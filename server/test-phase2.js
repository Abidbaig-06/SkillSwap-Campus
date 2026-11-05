import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setDatabase, initDatabase } from './db.js';
import { SQLiteSessionStore } from './sessionStore.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDbPath = path.join(__dirname, '../data/temp_phase2_test.db');

// Ensure clean slate for temporary test database
if (fs.existsSync(tempDbPath)) {
  try {
    fs.unlinkSync(tempDbPath);
  } catch {}
}

const testDb = new DatabaseSync(tempDbPath);
setDatabase(testDb);
initDatabase();

function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      store: new SQLiteSessionStore(testDb),
      name: 'skillswap_sid',
      secret: 'phase2-test-secret-2026',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      }
    })
  );
  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  return app;
}

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
    if (this.cookies.size === 0) return '';
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  clear() {
    this.cookies.clear();
  }
}

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('SkillSwap Campus — Phase 2 Backend Verification Suite');
  console.log('Temporary Test Database: data/temp_phase2_test.db');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  const PORT = 3097;
  const app = createTestServer();
  let server;
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // TEST 1: Signed-out requests rejection
    console.log('--- Step 1: Signed-out Requests Rejection ---');
    const unauthProfileRes = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: 'Attempt by stranger' })
    });
    assert(unauthProfileRes.status === 401, 'PATCH /api/me/profile without session returns 401');

    const unauthAddSkillRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teach', name: 'Go' })
    });
    assert(unauthAddSkillRes.status === 401, 'POST /api/me/skills without session returns 401');

    const unauthDeleteSkillRes = await fetch(`${baseUrl}/api/me/skills/st-fake-123`, {
      method: 'DELETE'
    });
    assert(unauthDeleteSkillRes.status === 401, 'DELETE /api/me/skills/:id without session returns 401');

    // TEST 2: Register Student A (Priya Patel)
    console.log('\n--- Step 2: Register Student A (Priya Patel) ---');
    const jarA = new CookieJar();
    const signupARes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Priya Patel',
        email: 'priya.patel@campus.edu',
        password: 'Password123!',
        department: 'Computer Science',
        year: '3rd Year',
        bio: 'Frontend enthusiast exploring React.',
        skillsTeaching: [{ name: 'React', level: 'Advanced', category: 'Programming' }],
        skillsLearning: [{ name: 'Python', level: 'Beginner', category: 'Programming' }]
      })
    });
    jarA.extract(signupARes);
    const signupAData = await signupARes.json();
    assert(signupARes.status === 201, 'Student A registered with 201 Created');
    assert(signupAData.user.name === 'Priya Patel', 'Student A name is Priya Patel');
    assert(signupAData.user.skillsTeaching.some((s) => s.name === 'React'), 'Student A has initial teaching skill React');

    // TEST 3: Register Student B (Rahul Verma) — Also teaches React!
    console.log('\n--- Step 3: Register Student B (Rahul Verma) [Both teach React] ---');
    const jarB = new CookieJar();
    const signupBRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Rahul Verma',
        email: 'rahul.verma@campus.edu',
        password: 'Password456!',
        department: 'Information Technology',
        year: '2nd Year',
        bio: 'Fullstack explorer.',
        skillsTeaching: [
          { name: 'React', level: 'Intermediate', category: 'Programming' },
          { name: 'Node.js', level: 'Advanced', category: 'Programming' }
        ],
        skillsLearning: [{ name: 'Docker', level: 'Beginner', category: 'DevOps' }]
      })
    });
    jarB.extract(signupBRes);
    const signupBData = await signupBRes.json();
    assert(signupBRes.status === 201, 'Student B registered with 201 Created');
    assert(signupBData.user.skillsTeaching.some((s) => s.name === 'React'), 'Student B also teaches React');

    // TEST 4: Persist Profile Edits for Student A
    console.log('\n--- Step 4: Persist Profile Edits (PATCH /api/me/profile) ---');
    const updateProfileRes = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({
        bio: 'Senior CS mentor specializing in modern React & design systems.',
        department: 'Computer Science & Engineering',
        year: '4th Year',
        avatar: './avatars/avatar_4.svg',
        // Uneditable fields that must be ignored/protected
        email: 'hacked.email@other.com',
        isVerified: true,
        isDemo: true
      })
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, 'PATCH /api/me/profile returns 200 OK');
    assert(updateProfileData.user.bio === 'Senior CS mentor specializing in modern React & design systems.', 'Bio correctly updated');
    assert(updateProfileData.user.department === 'Computer Science & Engineering', 'Department correctly updated');
    assert(updateProfileData.user.year === '4th Year', 'Year correctly updated');
    assert(updateProfileData.user.avatar === './avatars/avatar_4.svg', 'Avatar correctly updated');
    assert(updateProfileData.user.email === 'priya.patel@campus.edu', 'Protected email remained unchanged');
    assert(updateProfileData.user.isVerified === false, 'Protected isVerified remained false');
    assert(updateProfileData.user.isDemo === false, 'Protected isDemo remained false');

    // Invalid profile update (short name)
    const invalidNameRes = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({ name: 'P' })
    });
    assert(invalidNameRes.status === 400, 'Profile update with name < 2 characters rejected with 400 Bad Request');

    // TEST 5: Add Teaching and Learning Skills for Student A
    console.log('\n--- Step 5: Add Skills (POST /api/me/skills) ---');
    const addTeachRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({
        type: 'teach',
        name: 'TypeScript',
        level: 'Advanced',
        category: 'Programming'
      })
    });
    const addTeachData = await addTeachRes.json();
    assert(addTeachRes.status === 201, 'POST /api/me/skills (teach) returns 201 Created');
    assert(addTeachData.user.skillsTeaching.some((s) => s.name === 'TypeScript' && s.level === 'Advanced'), 'TypeScript teaching skill added');
    assert(addTeachData.user.stats.skillsTeachingCount === 2, 'skillsTeachingCount incremented to 2');

    const addLearnRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({
        type: 'learn',
        name: 'Kubernetes',
        level: 'Beginner',
        category: 'DevOps'
      })
    });
    const addLearnData = await addLearnRes.json();
    assert(addLearnRes.status === 201, 'POST /api/me/skills (learn) returns 201 Created');
    assert(addLearnData.user.skillsLearning.some((s) => s.name === 'Kubernetes'), 'Kubernetes learning goal added');
    assert(addLearnData.user.stats.skillsLearningCount === 2, 'skillsLearningCount incremented to 2');

    // TEST 6: Prevent Duplicate Skill Additions
    console.log('\n--- Step 6: Duplicate Skill Addition Rejection ---');
    const dupTeachRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({
        type: 'teach',
        name: 'typescript', // case-insensitive check
        level: 'Beginner'
      })
    });
    const dupTeachData = await dupTeachRes.json();
    assert(dupTeachRes.status === 409, 'Duplicate teaching skill rejected with 409 Conflict');
    assert(Boolean(dupTeachData.error), 'Clear duplicate error message returned');

    const dupLearnRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jarA.header()
      },
      body: JSON.stringify({
        type: 'learn',
        name: 'kubernetes'
      })
    });
    assert(dupLearnRes.status === 409, 'Duplicate learning skill rejected with 409 Conflict');

    // TEST 7: Cross-student skill deletion protection
    console.log('\n--- Step 7: Unauthorized & Non-existent Skill Deletion ---');
    const fakeDelRes = await fetch(`${baseUrl}/api/me/skills/st-nonexistent-999`, {
      method: 'DELETE',
      headers: { Cookie: jarA.header() }
    });
    assert(fakeDelRes.status === 404, 'Deleting non-existent skill returns 404 Not Found');

    // Student A tries to delete Student B's skill
    const studentBSkill = signupBData.user.skillsTeaching.find((s) => s.name === 'Node.js');
    const hijackDelRes = await fetch(`${baseUrl}/api/me/skills/${studentBSkill.id}`, {
      method: 'DELETE',
      headers: { Cookie: jarA.header() }
    });
    assert(hijackDelRes.status === 404, 'Student A cannot delete Student B\'s skill (returns 404)');

    // TEST 8: Remove skill and verify independence
    console.log('\n--- Step 8: Remove Skill & Multi-student Independence ---');
    const priyaReactSkill = addTeachData.user.skillsTeaching.find((s) => s.name === 'React');
    const removeRes = await fetch(`${baseUrl}/api/me/skills/${priyaReactSkill.id}`, {
      method: 'DELETE',
      headers: { Cookie: jarA.header() }
    });
    const removeData = await removeRes.json();
    assert(removeRes.status === 200, 'DELETE /api/me/skills/:id returns 200 OK');
    assert(!removeData.user.skillsTeaching.some((s) => s.name === 'React'), 'Priya no longer teaches React');

    // Check Student B (Rahul) — MUST STILL TEACH REACT!
    const rahulProfileRes = await fetch(`${baseUrl}/api/me/profile`, {
      headers: { Cookie: jarB.header() }
    });
    const rahulProfileData = await rahulProfileRes.json();
    assert(
      rahulProfileData.user.skillsTeaching.some((s) => s.name === 'React'),
      'Removing React for Priya left Rahul\'s React skill completely intact'
    );

    // TEST 9: Changes Survive Logout and Login
    console.log('\n--- Step 9: Persistence Across Logout & Re-login ---');
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: jarA.header() }
    });

    const newJarA = new CookieJar();
    const reloginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.patel@campus.edu',
        password: 'Password123!'
      })
    });
    newJarA.extract(reloginRes);
    const reloginData = await reloginRes.json();
    assert(reloginRes.status === 200, 'Student A logged back in successfully');
    assert(reloginData.user.bio === 'Senior CS mentor specializing in modern React & design systems.', 'Updated bio persisted across logout/login');
    assert(reloginData.user.year === '4th Year', 'Updated year persisted across logout/login');
    assert(reloginData.user.skillsTeaching.some((s) => s.name === 'TypeScript'), 'Added TypeScript skill persisted');
    assert(!reloginData.user.skillsTeaching.some((s) => s.name === 'React'), 'Deleted React skill remained deleted');

    // TEST 10: Isolated Demo Student Read-Only Protection
    console.log('\n--- Step 10: Quick Demo Account Isolation ---');
    const demoJar = new CookieJar();
    const demoLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ram@campus.edu',
        password: 'demopassword'
      })
    });
    demoJar.extract(demoLoginRes);

    const demoEditProfileRes = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: demoJar.header()
      },
      body: JSON.stringify({ name: 'Hacked Demo Name' })
    });
    assert(demoEditProfileRes.status === 403, 'Editing Demo account profile is rejected with 403 Forbidden');

    const demoAddSkillRes = await fetch(`${baseUrl}/api/me/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: demoJar.header()
      },
      body: JSON.stringify({ type: 'teach', name: 'Malicious Skill' })
    });
    assert(demoAddSkillRes.status === 403, 'Adding skills to Demo account is rejected with 403 Forbidden');

    const demoDeleteSkillRes = await fetch(`${baseUrl}/api/me/skills/st-demo-react`, {
      method: 'DELETE',
      headers: { Cookie: demoJar.header() }
    });
    assert(demoDeleteSkillRes.status === 403, 'Removing skills from Demo account is rejected with 403 Forbidden');
  } finally {
    server.close();
    testDb.close();
    try {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    } catch {}
  }

  console.log('\n====================================================');
  console.log(`Phase 2 Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test suite crashed:', err);
  process.exit(1);
});

