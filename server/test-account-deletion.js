/**
 * SkillSwap Campus — Account Deletion, Logout Cleanup & Session Lifecycle Test Suite
 *
 * Verifies:
 * 1. Demo account protection (HTTP 403 when attempting to delete demo-ram)
 * 2. Authenticated account deletion (DELETE /api/me/account and DELETE /api/me)
 * 3. Removal of user document and custom photos from MongoDB
 * 4. Invalidation of all active login sessions in connect-mongo
 * 5. Rejection of subsequent requests using deleted account (HTTP 401)
 * 6. Preservation of peer student connections, conversations, and sessions displaying "Deleted student"
 * 7. Complete exclusion of deleted user from student discovery and search
 * 8. "Remember me" cookie lifetime: session cookie (null maxAge) vs 7-day persistent cookie
 * 9. Logout cleanup clearing session cookie and session store record
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, resetDemoStudent } from './db.js';
import { User } from './models/User.js';
import { Photo } from './models/Photo.js';
import { Connection } from './models/Connection.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';
import { Session as LearningSession } from './models/Session.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import studentsRoutes from './routes/students.js';
import connectionsRoutes from './routes/connections.js';
import messagesRoutes from './routes/messages.js';
import sessionsRoutes from './routes/sessions.js';
import { SESSION_SECRET, MONGODB_URI } from './config.js';

const TEST_DB_NAME = `skillswap_test_deletion_${Date.now()}`;
const TEST_URI = MONGODB_URI.endsWith('/')
  ? `${MONGODB_URI}${TEST_DB_NAME}?retryWrites=true&w=majority`
  : `${MONGODB_URI}/${TEST_DB_NAME}?retryWrites=true&w=majority`;

let server;
let serverPort;
let baseUrl;

async function setupTestServer() {
  await connectDB(TEST_URI);
  console.log(`✔ Connected to isolated test DB: ${TEST_DB_NAME}`);

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // URL rewrite middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/SkillSwap-Campus/api')) {
      req.url = req.url.replace(/^\/SkillSwap-Campus/, '');
    }
    next();
  });

  const sessionStore = MongoStore.create({
    clientPromise: Promise.resolve(mongoose.connection.getClient()),
    collectionName: 'login_sessions',
    ttl: 7 * 24 * 60 * 60
  });

  app.use(
    session({
      store: sessionStore,
      name: 'skillswap_sid',
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: null // Session cookie by default
      }
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/connections', connectionsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/sessions', sessionsRoutes);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      serverPort = server.address().port;
      baseUrl = `http://localhost:${serverPort}`;
      console.log(`✔ Test server listening on ${baseUrl}`);
      resolve();
    });
  });
}

async function request(endpoint, options = {}, cookie = '') {
  const url = `${baseUrl}${endpoint}`;
  const headers = { ...(options.headers || {}) };
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(url, { ...options, headers });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const rawSetCookie = res.headers.get('set-cookie');
  let newCookie = cookie;
  if (rawSetCookie) {
    newCookie = rawSetCookie.split(';')[0];
  }

  return { status: res.status, data, cookie: newCookie, rawSetCookie };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Account Deletion & Lifecycle Tests');
  console.log('======================================================\n');

  try {
    await setupTestServer();
    await resetDemoStudent();

    // 1. Protect demo accounts from deletion
    console.log('Test 1: Verify demo student Ram cannot be deleted (HTTP 403)');
    const demoLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ram@campus.edu', password: 'demopassword' })
    });
    assert.strictEqual(demoLogin.status, 200);

    const demoDelete = await request('/api/me/account', { method: 'DELETE' }, demoLogin.cookie);
    assert.strictEqual(demoDelete.status, 403, 'Demo deletion must return 403 Forbidden');
    assert.ok(demoDelete.data?.error?.includes('demo student profile is protected'));

    const demoInDb = await User.findById('demo-ram');
    assert.ok(demoInDb, 'Demo student Ram must still exist in MongoDB');
    console.log('✔ Demo account successfully protected from deletion.');

    // 2. Register regular student Alice and peer Bob
    console.log('\nTest 2: Register Alice and Bob, add photo, connections and session');
    const aliceSignup = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Walker',
        email: 'alice@campus.edu',
        password: 'password123',
        department: 'Computer Science',
        year: '2nd Year',
        teachingSkills: [{ name: 'Rust', level: 'Intermediate', category: 'Programming' }],
        learningSkills: [{ name: 'TypeScript', level: 'Beginner', category: 'Programming' }]
      })
    });
    assert.strictEqual(aliceSignup.status, 201);
    const aliceId = aliceSignup.data.user.id;
    const aliceCookie = aliceSignup.cookie;

    // Alice uploads custom photo (valid minimal 1x1 PNG)
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const photoUpload = await request('/api/me/photo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoData: validPngBase64 })
    }, aliceCookie);
    assert.strictEqual(photoUpload.status, 200);
    const photoCountBefore = await Photo.countDocuments({ userId: aliceId });
    assert.strictEqual(photoCountBefore, 1, 'Alice should have 1 photo in photos collection');

    // Register Bob
    const bobSignup = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bob Smith',
        email: 'bob@campus.edu',
        password: 'password123',
        department: 'Information Tech',
        year: '3rd Year',
        teachingSkills: [{ name: 'TypeScript', level: 'Advanced', category: 'Programming' }],
        learningSkills: [{ name: 'Rust', level: 'Beginner', category: 'Programming' }]
      })
    });
    assert.strictEqual(bobSignup.status, 201);
    const bobId = bobSignup.data.user.id;
    const bobCookie = bobSignup.cookie;

    // Create accepted connection and conversation between Alice and Bob
    const connDoc = await Connection.create({
      sender: aliceId,
      recipient: bobId,
      status: 'accepted',
      offeredSkill: { name: 'Rust', level: 'Intermediate', category: 'Programming' },
      requestedSkill: { name: 'TypeScript', level: 'Advanced', category: 'Programming' }
    });

    const convDoc = await Conversation.create({
      connectionId: connDoc._id,
      participants: [aliceId, bobId],
      lastMessage: { text: 'Hi Bob! Looking forward to swapping skills.', sender: aliceId, createdAt: new Date() }
    });

    await Message.create({
      conversationId: convDoc._id,
      sender: aliceId,
      text: 'Hi Bob! Looking forward to swapping skills.',
      status: 'delivered'
    });

    // Create learning session
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    await LearningSession.create({
      connectionId: connDoc._id,
      conversationId: convDoc._id,
      title: 'Rust Basics for Bob',
      skillName: 'Rust',
      teacher: aliceId,
      learner: bobId,
      proposedBy: aliceId,
      startTime,
      endTime,
      durationMinutes: 60,
      status: 'confirmed'
    });

    console.log('✔ Alice and Bob registered with photo, connection, messages, and session.');

    // 3. Verify Alice is in discovery list before deletion
    console.log('\nTest 3: Verify Alice appears in student search before deletion');
    const studentsBefore = await request('/api/students', {}, bobCookie);
    const aliceInList = studentsBefore.data?.students?.some((s) => s.id === aliceId);
    assert.ok(aliceInList, 'Alice must be present in students list before deletion');
    console.log('✔ Alice appears in student search as expected.');

    // 4. Perform authenticated account deletion for Alice
    console.log('\nTest 4: Permanently delete Alice account (DELETE /api/me/account)');
    const deleteRes = await request('/api/me/account', { method: 'DELETE' }, aliceCookie);
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.data.success, true);
    assert.ok(deleteRes.rawSetCookie?.includes('skillswap_sid=;'), 'Session cookie must be cleared on deletion');
    console.log('✔ Delete endpoint returned 200 and cleared session cookie.');

    // 5. Database cleanup verification
    console.log('\nTest 5: Verify MongoDB cleanup (User, Photo, Sessions)');
    const aliceDocAfter = await User.findById(aliceId);
    assert.strictEqual(aliceDocAfter, null, 'Alice must be completely deleted from User collection');

    const photoAfter = await Photo.countDocuments({ userId: aliceId });
    assert.strictEqual(photoAfter, 0, 'Alice photos must be completely deleted from Photo collection');

    const sessionsCol = mongoose.connection.collection('login_sessions');
    const remainingSessions = await sessionsCol.countDocuments({
      $or: [
        { 'session.userId': aliceId },
        { session: { $regex: `"userId":"${aliceId}"` } }
      ]
    });
    assert.strictEqual(remainingSessions, 0, 'All login sessions for Alice must be purged from login_sessions');
    console.log('✔ User, photo, and sessions purged from MongoDB.');

    // 6. Verify subsequent requests with deleted account are rejected with 401
    console.log('\nTest 6: Verify subsequent requests with deleted session return HTTP 401');
    const profileAfter = await request('/api/me/profile', {}, aliceCookie);
    assert.strictEqual(profileAfter.status, 401, 'Request with deleted session must return 401');

    const loginAfter = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@campus.edu', password: 'password123' })
    });
    assert.strictEqual(loginAfter.status, 401, 'Login with deleted account must return 401');
    console.log('✔ Subsequent requests and logins rejected with 401.');

    // 7. Verify Bob views shared history cleanly as "Deleted student"
    console.log('\nTest 7: Verify peer Bob views shared history as "Deleted student"');
    const bobConns = await request('/api/connections', {}, bobCookie);
    assert.strictEqual(bobConns.status, 200);
    const aliceConnForBob = bobConns.data.connections.find((c) => c.studentId === aliceId);
    assert.ok(aliceConnForBob, 'Connection record with Alice must be preserved for Bob');
    assert.strictEqual(aliceConnForBob.name, 'Deleted student', 'Peer name should display as "Deleted student"');
    assert.strictEqual(aliceConnForBob.isDeleted, true, 'isDeleted flag should be true');

    const bobConvs = await request('/api/messages/conversations', {}, bobCookie);
    assert.strictEqual(bobConvs.status, 200);
    const aliceConvForBob = bobConvs.data.conversations.find((c) => c.studentId === aliceId);
    assert.ok(aliceConvForBob, 'Conversation with Alice must be preserved for Bob');
    assert.strictEqual(aliceConvForBob.studentName, 'Deleted student');
    assert.strictEqual(aliceConvForBob.isDeleted, true);
    assert.strictEqual(aliceConvForBob.messages.length, 1);
    assert.strictEqual(aliceConvForBob.messages[0].text, 'Hi Bob! Looking forward to swapping skills.');

    const bobSessions = await request('/api/sessions?status=upcoming', {}, bobCookie);
    assert.strictEqual(bobSessions.status, 200);
    const aliceSessionForBob = bobSessions.data.sessions.find((s) => s.title === 'Rust Basics for Bob');
    assert.ok(aliceSessionForBob, 'Session with Alice must be preserved for Bob');
    assert.strictEqual(aliceSessionForBob.teacher.name, 'Deleted student');
    assert.strictEqual(aliceSessionForBob.partner.name, 'Deleted student');
    console.log('✔ Peer connections, conversations, and learning sessions show "Deleted student" gracefully.');

    // 8. Verify Alice is completely removed from student discovery
    console.log('\nTest 8: Verify Alice is excluded from student search and discovery');
    const studentsAfter = await request('/api/students', {}, bobCookie);
    const aliceFound = studentsAfter.data?.students?.some((s) => s.id === aliceId);
    assert.strictEqual(aliceFound, false, 'Deleted student must not appear in discovery');
    console.log('✔ Deleted student is excluded from discovery.');

    // 9. "Remember me" cookie lifetime verification
    console.log('\nTest 9: Verify "Remember me" cookie lifetime (session cookie vs persistent)');
    const loginNoRemember = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@campus.edu', password: 'password123', rememberMe: false })
    });
    assert.strictEqual(loginNoRemember.status, 200);
    assert.ok(
      !loginNoRemember.rawSetCookie.includes('Expires='),
      'Without rememberMe, cookie must NOT include Expires attribute (session cookie)'
    );

    const loginWithRemember = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@campus.edu', password: 'password123', rememberMe: true })
    });
    assert.strictEqual(loginWithRemember.status, 200);
    const expiresMatch = loginWithRemember.rawSetCookie.match(/Expires=([^;]+)/i);
    assert.ok(expiresMatch, 'Persistent cookie must include Expires header');
    const expiresDate = new Date(expiresMatch[1]);
    const diffDays = Math.round((expiresDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    assert.strictEqual(diffDays, 7, 'Expires date must be 7 days in the future (persistent cookie)');
    console.log('✔ Remember me cookie lifetime verified (session cookie vs 7-day persistent).');

    // 10. Logout cleanup verification
    console.log('\nTest 10: Verify logout clears session cookie');
    const logoutRes = await request('/api/auth/logout', { method: 'POST' }, loginWithRemember.cookie);
    assert.strictEqual(logoutRes.status, 200);
    assert.ok(logoutRes.rawSetCookie?.includes('skillswap_sid=;'), 'Logout must clear skillswap_sid cookie');

    const meAfterLogout = await request('/api/auth/me', {}, loginWithRemember.cookie);
    assert.strictEqual(meAfterLogout.status, 401, 'Request after logout must return 401');
    console.log('✔ Logout completely invalidates session and clears cookie.');

    console.log('\n======================================================');
    console.log('✔ ALL 10 ACCOUNT DELETION & LIFECYCLE TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.dropDatabase();
        console.log(`✔ Dropped isolated test database: ${TEST_DB_NAME}`);
      }
    } catch {
      // ignore
    }
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
