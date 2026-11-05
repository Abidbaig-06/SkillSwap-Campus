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

const TEST_DB_NAME = `skillswap_test_fixes_${Date.now()}`;

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Messaging Fixes Verification Suite');
  console.log('======================================================\n');

  const uri = new URL(MONGODB_URI);
  uri.pathname = `/${TEST_DB_NAME}`;
  await connectDB(uri.toString(), 3);
  console.log('✔ Connected to isolated test DB:', mongoose.connection.name);

  await User.deleteMany({});
  await Connection.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});

  const app = express();
  const server = http.createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const sessionStore = MongoStore.create({
    clientPromise: Promise.resolve(mongoose.connection.getClient()),
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

        const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
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

  // 1. Register Alice & Bob
  const clientA = makeSessionClient();
  const resA = await clientA.request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alice',
      email: `alice_${Date.now()}@campus.edu`,
      password: 'password123',
      skillsTeaching: [{ name: 'Python', level: 'Intermediate', category: 'Programming' }]
    })
  });
  const studentA = resA.data.user;

  const clientB = makeSessionClient();
  const resB = await clientB.request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob',
      email: `bob_${Date.now()}@campus.edu`,
      password: 'password123',
      skillsTeaching: [{ name: 'React', level: 'Intermediate', category: 'Programming' }]
    })
  });
  const studentB = resB.data.user;

  // 2. Connect Alice & Bob
  const resConn = await clientA.request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: studentB.id,
      offeredSkill: 'Python',
      targetSkill: 'React',
      note: 'Hello Bob!'
    })
  });
  assert.strictEqual(resConn.status, 201);
  const connId = resConn.data.connection.id;

  const resAccept = await clientB.request(`/api/connections/${connId}/accept`, {
    method: 'PATCH'
  });
  assert.strictEqual(resAccept.status, 200);
  const conversationId = resAccept.data.conversationId;
  assert(conversationId, 'Conversation created on accept');

  // --- TEST A: VERIFY CONVERSATION RESTORATION AFTER REFRESH (NO 500 ERROR) ---
  console.log('--- TEST A: Conversations Restored After Session Refresh ---');
  // Simulate page refresh for Student A: calls GET /api/messages/conversations directly
  const resConvsA = await clientA.request('/api/messages/conversations');
  assert.strictEqual(resConvsA.status, 200, 'GET /api/messages/conversations must return 200 OK');
  assert(Array.isArray(resConvsA.data.conversations), 'Must return conversations array');
  assert.strictEqual(resConvsA.data.conversations.length, 1, 'Must have 1 active conversation');
  assert.strictEqual(resConvsA.data.conversations[0].id, conversationId);
  assert.strictEqual(resConvsA.data.conversations[0].studentName, 'Bob');
  console.log('✔ Student A conversation restored successfully after refresh (1 Active conversation found).');

  // Simulate page refresh for Student B
  const resConvsB = await clientB.request('/api/messages/conversations');
  assert.strictEqual(resConvsB.status, 200, 'GET /api/messages/conversations must return 200 OK');
  assert.strictEqual(resConvsB.data.conversations.length, 1);
  assert.strictEqual(resConvsB.data.conversations[0].studentName, 'Alice');
  console.log('✔ Student B conversation restored successfully after refresh (1 Active conversation found).');

  // --- TEST B: VERIFY SINGLE MESSAGE PRODUCTION & SENDER RECONCILIATION ---
  console.log('\n--- TEST B: Single Message Production & No Duplicate Bubbles ---');
  // Connect real Socket.IO clients for both users
  const socketA = ioClient(baseUrl, {
    path: '/socket.io',
    extraHeaders: { Cookie: clientA.getCookie() },
    transports: ['websocket']
  });
  const socketB = ioClient(baseUrl, {
    path: '/socket.io',
    extraHeaders: { Cookie: clientB.getCookie() },
    transports: ['websocket']
  });

  await Promise.all([
    new Promise((res) => socketA.on('connect', res)),
    new Promise((res) => socketB.on('connect', res))
  ]);

  // Both join conversation room
  await Promise.all([
    new Promise((res) => socketA.emit('join_conversation', { conversationId }, res)),
    new Promise((res) => socketB.emit('join_conversation', { conversationId }, res))
  ]);

  // Track socket broadcasts received by both sides
  const socketEventsA = [];
  const socketEventsB = [];
  socketA.on('message_received', (msg) => socketEventsA.push(msg));
  socketB.on('message_received', (msg) => socketEventsB.push(msg));

  // Student A sends 1 message
  const clientMsgId1 = `cmsg-test-1-${Date.now()}`;
  const resSend1 = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Hey Bob, testing single bubble delivery!',
      clientMsgId: clientMsgId1
    })
  });
  assert.strictEqual(resSend1.status, 201);
  const confirmedMsg1 = resSend1.data.message;

  // Wait brief moment for socket delivery
  await new Promise((r) => setTimeout(r, 200));

  // Verify MongoDB document count
  const dbMessages1 = await Message.find({ conversationId, clientMsgId: clientMsgId1 }).lean();
  assert.strictEqual(dbMessages1.length, 1, 'MongoDB must contain EXACTLY 1 message document');
  console.log('✔ Exactly 1 message document saved in MongoDB for logical send.');

  // Verify socket event payload includes clientMsgId for sender reconciliation
  assert.strictEqual(socketEventsA.length, 1, 'Sender socket receives exactly 1 broadcast');
  assert.strictEqual(socketEventsA[0].clientMsgId, clientMsgId1, 'Socket payload must include clientMsgId');
  assert.strictEqual(socketEventsA[0].senderId, studentA.id, 'Socket payload must include senderId');

  assert.strictEqual(socketEventsB.length, 1, 'Recipient socket receives exactly 1 broadcast');
  assert.strictEqual(socketEventsB[0].clientMsgId, clientMsgId1);
  console.log('✔ Socket payload carries stable clientMsgId and senderId for seamless client reconciliation.');

  // --- TEST C: INTENTIONAL REPEATED MESSAGES PRESERVED ---
  console.log('\n--- TEST C: Intentional Repeated Messages Both Preserved ---');
  // Student A intentionally sends the same text "hello" twice with separate clientMsgIds
  const clientMsgId2 = `cmsg-repeat-1-${Date.now()}`;
  const resRep1 = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'hello', clientMsgId: clientMsgId2 })
  });
  assert.strictEqual(resRep1.status, 201);

  const clientMsgId3 = `cmsg-repeat-2-${Date.now()}`;
  const resRep2 = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'hello', clientMsgId: clientMsgId3 })
  });
  assert.strictEqual(resRep2.status, 201);

  assert.notStrictEqual(resRep1.data.message.id, resRep2.data.message.id, 'Distinct sends must have distinct server IDs');

  const helloMsgs = await Message.find({ conversationId, text: 'hello' }).lean();
  assert.strictEqual(helloMsgs.length, 2, 'MongoDB must preserve both intentional "hello" messages');
  console.log('✔ Two intentional "hello" messages both preserved with distinct server IDs and clientMsgIds.');

  // --- TEST D: RETRY IDEMPOTENCY ---
  console.log('\n--- TEST D: Retrying Identical clientMsgId Does Not Create Duplicate ---');
  const resRetry = await clientA.request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'hello', clientMsgId: clientMsgId2 })
  });
  assert.strictEqual(resRetry.status, 201);
  assert.strictEqual(resRetry.data.message.id, resRep1.data.message.id, 'Must return existing message ID on retry');

  const countAfterRetry = await Message.countDocuments({ conversationId, clientMsgId: clientMsgId2 });
  assert.strictEqual(countAfterRetry, 1, 'Retry must not add second document to MongoDB');
  console.log('✔ Idempotent retry verified: duplicate document prevented by unique index.');

  // --- TEST E: OPEN CHAT THROUGH CONNECTIONS REUSES EXISTING CONVERSATION ---
  console.log('\n--- TEST E: Opening Chat Through Connections Reuses Conversation ---');
  const resStart = await clientA.request('/api/messages/start', {
    method: 'POST',
    body: JSON.stringify({ studentId: studentB.id })
  });
  assert.strictEqual(resStart.status, 200);
  assert.strictEqual(resStart.data.conversation.id, conversationId, 'Must return existing conversation without creating new one');

  const totalConvs = await Conversation.countDocuments({
    participants: { $all: [studentA.id, studentB.id] }
  });
  assert.strictEqual(totalConvs, 1, 'Exactly 1 conversation exists between A and B');
  console.log('✔ Reusing existing conversation confirmed: no duplicate conversation created.');

  // Teardown
  socketA.disconnect();
  socketB.disconnect();
  server.close();
  await mongoose.connection.dropDatabase();
  await disconnectDB();

  console.log('\n======================================================');
  console.log('All Messaging Fix Verification Tests Passed! (5/5)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

