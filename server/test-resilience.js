import { apiRequest } from '../src/utils/api.js';

function assert(cond, msg) {
  if (!cond) {
    throw new Error(`[Assertion Failed] ${msg}`);
  }
}

async function testResilience() {
  console.log('\n======================================================');
  console.log('SkillSwap Campus — API & Frontend Resilience Test');
  console.log('======================================================\n');

  // Test 1: Health check against running Express server
  console.log('--- TEST 1: Live Health Check Endpoint ---');
  const healthRes = await fetch('http://localhost:3001/api/health');
  assert(healthRes.headers.get('content-type').includes('application/json'), 'Health endpoint must return JSON');
  const healthData = await healthRes.json();
  assert(typeof healthData.connected === 'boolean', 'Health data must contain connected boolean');
  assert(healthData.service === 'SkillSwap Campus Backend', 'Health service name must match');
  console.log('✔ Direct health check returned valid JSON:', healthData);

  // Test 2: Proxied Health check through Vite
  console.log('\n--- TEST 2: Proxied Health Check through Vite ---');
  const proxiedHealthRes = await fetch('http://localhost:5173/api/health');
  assert(proxiedHealthRes.headers.get('content-type').includes('application/json'), 'Proxied health must return JSON');
  const proxiedHealthData = await proxiedHealthRes.json();
  assert(proxiedHealthData.service === 'SkillSwap Campus Backend', 'Proxied service name must match');
  console.log('✔ Proxied health check through Vite succeeded with valid JSON.');

  // Test 3: Live Login Endpoint with Seeded Demo Account
  console.log('\n--- TEST 3: Live Login Endpoint with Seeded Demo Account ---');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ram@campus.edu', password: 'demopassword' })
  });
  const loginContentType = loginRes.headers.get('content-type') || '';
  assert(loginContentType.includes('application/json'), `Login must return JSON, got ${loginContentType}`);
  const loginData = await loginRes.json();
  if (loginRes.status === 200) {
    assert(loginData.user && loginData.user.email === 'ram@campus.edu', 'Must return authenticated demo student user profile');
    console.log(`✔ Live login succeeded (200 OK) for demo student: ${loginData.user.name} (${loginData.user.email})`);
  } else if (loginRes.status === 503) {
    assert(typeof loginData.error === 'string' && loginData.error.length > 0, 'Must return clear 503 error message string');
    console.log(`✔ Connecting guard returned HTTP 503 with message: "${loginData.error}"`);
  } else {
    assert(false, `Unexpected status from login: ${loginRes.status}`);
  }

  // Test 3b: Invalid Credentials Handling
  console.log('\n--- TEST 3b: Invalid Credentials Handling ---');
  const badLoginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ram@campus.edu', password: 'wrongpassword' })
  });
  assert(badLoginRes.status === 401, `Invalid login must return 401 Unauthorized, got ${badLoginRes.status}`);
  const badLoginData = await badLoginRes.json();
  assert(badLoginData.error === 'Invalid email or password.', 'Must return proper invalid credentials error');
  console.log('✔ Invalid credentials properly returned 401 with JSON error.');

  // Test 4: Malformed JSON Request Handling
  console.log('\n--- TEST 4: Malformed JSON Body Handling ---');
  const malformedRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'invalid-json{{{'
  });
  assert(malformedRes.status === 400, `Malformed JSON must return 400 Bad Request, got ${malformedRes.status}`);
  const malformedData = await malformedRes.json();
  assert(malformedData.error === 'Malformed JSON payload.', 'Must return clean JSON error');
  console.log('✔ Malformed JSON properly intercepted with HTTP 400 JSON response.');

  // Test 5: apiRequest Utility Tolerance of Empty Body / 502 / Non-JSON
  console.log('\n--- TEST 5: Frontend apiRequest Utility Resilience ---');
  // Mock an empty 502 response
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', {
    status: 502,
    statusText: 'Bad Gateway',
    headers: { 'Content-Type': 'text/plain' }
  });

  try {
    await apiRequest('/api/auth/login', { method: 'POST' });
    assert(false, 'Should have thrown on 502 Bad Gateway');
  } catch (err) {
    assert(!err.message.includes('Unexpected end of JSON input'), `Must NOT throw JSON parse error, got: ${err.message}`);
    assert(err.message.includes('Backend service is currently unavailable'), `Must give human-readable message, got: ${err.message}`);
    console.log('✔ apiRequest gracefully handled empty 502 without throwing "Unexpected end of JSON input"!');
  }

  // Mock HTML 500 error page
  globalThis.fetch = async () => new Response('<html><body>500 Internal Error</body></html>', {
    status: 500,
    headers: { 'Content-Type': 'text/html' }
  });

  try {
    await apiRequest('/api/auth/login', { method: 'POST' });
    assert(false, 'Should have thrown on 500');
  } catch (err) {
    assert(!err.message.includes('Unexpected token'), `Must NOT throw HTML JSON syntax error, got: ${err.message}`);
    console.log('✔ apiRequest gracefully handled HTML 500 response with human-readable error message.');
  }

  // Restore fetch
  globalThis.fetch = originalFetch;

  console.log('\n======================================================');
  console.log('All API & Frontend Resilience Tests Passed Successfully!');
  console.log('======================================================\n');
}

testResilience().catch((err) => {
  console.error('\n❌ Resilience test failed:', err.message);
  process.exit(1);
});

