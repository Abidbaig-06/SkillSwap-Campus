import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import { connectDB, disconnectDB } from './db.js';
import { SESSION_SECRET, MONGODB_URI } from './config.js';
import { User } from './models/User.js';
import { Connection } from './models/Connection.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';
import authRoutes from './routes/auth.js';
import connectionsRoutes from './routes/connections.js';
import messagesRoutes from './routes/messages.js';
import { initSocket } from './socket.js';

// Isolated test database name to avoid touching real data
const TEST_DB_NAME = `skillswap_test_conns_${Date.now()}`;

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Swap Requests & Real-time Messaging Test Suite');
  console.log('======================================================\n');

  console.log('[Setup] Connecting to isolated test database:', TEST_DB_NAME);
  // Parse base URI and append isolated test DB name
  const uri = new URL(MONGODB_URI);
  uri.pathname = `/${TEST_DB_NAME}`;
  const testMongoUri = uri.toString();

  await connectDB(testMongoUri, 3);
  console.log('✔ Connected to isolated test DB:', mongoose.connection.name);

  // Clean test DB collections
  await User.deleteMany({});
  await Connection.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});

  // Setup ephemeral Express app & HTTP server
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const sessionStore = MongoStore.create({
    clientPromise: Promise.resolve(mongoose.connection.getClient()),
    collectionName: 'login_sessions',
    dbName: TEST_DB_NAME,
    ttl: 3600
  });

  app.use(
    session({
      store: sessionStore,
      name: 'skillswap_sid',
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false, maxAge: 3600000 }
    })
  );

  initSocket(server, sessionStore);

  app.use('/api/auth', authRoutes);
  app.use('/api/connections', connectionsRoutes);
  app.use('/api/messages', messagesRoutes);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✔ Test server listening on ${baseUrl}\n`);

  // Helper for making authenticated requests preserving cookies
  function makeSessionClient() {
    let cookie = '';
    return {
      async request(path, options = {}) {
        const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        };
        if (cookie) {
          headers['Cookie'] = cookie;
        }

        const res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers
        });

        const setCookieHeader = res.headers.get('set-cookie');
        if (setCookieHeader) {
          cookie = setCookieHeader.split(';')[0];
        }

        const text = await res.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        return { status: res.status, data, headers: res.headers, rawCookie: cookie };
      },
      getCookie() {
        return cookie;
      }
    };
  }

  // --- SECTION 1: ACCOUNT PERSISTENCE & DIRECT ATLAS QUERY ---
  console.log('--- TEST 1: Account Persistence & Independent MongoDB Query ---');
  const clientA = makeSessionClient();
  const resSignupA = await clientA.request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alice Walker',
      email: `alice_${Date.now()}@campus.edu`,
      password: 'password123',
      department: 'Computer Science',
      year: '2nd Year',
      skillsTeaching: [{ name: 'Python', level: 'Advanced', category: 'Programming' }],
      skillsLearning: [{ name: 'React', level: 'Beginner', category: 'Web' }]
    })
  });
  assert.strictEqual(resSignupA.status, 201, 'Student A must register with 201');
  const studentA = resSignupA.data.user;
  console.log(`✔ Student A registered: ${studentA.name} (${studentA.id})`);

  // Independently query MongoDB directly
  const dbUserA = await User.findById(studentA.id).lean();
  assert(dbUserA, 'Student A document must exist directly in MongoDB');
  assert.strictEqual(dbUserA.email, studentA.email, 'Email in DB must match');
  assert(dbUserA.passwordHash && dbUserA.passwordHash.startsWith('$2'), 'Password must be bcrypt hashed');
  console.log('✔ Student A confirmed directly in MongoDB Atlas collection "users".');

  // Verify session restoration
  const resMeA = await clientA.request('/api/auth/me');
  assert.strictEqual(resMeA.status, 200);
  assert.strictEqual(resMeA.data.user.email, studentA.email);
  console.log('✔ Session restoration verified via GET /api/auth/me.');

  // Register Student B
  const clientB = makeSessionClient();
  const resSignupB = await clientB.request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Chen',
      email: `bob_${Date.now()}@campus.edu`,
      password: 'password123',
      department: 'Information Technology',
      year: '3rd Year',
      skillsTeaching: [{ name: 'React', level: 'Intermediate', category: 'Web' }],
      skillsLearning: [{ name: 'Python', level: 'Beginner', category: 'Programming' }]
    })
  });
  assert.strictEqual(resSignupB.status, 201);
  const studentB = resSignupB.data.user;
  console.log(`✔ Student B registered: ${studentB.name} (${studentB.id})`);

  // Register Student C (third party / attacker)
  const clientC = makeSessionClient();
  const resSignupC = await clientC.request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Charlie Smith',
      email: `charlie_${Date.now()}@campus.edu`,
      password: 'password123',
      department: 'Mechanical',
      year: '1st Year',
      skillsTeaching: [{ name: 'AutoCAD', level: 'Intermediate', category: 'Design' }]
    })
  });
  assert.strictEqual(resSignupC.status, 201);
  const studentC = resSignupC.data.user;
  console.log(`✔ Student C registered: ${studentC.name} (${studentC.id})\n`);

  // --- SECTION 2: SWAP REQUEST PERSISTENCE & VALIDATIONS ---
  console.log('--- TEST 2: Swap Requests Validation, Deduplication & Atomic Accept ---');

  // Self-request check
  const resSelf = await clientA.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentA.id,
      offeredSkill: 'Python',
      targetSkill: 'Python'
    })
  });
  assert.strictEqual(resSelf.status, 400, 'Self-request must return 400');
  console.log('✔ Self-connection request properly blocked (400 Bad Request).');

  // Skill ownership check
  const resSkillMismatch = await clientA.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentB.id,
      offeredSkill: 'NonExistentSkill',
      targetSkill: 'React'
    })
  });
  assert.strictEqual(resSkillMismatch.status, 400, 'Unowned skill must return 400');
  console.log('✔ Skill ownership validation verified (400 Bad Request).');

  // Valid swap request: Student A -> Student B
  const resReq = await clientA.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentB.id,
      offeredSkill: 'Python',
      targetSkill: 'React',
      note: 'Hey Bob, lets swap Python for React!'
    })
  });
  assert.strictEqual(resReq.status, 201, 'Valid connection request must return 201');
  const connA = resReq.data.connection;
  assert.strictEqual(connA.status, 'pending_outgoing', 'Sender sees status pending_outgoing');
  console.log(`✔ Swap request created with ID: ${connA.id}`);

  // Duplicate request check (same direction)
  const resDup1 = await clientA.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentB.id,
      offeredSkill: 'Python',
      targetSkill: 'React'
    })
  });
  assert.strictEqual(resDup1.status, 409, 'Duplicate request must return 409 Conflict');
  console.log('✔ Duplicate pending request from sender rejected (409 Conflict).');

  // Duplicate request check (reverse direction while pending)
  const resDup2 = await clientB.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentA.id,
      offeredSkill: 'React',
      targetSkill: 'Python'
    })
  });
  assert.strictEqual(resDup2.status, 409, 'Reverse pending request must return 409 Conflict');
  console.log('✔ Reverse pending request from recipient rejected (409 Conflict).');

  // Check Student B incoming connections list
  const resConnsB = await clientB.request('/api/connections');
  assert.strictEqual(resConnsB.status, 200);
  const connB = resConnsB.data.connections.find((c) => c.id === connA.id);
  assert(connB, 'Student B must see incoming connection request');
  assert.strictEqual(connB.status, 'pending_incoming');
  assert.strictEqual(connB.isIncoming, true);
  console.log('✔ Recipient incoming request list verified with status "pending_incoming".');

  // Unauthorized accept: Student C tries to accept Student A's request to Student B
  const resC_Accept = await clientC.request(`/api/connections/${connA.id}/accept`, {
    method: 'PATCH'
  });
  assert.strictEqual(resC_Accept.status, 404, 'Unauthorized student cannot accept connection');
  console.log('✔ Unauthorized third-party accept rejected (404/403).');

  // Student B accepts Student A's request
  const resAccept = await clientB.request(`/api/connections/${connA.id}/accept`, {
    method: 'PATCH'
  });
  assert.strictEqual(resAccept.status, 200, 'Accepting connection must return 200');
  assert.strictEqual(resAccept.data.connection.status, 'active');
  const conversationId = resAccept.data.conversationId;
  assert(conversationId, 'Accepting connection must create or return shared conversationId');
  console.log(`✔ Connection accepted. Shared conversation automatically created: ${conversationId}\n`);

  // --- SECTION 3: MESSAGING PERSISTENCE & AUTHORIZATION ---
  console.log('--- TEST 3: Messaging Persistence, Idempotency & Authorization ---');

  // Student C tries to view conversation history
  const resC_View = await clientC.request(`/api/messages/conversations/${conversationId}`);
  assert.strictEqual(resC_View.status, 404, 'Non-participant cannot view conversation');
  console.log('✔ Non-participant view blocked (404/403).');

  // Student C tries to send message to conversation
  const resC_Send = await clientC.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'Unauthorized message' })
  });
  assert.strictEqual(resC_Send.status, 403, 'Non-participant send must be rejected with 403');
  console.log('✔ Non-participant send blocked (403 Forbidden).');

  // Student A sends message with clientMsgId
  const clientMsgId = `cmsg-test-${Date.now()}`;
  const resSendA = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Hello Bob! Ready to learn React.',
      clientMsgId
    })
  });
  assert.strictEqual(resSendA.status, 201, 'Student A sending message must return 201');
  const msgA = resSendA.data.message;
  assert.strictEqual(msgA.text, 'Hello Bob! Ready to learn React.');
  assert.strictEqual(msgA.senderId, studentA.id);
  console.log(`✔ Message 1 sent and persisted by Student A: "${msgA.text}"`);

  // Test idempotency: Student A retries with same clientMsgId
  const resSendRetry = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Hello Bob! Ready to learn React.',
      clientMsgId
    })
  });
  assert.strictEqual(resSendRetry.status, 201);
  assert.strictEqual(resSendRetry.data.message.id, msgA.id, 'Retrying same clientMsgId must return existing message');
  const msgCountInDb = await Message.countDocuments({ conversationId, clientMsgId });
  assert.strictEqual(msgCountInDb, 1, 'Exactly 1 message must exist in DB for this clientMsgId');
  console.log('✔ Idempotent retry verified: no duplicate message saved in DB.');

  // Student B sends reply
  const resSendB = await clientB.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Awesome Alice! Let us start tomorrow at 4 PM.'
    })
  });
  assert.strictEqual(resSendB.status, 201);
  console.log(`✔ Message 2 sent and persisted by Student B: "${resSendB.data.message.text}"`);

  // Verify conversation history for Student A
  const resHistoryA = await clientA.request(`/api/messages/conversations/${conversationId}`);
  assert.strictEqual(resHistoryA.status, 200);
  const messagesList = resHistoryA.data.conversation.messages;
  assert(messagesList.length >= 2, 'Conversation must contain saved messages');
  console.log(`✔ Full chronological message history verified (${messagesList.length} messages loaded).\n`);

  // --- SECTION 4: REAL-TIME SOCKET.IO DELIVERY ---
  console.log('--- TEST 4: Real-time Socket.IO Delivery & Room Authorization ---');

  // Connect Socket.IO client for Student B
  const socketB = ioClient(baseUrl, {
    path: '/socket.io',
    extraHeaders: {
      Cookie: clientB.getCookie()
    },
    transports: ['websocket']
  });

  await new Promise((resolve, reject) => {
    socketB.on('connect', resolve);
    socketB.on('connect_error', reject);
  });
  console.log('✔ Student B Socket.IO client connected with session cookie.');

  // Student B joins conversation room
  await new Promise((resolve) => {
    socketB.emit('join_conversation', { conversationId }, (ack) => {
      assert(ack.success, 'Student B must successfully join conversation room');
      resolve();
    });
  });
  console.log('✔ Student B joined conversation room conv:' + conversationId);

  // Student C tries to join room over socket
  const socketC = ioClient(baseUrl, {
    path: '/socket.io',
    extraHeaders: {
      Cookie: clientC.getCookie()
    },
    transports: ['websocket']
  });

  await new Promise((resolve) => socketC.on('connect', resolve));
  await new Promise((resolve) => {
    socketC.emit('join_conversation', { conversationId }, (ack) => {
      assert(ack.error, 'Student C socket join must be rejected');
      resolve();
    });
  });
  console.log('✔ Student C socket subscription rejected with unauthorized error.');
  socketC.disconnect();

  // Test real-time message delivery to Student B via Socket.IO
  const messagePromise = new Promise((resolve) => {
    socketB.on('message_received', (msg) => {
      resolve(msg);
    });
  });

  // Student A sends message via REST API
  await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'Real-time test message across sockets!' })
  });

  const receivedMsg = await messagePromise;
  assert.strictEqual(receivedMsg.text, 'Real-time test message across sockets!');
  console.log(`✔ Real-time message delivered to Student B over WebSocket: "${receivedMsg.text}"`);

  socketB.disconnect();

  // Clean teardown
  server.close();
  await mongoose.connection.dropDatabase();
  await disconnectDB();

  console.log('\n======================================================');
  console.log('All Swap Request & Real-time Messaging Tests Passed! (4/4)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

