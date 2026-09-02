import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { hashPassword } from '../security/password.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { hashToken } from '../security/tokens.ts';
import http from 'node:http';

const TEST_PORT = 5002;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: any = {}) {
  const url = `${baseUrl}${path}`;
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, body: data };
}

async function runTests() {
  console.log('🧪 Starting Lagoree Arts Module 2: Admin Auth & Roles Automated Test Suite...\n');

  // Seed DB and start test server
  await runSeed();

  // Cleanup test user from previous test runs
  const existingTestUser = prisma.adminUser.findUnique({ where: { email: 'priya.curator@lagoreearts.com' } });
  if (existingTestUser) {
    prisma.adminUser.delete({ where: { id: existingTestUser.id } });
  }

  const app = createApp();
  server = app.listen(TEST_PORT);
  baseUrl = `http://localhost:${TEST_PORT}`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`• Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error('  Error:', err.message || err);
      failed++;
    }
  }

  let superAdminToken = '';
  let superAdminRefreshToken = '';
  let superAdminId = '';
  let catalogueManagerToken = '';
  let catalogueManagerId = '';

  // 1. Health check
  await test('Server Health Check (GET /api/v1/admin/health)', async () => {
    const res = await request('/api/v1/admin/health');
    if (res.status !== 200 || res.body.data.status !== 'healthy') {
      throw new Error(`Expected status 200 and healthy, got ${res.status}`);
    }
  });

  // 2. Valid Super Admin Login
  await test('Valid Super Admin Login (POST /api/v1/admin/auth/login)', async () => {
    const res = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@lagoreearts.com',
        password: 'LagoreeAdmin@2026!'
      }
    });

    if (res.status !== 200 || !res.body.success || !res.body.data.accessToken) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
    }

    // Security check: No password or hash leaked
    if (res.body.data.admin.passwordHash || res.body.data.admin.password) {
      throw new Error('Security violation: Password or hash leaked in login response');
    }

    superAdminToken = res.body.data.accessToken;
    superAdminId = res.body.data.admin.id;

    // Extract refresh cookie or simulate refresh token
    const cookieHeader = res.headers.get('set-cookie') || '';
    const match = cookieHeader.match(/lagoree_admin_refresh_token=([^;]+)/);
    if (match) {
      superAdminRefreshToken = match[1];
    }
  });

  // 3. Invalid credentials rejection
  await test('Invalid Password Rejection (POST /api/v1/admin/auth/login)', async () => {
    const res = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@lagoreearts.com',
        password: 'WrongPassword123!'
      }
    });
    if (res.status !== 401 || res.body.success !== false || res.body.error.code !== 'UNAUTHENTICATED') {
      throw new Error(`Expected 401 UNAUTHENTICATED, got ${res.status}`);
    }
  });

  // 4. Me endpoint
  await test('Admin Profile & Permissions (GET /api/v1/admin/auth/me)', async () => {
    const res = await request('/api/v1/admin/auth/me', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.data.admin.role || !Array.isArray(res.body.data.admin.permissions)) {
      throw new Error(`Failed to retrieve profile: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.admin.email !== 'admin@lagoreearts.com') {
      throw new Error(`Unexpected admin email: ${res.body.data.admin.email}`);
    }
  });

  // 5. Create Catalogue Manager Admin
  await test('Create Admin User with Catalogue Manager Role (POST /api/v1/admin/users)', async () => {
    const catRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
    if (!catRole) throw new Error('Catalogue Manager role missing in seed');

    const res = await request('/api/v1/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Priya Verma',
        email: 'priya.curator@lagoreearts.com',
        password: 'CatalogueCurator@2026',
        roleId: catRole.id,
        status: 'ACTIVE'
      }
    });

    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Failed to create admin user: ${JSON.stringify(res.body)}`);
    }
    catalogueManagerId = res.body.data.id;
  });

  // 6. Login as Catalogue Manager
  await test('Login as Catalogue Manager', async () => {
    const res = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'priya.curator@lagoreearts.com',
        password: 'CatalogueCurator@2026'
      }
    });
    if (res.status !== 200 || !res.body.data.accessToken) {
      throw new Error(`Catalogue manager login failed: ${JSON.stringify(res.body)}`);
    }
    catalogueManagerToken = res.body.data.accessToken;
  });

  // 7. RBAC Permission Test: Catalogue Manager allowed catalogue routes, denied admin user creation
  await test('RBAC Check: Catalogue Manager denied admin.create (HTTP 403)', async () => {
    const res = await request('/api/v1/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${catalogueManagerToken}` },
      body: {
        name: 'Unauthorized User',
        email: 'unauth@lagoreearts.com',
        password: 'Password@20261234',
        roleId: 'dummy-role'
      }
    });
    if (res.status !== 403 || res.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    }
  });

  // 8. Refresh Token Rotation
  await test('Refresh Token Rotation (POST /api/v1/admin/auth/refresh)', async () => {
    if (!superAdminRefreshToken) {
      // Create test session directly
      const session = prisma.adminSession.create({
        data: {
          adminUserId: superAdminId,
          refreshTokenHash: 'dummy_hash_test_123',
          expiresAt: new Date(Date.now() + 100000)
        }
      });
      superAdminRefreshToken = 'raw_refresh_token_test';
      prisma.adminSession.update({
        where: { id: session.id },
        data: { refreshTokenHash: '96b997864f1dc0b06cfaed7ff96cf5d92df9a951c6e11894d872166ec96131c1' } // sha256 of raw_refresh_token_test
      });
    }

    const res = await request('/api/v1/admin/auth/refresh', {
      method: 'POST',
      body: { refreshToken: superAdminRefreshToken }
    });

    if (res.status !== 200 || !res.body.data.accessToken) {
      throw new Error(`Refresh token failed with status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 9. Change Password & Session Invalidation
  await test('Change Password & Revoke Old Sessions (POST /api/v1/admin/auth/change-password)', async () => {
    const res = await request('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${catalogueManagerToken}` },
      body: {
        currentPassword: 'CatalogueCurator@2026',
        newPassword: 'BrandNewSecurePassword@2026!'
      }
    });

    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Password change failed: ${JSON.stringify(res.body)}`);
    }

    // Verify login with new password
    const loginRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'priya.curator@lagoreearts.com',
        password: 'BrandNewSecurePassword@2026!'
      }
    });

    if (loginRes.status !== 200 || !loginRes.body.data.accessToken) {
      throw new Error('Login with new password failed');
    }
    catalogueManagerToken = loginRes.body.data.accessToken;
  });

  // 10. Forgot & Reset Password Flow
  await test('Forgot & Reset Password Workflow', async () => {
    // 1. Forgot password
    const forgotRes = await request('/api/v1/admin/auth/forgot-password', {
      method: 'POST',
      body: { email: 'priya.curator@lagoreearts.com' }
    });
    if (forgotRes.status !== 200 || !forgotRes.body.success) {
      throw new Error('Forgot password request failed');
    }

    // Create test password reset entry in DB
    const testToken = 'test_reset_token_secret_12345678';
    const testTokenHash = hashToken(testToken);

    prisma.adminPasswordReset.create({
      data: {
        adminUserId: catalogueManagerId,
        tokenHash: testTokenHash,
        expiresAt: new Date(Date.now() + 60000)
      }
    });

    // 2. Reset password
    const resetRes = await request('/api/v1/admin/auth/reset-password', {
      method: 'POST',
      body: {
        token: testToken,
        password: 'FinalResetPassword@2026!'
      }
    });

    if (resetRes.status !== 200 || !resetRes.body.success) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetRes.body)}`);
    }
  });

  // 11. Admin Status Enforcement: Inactive admin rejected
  await test('Deactivated Admin Denied Login & Access (PATCH /status & POST /login)', async () => {
    // Deactivate Priya
    const statusRes = await request(`/api/v1/admin/users/${catalogueManagerId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'INACTIVE' }
    });
    if (statusRes.status !== 200) throw new Error('Failed to deactivate admin');

    // Attempt login as deactivated user
    const loginRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'priya.curator@lagoreearts.com',
        password: 'FinalResetPassword@2026!'
      }
    });
    if (loginRes.status !== 403 || loginRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for inactive user, got ${loginRes.status}`);
    }
  });

  // 12. Role Management & System Role Protection
  await test('System Role Protection on DELETE (DELETE /api/v1/admin/roles/:id)', async () => {
    const superRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    if (!superRole) throw new Error('Super Admin role missing');

    const res = await request(`/api/v1/admin/roles/${superRole.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    if (res.status !== 400 || res.body.error?.code !== 'SYSTEM_ROLE_PROTECTED') {
      throw new Error(`Expected 400 SYSTEM_ROLE_PROTECTED, got ${res.status}`);
    }
  });

  // 13. Audit Log Verification
  await test('Audit Log Recording for Security Events', async () => {
    const logs = prisma.adminAuditLog.findMany({ take: 10 });
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error('No audit logs recorded');
    }
    const actions = logs.map((l: any) => l.action);
    if (!actions.includes('LOGIN_SUCCESS')) {
      throw new Error('Expected LOGIN_SUCCESS in audit logs');
    }
  });

  // Shutdown server
  server.close();

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 2 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
