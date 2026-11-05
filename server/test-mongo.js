import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { MONGODB_URI, SESSION_SECRET } from './config.js';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import studentsRoutes from './routes/students.js';
import skillsRoutes from './routes/skills.js';
import statsRoutes from './routes/stats.js';
import { seedDemoUsers } from './seed-demos.js';

// Cookie Jar for session cookie management across HTTP calls
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  extract(res) {
    const raw = res.headers.get('set-cookie');
    if (raw) {
      const parts = raw.split(/,(?=[^;]+;)/);
      for (const part of parts) {
        const [pair] = part.split(';');
        const [key, ...val] = pair.trim().split('=');
        if (key && val) {
          this.cookies.set(key, val.join('='));
        }
      }
    }
  }

  header() {
    const pairs = [];
    for (const [k, v] of this.cookies.entries()) {
      pairs.push(`${k}=${v}`);
    }
    return pairs.join('; ');
  }

  clear() {
    this.cookies.clear();
  }
}

async function request(baseUrl, jar, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const cookieHeader = jar.header();
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });
  jar.extract(res);

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Automated MongoDB Backend Test Suite');
  console.log('======================================================\n');

  // Derive isolated test database URI
  const parsedUrl = new URL(MONGODB_URI);
  parsedUrl.pathname = '/skillswap_test_suite';
  const testMongoUri = parsedUrl.toString();

  console.log('[Test Setup] Connecting to isolated test database...');
  await connectDB(testMongoUri, 6);

  // Clear any leftover data in isolated test database
  await User.deleteMany({});
  console.log('[Test Setup] Cleaned isolated test database.');

  // Seed demo accounts in the test database
  console.log('[Test Setup] Seeding exactly 5 demo accounts...');
  const seedResult = await seedDemoUsers();
  assert(seedResult.totalDemoUsers === 5, `Expected 5 demo accounts, got ${seedResult.totalDemoUsers}`);

  // Create isolated Express test app
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      name: 'skillswap_test_sid',
      secret: SESSION_SECRET || 'test-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        clientPromise: Promise.resolve(mongoose.connection.getClient()),
        collectionName: 'test_sessions'
      }),
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000
      }
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/skills', skillsRoutes);
  app.use('/api/stats', statsRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Setup] Ephemeral test server listening on port ${port}\n`);

  const jar = new CookieJar();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Demo Account Modification Protection
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Demo Account Protection ---');
    const demoLogin = await request(baseUrl, jar, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ram@campus.edu', password: 'demopassword' })
    });
    assert(demoLogin.status === 200, `Demo login should succeed with 200, got ${demoLogin.status}`);
    assert(demoLogin.data.user.isDemo === true, 'Ram should be marked isDemo: true');

    // Attempt profile edit on demo account -> must be rejected 403
    const editDemoProfile = await request(baseUrl, jar, '/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hacked Ram' })
    });
    assert(editDemoProfile.status === 403, `Demo profile update must return 403 Forbidden, got ${editDemoProfile.status}`);
    console.log('✔ Demo profile edit properly blocked (403 Forbidden).');

    // Attempt skill add on demo account -> must be rejected 403
    const addDemoSkill = await request(baseUrl, jar, '/api/me/skills', {
      method: 'POST',
      body: JSON.stringify({ type: 'teach', name: 'Go', level: 'Intermediate' })
    });
    assert(addDemoSkill.status === 403, `Demo skill addition must return 403 Forbidden, got ${addDemoSkill.status}`);
    console.log('✔ Demo skill addition properly blocked (403 Forbidden).');

    // Attempt skill delete on demo account -> must be rejected 403
    const deleteDemoSkill = await request(baseUrl, jar, '/api/me/skills/st-ram-python', {
      method: 'DELETE'
    });
    assert(deleteDemoSkill.status === 403, `Demo skill removal must return 403 Forbidden, got ${deleteDemoSkill.status}`);
    console.log('✔ Demo skill removal properly blocked (403 Forbidden).');

    // Logout demo account
    await request(baseUrl, jar, '/api/auth/logout', { method: 'POST' });
    jar.clear();
    console.log('✔ Demo account test passed.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Real Student A Signup, Session Restoration & Duplicate Rejection
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Student A Registration & Session Restoration ---');
    const studentAPayload = {
      name: 'Alice Walker',
      email: 'alice@campus.edu',
      password: 'SecurePassword123!',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      bio: 'Enthusiastic full-stack student looking to trade React for Python.',
      avatar: './avatars/avatar_1.svg',
      skillsTeaching: [
        { name: 'React', level: 'Advanced', category: 'Programming' }
      ],
      skillsLearning: [
        { name: 'Python', level: 'Beginner', category: 'Programming' }
      ]
    };

    const signupA = await request(baseUrl, jar, '/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(studentAPayload)
    });
    assert(signupA.status === 201, `Student A signup should return 201 Created, got ${signupA.status}`);
    assert(signupA.data.user.email === 'alice@campus.edu', 'Email must match');
    assert(signupA.data.user.isDemo === false, 'Student A must not be a demo user');
    assert(signupA.data.user.skillsTeaching.length === 1, 'Should have 1 teaching skill');
    assert(signupA.data.user.skillsLearning.length === 1, 'Should have 1 learning skill');
    console.log('✔ Student A registered successfully with skills.');

    // Test session restoration (/api/auth/me)
    const meA = await request(baseUrl, jar, '/api/auth/me');
    assert(meA.status === 200, `Session check must return 200 OK, got ${meA.status}`);
    assert(meA.data.user.name === 'Alice Walker', 'Session should restore Alice Walker');
    console.log('✔ Session restored successfully via persistent session cookie.');

    // Duplicate email signup rejection
    const duplicateSignup = await request(baseUrl, jar, '/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(studentAPayload)
    });
    assert(duplicateSignup.status === 409, `Duplicate email must return 409 Conflict, got ${duplicateSignup.status}`);
    console.log('✔ Duplicate registration rejected with 409 Conflict.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Skill Management & Profile Editing for Student A
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Profile Editing & Skill Operations ---');
    // Add a second teaching skill (TypeScript)
    const addSkillRes = await request(baseUrl, jar, '/api/me/skills', {
      method: 'POST',
      body: JSON.stringify({ type: 'teach', name: 'TypeScript', level: 'Intermediate', category: 'Programming' })
    });
    assert(addSkillRes.status === 201, `Skill add should return 201 Created, got ${addSkillRes.status}`);
    assert(addSkillRes.data.user.skillsTeaching.length === 2, 'Should now have 2 teaching skills');
    console.log('✔ Skill "TypeScript" added successfully.');

    // Duplicate skill rejection in same list
    const dupSkillRes = await request(baseUrl, jar, '/api/me/skills', {
      method: 'POST',
      body: JSON.stringify({ type: 'teach', name: 'typescript', level: 'Beginner' })
    });
    assert(dupSkillRes.status === 409, `Duplicate skill must return 409 Conflict, got ${dupSkillRes.status}`);
    console.log('✔ Duplicate skill addition properly rejected with 409 Conflict.');

    // Remove the added skill
    const tsSkill = addSkillRes.data.user.skillsTeaching.find((s) => s.name.toLowerCase() === 'typescript');
    const deleteSkillRes = await request(baseUrl, jar, `/api/me/skills/${encodeURIComponent(tsSkill.id)}`, {
      method: 'DELETE'
    });
    assert(deleteSkillRes.status === 200, `Delete skill should return 200 OK, got ${deleteSkillRes.status}`);
    assert(deleteSkillRes.data.user.skillsTeaching.length === 1, 'Should have 1 teaching skill after removal');
    console.log('✔ Skill removal succeeded.');

    // Profile update
    const updateProfileRes = await request(baseUrl, jar, '/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        bio: 'Updated bio for Alice Walker.',
        year: '4th Year'
      })
    });
    assert(updateProfileRes.status === 200, `Profile update should return 200 OK, got ${updateProfileRes.status}`);
    assert(updateProfileRes.data.user.bio === 'Updated bio for Alice Walker.', 'Bio should be updated');
    assert(updateProfileRes.data.user.year === '4th Year', 'Year should be updated');
    console.log('✔ Profile updated successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Student B Registration & Synergistic Peer Matching Engine
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Student B & Reciprocal Matching Engine ---');
    // Student B teaches Python (which Alice wants) and wants to learn React (which Alice teaches)
    const jarB = new CookieJar();
    const studentBPayload = {
      name: 'Bob Chen',
      email: 'bob@campus.edu',
      password: 'SecurePassword123!',
      department: 'Information Technology',
      year: '2nd Year',
      bio: 'Python data science student keen to learn frontend React.',
      avatar: './avatars/avatar_2.svg',
      teachingSkills: [
        { name: 'Python', level: 'Advanced', category: 'Programming' }
      ],
      learningSkills: [
        { name: 'React', level: 'Beginner', category: 'Programming' }
      ]
    };

    const signupB = await request(baseUrl, jarB, '/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(studentBPayload)
    });
    assert(signupB.status === 201, `Student B signup must succeed with 201, got ${signupB.status}`);
    console.log('✔ Student B registered successfully.');

    // Query /api/students as Student B
    const studentsAsB = await request(baseUrl, jarB, '/api/students');
    assert(studentsAsB.status === 200, `GET /api/students must return 200 OK, got ${studentsAsB.status}`);
    const peerList = studentsAsB.data.students;

    // Verify Bob Chen is excluded from peer listings
    const bobInList = peerList.find((s) => s.email === 'bob@campus.edu' || s.name === 'Bob Chen');
    assert(!bobInList, 'Current student (Bob Chen) must be excluded from /api/students');
    console.log('✔ Current student correctly excluded from peer directory.');

    // Verify Alice Walker is in peer listings and has a high synergy match score
    const aliceInList = peerList.find((s) => s.name === 'Alice Walker');
    assert(Boolean(aliceInList), 'Alice Walker must be present in peer directory for Bob Chen');
    assert(aliceInList.matchPercent >= 80, `Expected reciprocal match >= 80%, got ${aliceInList.matchPercent}%`);
    console.log(`✔ Synergistic match algorithm verified: Alice Walker scored ${aliceInList.matchPercent}% mutual synergy with Bob Chen.`);

    // -------------------------------------------------------------------------
    // TEST 5: Derived Skills & Campus Truthful Statistics
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Truthful Stats & Dynamic Skills Inventory ---');
    const skillsRes = await request(baseUrl, jarB, '/api/skills');
    assert(skillsRes.status === 200, `GET /api/skills must return 200 OK, got ${skillsRes.status}`);
    const reactSkill = skillsRes.data.skills.find((s) => s.title.toLowerCase() === 'react');
    const pythonSkill = skillsRes.data.skills.find((s) => s.title.toLowerCase() === 'python');
    assert(Boolean(reactSkill), 'React skill must be derived from registered teaching skills');
    assert(Boolean(pythonSkill), 'Python skill must be derived from registered teaching skills');
    console.log('✔ Skills inventory dynamically derived from stored teaching skills.');

    const statsRes = await request(baseUrl, jarB, '/api/stats/campus');
    assert(statsRes.status === 200, `GET /api/stats/campus must return 200 OK, got ${statsRes.status}`);
    const stats = statsRes.data.stats || statsRes.data;
    assert(stats.realStudentsCount === 2, `Expected 2 real students (Alice + Bob), got ${stats.realStudentsCount}`);
    assert(stats.demoStudentsCount === 5, `Expected 5 demo guides, got ${stats.demoStudentsCount}`);
    assert(stats.skillsOfferedCount >= 2, `Expected at least 2 distinct skills, got ${stats.skillsOfferedCount}`);
    console.log(`✔ Truthful campus statistics confirmed: ${stats.realStudentsCount} real students, ${stats.demoStudentsCount} demo guides, ${stats.skillsOfferedCount} skills offered.`);

    // -------------------------------------------------------------------------
    // TEST 6: Logout and Unauthenticated Directory Access
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Logout & Unauthenticated Guest Discovery ---');
    const logoutB = await request(baseUrl, jarB, '/api/auth/logout', { method: 'POST' });
    assert(logoutB.status === 200, 'Logout should return 200 OK');

    const meAfterLogout = await request(baseUrl, jarB, '/api/auth/me');
    assert(meAfterLogout.status === 401, 'Logged out session must return 401 Unauthorized');
    console.log('✔ Logout invalidated session cookie.');

    // Guest student query
    const guestJar = new CookieJar();
    const guestStudents = await request(baseUrl, guestJar, '/api/students');
    assert(guestStudents.status === 200, 'Guests can discover campus peers');
    assert(guestStudents.data.totalReal === 2, 'Guests see both real students');
    console.log('✔ Unauthenticated guest directory discovery verified.');

    console.log('\n======================================================');
    console.log('All MongoDB Foundation Backend Tests Passed Successfully (6/6)');
    console.log('======================================================\n');
  } finally {
    server.close();
    // Drop test database and disconnect cleanly
    try {
      await mongoose.connection.db.dropDatabase();
      console.log('[Test Teardown] Dropped isolated test database.');
    } catch (e) {
      console.warn('[Test Teardown] Error dropping test database:', e.message);
    }
    await mongoose.disconnect();
    console.log('[Test Teardown] Disconnected from MongoDB.');
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
