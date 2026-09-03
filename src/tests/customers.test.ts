import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5016;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let passed = 0;
let failed = 0;

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : undefined;
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      res => {
        let resData = '';
        res.on('data', chunk => {
          resData += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(resData);
          } catch {
            parsed = resData;
          }
          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖\x1b[0m ${msg}`);
  }
}

async function runCustomerTests() {
  console.log('\n======================================================');
  console.log(' MODULE 16: CUSTOMER MANAGEMENT & ACCOUNTS TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize server and seed
  const app = createApp();
  server = app.listen(TEST_PORT);

  try {
    await runSeed();

    // 2. Setup admin users & tokens
    const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
    const contentManagerRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
    const marketingManagerRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
    const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

    const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
    superAdminToken = generateAccessToken({ sub: superAdminUser!.id, roleId: superAdminRole!.id });

    let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.cust@lagoreearts.com' } });
    if (!catUser) {
      catUser = prisma.adminUser.create({
        data: {
          name: 'Customer Catalogue Manager',
          email: 'cat.cust@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: catalogueManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catalogueManagerRole!.id });

    let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.cust@lagoreearts.com' } });
    if (!contentUser) {
      contentUser = prisma.adminUser.create({
        data: {
          name: 'Customer Content Manager',
          email: 'content.cust@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: contentManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentManagerRole!.id });

    let mktUser = prisma.adminUser.findUnique({ where: { email: 'mkt.cust@lagoreearts.com' } });
    if (!mktUser) {
      mktUser = prisma.adminUser.create({
        data: {
          name: 'Customer Marketing Manager',
          email: 'mkt.cust@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: marketingManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: marketingManagerRole!.id });

    let ordUser = prisma.adminUser.findUnique({ where: { email: 'ord.cust@lagoreearts.com' } });
    if (!ordUser) {
      ordUser = prisma.adminUser.create({
        data: {
          name: 'Customer Order Manager',
          email: 'ord.cust@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: orderManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: orderManagerRole!.id });

    // Clean customer database fixtures
    prisma.customerAddress.deleteMany({});
    prisma.customerSession.deleteMany({});
    prisma.customerPasswordReset.deleteMany({});
    prisma.customerEmailVerification.deleteMany({});
    prisma.customer.deleteMany({});

    console.log('--- CATEGORY A: Customer Registration ---');
    let customer1AccessToken: string;
    let customer1RefreshToken: string;
    let customer1Id: string;
    let customer1VerificationToken: string;

    // A1. Valid registration
    const resA1 = await request('POST', '/api/v1/auth/customer/register', {
      email: 'Rohan.Sharma@LagoreeArts.com',
      password: 'RoyalHeritage2026!',
      firstName: 'Rohan',
      lastName: 'Sharma',
      phone: '+91 98765 43210'
    });

    assert(resA1.status === 201, 'A1. Register returns 201 Created');
    assert(resA1.body.data.customer.email === 'Rohan.Sharma@LagoreeArts.com', 'A1. Email preserved');
    assert(resA1.body.data.customer.firstName === 'Rohan', 'A1. First name matches');
    assert(resA1.body.data.customer.status === 'ACTIVE', 'A1. Status defaults to ACTIVE');
    assert(resA1.body.data.customer.passwordHash === undefined, 'A1. passwordHash not exposed');
    assert(resA1.body.data.accessToken !== undefined, 'A1. Access token returned');
    assert(resA1.body.data.refreshToken !== undefined, 'A1. Refresh token returned');
    assert(resA1.body.data.verificationToken !== undefined, 'A1. Verification token returned in dev');

    customer1AccessToken = resA1.body.data.accessToken;
    customer1RefreshToken = resA1.body.data.refreshToken;
    customer1Id = resA1.body.data.customer.id;
    customer1VerificationToken = resA1.body.data.verificationToken;

    // A2. Duplicate email rejection (case-insensitive)
    const resA2 = await request('POST', '/api/v1/auth/customer/register', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'AnotherPassword123',
      firstName: 'Duplicate',
      lastName: 'User'
    });
    assert(resA2.status === 409, 'A2. Duplicate email rejected with 409 Conflict');
    assert(resA2.body.error.code === 'CUSTOMER_EMAIL_EXISTS', 'A2. Error code is CUSTOMER_EMAIL_EXISTS');

    // A3. Weak password rejection
    const resA3 = await request('POST', '/api/v1/auth/customer/register', {
      email: 'weak.pwd@lagoreearts.com',
      password: 'short',
      firstName: 'Weak',
      lastName: 'Password'
    });
    assert(resA3.status === 400, 'A3. Weak password rejected with 400 Bad Request');

    // A4. Invalid email format rejection
    const resA4 = await request('POST', '/api/v1/auth/customer/register', {
      email: 'not-an-email',
      password: 'ValidPassword123',
      firstName: 'Invalid',
      lastName: 'Email'
    });
    assert(resA4.status === 400, 'A4. Invalid email format rejected with 400 Bad Request');

    console.log('--- CATEGORY B: Customer Login ---');
    // B1. Valid login with case-insensitive email
    const resB1 = await request('POST', '/api/v1/auth/customer/login', {
      email: 'ROHAN.SHARMA@LAGOREEARTS.COM',
      password: 'RoyalHeritage2026!'
    });
    assert(resB1.status === 200, 'B1. Valid login returns 200 OK');
    assert(resB1.body.data.accessToken !== undefined, 'B1. New access token issued');
    assert(resB1.body.data.refreshToken !== undefined, 'B1. New refresh token issued');
    customer1AccessToken = resB1.body.data.accessToken;
    customer1RefreshToken = resB1.body.data.refreshToken;

    // B2. Wrong password rejection
    const resB2 = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'WrongPassword123'
    });
    assert(resB2.status === 401, 'B2. Wrong password returns 401 Unauthorized');
    assert(resB2.body.error.code === 'INVALID_CREDENTIALS', 'B2. Error code is INVALID_CREDENTIALS');

    // B3. Non-existent email rejection
    const resB3 = await request('POST', '/api/v1/auth/customer/login', {
      email: 'nonexistent@lagoreearts.com',
      password: 'SomePassword123'
    });
    assert(resB3.status === 401, 'B3. Non-existent email returns 401 Unauthorized');

    // B4. Suspended account rejection
    await prisma.customer.update({ where: { id: customer1Id }, data: { status: 'SUSPENDED' } });
    const resB4 = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'RoyalHeritage2026!'
    });
    assert(resB4.status === 403, 'B4. Suspended account login returns 403 Forbidden');
    // Restore to ACTIVE
    await prisma.customer.update({ where: { id: customer1Id }, data: { status: 'ACTIVE' } });

    console.log('--- CATEGORY C: Session Management & Refresh Rotation ---');
    // C1. Refresh token rotation
    const resC1 = await request('POST', '/api/v1/auth/customer/refresh', {
      refreshToken: customer1RefreshToken
    });
    assert(resC1.status === 200, 'C1. Refresh token returns 200 OK');
    assert(resC1.body.data.accessToken !== undefined, 'C1. New access token issued');
    assert(resC1.body.data.refreshToken !== undefined, 'C1. New rotated refresh token issued');
    const rotatedAccessToken = resC1.body.data.accessToken;
    const rotatedRefreshToken = resC1.body.data.refreshToken;

    // C2. Replaying old refresh token is rejected
    const resC2 = await request('POST', '/api/v1/auth/customer/refresh', {
      refreshToken: customer1RefreshToken
    });
    assert(resC2.status === 401, 'C2. Replaying invalidated refresh token returns 401 Unauthorized');

    // C3. Logout current session
    const resC3 = await request('POST', '/api/v1/auth/customer/logout', {
      refreshToken: rotatedRefreshToken
    });
    assert(resC3.status === 200, 'C3. Logout returns 200 OK');

    // C4. Logging in again to test logout-all
    const resC4Login = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'RoyalHeritage2026!'
    });
    customer1AccessToken = resC4Login.body.data.accessToken;

    const resC4 = await request('POST', '/api/v1/auth/customer/logout-all', undefined, customer1AccessToken);
    assert(resC4.status === 200, 'C4. Logout-all returns 200 OK');

    // Verify all active sessions were revoked
    const activeSessions = await prisma.customerSession.findMany({
      where: { customerId: customer1Id, revokedAt: null }
    });
    assert(activeSessions.length === 0, 'C4. Zero active sessions remaining after logout-all');

    console.log('--- CATEGORY D: Password Reset & Change ---');
    // Re-login customer1
    const resDLogin = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'RoyalHeritage2026!'
    });
    customer1AccessToken = resDLogin.body.data.accessToken;

    // D1. Forgot password request (generic response)
    const resD1 = await request('POST', '/api/v1/auth/customer/forgot-password', {
      email: 'rohan.sharma@lagoreearts.com'
    });
    assert(resD1.status === 200, 'D1. Forgot password returns 200 OK');
    assert(resD1.body.data.resetToken !== undefined, 'D1. Reset token returned in dev');
    const resetToken = resD1.body.data.resetToken;

    // D2. Forgot password for unknown email (also returns generic 200)
    const resD2 = await request('POST', '/api/v1/auth/customer/forgot-password', {
      email: 'unknown.user@lagoreearts.com'
    });
    assert(resD2.status === 200, 'D2. Unknown email returns generic 200 OK (anti-enumeration)');

    // D3. Reset password execution
    const resD3 = await request('POST', '/api/v1/auth/customer/reset-password', {
      token: resetToken,
      newPassword: 'BrandNewPassword2026!'
    });
    assert(resD3.status === 200, 'D3. Reset password returns 200 OK');

    // D4. Reusing reset token is rejected
    const resD4 = await request('POST', '/api/v1/auth/customer/reset-password', {
      token: resetToken,
      newPassword: 'AnotherPassword2026!'
    });
    assert(resD4.status === 400, 'D4. Reusing reset token rejected with 400 Bad Request');
    assert(resD4.body.error.code === 'RESET_TOKEN_ALREADY_USED', 'D4. Error code is RESET_TOKEN_ALREADY_USED');

    // D5. Login with new password
    const resD5 = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'BrandNewPassword2026!'
    });
    assert(resD5.status === 200, 'D5. Login with newly reset password returns 200 OK');
    customer1AccessToken = resD5.body.data.accessToken;

    // D6. Authenticated change password
    const resD6 = await request('POST', '/api/v1/auth/customer/change-password', {
      currentPassword: 'BrandNewPassword2026!',
      newPassword: 'RoyalHeritage2026!'
    }, customer1AccessToken);
    assert(resD6.status === 200, 'D6. Change password returns 200 OK');

    // Login back with RoyalHeritage2026!
    const resD6Login = await request('POST', '/api/v1/auth/customer/login', {
      email: 'rohan.sharma@lagoreearts.com',
      password: 'RoyalHeritage2026!'
    });
    customer1AccessToken = resD6Login.body.data.accessToken;

    console.log('--- CATEGORY E: Email Verification ---');
    // E1. Verify email using token
    const resE1 = await request('POST', '/api/v1/auth/customer/verify-email', {
      token: customer1VerificationToken
    });
    assert(resE1.status === 200, 'E1. Verify email returns 200 OK');

    // Customer record has emailVerifiedAt set
    const verifiedCust = await prisma.customer.findUnique({ where: { id: customer1Id } });
    assert(verifiedCust.emailVerifiedAt !== null, 'E1. emailVerifiedAt is set');

    // E2. Idempotent re-verification
    const resE2 = await request('POST', '/api/v1/auth/customer/verify-email', {
      token: customer1VerificationToken
    });
    assert(resE2.status === 200, 'E2. Re-verifying email is idempotent (200 OK)');
    assert(resE2.body.data.alreadyVerified === true, 'E2. alreadyVerified flag is true');

    // E3. Resend verification on already verified account
    const resE3 = await request('POST', '/api/v1/auth/customer/resend-verification', {
      email: 'rohan.sharma@lagoreearts.com'
    });
    assert(resE3.status === 200, 'E3. Resend verification on verified email returns 200 OK');
    assert(resE3.body.data.alreadyVerified === true, 'E3. alreadyVerified returned');

    console.log('--- CATEGORY F: Customer Profile ---');
    // F1. Get customer profile
    const resF1 = await request('GET', '/api/v1/customer/profile', undefined, customer1AccessToken);
    assert(resF1.status === 200, 'F1. Get profile returns 200 OK');
    assert(resF1.body.data.firstName === 'Rohan', 'F1. firstName matches');
    assert(resF1.body.data.emailVerifiedAt !== null, 'F1. emailVerifiedAt is present');
    assert(resF1.body.data.passwordHash === undefined, 'F1. passwordHash not exposed');

    // F2. Update profile details (names, phone)
    const resF2 = await request('PATCH', '/api/v1/customer/profile', {
      firstName: 'Rohan Dev',
      lastName: 'Sharma-Verma',
      phone: '+91 99999 88888'
    }, customer1AccessToken);
    assert(resF2.status === 200, 'F2. Update profile returns 200 OK');
    assert(resF2.body.data.customer.firstName === 'Rohan Dev', 'F2. Updated first name persisted');

    // F3. Update profile email resets emailVerifiedAt and issues new token
    const resF3 = await request('PATCH', '/api/v1/customer/profile', {
      email: 'rohan.new@lagoreearts.com'
    }, customer1AccessToken);
    assert(resF3.status === 200, 'F3. Email update returns 200 OK');
    assert(resF3.body.data.customer.emailVerifiedAt === null, 'F3. emailVerifiedAt was reset to null');
    assert(resF3.body.data.verificationToken !== undefined, 'F3. New verification token generated');

    // Verify the new email
    await request('POST', '/api/v1/auth/customer/verify-email', {
      token: resF3.body.data.verificationToken
    });

    console.log('--- CATEGORY G: Address Book Management ---');
    let address1Id: string;
    let address2Id: string;

    // G1. Add first address (should auto-become default shipping and default billing)
    const resG1 = await request('POST', '/api/v1/customer/addresses', {
      type: 'HOME',
      firstName: 'Rohan',
      lastName: 'Sharma',
      addressLine1: '42 Heritage Villa, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'INDIA',
      phone: '+91 98765 43210'
    }, customer1AccessToken);
    assert(resG1.status === 201, 'G1. Add first address returns 201 Created');
    assert(resG1.body.data.isDefaultShipping === true, 'G1. First address is auto default shipping');
    assert(resG1.body.data.isDefaultBilling === true, 'G1. First address is auto default billing');
    address1Id = resG1.body.data.id;

    // G2. Add second address with isDefaultShipping: true
    const resG2 = await request('POST', '/api/v1/customer/addresses', {
      type: 'WORK',
      firstName: 'Rohan',
      lastName: 'Sharma',
      companyName: 'Atelier Royal Arts Ltd',
      addressLine1: 'Tower B, Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      country: 'INDIA',
      phone: '+91 98765 43211',
      isDefaultShipping: true
    }, customer1AccessToken);
    assert(resG2.status === 201, 'G2. Add second address returns 201 Created');
    assert(resG2.body.data.isDefaultShipping === true, 'G2. Second address is default shipping');
    assert(resG2.body.data.isDefaultBilling === false, 'G2. Second address is not default billing');
    address2Id = resG2.body.data.id;

    // Verify first address isDefaultShipping was automatically unset
    const resG2Check = await request('GET', `/api/v1/customer/addresses/${address1Id}`, undefined, customer1AccessToken);
    assert(resG2Check.body.data.isDefaultShipping === false, 'G2. First address default shipping was unset');
    assert(resG2Check.body.data.isDefaultBilling === true, 'G2. First address remains default billing');

    // G3. List customer addresses
    const resG3 = await request('GET', '/api/v1/customer/addresses', undefined, customer1AccessToken);
    assert(resG3.status === 200, 'G3. List addresses returns 200 OK');
    assert(resG3.body.data.length === 2, 'G3. 2 addresses listed');

    // G4. Indian 6-digit PIN code validation
    const resG4 = await request('POST', '/api/v1/customer/addresses', {
      firstName: 'Test',
      lastName: 'User',
      addressLine1: 'Test Address',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '123', // Invalid PIN
      country: 'INDIA',
      phone: '+91 98765 43210'
    }, customer1AccessToken);
    assert(resG4.status === 400, 'G4. Invalid 3-digit Indian PIN code rejected with 400 Bad Request');

    // G5. Switch default billing to second address
    const resG5 = await request('POST', `/api/v1/customer/addresses/${address2Id}/default-billing`, undefined, customer1AccessToken);
    assert(resG5.status === 200, 'G5. Set default billing returns 200 OK');
    assert(resG5.body.data.isDefaultBilling === true, 'G5. Address 2 is now default billing');

    // G6. Delete default shipping address (address2), verify address1 is auto-promoted
    const resG6 = await request('DELETE', `/api/v1/customer/addresses/${address2Id}`, undefined, customer1AccessToken);
    assert(resG6.status === 200, 'G6. Delete address returns 200 OK');

    const resG6Promoted = await request('GET', `/api/v1/customer/addresses/${address1Id}`, undefined, customer1AccessToken);
    assert(resG6Promoted.body.data.isDefaultShipping === true, 'G6. Address 1 auto-promoted to default shipping');
    assert(resG6Promoted.body.data.isDefaultBilling === true, 'G6. Address 1 auto-promoted to default billing');

    console.log('--- CATEGORY H: Admin Customer Management ---');
    // H1. List customers with search & pagination
    const resH1 = await request('GET', '/api/v1/admin/customers?search=Rohan&page=1&limit=10', undefined, superAdminToken);
    assert(resH1.status === 200, 'H1. Admin list customers returns 200 OK');
    assert(resH1.body.data.items.length >= 1, 'H1. Customer found in search results');
    assert(resH1.body.data.items[0].passwordHash === undefined, 'H1. Admin list does not expose passwordHash');

    // H2. Get customer detail by ID
    const resH2 = await request('GET', `/api/v1/admin/customers/${customer1Id}`, undefined, superAdminToken);
    assert(resH2.status === 200, 'H2. Admin get customer by ID returns 200 OK');
    assert(resH2.body.data.id === customer1Id, 'H2. Customer ID matches');
    assert(resH2.body.data.addressCount === 1, 'H2. addressCount is 1');

    // H3. Update customer details by admin
    const resH3 = await request('PATCH', `/api/v1/admin/customers/${customer1Id}`, {
      firstName: 'Rohan Sovereign'
    }, superAdminToken);
    assert(resH3.status === 200, 'H3. Admin update customer returns 200 OK');
    assert(resH3.body.data.firstName === 'Rohan Sovereign', 'H3. Updated name saved');

    // H4. Update customer status to INACTIVE
    const resH4 = await request('PATCH', `/api/v1/admin/customers/${customer1Id}/status`, {
      status: 'INACTIVE'
    }, superAdminToken);
    assert(resH4.status === 200, 'H4. Admin update customer status returns 200 OK');
    assert(resH4.body.data.status === 'INACTIVE', 'H4. Status is INACTIVE');

    // Restore to ACTIVE
    await request('PATCH', `/api/v1/admin/customers/${customer1Id}/status`, { status: 'ACTIVE' }, superAdminToken);

    // H5. Admin view customer addresses
    const resH5 = await request('GET', `/api/v1/admin/customers/${customer1Id}/addresses`, undefined, superAdminToken);
    assert(resH5.status === 200, 'H5. Admin view customer addresses returns 200 OK');
    assert(Array.isArray(resH5.body.data), 'H5. Addresses array returned');

    // H6. Admin view customer sessions (sanitized)
    const resH6 = await request('GET', `/api/v1/admin/customers/${customer1Id}/sessions`, undefined, superAdminToken);
    assert(resH6.status === 200, 'H6. Admin view customer sessions returns 200 OK');
    assert(Array.isArray(resH6.body.data), 'H6. Sessions array returned');
    if (resH6.body.data.length > 0) {
      assert(resH6.body.data[0].refreshTokenHash === undefined, 'H6. refreshTokenHash sanitized from session response');
    }

    // H7. Admin revoke all customer sessions
    const resH7 = await request('POST', `/api/v1/admin/customers/${customer1Id}/revoke-sessions`, undefined, superAdminToken);
    assert(resH7.status === 200, 'H7. Admin revoke customer sessions returns 200 OK');

    console.log('--- CATEGORY I: RBAC Permission Matrix ---');
    // I1. Order Manager can view customers, addresses, and update status
    const resI1List = await request('GET', '/api/v1/admin/customers', undefined, orderManagerToken);
    assert(resI1List.status === 200, 'I1. Order Manager can list customers');

    const resI1Status = await request('PATCH', `/api/v1/admin/customers/${customer1Id}/status`, { status: 'ACTIVE' }, orderManagerToken);
    assert(resI1Status.status === 200, 'I1. Order Manager can update customer status');

    // I2. Content Manager can view customers but cannot update status (403)
    const resI2List = await request('GET', '/api/v1/admin/customers', undefined, contentManagerToken);
    assert(resI2List.status === 200, 'I2. Content Manager can view customers');

    const resI2Status = await request('PATCH', `/api/v1/admin/customers/${customer1Id}/status`, { status: 'ACTIVE' }, contentManagerToken);
    assert(resI2Status.status === 403, 'I2. Content Manager cannot update customer status (403 Forbidden)');

    // I3. Catalogue Manager can view customers
    const resI3List = await request('GET', '/api/v1/admin/customers', undefined, catalogueManagerToken);
    assert(resI3List.status === 200, 'I3. Catalogue Manager can view customers');

    // I4. Marketing Manager can view customers
    const resI4List = await request('GET', '/api/v1/admin/customers', undefined, marketingManagerToken);
    assert(resI4List.status === 200, 'I4. Marketing Manager can view customers');

    console.log('--- CATEGORY J: Security, Isolation & IDOR Protection ---');
    // Register Customer 2
    const resCust2 = await request('POST', '/api/v1/auth/customer/register', {
      email: 'customer2@lagoreearts.com',
      password: 'Customer2Password123!',
      firstName: 'Customer',
      lastName: 'Two'
    });
    const customer2AccessToken = resCust2.body.data.accessToken;
    const customer2Id = resCust2.body.data.customer.id;

    // J1. Customer 2 cannot view Customer 1's address (404 / IDOR protection)
    const resJ1 = await request('GET', `/api/v1/customer/addresses/${address1Id}`, undefined, customer2AccessToken);
    assert(resJ1.status === 404, 'J1. Customer 2 accessing Customer 1 address returns 404 Not Found (IDOR protected)');

    // J2. Customer 2 cannot delete Customer 1's address (404 / IDOR protection)
    const resJ2 = await request('DELETE', `/api/v1/customer/addresses/${address1Id}`, undefined, customer2AccessToken);
    assert(resJ2.status === 404, 'J2. Customer 2 deleting Customer 1 address returns 404 Not Found');

    // J3. Admin token cannot access customer endpoints (401 Unauthorized)
    const resJ3 = await request('GET', '/api/v1/customer/profile', undefined, superAdminToken);
    assert(resJ3.status === 401, 'J3. Admin token rejected on Customer endpoints with 401 Unauthorized');

    // J4. Customer token cannot access admin endpoints (401 Unauthorized)
    const resJ4 = await request('GET', '/api/v1/admin/customers', undefined, customer1AccessToken);
    assert(resJ4.status === 401, 'J4. Customer token rejected on Admin endpoints with 401 Unauthorized');

    // J5. Input Sanitization (strip script tags from customer names and addresses)
    const resJ5 = await request('PATCH', '/api/v1/customer/profile', {
      firstName: '<b>Rohan</b><script>alert("XSS")</script>'
    }, customer2AccessToken);
    assert(resJ5.status === 200, 'J5. Profile update with XSS payload returns 200 OK');
    assert(resJ5.body.data.customer.firstName === 'Rohan', 'J5. Script tags and HTML stripped cleanly');

    console.log('--- CATEGORY K: Audit Logging Verification ---');
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        module: 'CUSTOMER'
      }
    });
    assert(auditLogs.length > 0, 'K1. Audit logs recorded for CUSTOMER module');
    const actions = auditLogs.map(a => a.action);
    assert(actions.includes('CUSTOMER_CREATED'), 'K2. Audit recorded CUSTOMER_CREATED');
    assert(actions.includes('CUSTOMER_LOGIN'), 'K3. Audit recorded CUSTOMER_LOGIN');
    assert(actions.includes('CUSTOMER_ADDRESS_CREATED'), 'K4. Audit recorded CUSTOMER_ADDRESS_CREATED');

    console.log('\n======================================================');
    console.log(` CUSTOMER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runCustomerTests();
