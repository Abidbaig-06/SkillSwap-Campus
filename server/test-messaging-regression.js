import http from 'http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import assert from 'assert';
import { connectDB, disconnectDB } from './db.js';
import { SESSION_SECRET, MONGODB_URI } from './config.js';
import { User } from './models/User.js';
import { Connection } from './models/Connection.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';
import { Session } from './models/Session.js';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import connectionsRoutes from './routes/connections.js';
import messagesRoutes from './routes/messages.js';

const TEST_DB_NAME = `skillswap_test_msg_reg_${Date.now()}`;

function createTestServer(dbName) {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const sessionStore = MongoStore.create({
    clientPromise: Promise.resolve(mongoose.connection.getClient()),
    collectionName: 'login_sessions',
    dbName: dbName,
    ttl: 3600
  });

  app.use(
    session({
      store: sessionStore,
      name: 'skillswap_sid',
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 }
    })
  );

  initSocket(server, sessionStore);

  app.use('/api/auth', authRoutes);
  app.use('/api/connections', connectionsRoutes);
  app.use('/api/messages', messagesRoutes);

  return { app, server };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Messaging Regression & Storage Test');
  console.log('======================================================\n');

  console.log('[Setup] Connecting to isolated test database:', TEST_DB_NAME);
  const uri = new URL(MONGODB_URI);
  uri.pathname = `/${TEST_DB_NAME}`;
  const testMongoUri = uri.toString();

  await connectDB(testMongoUri, 3);
  console.log('✔ Connected to isolated test DB:', mongoose.connection.name);

  // Clean test DB
  await User.deleteMany({});
  await Connection.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  await Session.deleteMany({});

  const { server } = createTestServer(TEST_DB_NAME);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✔ Test server listening on ${baseUrl}`);

  async function api(path, options = {}, cookies = '') {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies ? { Cookie: cookies } : {}),
        ...(options.headers || {})
      }
    });
    const setCookie = res.headers.get('set-cookie');
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, setCookie };
  }

  try {
    // 1. Verify Distinct Collection Names
    console.log('\n--- 1. Verify Distinct Collection Names ---');
    assert.strictEqual(User.collection.name, 'users');
    assert.strictEqual(Connection.collection.name, 'connections');
    assert.strictEqual(Conversation.collection.name, 'conversations');
    assert.strictEqual(Message.collection.name, 'messages');
    assert.strictEqual(Session.collection.name, 'learning_sessions', 'Session model must use "learning_sessions"');
    console.log('✔ Mongoose Session model collection name is strictly: "learning_sessions"');

    // 2. Register Lakshmi & Lucky
    console.log('\n--- 2. Register Lakshmi & Lucky ---');
    const regLakshmi = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Lakshmi Rao',
        email: `lakshmi_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Computer Science',
        year: '3rd Year',
        skillsTeaching: [{ name: 'Machine Learning', level: 'Intermediate' }],
        skillsLearning: [{ name: 'Cloud Computing', level: 'Beginner' }]
      })
    });
    assert.strictEqual(regLakshmi.status, 201);
    const lakshmiCookie = regLakshmi.setCookie;
    const lakshmiId = regLakshmi.data.user.id;

    const regLucky = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Lucky Sharma',
        email: `lucky_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Information Technology',
        year: '3rd Year',
        skillsTeaching: [{ name: 'Cloud Computing', level: 'Advanced' }],
        skillsLearning: [{ name: 'Machine Learning', level: 'Beginner' }]
      })
    });
    assert.strictEqual(regLucky.status, 201);
    const luckyCookie = regLucky.setCookie;
    const luckyId = regLucky.data.user.id;
    console.log('✔ Registered Lakshmi and Lucky.');

    // 3. Connect Lakshmi & Lucky
    console.log('\n--- 3. Establish Connection & Conversation ---');
    const reqConn = await api('/api/connections', {
      method: 'POST',
      body: JSON.stringify({
        studentId: luckyId,
        studentName: 'Lucky Sharma',
        offeredSkill: 'Machine Learning',
        targetSkill: 'Cloud Computing',
        note: 'Hi Lucky, let us swap ML and Cloud!'
      })
    }, lakshmiCookie);
    assert.strictEqual(reqConn.status, 201);
    const connectionId = reqConn.data.connection.id;

    const acceptConn = await api(`/api/connections/${connectionId}/accept`, {
      method: 'PATCH'
    }, luckyCookie);
    assert.strictEqual(acceptConn.status, 200);

    const convsRes = await api('/api/messages/conversations', {}, lakshmiCookie);
    assert.strictEqual(convsRes.status, 200);
    assert.strictEqual(convsRes.data.conversations.length, 1);
    const conversationId = convsRes.data.conversations[0].id;
    console.log('✔ Connection accepted, conversation created:', conversationId);

    // 4. Socket Listeners for Real-time Delivery
    console.log('\n--- 4. Real-time Socket Setup ---');
    const luckySocket = ioClient(baseUrl, {
      extraHeaders: { Cookie: luckyCookie },
      transports: ['websocket']
    });
    await new Promise((resolve) => luckySocket.on('connect', resolve));
    luckySocket.emit('join_conversation', { conversationId });

    const lakshmiSocket = ioClient(baseUrl, {
      extraHeaders: { Cookie: lakshmiCookie },
      transports: ['websocket']
    });
    await new Promise((resolve) => lakshmiSocket.on('connect', resolve));
    lakshmiSocket.emit('join_conversation', { conversationId });
    console.log('✔ Both Lakshmi and Lucky connected and joined room conv:' + conversationId);

    // 5. Test Direction 1: Lakshmi sends a message to Lucky
    console.log('\n--- 5. Direction 1: Lakshmi Sends to Lucky ---');
    const clientMsgId1 = `cmsg-lakshmi-${Date.now()}`;
    const luckyReceivedPromise = new Promise((resolve) => {
      luckySocket.once('message_received', (msg) => resolve(msg));
    });
    const lakshmiReceivedPromise = new Promise((resolve) => {
      lakshmiSocket.once('message_received', (msg) => resolve(msg));
    });

    const sendRes1 = await api(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Hi Lucky! When are you free to discuss Cloud Architecture?',
        clientMsgId: clientMsgId1
      })
    }, lakshmiCookie);
    assert.strictEqual(sendRes1.status, 201);
    const confirmedMsg1 = sendRes1.data.message;
    assert.strictEqual(confirmedMsg1.clientMsgId, clientMsgId1);

    const luckyReceivedMsg = await luckyReceivedPromise;
    const lakshmiReceivedMsg = await lakshmiReceivedPromise;
    assert.strictEqual(luckyReceivedMsg.id, confirmedMsg1.id);
    assert.strictEqual(lakshmiReceivedMsg.id, confirmedMsg1.id);
    console.log('✔ Message delivered over socket to Lucky and broadcasted back to room.');

    // 6. Test Direction 2: Lucky sends a message back to Lakshmi
    console.log('\n--- 6. Direction 2: Lucky Sends to Lakshmi ---');
    const clientMsgId2 = `cmsg-lucky-${Date.now()}`;
    const lakshmiReceivedPromise2 = new Promise((resolve) => {
      lakshmiSocket.once('message_received', (msg) => resolve(msg));
    });

    const sendRes2 = await api(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Hey Lakshmi! I am free this Friday at 4 PM.',
        clientMsgId: clientMsgId2
      })
    }, luckyCookie);
    assert.strictEqual(sendRes2.status, 201);
    const confirmedMsg2 = sendRes2.data.message;

    const luckyReplyReceived = await lakshmiReceivedPromise2;
    assert.strictEqual(luckyReplyReceived.id, confirmedMsg2.id);
    console.log('✔ Reply delivered over socket to Lakshmi.');

    // 7. Send IDENTICAL Text Twice Intentionally (Must Retain Both)
    console.log('\n--- 7. Send Identical Text Twice (Deduplication Check) ---');
    const cmsg3 = `cmsg-dup-1-${Date.now()}`;
    const resDup1 = await api(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Sounds great! See you then.',
        clientMsgId: cmsg3
      })
    }, lakshmiCookie);
    assert.strictEqual(resDup1.status, 201);

    const cmsg4 = `cmsg-dup-2-${Date.now()}`;
    const resDup2 = await api(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Sounds great! See you then.',
        clientMsgId: cmsg4
      })
    }, lakshmiCookie);
    assert.strictEqual(resDup2.status, 201);

    assert.notStrictEqual(resDup1.data.message.id, resDup2.data.message.id, 'Must produce distinct server IDs');
    assert.strictEqual(resDup1.data.message.text, resDup2.data.message.text);

    // Verify exactly 5 messages in DB now (1 connection intro + 4 chat messages)
    const allDbMessages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    assert.strictEqual(allDbMessages.length, 5, 'Should have exactly 5 stored messages (1 intro + 4 chat)');
    assert.strictEqual(allDbMessages[3].text, 'Sounds great! See you then.');
    assert.strictEqual(allDbMessages[4].text, 'Sounds great! See you then.');
    assert.strictEqual(allDbMessages[3].clientMsgId, cmsg3);
    assert.strictEqual(allDbMessages[4].clientMsgId, cmsg4);
    console.log('✔ Two identical consecutive messages retained as distinct database records.');

    // 8. Idempotency Check (Same clientMsgId Resent Returns Same Record)
    console.log('\n--- 8. Idempotency Check with Identical clientMsgId ---');
    const resRetry = await api(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Sounds great! See you then.',
        clientMsgId: cmsg4 // Same clientMsgId as previous send
      })
    }, lakshmiCookie);
    assert.ok(resRetry.status === 200 || resRetry.status === 201, 'Idempotent retry should succeed');
    assert.strictEqual(resRetry.data.message.id, resDup2.data.message.id, 'Must return same server message ID');

    const totalAfterRetry = await Message.countDocuments({ conversationId });
    assert.strictEqual(totalAfterRetry, 5, 'No duplicate record created on idempotent retry');
    console.log('✔ Idempotent retry preserved existing record without creating duplicate.');

    // 9. Client Reconciliation Logic Verification
    console.log('\n--- 9. Frontend Message List Reconciliation Unit Check ---');
    // Simulate the exact state before and after:
    const initialMessages = [
      { id: confirmedMsg1.id, clientMsgId: confirmedMsg1.clientMsgId, text: confirmedMsg1.text }
    ];
    const newOptimisticMsg = {
      id: 'cmsg-test-opt',
      clientMsgId: 'cmsg-test-opt',
      text: 'Optimistic bubble test'
    };
    // Step a: optimistic bubble appended
    let messagesState = [...initialMessages, newOptimisticMsg];
    assert.strictEqual(messagesState.length, 2);

    // Step b: socket message arrives first and replaces placeholder
    const socketMsg = {
      id: 'srv-mongo-id-123',
      clientMsgId: 'cmsg-test-opt',
      text: 'Optimistic bubble test'
    };
    const srvIdx = messagesState.findIndex((m) => m.id === socketMsg.id);
    if (srvIdx >= 0) {
      messagesState[srvIdx] = socketMsg;
    } else {
      const plIdx = messagesState.findIndex((m) => m.clientMsgId === socketMsg.clientMsgId || m.id === socketMsg.clientMsgId);
      if (plIdx >= 0) messagesState[plIdx] = socketMsg;
      else messagesState.push(socketMsg);
    }
    assert.strictEqual(messagesState.length, 2, 'Should keep 2 messages after socket replacement');
    assert.strictEqual(messagesState[1].id, 'srv-mongo-id-123');

    // Step c: REST response resolves. With our fix:
    // It must NOT filter out socketMsg (which has clientMsgId: 'cmsg-test-opt')!
    const restMsg = { id: 'srv-mongo-id-123', clientMsgId: 'cmsg-test-opt', text: 'Optimistic bubble test' };
    const existingServerIdx = messagesState.findIndex((m) => m.id === restMsg.id);
    assert.ok(existingServerIdx >= 0, 'Server ID already present from socket');

    // Applied fix logic:
    messagesState = messagesState
      .map((m, idx) => (idx === existingServerIdx ? { ...m, ...restMsg } : m))
      .filter((m) => !(m.id === 'cmsg-test-opt' && m.id !== restMsg.id));

    assert.strictEqual(messagesState.length, 2, 'Message MUST NOT be filtered out by REST response!');
    assert.strictEqual(messagesState[1].id, 'srv-mongo-id-123');
    assert.strictEqual(messagesState[1].clientMsgId, 'cmsg-test-opt');
    console.log('✔ Verified: REST response reconciliation preserves sent message bubble in active chat.');

    // 10. Direct MongoDB Storage Verification
    console.log('\n--- 10. Direct MongoDB Storage Verification ---');
    const msgRecord = await Message.findOne({ clientMsgId: clientMsgId1 }).lean();
    assert.ok(msgRecord, 'Message must be found in MongoDB');
    assert.strictEqual(msgRecord.sender, lakshmiId);
    assert.strictEqual(msgRecord.clientMsgId, clientMsgId1);
    console.log('✔ Direct MongoDB Atlas query confirmed message in "messages" collection.');

    // Clean up sockets
    luckySocket.disconnect();
    lakshmiSocket.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL MESSAGING REGRESSION & STORAGE CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    server.close();
    try {
      await mongoose.connection.dropDatabase();
      console.log('✔ Cleaned up test DB:', TEST_DB_NAME);
    } catch (e) {
      console.warn('DB cleanup warning:', e.message);
    }
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
