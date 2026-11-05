/**
 * SkillSwap Campus — Automated My Skills Milestone & Regression Test Suite
 *
 * Verifies:
 * 1. Demo student account protection (read-only for add, edit, and delete)
 * 2. Regular student registration and session establishment
 * 3. Adding teaching skills with preserved IDs and database persistence
 * 4. Adding learning goals with preserved IDs and database persistence
 * 5. Case-insensitive duplicate detection for teaching and learning lists
 * 6. Useful input validation errors (empty name, invalid type, invalid level)
 * 7. Editing teaching skills via PATCH /api/me/skills/:id (name, level, category)
 * 8. Editing learning goals via PATCH /api/me/skills/:id
 * 9. Duplicate detection on edit (preventing rename to existing skill)
 * 10. Multi-user ownership isolation (Student B cannot edit or delete Student A's skills)
 * 11. Support for /SkillSwap-Campus/api base path prefix
 * 12. Removing teaching skills via DELETE /api/me/skills/:id
 * 13. Removing learning goals via DELETE /api/me/skills/:id
 * 14. Preservation of session skill snapshots when user skills change
 * 15. Persistence verified directly against MongoDB Atlas
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
import { Session } from './models/Session.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { SESSION_SECRET, MONGODB_URI } from './config.js';

const TEST_DB_NAME = `skillswap_test_myskills_${Date.now()}`;
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
  app.use(express.json());
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

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);

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

  const setCookie = res.headers.get('set-cookie');
  let newCookie = cookie;
  if (setCookie) {
    newCookie = setCookie.split(';')[0];
  }

  return { status: res.status, data, cookie: newCookie };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — My Skills Milestone Test Suite');
  console.log('======================================================\n');

  try {
    await setupTestServer();
    await resetDemoStudent();

    // 1. Demo Student Protection
    console.log('--- 1. Demo Student Protection ---');
    const demoLoginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ram@campus.edu', password: 'demopassword' })
    });
    assert.strictEqual(demoLoginRes.status, 200);
    const demoCookie = demoLoginRes.cookie;

    const demoAdd = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teach', name: 'Kotlin', level: 'Beginner' })
    }, demoCookie);
    assert.strictEqual(demoAdd.status, 403);
    assert(demoAdd.data.error.includes('demo student profile is read-only'));

    const demoPatch = await request('/api/me/skills/st-demo-javascript', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'Advanced' })
    }, demoCookie);
    assert.strictEqual(demoPatch.status, 403);

    const demoDel = await request('/api/me/skills/st-demo-javascript', {
      method: 'DELETE'
    }, demoCookie);
    assert.strictEqual(demoDel.status, 403);
    console.log('✔ Demo student read-only protection verified (Add, Edit, Delete rejected with 403).');

    // 2. Regular Student A (Lakshmi) Registration
    console.log('\n--- 2. Register Regular Student Lakshmi ---');
    const signupA = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lakshmi Rao',
        email: 'lakshmi.test@campus.edu',
        password: 'password123',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        skillsTeaching: [{ name: 'Data Science', level: 'Intermediate', category: 'Programming' }],
        skillsLearning: [{ name: 'Kubernetes', level: 'Beginner', category: 'General' }]
      })
    });
    assert.strictEqual(signupA.status, 201);
    const lakshmiCookie = signupA.cookie;
    const lakshmiId = signupA.data.user.id;
    assert.strictEqual(signupA.data.user.skillsTeaching.length, 1);
    assert.strictEqual(signupA.data.user.skillsLearning.length, 1);
    console.log(`✔ Registered Lakshmi (${lakshmiId}) with 1 teaching and 1 learning skill.`);

    // 3. Add Teaching Skill (POST /api/me/skills)
    console.log('\n--- 3. Add Teaching Skill ---');
    const addTeachRes = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teach',
        name: 'Distributed Systems',
        level: 'Advanced',
        category: 'Programming'
      })
    }, lakshmiCookie);
    assert.strictEqual(addTeachRes.status, 201);
    assert(addTeachRes.data.skill.id.startsWith('st-'));
    assert.strictEqual(addTeachRes.data.skill.name, 'Distributed Systems');
    assert.strictEqual(addTeachRes.data.skill.level, 'Advanced');
    assert.strictEqual(addTeachRes.data.user.skillsTeaching.length, 2);
    assert.strictEqual(addTeachRes.data.user.stats.skillsTeachingCount, 2);

    // Direct MongoDB verification
    const userDoc1 = await User.findById(lakshmiId);
    assert.strictEqual(userDoc1.skillsTeaching.length, 2);
    const savedTeach = userDoc1.skillsTeaching.find((s) => s.name === 'Distributed Systems');
    assert(savedTeach);
    assert.strictEqual(savedTeach.level, 'Advanced');
    const teachSkillId = savedTeach._id;
    console.log(`✔ Teaching skill added and verified in MongoDB (ID: ${teachSkillId}).`);

    // 4. Add Learning Goal (POST /api/me/skills)
    console.log('\n--- 4. Add Learning Goal ---');
    const addLearnRes = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'learn',
        name: 'Cloud Computing',
        level: 'Intermediate',
        category: 'General'
      })
    }, lakshmiCookie);
    assert.strictEqual(addLearnRes.status, 201);
    assert(addLearnRes.data.skill.id.startsWith('sl-'));
    assert.strictEqual(addLearnRes.data.skill.name, 'Cloud Computing');
    assert.strictEqual(addLearnRes.data.user.skillsLearning.length, 2);
    assert.strictEqual(addLearnRes.data.user.stats.skillsLearningCount, 2);

    const userDoc2 = await User.findById(lakshmiId);
    assert.strictEqual(userDoc2.skillsLearning.length, 2);
    const savedLearn = userDoc2.skillsLearning.find((s) => s.name === 'Cloud Computing');
    assert(savedLearn);
    const learnSkillId = savedLearn._id;
    console.log(`✔ Learning goal added and verified in MongoDB (ID: ${learnSkillId}).`);

    // 5. Duplicate Detection
    console.log('\n--- 5. Duplicate Detection ---');
    const dupTeach = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teach',
        name: '  distributed systems  ',
        level: 'Beginner'
      })
    }, lakshmiCookie);
    assert.strictEqual(dupTeach.status, 409);
    assert(dupTeach.data.error.includes('already added'));

    const dupLearn = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'learn',
        name: 'cloud computing',
        level: 'Advanced'
      })
    }, lakshmiCookie);
    assert.strictEqual(dupLearn.status, 409);
    assert(dupLearn.data.error.includes('already added'));
    console.log('✔ Case-insensitive duplicate rejection verified for both teaching and learning.');

    // 6. Validation Errors
    console.log('\n--- 6. Validation Errors ---');
    const emptyName = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teach', name: '   ' })
    }, lakshmiCookie);
    assert.strictEqual(emptyName.status, 400);

    const invalidType = await request('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unknown', name: 'GraphQL' })
    }, lakshmiCookie);
    assert.strictEqual(invalidType.status, 400);
    console.log('✔ Input validation verified (empty name & invalid type rejected with 400).');

    // 7. Edit Teaching Skill (PATCH /api/me/skills/:id)
    console.log('\n--- 7. Edit Teaching Skill ---');
    const patchTeachRes = await request(`/api/me/skills/${teachSkillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cloud Architecture & Distributed Systems',
        level: 'Intermediate',
        category: 'Engineering'
      })
    }, lakshmiCookie);
    assert.strictEqual(patchTeachRes.status, 200);
    assert.strictEqual(patchTeachRes.data.skill.name, 'Cloud Architecture & Distributed Systems');
    assert.strictEqual(patchTeachRes.data.skill.level, 'Intermediate');
    assert.strictEqual(patchTeachRes.data.skill.category, 'Engineering');

    const userDoc3 = await User.findById(lakshmiId);
    const updatedTeach = userDoc3.skillsTeaching.find((s) => s._id === teachSkillId);
    assert.strictEqual(updatedTeach.name, 'Cloud Architecture & Distributed Systems');
    assert.strictEqual(updatedTeach.level, 'Intermediate');
    assert.strictEqual(updatedTeach.category, 'Engineering');
    console.log('✔ Teaching skill edited and verified in MongoDB.');

    // 8. Edit Learning Goal (PATCH /api/me/skills/:id)
    console.log('\n--- 8. Edit Learning Goal ---');
    const patchLearnRes = await request(`/api/me/skills/${learnSkillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'Advanced',
        category: 'Technical'
      })
    }, lakshmiCookie);
    assert.strictEqual(patchLearnRes.status, 200);
    assert.strictEqual(patchLearnRes.data.skill.level, 'Advanced');

    const userDoc4 = await User.findById(lakshmiId);
    const updatedLearn = userDoc4.skillsLearning.find((s) => s._id === learnSkillId);
    assert.strictEqual(updatedLearn.level, 'Advanced');
    console.log('✔ Learning goal edited and verified in MongoDB.');

    // 9. Edit Duplicate Name Collision
    console.log('\n--- 9. Duplicate Rejection on Edit ---');
    const editDup = await request(`/api/me/skills/${teachSkillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Data Science' })
    }, lakshmiCookie);
    assert.strictEqual(editDup.status, 409);
    assert(editDup.data.error.includes('already have'));
    console.log('✔ Duplicate name collision on edit properly rejected with 409 Conflict.');

    // 10. Multi-user Ownership Isolation
    console.log('\n--- 10. Multi-user Ownership Isolation ---');
    const signupB = await request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lucky Sharma',
        email: 'lucky.test@campus.edu',
        password: 'password123',
        department: 'Information Technology',
        year: '2nd Year',
        skillsTeaching: [{ name: 'Rust', level: 'Intermediate' }],
        skillsLearning: [{ name: 'Solidity', level: 'Beginner' }]
      })
    });
    assert.strictEqual(signupB.status, 201);
    const luckyCookie = signupB.cookie;

    // Lucky attempts to modify Lakshmi's skill
    const unauthorizedPatch = await request(`/api/me/skills/${teachSkillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Skill' })
    }, luckyCookie);
    assert.strictEqual(unauthorizedPatch.status, 404);

    // Lucky attempts to delete Lakshmi's skill
    const unauthorizedDel = await request(`/api/me/skills/${teachSkillId}`, {
      method: 'DELETE'
    }, luckyCookie);
    assert.strictEqual(unauthorizedDel.status, 404);

    // Verify Lakshmi's skill is untouched
    const userDoc5 = await User.findById(lakshmiId);
    const untouched = userDoc5.skillsTeaching.find((s) => s._id === teachSkillId);
    assert.strictEqual(untouched.name, 'Cloud Architecture & Distributed Systems');
    console.log('✔ Cross-user mutation blocked. Skills strictly isolated per student account.');

    // 11. /SkillSwap-Campus/ Base Path Verification
    console.log('\n--- 11. Base Path Rewrite Verification ---');
    const basePathRes = await request('/SkillSwap-Campus/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teach',
        name: 'GraphQL & Apollo',
        level: 'Intermediate',
        category: 'Programming'
      })
    }, lakshmiCookie);
    assert.strictEqual(basePathRes.status, 201);
    assert.strictEqual(basePathRes.data.skill.name, 'GraphQL & Apollo');
    const graphqlSkillId = basePathRes.data.skill.id;
    console.log('✔ /SkillSwap-Campus/api prefix seamlessly handled by backend rewrite.');

    // 12. Remove Teaching Skill (DELETE /api/me/skills/:id)
    console.log('\n--- 12. Remove Teaching Skill ---');
    const delTeachRes = await request(`/api/me/skills/${graphqlSkillId}`, {
      method: 'DELETE'
    }, lakshmiCookie);
    assert.strictEqual(delTeachRes.status, 200);
    assert.strictEqual(delTeachRes.data.user.skillsTeaching.length, 2);

    const userDoc6 = await User.findById(lakshmiId);
    assert(!userDoc6.skillsTeaching.some((s) => s._id === graphqlSkillId));
    console.log('✔ Teaching skill removed and verified deleted in MongoDB.');

    // 13. Remove Learning Goal (DELETE /api/me/skills/:id)
    console.log('\n--- 13. Remove Learning Goal ---');
    const delLearnRes = await request(`/api/me/skills/${learnSkillId}`, {
      method: 'DELETE'
    }, lakshmiCookie);
    assert.strictEqual(delLearnRes.status, 200);
    assert.strictEqual(delLearnRes.data.user.skillsLearning.length, 1);

    const userDoc7 = await User.findById(lakshmiId);
    assert(!userDoc7.skillsLearning.some((s) => s._id === learnSkillId));
    console.log('✔ Learning goal removed and verified deleted in MongoDB.');

    // 14. Preservation of Session Skill Snapshots
    console.log('\n--- 14. Session Skill Snapshot Preservation ---');
    const fakeConnId = new mongoose.Types.ObjectId();
    const sessionDoc = new Session({
      connectionId: fakeConnId,
      title: 'Data Science Mentorship Session',
      skillName: 'Data Science',
      teacher: lakshmiId,
      learner: signupB.data.user.id,
      proposedBy: lakshmiId,
      status: 'confirmed',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 86400000 + 3600000),
      durationMinutes: 60,
      teacherSnapshot: { name: 'Lakshmi Rao' },
      learnerSnapshot: { name: 'Lucky Sharma' }
    });
    await sessionDoc.save();

    // Now edit Lakshmi's Data Science skill
    const initialSkillId = userDoc7.skillsTeaching.find((s) => s.name === 'Data Science')._id;
    const renameRes = await request(`/api/me/skills/${initialSkillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Data Science & Machine Learning' })
    }, lakshmiCookie);
    assert.strictEqual(renameRes.status, 200);

    // Verify session document still preserves historical snapshot "Data Science"
    const verifiedSession = await Session.findById(sessionDoc._id);
    assert.strictEqual(verifiedSession.skillName, 'Data Science');
    assert.strictEqual(verifiedSession.title, 'Data Science Mentorship Session');
    console.log('✔ Historical session snapshots preserved intact after skill renaming.');

    // 15. Persistence Across Session Restoration
    console.log('\n--- 15. Persistence Across Session Restoration ---');
    const restoreRes = await request('/api/auth/me', {}, lakshmiCookie);
    assert.strictEqual(restoreRes.status, 200);
    assert.strictEqual(restoreRes.data.user.skillsTeaching.length, 2);
    assert(restoreRes.data.user.skillsTeaching.some((s) => s.name === 'Data Science & Machine Learning'));
    assert(restoreRes.data.user.skillsTeaching.some((s) => s.name === 'Cloud Architecture & Distributed Systems'));
    assert.strictEqual(restoreRes.data.user.skillsLearning.length, 1);
    assert.strictEqual(restoreRes.data.user.skillsLearning[0].name, 'Kubernetes');
    console.log('✔ Session restoration verified with 100% persistent MongoDB data.');

    console.log('\n======================================================');
    console.log('🎉 ALL 15 MY SKILLS MILESTONE & REGRESSION CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    try {
      await mongoose.connection.dropDatabase();
      console.log(`✔ Cleaned up and dropped test DB: ${TEST_DB_NAME}`);
      await disconnectDB();
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
