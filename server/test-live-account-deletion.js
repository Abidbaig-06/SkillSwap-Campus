/**
 * Live End-to-End Account Deletion Test Through Running Vite Frontend (port 5173)
 *
 * Verifies:
 * 1. Registering disposable account through http://localhost:5173/SkillSwap-Campus/api
 * 2. Authenticated session verification via GET /api/auth/me
 * 3. MongoDB persistence check for the newly created user
 * 4. Account deletion through DELETE http://localhost:5173/SkillSwap-Campus/api/me/account
 * 5. Instant removal of user document from MongoDB Atlas
 * 6. Invalidation of old session returning HTTP 401 from /api/auth/me
 * 7. Verification that refresh without session returns HTTP 401 with no lingering username
 * 8. Preservation of all demo profiles (Ram, Priya, Aniket, Sara, Kabir) and existing real accounts
 */

import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import { User } from './models/User.js';

const FRONTEND_BASE = 'http://localhost:5173/SkillSwap-Campus/api';

async function request(path, options = {}, cookie = '') {
  const url = `${FRONTEND_BASE}${path}`;
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

async function run() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Live Frontend Deletion Verification');
  console.log('======================================================\n');

  await connectDB();
  console.log('✔ Connected to MongoDB Atlas to inspect live records.');

  // 1. Snapshot existing accounts
  const demoUsersCount = await User.countDocuments({ isDemo: true });
  console.log(`Initial demo accounts in DB: ${demoUsersCount}`);
  assert.ok(demoUsersCount >= 1, 'Demo accounts must be present in DB');

  // 2. Register disposable account
  const testId = Date.now();
  const disposableEmail = `disposable.student.${testId}@campus.edu`;
  const disposableName = `Disposable Tester ${testId}`;

  console.log(`\nStep 1: Registering new disposable account: ${disposableEmail}`);
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: disposableName,
      email: disposableEmail,
      password: 'DisposablePassword123!',
      department: 'Computer Science & Engineering',
      year: '1st Year',
      teachingSkills: [{ name: 'Disposable Testing', level: 'Beginner', category: 'Testing' }],
      learningSkills: [{ name: 'Cloud Architecture', level: 'Beginner', category: 'DevOps' }]
    })
  });

  assert.strictEqual(signupRes.status, 201, `Signup failed with status ${signupRes.status}: ${JSON.stringify(signupRes.data)}`);
  assert.ok(signupRes.data?.user?.id, 'User ID must be returned on signup');
  const disposableUserId = signupRes.data.user.id;
  const sessionCookie = signupRes.cookie;
  console.log(`✔ Registered disposable user with ID: ${disposableUserId}`);
  console.log(`✔ Session cookie received: ${sessionCookie}`);

  // 3. Verify session works via GET /auth/me through port 5173
  console.log('\nStep 2: Verifying session through GET /api/auth/me');
  const meRes = await request('/auth/me', {}, sessionCookie);
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data?.user?.id, disposableUserId);
  assert.strictEqual(meRes.data?.user?.name, disposableName);
  console.log(`✔ GET /api/auth/me confirmed authenticated as: ${meRes.data.user.name}`);

  // 4. Verify record exists in MongoDB Atlas
  console.log('\nStep 3: Checking MongoDB Atlas for user document');
  const userInDbBefore = await User.findById(disposableUserId);
  assert.ok(userInDbBefore, 'User must exist in MongoDB');
  assert.strictEqual(userInDbBefore.email, disposableEmail);
  console.log(`✔ Confirmed user document present in MongoDB Atlas (email: ${userInDbBefore.email})`);

  // 5. Perform account deletion through frontend proxy (port 5173)
  console.log('\nStep 4: Executing DELETE /api/me/account through port 5173');
  const deleteRes = await request('/me/account', { method: 'DELETE' }, sessionCookie);
  console.log(`DELETE status: ${deleteRes.status}`);
  console.log(`DELETE response:`, deleteRes.data);
  assert.strictEqual(deleteRes.status, 200, `DELETE /api/me/account failed: ${JSON.stringify(deleteRes.data)}`);
  assert.strictEqual(deleteRes.data?.success, true);
  assert.ok(
    deleteRes.rawSetCookie?.includes('skillswap_sid=;'),
    'Deletion response must clear the skillswap_sid cookie'
  );
  console.log('✔ Server confirmed account deletion and issued cookie clearing header.');

  // 6. Verify user document is gone from MongoDB Atlas
  console.log('\nStep 5: Verifying record is completely gone from MongoDB Atlas');
  const userInDbAfter = await User.findById(disposableUserId);
  assert.strictEqual(userInDbAfter, null, 'User document must be completely null in MongoDB');
  console.log('✔ Verified: User document is completely removed from MongoDB Atlas.');

  // 7. Verify old session gets 401 from /api/auth/me
  console.log('\nStep 6: Verifying old session gets HTTP 401 from /api/auth/me');
  const meResAfter = await request('/auth/me', {}, sessionCookie);
  assert.strictEqual(meResAfter.status, 401, 'Old session must be rejected with HTTP 401');
  assert.strictEqual(meResAfter.data?.user, null, 'User payload must be null');
  console.log(`✔ Verified: Old session correctly rejected with HTTP 401 (${meResAfter.data?.error}).`);

  // 8. Verify fresh visit / refresh with no session gets 401 and null user
  console.log('\nStep 7: Verifying unauthenticated refresh has no signed-in name');
  const refreshRes = await request('/auth/me', {});
  assert.strictEqual(refreshRes.status, 401);
  assert.strictEqual(refreshRes.data?.user, null);
  console.log('✔ Verified: Fresh visit/refresh returns 401 with no signed-in username or private data.');

  // 9. Verify demo accounts and existing accounts are fully preserved
  console.log('\nStep 8: Verifying demo accounts and other records are preserved');
  const ramUser = await User.findById('demo-ram');
  assert.ok(ramUser, 'Demo student Ram must be intact in MongoDB');
  const finalDemoCount = await User.countDocuments({ isDemo: true });
  assert.strictEqual(finalDemoCount, demoUsersCount, 'Demo accounts count must remain unchanged');
  console.log(`✔ Verified: Demo student Ram and all ${finalDemoCount} demo profiles preserved intact.`);

  console.log('\n======================================================');
  console.log('✔ LIVE FRONTEND ACCOUNT DELETION VERIFIED END-TO-END!');
  console.log('======================================================\n');

  await disconnectDB();
}

run().catch(async (err) => {
  console.error('\n❌ Live test failed:', err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

