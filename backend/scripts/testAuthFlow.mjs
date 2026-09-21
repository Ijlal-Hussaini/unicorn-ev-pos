import http from 'http';
import mongoose from 'mongoose';
import crypto from 'crypto';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAuthAudit() {
  console.log('====================================================');
  console.log('🔐 UNICORN EV POS - COMPREHENSIVE AUTH & SECURITY AUDIT');
  console.log('Testing: Registration, Login, RBAC, Forgot Password & OTP');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      if (details) console.error(`     Details: ${JSON.stringify(details)}`);
      failed++;
    }
  }

  // Connect to DB directly to inspect OTP and hashes
  await mongoose.connect('mongodb://127.0.0.1:27017/UnicornEV');
  const db = mongoose.connection.db;

  // ----------------------------------------------------
  // TEST 1: Public Registration Prevention
  // ----------------------------------------------------
  console.log('--- TEST 1: REGISTRATION ACCESS CONTROL ---');
  const publicRegister = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: 'hacker_public',
    email: 'hacker@public.com',
    password: 'password123',
  });

  assert(
    publicRegister.status === 401,
    'Unauthenticated public registration is strictly BLOCKED (HTTP 401)',
    publicRegister.data
  );

  // ----------------------------------------------------
  // TEST 2: Admin Login & Privilege Verification
  // ----------------------------------------------------
  console.log('\n--- TEST 2: ADMIN AUTHENTICATION ---');
  const adminLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'admin@unicornevbikes.com',
    password: 'admin123',
  });

  assert(adminLogin.status === 200 && adminLogin.data?.token, 'Admin login succeeded with valid JWT', adminLogin.data);
  const adminToken = adminLogin.data?.token;

  // Verify password hash is never exposed in response
  assert(!adminLogin.data?.data?.password, 'Password hash is safely excluded from user response payload');

  // ----------------------------------------------------
  // TEST 3: Admin Creates a New Showroom Cashier
  // ----------------------------------------------------
  console.log('\n--- TEST 3: AUTHORIZED STAFF ACCOUNT CREATION ---');
  const uniqueId = Date.now().toString().slice(-5);
  const testStaffEmail = `staff_${uniqueId}@unicornevbikes.com`;
  const testStaffUsername = `staff_${uniqueId}`;

  const staffRegister = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  }, {
    username: testStaffUsername,
    email: testStaffEmail,
    password: 'InitialPassword123',
    role: 'sales',
    phone: '03123456789',
    cnic: '35201-9999999-1',
  });

  assert(
    staffRegister.status === 201 && staffRegister.data?.data?.email === testStaffEmail,
    `Admin successfully registered new Cashier account (${testStaffEmail})`,
    staffRegister.data
  );

  // Duplicate email registration should fail
  const duplicateRegister = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  }, {
    username: `another_${uniqueId}`,
    email: testStaffEmail,
    password: 'Password123',
    role: 'sales',
  });

  assert(duplicateRegister.status === 400, 'Duplicate email registration is rejected with HTTP 400', duplicateRegister.data);

  // ----------------------------------------------------
  // TEST 4: Cashier Login & Role-Based Access Control
  // ----------------------------------------------------
  console.log('\n--- TEST 4: CASHIER LOGIN & RBAC ENFORCEMENT ---');
  const staffLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: 'InitialPassword123',
  });

  assert(staffLogin.status === 200 && staffLogin.data?.data?.role === 'sales', 'New staff member successfully authenticated with role "sales"');
  const staffToken = staffLogin.data?.token;

  // Cashier attempts to register another user (Admin only)
  const unauthorizedRegister = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`,
    },
  }, {
    username: `illegal_${uniqueId}`,
    email: `illegal_${uniqueId}@unicornevbikes.com`,
    password: 'Password123',
  });

  assert(unauthorizedRegister.status === 403, 'Cashier blocked from registering users (HTTP 403 Forbidden)', unauthorizedRegister.data);

  // ----------------------------------------------------
  // TEST 5: Login Error Handling & Security Checks
  // ----------------------------------------------------
  console.log('\n--- TEST 5: LOGIN ERROR HANDLING ---');
  // Wrong password
  const wrongPasswordLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: 'WrongPassword999',
  });

  assert(
    wrongPasswordLogin.status === 401 && wrongPasswordLogin.data?.message === 'Invalid credentials',
    'Incorrect password rejected with generic "Invalid credentials" (prevents username enumeration)'
  );

  // Non-existent email
  const wrongEmailLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'nonexistent@unicornevbikes.com',
    password: 'Password123',
  });

  assert(
    wrongEmailLogin.status === 401 && wrongEmailLogin.data?.message === 'Invalid credentials',
    'Non-existent email rejected with generic "Invalid credentials"'
  );

  // Deactivated user test
  await db.collection('users').updateOne({ email: testStaffEmail }, { $set: { isActive: false } });
  const deactivatedLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: 'InitialPassword123',
  });

  assert(
    deactivatedLogin.status === 401 && deactivatedLogin.data?.message === 'Account is deactivated',
    'Deactivated accounts are blocked from logging in'
  );
  // Re-activate user
  await db.collection('users').updateOne({ email: testStaffEmail }, { $set: { isActive: true } });

  // ----------------------------------------------------
  // TEST 6: Forgot Password & 6-Digit OTP Flow
  // ----------------------------------------------------
  console.log('\n--- TEST 6: FORGOT PASSWORD & OTP RESET FLOW ---');
  
  // Non-existent email check
  const nonExistentForgot = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'nobody@nowhere.com',
  });

  assert(nonExistentForgot.status === 404, 'Forgot password for non-existent email returns 404 Not Found');

  // Inject valid hashed OTP into DB to verify the OTP verification and reset workflow
  const testOTP = '849201';
  const hashedOTP = crypto.createHash('sha256').update(testOTP).digest('hex');
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.collection('users').updateOne(
    { email: testStaffEmail },
    {
      $set: {
        resetPasswordOTP: hashedOTP,
        resetPasswordOTPExpires: otpExpiry,
      }
    }
  );

  // Check wrong OTP
  const wrongOTPRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    otp: '000000',
  });

  assert(wrongOTPRes.status === 400 && wrongOTPRes.data?.message.includes('Invalid or expired OTP'), 'Incorrect OTP rejected with HTTP 400');

  // Check correct OTP
  const correctOTPRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    otp: testOTP,
  });

  assert(correctOTPRes.status === 200 && correctOTPRes.data?.success, 'Valid 6-digit OTP verified successfully (HTTP 200)');

  // Reset password using the verified OTP
  const newSecretPassword = 'BrandNewSecurePassword2026!';
  const resetRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    otp: testOTP,
    newPassword: newSecretPassword,
  });

  assert(resetRes.status === 200 && resetRes.data?.success, 'Password successfully reset with OTP (HTTP 200)');

  // Verify Single-Use OTP (replay protection)
  const replayOTPRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    otp: testOTP,
    newPassword: 'AnotherPassword999',
  });

  assert(replayOTPRes.status === 400, 'Used OTP is automatically invalidated; replay attacks are BLOCKED');

  // Verify login with NEW password
  const newLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: newSecretPassword,
  });

  assert(newLogin.status === 200 && newLogin.data?.token, 'Login with NEW password succeeded immediately');

  // Verify OLD password no longer works
  const oldLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: 'InitialPassword123',
  });

  assert(oldLogin.status === 401, 'Old password was successfully replaced and no longer works');

  // Clean up test user
  await db.collection('users').deleteOne({ email: testStaffEmail });

  await mongoose.connection.close();

  console.log('\n====================================================');
  console.log(`AUTH AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAuthAudit().catch(err => {
  console.error('Fatal auth audit error:', err);
  process.exit(1);
});
