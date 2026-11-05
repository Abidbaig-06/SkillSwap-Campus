import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import { SESSION_SECRET, MONGODB_URI } from './config.js';
import { User } from './models/User.js';
import { Connection } from './models/Connection.js';
import { Conversation } from './models/Conversation.js';
import { Session } from './models/Session.js';
import { SessionNote } from './models/SessionNote.js';
import authRoutes from './routes/auth.js';
import connectionsRoutes from './routes/connections.js';
import sessionsRoutes from './routes/sessions.js';
import statsRoutes from './routes/stats.js';
import { initSocket } from './socket.js';

const TEST_DB_NAME = `skillswap_test_sessions_${Date.now()}`;

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
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/stats', statsRoutes);

  return { app, server };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Scheduled Peer Sessions Test Suite');
  console.log('======================================================\n');

  console.log('[Setup] Connecting to isolated test database:', TEST_DB_NAME);
  const uri = new URL(MONGODB_URI);
  uri.pathname = `/${TEST_DB_NAME}`;
  const testMongoUri = uri.toString();

  await connectDB(testMongoUri, 3);
  console.log('✔ Connected to isolated test DB:', mongoose.connection.name);

  // Clean test DB collections
  await User.deleteMany({});
  await Connection.deleteMany({});
  await Conversation.deleteMany({});
  await Session.deleteMany({});
  await SessionNote.deleteMany({});

  let { server } = createTestServer(TEST_DB_NAME);

  await new Promise((resolve) => server.listen(0, resolve));
  let port = server.address().port;
  let baseUrl = `http://localhost:${port}`;
  console.log(`✔ Test server listening on ${baseUrl}`);

  // Helper HTTP request function with cookie handling
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
    return { status: res.status, data, setCookie: setCookie ? setCookie.split(';')[0] : cookies };
  }

  try {
    // 1. Create two test students + a third-party student
    console.log('\n--- 1. User Registration & Setup ---');
    const resA = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student Teacher',
        email: `teacher_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Computer Science',
        year: '3rd Year',
        skillsTeaching: [{ name: 'React', level: 'Advanced', description: 'Components & State' }],
        skillsLearning: [{ name: 'Python', level: 'Beginner' }]
      })
    });
    assert.strictEqual(resA.status, 201, 'Teacher signup failed');
    const teacherCookie = resA.setCookie;
    const teacherId = resA.data.user.id;

    const resB = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student Learner',
        email: `learner_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Information Tech',
        year: '2nd Year',
        skillsTeaching: [{ name: 'Python', level: 'Intermediate', description: 'Flask' }],
        skillsLearning: [{ name: 'React', level: 'Beginner' }]
      })
    });
    assert.strictEqual(resB.status, 201, 'Learner signup failed');
    const learnerCookie = resB.setCookie;
    const learnerId = resB.data.user.id;

    const resC = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student Charlie',
        email: `charlie_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Mechanical Engg',
        year: '1st Year',
        skillsTeaching: [{ name: 'CAD', level: 'Beginner' }],
        skillsLearning: [{ name: 'Python', level: 'Beginner' }]
      })
    });
    assert.strictEqual(resC.status, 201, 'Charlie signup failed');
    const charlieCookie = resC.setCookie;
    const charlieId = resC.data.user.id;

    console.log('✔ Registered Student Teacher, Student Learner, and Student Charlie');

    // 2. Connect the students (request + accept)
    console.log('\n--- 2. Establish Accepted Connection ---');
    const connReq = await api('/api/connections', {
      method: 'POST',
      body: JSON.stringify({
        studentId: learnerId,
        studentName: 'Student Learner',
        offeredSkill: 'React',
        targetSkill: 'Python',
        note: 'Let us swap React and Python!'
      })
    }, teacherCookie);
    assert.strictEqual(connReq.status, 201, 'Connection request failed');
    const connectionId = connReq.data.connection.id;

    const connAccept = await api(`/api/connections/${connectionId}/accept`, {
      method: 'PATCH'
    }, learnerCookie);
    assert.strictEqual(connAccept.status, 200, 'Connection acceptance failed');
    console.log('✔ Connection accepted. Connection ID:', connectionId);

    // 3. Propose Session Validation
    console.log('\n--- 3. Propose Session Input Validations ---');
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const futureTime1 = new Date(Date.now() + 86400000).toISOString(); // +24 hours

    const pastRes = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Past Lesson',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        startTime: pastTime,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(pastRes.status, 400, 'Should reject past start time');
    console.log('✔ Past start time correctly rejected (400)');

    const badDurRes = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Invalid Duration',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        startTime: futureTime1,
        durationMinutes: 5 // Less than min allowed 15 mins
      })
    }, teacherCookie);
    assert.strictEqual(badDurRes.status, 400, 'Should reject invalid duration');
    console.log('✔ Invalid duration correctly rejected (400)');

    // 4. Valid Session Proposal
    console.log('\n--- 4. Propose Valid Session ---');
    const propRes = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Mastering React State & Hooks',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        learningObjectives: 'Cover useState, useEffect, and custom hooks with examples.',
        startTime: futureTime1,
        durationMinutes: 60,
        timezone: 'Asia/Kolkata',
        clientRequestId: `req_${Date.now()}`
      })
    }, teacherCookie);
    assert.strictEqual(propRes.status, 201, 'Valid session proposal failed');
    assert.strictEqual(propRes.data.session.status, 'proposed');
    assert.strictEqual(propRes.data.session.proposedBy, teacherId);
    const sessionId = propRes.data.session.id;
    console.log('✔ Session proposed successfully. Session ID:', sessionId);

    // 5. Proposal Acceptance Authorization (Self-acceptance rejection)
    console.log('\n--- 5. Proposal Authorization Checks ---');
    const selfAccept = await api(`/api/sessions/${sessionId}/accept`, {
      method: 'PATCH'
    }, teacherCookie);
    assert.strictEqual(selfAccept.status, 403, 'Proposer cannot accept own proposal');
    console.log('✔ Proposer blocked from accepting own proposal (403)');

    // Partner accepts
    const partnerAccept = await api(`/api/sessions/${sessionId}/accept`, {
      method: 'PATCH'
    }, learnerCookie);
    assert.strictEqual(partnerAccept.status, 200, 'Partner should accept proposal');
    assert.strictEqual(partnerAccept.data.session.status, 'confirmed');
    console.log('✔ Partner accepted proposal. Status: confirmed');

    // 6. Overlapping Booking Conflict Prevention
    console.log('\n--- 6. Overlapping Booking Conflict Prevention ---');
    const overlapStart = new Date(new Date(futureTime1).getTime() + 30 * 60000).toISOString();
    const overlapRes = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Conflicting Session',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        startTime: overlapStart,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(overlapRes.status, 409, 'Should reject overlapping confirmed slot');
    console.log('✔ Conflicting overlapping booking blocked (409 Conflict)');

    // 7. Concurrent Overlapping Booking Attempts
    console.log('\n--- 7. Concurrent Overlapping Booking Attempts ---');
    // Prepare a separate future window
    const windowStart = new Date(Date.now() + 259200000).toISOString(); // +72 hours
    const propConcurrent1 = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Concurrent Candidate 1',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        startTime: windowStart,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(propConcurrent1.status, 201);
    const concSessionId1 = propConcurrent1.data.session.id;

    // Second proposal for the exact same slot
    const propConcurrent2 = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Concurrent Candidate 2',
        skillName: 'React',
        teacher: teacherId,
        learner: learnerId,
        startTime: windowStart,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(propConcurrent2.status, 201);
    const concSessionId2 = propConcurrent2.data.session.id;

    // Confirm candidate 1
    const acceptConc1 = await api(`/api/sessions/${concSessionId1}/accept`, { method: 'PATCH' }, learnerCookie);
    assert.strictEqual(acceptConc1.status, 200);

    // Confirm candidate 2 now that candidate 1 is confirmed in that slot
    const acceptConc2 = await api(`/api/sessions/${concSessionId2}/accept`, { method: 'PATCH' }, learnerCookie);
    assert.strictEqual(acceptConc2.status, 409, 'Accepting second overlapping session must fail with 409 Conflict');
    console.log('✔ Concurrent overlapping session acceptance blocked with 409 Conflict');

    // 8. Reschedule Flow
    console.log('\n--- 8. Rescheduling Proposal & Acceptance Flow ---');
    const newRescheduleTime = new Date(Date.now() + 172800000).toISOString(); // +48 hours
    const reschedReq = await api(`/api/sessions/${sessionId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        startTime: newRescheduleTime,
        durationMinutes: 90,
        reason: 'Midterm exam moved, proposing 2 days later'
      })
    }, learnerCookie);
    assert.strictEqual(reschedReq.status, 200, 'Reschedule proposal failed');
    assert.strictEqual(reschedReq.data.session.status, 'confirmed', 'Original time remains confirmed');
    assert.ok(reschedReq.data.session.rescheduleProposal, 'Reschedule proposal snapshot saved');
    console.log('✔ Reschedule proposal recorded. Existing confirmed slot preserved.');

    // Partner (teacher) accepts reschedule
    const acceptResched = await api(`/api/sessions/${sessionId}/reschedule/accept`, {
      method: 'PATCH'
    }, teacherCookie);
    assert.strictEqual(acceptResched.status, 200, 'Accept reschedule failed');
    assert.strictEqual(new Date(acceptResched.data.session.startTime).toISOString(), new Date(newRescheduleTime).toISOString());
    assert.strictEqual(acceptResched.data.session.durationMinutes, 90);
    assert.strictEqual(acceptResched.data.session.rescheduleProposal, null, 'Reschedule proposal cleared upon acceptance');
    console.log('✔ Reschedule accepted. New time & duration (90 mins) confirmed.');

    // 9. Session Notes & Resource URL Validation
    console.log('\n--- 9. Session Notes & Resource Links ---');
    const badUrlNote = await api(`/api/sessions/${sessionId}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Unsafe script link',
        resources: [{ title: 'Exploit', url: 'javascript:alert(1)' }]
      })
    }, teacherCookie);
    assert.strictEqual(badUrlNote.status, 400, 'Unsafe resource URL should be rejected');
    console.log('✔ Unsafe resource URL correctly rejected (400)');

    const goodNoteRes = await api(`/api/sessions/${sessionId}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Key takeaways: React 19 Actions and useOptimistic hooks.',
        resources: [{ title: 'Official Docs', url: 'https://react.dev' }]
      })
    }, teacherCookie);
    assert.strictEqual(goodNoteRes.status, 201, 'Valid note creation failed');
    const noteId = goodNoteRes.data.note.id;
    assert.strictEqual(goodNoteRes.data.note.authorId, teacherId);
    console.log('✔ Session note created with verified HTTPS resource link. Note ID:', noteId);

    // Learner attempts to edit Teacher's note (should fail 403)
    const unauthorizedEdit = await api(`/api/sessions/${sessionId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: 'Hacked edit' })
    }, learnerCookie);
    assert.strictEqual(unauthorizedEdit.status, 403, 'Author-only note modification violation');
    console.log('✔ Author-only note modification enforced (403)');

    // Teacher edits note
    const authorEdit = await api(`/api/sessions/${sessionId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: 'Updated takeaways: React 19 Actions and Server Functions.' })
    }, teacherCookie);
    assert.strictEqual(authorEdit.status, 200, 'Author edit failed');
    assert.strictEqual(authorEdit.data.note.text, 'Updated takeaways: React 19 Actions and Server Functions.');
    console.log('✔ Note successfully edited by original author.');

    // 10. Participant Permissions & Third-Party Isolation
    console.log('\n--- 10. Participant Permissions & Third-Party Access Control ---');
    const charlieViewSession = await api(`/api/sessions/${sessionId}`, {}, charlieCookie);
    assert.strictEqual(charlieViewSession.status, 403, 'Non-participant cannot view session details');

    const charlieAccept = await api(`/api/sessions/${sessionId}/accept`, { method: 'PATCH' }, charlieCookie);
    assert.strictEqual(charlieAccept.status, 403, 'Non-participant cannot accept session');

    const charlieNotes = await api(`/api/sessions/${sessionId}/notes`, {}, charlieCookie);
    assert.strictEqual(charlieNotes.status, 403, 'Non-participant cannot view session notes');
    console.log('✔ Non-participant blocked from reading, accepting, or modifying session (403 Forbidden)');

    // 11. Session Cancellation
    console.log('\n--- 11. Session Cancellation Flow ---');
    // We cancel the concurrent session candidate 1
    const cancelRes = await api(`/api/sessions/${concSessionId1}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Scheduling conflict resolved' })
    }, teacherCookie);
    assert.strictEqual(cancelRes.status, 200, 'Cancellation failed');
    assert.strictEqual(cancelRes.data.session.status, 'cancelled');
    assert.strictEqual(cancelRes.data.session.cancelledBy, teacherId);
    console.log('✔ Session cancellation verified. Status: cancelled, cancelledBy recorded.');

    // 12. Two-Party Session Completion & Hours Tracking
    console.log('\n--- 12. Two-Sided Completion & Personal Exchange Hours ---');
    await Session.findByIdAndUpdate(sessionId, {
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 1800000)    // 30 mins ago
    });

    // First participant confirms
    const comp1 = await api(`/api/sessions/${sessionId}/complete`, {
      method: 'POST'
    }, teacherCookie);
    assert.strictEqual(comp1.status, 200);
    assert.strictEqual(comp1.data.session.status, 'confirmed', 'Requires two-party confirmation');
    assert.ok(comp1.data.session.completedBy.includes(teacherId));
    console.log('✔ First participant confirmed completion. Status remains confirmed awaiting partner.');

    // Second participant confirms
    const comp2 = await api(`/api/sessions/${sessionId}/complete`, {
      method: 'POST'
    }, learnerCookie);
    assert.strictEqual(comp2.status, 200);
    assert.strictEqual(comp2.data.session.status, 'completed', 'Both confirmed flips status to completed');
    assert.ok(comp2.data.session.completedBy.includes(learnerId));
    console.log('✔ Both participants confirmed completion. Status: completed.');

    // 13. Truthful Personal Stats Calculation
    console.log('\n--- 13. Truthful Personal Statistics Verification ---');
    const statsTeacher = await api('/api/stats/personal', {}, teacherCookie);
    assert.strictEqual(statsTeacher.status, 200);
    assert.strictEqual(statsTeacher.data.stats.completedSessionsCount, 1);
    assert.strictEqual(statsTeacher.data.stats.teachingHours, 1.5, '90 minutes = 1.5 teaching hours');
    assert.strictEqual(statsTeacher.data.stats.learningHours, 0);
    assert.strictEqual(statsTeacher.data.stats.totalExchangeHours, 1.5);
    console.log('✔ Teacher stats verified: 1.5 teaching hours, 0 learning hours, total 1.5 hrs');

    const statsLearner = await api('/api/stats/personal', {}, learnerCookie);
    assert.strictEqual(statsLearner.status, 200);
    assert.strictEqual(statsLearner.data.stats.completedSessionsCount, 1);
    assert.strictEqual(statsLearner.data.stats.teachingHours, 0);
    assert.strictEqual(statsLearner.data.stats.learningHours, 1.5, '90 minutes = 1.5 learning hours');
    assert.strictEqual(statsLearner.data.stats.totalExchangeHours, 1.5);
    console.log('✔ Learner stats verified: 0 teaching hours, 1.5 learning hours, total 1.5 hrs');

    // 14. Persistence Across Backend Restart
    console.log('\n--- 14. Data Persistence Across Backend Restart ---');
    console.log('[Restart] Shutting down HTTP server & closing connections...');
    server.close();
    await disconnectDB();

    console.log('[Restart] Reconnecting to database & starting fresh server instance...');
    await connectDB(testMongoUri, 3);
    const restarted = createTestServer(TEST_DB_NAME);
    server = restarted.server;
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`✔ Restarted test server listening on ${baseUrl}`);

    // Verify session data persists exactly
    const persistedSession = await Session.findById(sessionId).lean();
    assert.ok(persistedSession, 'Session must exist in database after server restart');
    assert.strictEqual(persistedSession.status, 'completed');
    assert.strictEqual(persistedSession.durationMinutes, 90);
    assert.strictEqual(persistedSession.completedBy.length, 2);

    // Verify notes persisted
    const persistedNotes = await SessionNote.find({ sessionId }).lean();
    assert.strictEqual(persistedNotes.length, 1);
    assert.strictEqual(persistedNotes[0].authorId.toString(), teacherId);

    // Verify personal stats persist through API on restarted server
    const statsAfterRestart = await api('/api/stats/personal', {}, teacherCookie);
    assert.strictEqual(statsAfterRestart.status, 200);
    assert.strictEqual(statsAfterRestart.data.stats.completedSessionsCount, 1);
    assert.strictEqual(statsAfterRestart.data.stats.totalExchangeHours, 1.5);
    console.log('✔ Session, notes, and personal stats verified persistent across full backend restart.');

    // 15. Browser-Style Quick Accept Regression (Empty Body & Headers)
    console.log('\n--- 15. Browser-Style Quick Accept Regression (Empty Body & Headers) ---');
    const futureDate1 = new Date(Date.now() + 86400000 * 2).toISOString();
    const prop1 = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Graph Algorithms',
        skillName: 'Algorithms',
        teacher: teacherId,
        learner: learnerId,
        learningObjectives: 'Dijkstra and Bellman-Ford',
        startTime: futureDate1,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(prop1.status, 201);
    const regSessionId1 = prop1.data.session.id;

    // Direct raw fetch reproduction: PATCH with NO Content-Type and NO body
    const rawRes = await fetch(`${baseUrl}/api/sessions/${regSessionId1}/accept`, {
      method: 'PATCH',
      headers: { Cookie: learnerCookie }
    });
    const rawData = await rawRes.json();
    assert.strictEqual(rawRes.status, 200, 'Accept without Content-Type/body should succeed with 200');
    assert.strictEqual(rawData.session.status, 'confirmed');
    assert.strictEqual(rawData.session.version, 2, 'Version should increment to 2');
    console.log('✔ Regression verified: Session accepted without body/headers succeeds (HTTP 200, version incremented)');

    // 16. Details Modal Accept with Explicit Version Payload
    console.log('\n--- 16. Details Modal Accept with Explicit Version Payload ---');
    const futureDate2 = new Date(Date.now() + 86400000 * 3).toISOString();
    const prop2 = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'Dynamic Programming',
        skillName: 'Algorithms',
        teacher: teacherId,
        learner: learnerId,
        learningObjectives: 'Knapsack and LCS',
        startTime: futureDate2,
        durationMinutes: 60
      })
    }, teacherCookie);
    assert.strictEqual(prop2.status, 201);
    const regSessionId2 = prop2.data.session.id;
    assert.strictEqual(prop2.data.session.version, 1);

    // Modal acceptance sends JSON { version: 1 }
    const modalAcceptRes = await api(`/api/sessions/${regSessionId2}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ version: 1 })
    }, learnerCookie);
    assert.strictEqual(modalAcceptRes.status, 200);
    assert.strictEqual(modalAcceptRes.data.session.status, 'confirmed');
    assert.strictEqual(modalAcceptRes.data.session.version, 2);
    console.log('✔ Modal accept verified: explicit version passed and incremented.');

    // 17. Duplicate Accept and Double Click Handling
    console.log('\n--- 17. Duplicate Accept and Stale Version Handling ---');
    const dupRes = await api(`/api/sessions/${regSessionId2}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ version: 1 })
    }, learnerCookie);
    assert.strictEqual(dupRes.status, 400, 'Should reject accepting session that is already confirmed');
    console.log('✔ Re-accepting already confirmed session rejected (HTTP 400).');

    // Proposer trying to accept own proposal
    const futureDate3 = new Date(Date.now() + 86400000 * 4).toISOString();
    const prop3 = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId,
        title: 'System Design',
        skillName: 'Algorithms',
        teacher: teacherId,
        learner: learnerId,
        learningObjectives: 'Caching and Sharding',
        startTime: futureDate3,
        durationMinutes: 45
      })
    }, teacherCookie);
    assert.strictEqual(prop3.status, 201);
    const regSessionId3 = prop3.data.session.id;

    const selfAcceptRes = await api(`/api/sessions/${regSessionId3}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ version: 1 })
    }, teacherCookie);
    assert.strictEqual(selfAcceptRes.status, 403, 'Proposer cannot accept own proposal');
    console.log('✔ Proposer acceptance blocked (HTTP 403).');

    // 18. Acceptance Flow Between Two Regular Registered Accounts
    console.log('\n--- 18. Acceptance Flow Between Two Regular Registered Accounts ---');
    const regAlice = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Student',
        email: `alice_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Computer Science',
        year: '3rd Year',
        skillsTeaching: [{ name: 'Calculus', level: 'Advanced' }],
        skillsLearning: [{ name: 'Python', level: 'Beginner' }]
      })
    });
    assert.strictEqual(regAlice.status, 201);
    const aliceCookie = regAlice.setCookie;
    const aliceId = regAlice.data.user.id;

    const regBob = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bob Student',
        email: `bob_${Date.now()}@campus.edu`,
        password: 'Password123!',
        department: 'Mathematics',
        year: '2nd Year',
        skillsTeaching: [{ name: 'Python', level: 'Intermediate' }],
        skillsLearning: [{ name: 'Calculus', level: 'Beginner' }]
      })
    });
    assert.strictEqual(regBob.status, 201);
    const bobCookie = regBob.setCookie;
    const bobId = regBob.data.user.id;

    const sendConn = await api('/api/connections', {
      method: 'POST',
      body: JSON.stringify({
        studentId: bobId,
        studentName: 'Bob Student',
        offeredSkill: 'Calculus',
        targetSkill: 'Python',
        note: 'Hi Bob, want to study Calculus and Python together?'
      })
    }, aliceCookie);
    assert.strictEqual(sendConn.status, 201);
    const connId = sendConn.data.connection.id;

    const acceptConn = await api(`/api/connections/${connId}/accept`, {
      method: 'PATCH'
    }, bobCookie);
    assert.strictEqual(acceptConn.status, 200);

    const futureDate4 = new Date(Date.now() + 86400000 * 5).toISOString();
    const aliceProp = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        connectionId: connId,
        title: 'Calculus I Review',
        skillName: 'Calculus',
        teacher: aliceId,
        learner: bobId,
        learningObjectives: 'Derivatives and Chain rule',
        startTime: futureDate4,
        durationMinutes: 60
      })
    }, aliceCookie);
    assert.strictEqual(aliceProp.status, 201);
    const regularSessionId = aliceProp.data.session.id;

    const bobAccept = await api(`/api/sessions/${regularSessionId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ version: aliceProp.data.session.version })
    }, bobCookie);
    assert.strictEqual(bobAccept.status, 200);
    assert.strictEqual(bobAccept.data.session.status, 'confirmed');

    const aliceSessions = await api('/api/sessions?status=upcoming', {}, aliceCookie);
    assert.strictEqual(aliceSessions.status, 200);
    assert.ok(aliceSessions.data.sessions.some((s) => s.id === regularSessionId));

    const bobSessions = await api('/api/sessions?status=upcoming', {}, bobCookie);
    assert.strictEqual(bobSessions.status, 200);
    assert.ok(bobSessions.data.sessions.some((s) => s.id === regularSessionId));
    console.log('✔ Full regular student session proposal and acceptance flow verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL 18 SESSION MILESTONE VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    // Cleanup
    server.close();
    try {
      await mongoose.connection.dropDatabase();
      console.log('✔ Cleaned up and dropped test DB:', TEST_DB_NAME);
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
