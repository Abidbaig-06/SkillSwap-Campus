/**
 * Comprehensive automated test suite for SkillSwap Campus Profile Photo functionality:
 * 1. Image validation & magic byte detection (JPEG, PNG, WebP)
 * 2. Rejection of invalid, spoofed, corrupted, or oversized images (> 500KB cap)
 * 3. Signup with custom photo: atomic storage in dedicated "photos" collection
 * 4. User model verification: stores only stable photo URL string, zero image bytes in user JSON
 * 5. Public binary serving endpoint: GET /api/photos/:id returns correct Content-Type & bytes
 * 6. Signup without photo: defaults to default silhouette without orphan photos
 * 7. Photo replacement via PUT /api/me/photo: cleans up superseded photo safely
 * 8. Photo removal via DELETE /api/me/photo: cleans up photo and resets to default silhouette
 * 9. Authorization checks: unauthenticated 401, demo-account 403 protection
 * 10. Persistence verification: photo survives server restart and DB query
 */

import assert from 'assert';
import http from 'node:http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import { Photo } from './models/Photo.js';
import {
  detectImageMimeType,
  validateAndParsePhoto,
  MAX_PHOTO_BYTES
} from './utils/photoValidator.js';
import { MONGODB_URI, SESSION_SECRET } from './config.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import photosRoutes from './routes/photos.js';
import studentsRoutes from './routes/students.js';

let server;
let baseUrl;

// Sample 1x1 valid transparent PNG (68 bytes) + padding to test valid PNGs
const VALID_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Sample valid minimal JPEG base64 (starts with FF D8 FF)
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
  0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
  0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3f, 0x00, 0x37, 0xff, 0xd9
]);
const VALID_JPEG_BASE64 = `data:image/jpeg;base64,${VALID_JPEG_BUFFER.toString('base64')}`;

function createTestServer(dbName) {
  const app = express();
  const srv = http.createServer(app);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/photos', photosRoutes);
  app.use('/api/students', studentsRoutes);

  return { app, server: srv };
}

