import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { db, initDatabase } from './db.js';
import { SQLiteSessionStore } from './sessionStore.js';
import authRoutes from './routes/auth.js';

function createServer() {
  initDatabase();
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      store: new SQLiteSessionStore(db),
      name: 'skillswap_sid',
      secret: 'test-secret-key-2026',
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
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  return app;
}

// Simple cookie jar for test requests
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  extract(res) {
    const raw = res.headers.get('set-cookie');
    if (raw) {
      // Split cookies if multiple
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

async function runTests() {
  console.log('====================================================');
  console.log('SkillSwap Campus — Phase 1 Backend Verification Suite');
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

  const PORT = 3099;
  let app = createServer();
  db.exec("DELETE FROM users WHERE email IN ('ananya.roy@campus.edu', 'vikram.sen@campus.edu')");
  let server;
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  const baseUrl = `http://localhost:${PORT}`;

  try {
    // TEST 1: Health check
    console.log('--- Step 1: Health Check ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health responds with 200 OK');

    // TEST 2: Signup Student A (Ananya Roy)
    console.log('\n--- Step 2: Signup Student A (Ananya Roy) ---');
    const jarA = new CookieJar();
    const signupARes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ananya Roy',
        email: 'ananya.roy@campus.edu',
        password: 'Password123!',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        bio: 'Interested in Python algorithms and distributed systems.',
        skillsTeaching: [{ name: 'Python', level: 'Advanced', category: 'Programming' }],
        skillsLearning: [{ name: 'UI/UX Design', level: 'Beginner', category: 'Design' }]
      })
    });
    jarA.extract(signupARes);
    const signupAData = await signupARes.json();

    assert(signupARes.status === 201, 'POST /api/auth/signup returns 201 Created');
    assert(signupAData.user && signupAData.user.name === 'Ananya Roy', 'Profile contains correct student name');
    assert(signupAData.user.email === 'ananya.roy@campus.edu', 'Profile contains normalized email');
    assert(signupAData.user.isVerified === false, 'Student is NOT marked verified (no email verification completed)');
    assert(signupAData.user.isDemo === false, 'Student account is explicitly marked isDemo: false');
    assert(signupAData.user.skillsTeaching.some((s) => s.name === 'Python'), 'Teaching skill Python persisted');
    assert(signupAData.user.skillsLearning.some((s) => s.name === 'UI/UX Design'), 'Learning skill UI/UX Design persisted');
    assert(!signupAData.user.password_hash && !signupAData.user.password, 'Password hash is strictly omitted from profile response');
    assert(jarA.cookies.has('skillswap_sid'), 'HTTP-only session cookie skillswap_sid issued on signup');

    // TEST 3: Duplicate Email Rejection
    console.log('\n--- Step 3: Duplicate Email Rejection ---');
    const dupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ananya Clone',
        email: 'ANANYA.ROY@campus.edu', // uppercase check
        password: 'AnotherPassword999',
        department: 'IT'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');
    assert(Boolean(dupData.error), 'Clear error message returned for duplicate email');

    // TEST 4: Input Validation Rejections
    console.log('\n--- Step 4: Input Validation ---');
    const shortPassRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Short',
        email: 'short.pass@campus.edu',
        password: '123'
      })
    });
    assert(shortPassRes.status === 400, 'Password shorter than 6 characters rejected with 400 Bad Request');

    const invalidEmailRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Invalid',
        email: 'notanemail',
        password: 'validPassword123'
      })
    });
    assert(invalidEmailRes.status === 400, 'Invalid email format rejected with 400 Bad Request');

    // TEST 5: Signup Student B (Vikram Sen) with completely different skills
    console.log('\n--- Step 5: Signup Student B (Vikram Sen) ---');
    const jarB = new CookieJar();
    const signupBRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Sen',
        email: 'vikram.sen@campus.edu',
        password: 'Password456!',
        department: 'Electronics & Communication',
        year: '4th Year',
        bio: 'Embedded systems engineer and microcontrollers enthusiast.',
        skillsTeaching: [{ name: 'Rust & Embedded C', level: 'Intermediate', category: 'Programming' }],
        skillsLearning: [{ name: 'Financial Modeling', level: 'Beginner', category: 'Business' }]
      })
    });
    jarB.extract(signupBRes);
    const signupBData = await signupBRes.json();
    assert(signupBRes.status === 201, 'Student B registered with 201 Created');
    assert(signupBData.user.name === 'Vikram Sen', 'Student B profile contains Vikram Sen');

    // TEST 6: Account Isolation Check
    console.log('\n--- Step 6: Account Isolation Verification ---');
    const meBRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: jarB.header() }
    });
    const meBData = await meBRes.json();
    assert(meBData.user.name === 'Vikram Sen', 'Session B strictly identifies as Vikram Sen');
    assert(meBData.user.skillsTeaching.some((s) => s.name === 'Rust & Embedded C'), 'Session B sees Rust & Embedded C');
    assert(!meBData.user.skillsTeaching.some((s) => s.name === 'Python'), 'Session B does NOT see Student A\'s Python skill');

    const meARes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: jarA.header() }
    });
    const meAData = await meARes.json();
    assert(meAData.user.name === 'Ananya Roy', 'Session A strictly identifies as Ananya Roy');
    assert(meAData.user.skillsTeaching.some((s) => s.name === 'Python'), 'Session A sees Python');
    assert(!meAData.user.skillsTeaching.some((s) => s.name === 'Rust & Embedded C'), 'Session A does NOT see Student B\'s Rust skill');

    // TEST 7: Incorrect Password Login Rejection
    console.log('\n--- Step 7: Incorrect Password Login ---');
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya.roy@campus.edu',
        password: 'WrongPassword999!'
      })
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401, 'Login with incorrect password rejected with 401 Unauthorized');
    assert(badLoginData.error === 'Invalid email or password.', 'Error message returned without leaking specifics');

    // TEST 8: Valid Login & Session Cookie
    console.log('\n--- Step 8: Valid Password Login ---');
    const loginJar = new CookieJar();
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya.roy@campus.edu',
        password: 'Password123!'
      })
    });
    loginJar.extract(loginRes);
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login with valid credentials returns 200 OK');
    assert(loginData.user && loginData.user.name === 'Ananya Roy', 'Logged in profile matches Ananya Roy');
    assert(loginJar.cookies.has('skillswap_sid'), 'New session cookie received on login');

    // TEST 9: Session Restoration (GET /api/auth/me)
    console.log('\n--- Step 9: Session Restoration ---');
    const sessionRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: loginJar.header() }
    });
    const sessionData = await sessionRes.json();
    assert(sessionRes.status === 200, 'GET /api/auth/me with session cookie returns 200 OK');
    assert(sessionData.user && sessionData.user.email === 'ananya.roy@campus.edu', 'Session restored to Ananya Roy');

    // TEST 10: Logout and Session Invalidation
    console.log('\n--- Step 10: Logout & Session Invalidation ---');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: loginJar.header() }
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');

    const afterLogoutRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: loginJar.header() }
    });
    assert(afterLogoutRes.status === 401, 'GET /api/auth/me after logout correctly rejected with 401 Unauthorized');

    // TEST 11: Demo Login Verification
    console.log('\n--- Step 11: Isolated Demo Student Login (Ram) ---');
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
    const demoData = await demoLoginRes.json();
    assert(demoLoginRes.status === 200, 'Demo login returns 200 OK');
    assert(demoData.user.isDemo === true, 'Demo user has isDemo: true flag');
    assert(demoData.user.isVerified === true, 'Demo user Ram has isVerified: true');
    assert(demoData.user.name === 'Ram', 'Demo user name is Ram');

    // TEST 12: Backend Persistence Across Server Restart
    console.log('\n--- Step 12: Persistence Across Server Restart ---');
    // Close existing server cleanly
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Spin up a brand new server instance on a fresh port pointing to the exact same SQLite DB file
    const PORT_RESTART = 3098;
    const restartedApp = createServer();
    await new Promise((resolve) => {
      server = restartedApp.listen(PORT_RESTART, resolve);
    });
    const restartUrl = `http://localhost:${PORT_RESTART}`;

    // Verify Ananya Roy can log in on the new server instance with the same password
    const restartLoginRes = await fetch(`${restartUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya.roy@campus.edu',
        password: 'Password123!'
      })
    });
    const restartLoginData = await restartLoginRes.json();
    assert(restartLoginRes.status === 200, 'User logs in successfully after server restart (database persisted on disk)');
    assert(restartLoginData.user && restartLoginData.user.name === 'Ananya Roy', 'Persisted profile matches Ananya Roy');
    assert(restartLoginData.user && restartLoginData.user.skillsTeaching.length > 0, 'Persisted skills remain intact after restart');
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