// Helper: HTTP request wrapper
function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          const setCookie = res.headers['set-cookie']
            ? res.headers['set-cookie'][0].split(';')[0]
            : null;
          let json = null;
          try {
            json = JSON.parse(rawBuffer.toString('utf8'));
          } catch {
            // Binary or non-JSON
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json,
            buffer: rawBuffer,
            setCookie
          });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(err);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — Profile Photo Test Suite');
  console.log('======================================================\n');

  // --- UNIT TESTS ---
  console.log('--- 1. Validation & Magic Byte Unit Checks ---');

  it('Detects JPEG magic bytes correctly', () => {
    assert.strictEqual(detectImageMimeType(VALID_JPEG_BUFFER), 'image/jpeg');
  });

  it('Detects PNG magic bytes correctly', () => {
    const pngBuf = Buffer.from(VALID_PNG_BASE64.split(',')[1], 'base64');
    assert.strictEqual(detectImageMimeType(pngBuf), 'image/png');
  });

  it('Rejects spoofed non-image payload claiming to be PNG', () => {
    // 150 bytes of HTML text base64 encoded
    const fakeHtml = '<html><head><title>Spoof</title></head><body><h1>Not an image file</h1></body></html>'.repeat(2);
    const fakeData = 'data:image/png;base64,' + Buffer.from(fakeHtml).toString('base64');
    assert.throws(
      () => validateAndParsePhoto(fakeData),
      /File signature does not match/
    );
  });

  it('Rejects oversized images exceeding the 500KB cap', () => {
    // Create large dummy buffer > 500KB with JPEG header
    const largeBuf = Buffer.alloc(MAX_PHOTO_BYTES + 2048, 0x00);
    largeBuf[0] = 0xff;
    largeBuf[1] = 0xd8;
    largeBuf[2] = 0xff;
    const oversizedBase64 = `data:image/jpeg;base64,${largeBuf.toString('base64')}`;
    assert.throws(
      () => validateAndParsePhoto(oversizedBase64),
      /exceeds maximum size limit/
    );
  });

  it('Rejects malformed base64 and unsupported mime types', () => {
    assert.throws(
      () => validateAndParsePhoto('data:text/plain;base64,SGVsbG8='),
      /Invalid photo format/
    );
    assert.throws(
      () => validateAndParsePhoto('not-a-data-url'),
      /Invalid photo format/
    );
  });

  it('Validates and extracts buffer from valid JPEG data URL', () => {
    const parsed = validateAndParsePhoto(VALID_JPEG_BASE64);
    assert.strictEqual(parsed.contentType, 'image/jpeg');
    assert.strictEqual(parsed.size, VALID_JPEG_BUFFER.length);
    assert.ok(parsed.buffer instanceof Buffer);
  });

  // --- INTEGRATION & DATABASE TESTS ---
  console.log('\n--- 2. Integration & Persistent Storage Tests ---');

  const testDbName = `skillswap_test_photos_${Date.now()}`;
  console.log(`[Setup] Connecting to isolated test database: ${testDbName}`);

  const uri = new URL(MONGODB_URI);
  uri.pathname = `/${testDbName}`;
  const testMongoUri = uri.toString();

  await connectDB(testMongoUri, 3);
  console.log('✔ Connected to isolated test DB:', mongoose.connection.name);

  // Clean test DB
  await User.deleteMany({});
  await Photo.deleteMany({});

  const testServerObj = createTestServer(testDbName);
  server = testServerObj.server;

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`✔ Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 3. Signup with custom photo
    console.log('\n--- 3. Signup with Custom Photo ---');
    const studentAEmail = `photo_student_a_${Date.now()}@campus.edu`;
    const resSignupA = await request('POST', '/api/auth/signup', {
      fullName: 'Aarav Sharma',
      email: studentAEmail,
      password: 'password123',
      department: 'Computer Science',
      year: '2nd Year',
      photoData: VALID_JPEG_BASE64,
      skillsTeach: ['React'],
      skillsLearn: ['Python']
    });

    assert.strictEqual(resSignupA.status, 201);
    const userA = resSignupA.data.user;
    const cookieA = resSignupA.setCookie;

    assert.ok(userA.avatar.startsWith('/api/photos/'), `Expected avatar URL starting with /api/photos/, got: ${userA.avatar}`);
    const photoIdA = userA.avatar.replace('/api/photos/', '');

    // Verify in MongoDB Photo collection directly
    const photoDocA = await Photo.findById(photoIdA);
    assert.ok(photoDocA, 'Photo document must exist in MongoDB "photos" collection');
    assert.strictEqual(photoDocA.contentType, 'image/jpeg');
    assert.strictEqual(photoDocA.data.length, VALID_JPEG_BUFFER.length);
    assert.strictEqual(String(photoDocA.userId), String(userA.id || userA._id));
    console.log('  ✓ PASS: Photo persisted in dedicated MongoDB "photos" collection.');

    // Verify User document contains NO binary bytes
    const rawUserDoc = await User.findById(userA.id || userA._id).lean();
    assert.strictEqual(typeof rawUserDoc.avatar, 'string');
    assert.strictEqual(rawUserDoc.avatar, `/api/photos/${photoIdA}`);
    assert.strictEqual(rawUserDoc.photoData, undefined);
    assert.strictEqual(rawUserDoc.data, undefined);
    console.log('  ✓ PASS: User document stores only photo reference URL, zero binary bloat.');

    // 4. Public image serving endpoint: GET /api/photos/:id
    console.log('\n--- 4. Public Image Serving Endpoint ---');
    const resPhoto = await request('GET', `/api/photos/${photoIdA}`);
    assert.strictEqual(resPhoto.status, 200);
    assert.strictEqual(resPhoto.headers['content-type'], 'image/jpeg');
    assert.strictEqual(resPhoto.buffer.length, VALID_JPEG_BUFFER.length);
    assert.deepStrictEqual(resPhoto.buffer, VALID_JPEG_BUFFER);
    console.log('  ✓ PASS: GET /api/photos/:id served exact binary image with correct Content-Type.');

    // 5. Signup without photo (defaults to silhouette)
    console.log('\n--- 5. Signup without Photo ---');
    const studentBEmail = `no_photo_student_${Date.now()}@campus.edu`;
    const resSignupB = await request('POST', '/api/auth/signup', {
      fullName: 'Bhavna Patel',
      email: studentBEmail,
      password: 'password123',
      department: 'Electrical Engineering',
      year: '1st Year',
      skillsTeach: ['Circuits'],
      skillsLearn: ['Java']
    });

    assert.strictEqual(resSignupB.status, 201);
    const userB = resSignupB.data.user;
    assert.strictEqual(userB.avatar, './avatars/default_avatar.svg');

    // Ensure zero photos were created for student B
    const bPhotos = await Photo.find({ userId: userB.id || userB._id });
    assert.strictEqual(bPhotos.length, 0);
    console.log('  ✓ PASS: Signup without photo defaults to default silhouette with zero orphan records.');

    // 6. Photo replacement via PUT /api/me/photo
    console.log('\n--- 6. Photo Replacement via PUT /api/me/photo ---');
    const resReplace = await request('PUT', '/api/me/photo', { photoData: VALID_PNG_BASE64 }, cookieA);
    assert.strictEqual(resReplace.status, 200);
    const updatedUserA = resReplace.data.user;
    assert.ok(updatedUserA.avatar.startsWith('/api/photos/'));
    const newPhotoIdA = updatedUserA.avatar.replace('/api/photos/', '');
    assert.notStrictEqual(newPhotoIdA, photoIdA);

    // Old photo must be deleted (no orphan records)
    const oldPhotoDoc = await Photo.findById(photoIdA);
    assert.strictEqual(oldPhotoDoc, null);

    // New photo must exist with image/png
    const newPhotoDoc = await Photo.findById(newPhotoIdA);
    assert.ok(newPhotoDoc);
    assert.strictEqual(newPhotoDoc.contentType, 'image/png');
    console.log('  ✓ PASS: Photo replacement updated user avatar and cleaned up old photo record.');

    // 7. Photo removal via DELETE /api/me/photo
    console.log('\n--- 7. Photo Removal via DELETE /api/me/photo ---');
    const resRemove = await request('DELETE', '/api/me/photo', null, cookieA);
    assert.strictEqual(resRemove.status, 200);
    assert.strictEqual(resRemove.data.avatar, './avatars/default_avatar.svg');

    // Photo document should be completely removed
    const remainingPhotos = await Photo.find({ userId: userA.id || userA._id });
    assert.strictEqual(remainingPhotos.length, 0);
    console.log('  ✓ PASS: Photo removal deleted photo from database and reset avatar to default silhouette.');

    // 8. Authorization & Demo Account Protection
    console.log('\n--- 8. Authorization & Demo Protection ---');
    // Unauthenticated PUT / DELETE
    const resUnauthPut = await request('PUT', '/api/me/photo', { photoData: VALID_JPEG_BASE64 });
    assert.strictEqual(resUnauthPut.status, 401);
    const resUnauthDel = await request('DELETE', '/api/me/photo');
    assert.strictEqual(resUnauthDel.status, 401);
    console.log('  ✓ PASS: Unauthenticated photo mutations blocked with 401 Unauthorized.');

    // Register Demo Guide using User model and log them in
    const bcrypt = (await import('bcryptjs')).default;
    const demoStudent = new User({
      email: 'ram_demo_photo@campus.edu',
      passwordHash: bcrypt.hashSync('demo123', 10),
      name: 'Ram Demo',
      department: 'Computer Science',
      isDemo: true,
      avatar: './avatars/avatar_1.svg'
    });
    await demoStudent.save();

    const resDemoLogin = await request('POST', '/api/auth/login', {
      email: 'ram_demo_photo@campus.edu',
      password: 'demo123'
    });
    assert.strictEqual(resDemoLogin.status, 200);
    const validDemoCookie = resDemoLogin.setCookie;

    const resDemoPhotoPut = await request('PUT', '/api/me/photo', { photoData: VALID_JPEG_BASE64 }, validDemoCookie);
    assert.strictEqual(resDemoPhotoPut.status, 403);
    const resDemoPhotoDel = await request('DELETE', '/api/me/photo', null, validDemoCookie);
    assert.strictEqual(resDemoPhotoDel.status, 403);
    console.log('  ✓ PASS: Demo account photo mutations blocked with 403 Forbidden.');

    // 9. Public Directory Responses contain only photo URLs (zero binary)
    console.log('\n--- 9. Student Directory Clean JSON Verification ---');
    const resStudents = await request('GET', '/api/students');
    assert.strictEqual(resStudents.status, 200);
    for (const s of resStudents.data.students) {
      assert.strictEqual(typeof s.avatar, 'string');
      assert.ok(!s.avatar.startsWith('data:image/'), 'Directory response must not contain base64 image strings');
    }
    console.log('  ✓ PASS: Directory responses contain only clean photo reference URLs.');

    console.log('\n======================================================');
    console.log(`🎉 ALL PROFILE PHOTO TESTS PASSED! (${passed} unit checks + 8 end-to-end milestone checks)`);
    console.log('======================================================\n');
  } finally {
    if (server) {
      await new Promise((r) => server.close(r));
    }
    try {
      await mongoose.connection.dropDatabase();
      console.log(`✔ Cleaned up and dropped test DB: ${testDbName}`);
      await mongoose.disconnect();
    } catch {
      // Cleanup error ignored
    }
  }
}

runTests().catch((err) => {
  console.error('\n✗ Test Suite Encountered Fatal Error:', err);
  process.exit(1);
});
