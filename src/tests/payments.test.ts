/**
 * Module 21: Payments — Comprehensive Test Suite
 * Lagoree Arts Backend
 */

import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { PaymentCurrencyHelper } from '../modules/payments/payment-currency.ts';
import { PaymentPolicy } from '../modules/payments/payment.policy.ts';
import { PaymentService } from '../modules/payments/payment.service.ts';
import { PaymentRepository } from '../modules/payments/payment.repository.ts';
import { OrderRepository } from '../modules/orders/order.repository.ts';
import { MockPaymentGatewayProvider } from '../modules/payments/providers/mock-payment.provider.ts';
import { RazorpayPaymentGatewayProvider } from '../modules/payments/providers/razorpay-payment.provider.ts';
import http from 'node:http';
import crypto from 'node:crypto';

const TEST_PORT = 5021;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let orderManagerToken: string;
let catalogueManagerToken: string;

let customer1: any;
let customer2: any;
let customer1Token: string;
let customer2Token: string;

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, meta?: any) {
  if (condition) {
    console.log(`  ✔ ${testName}`);
    passed++;
  } else {
    console.error(`  ✖ ${testName}`);
    if (meta) console.error('    Details:', JSON.stringify(meta, null, 2));
    failed++;
  }
}

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {})
    };
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const reqData = body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    if (reqData !== undefined && !reqHeaders['Content-Length']) {
      reqHeaders['Content-Length'] = Buffer.byteLength(reqData).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = resData ? JSON.parse(resData) : {};
            resolve({ status: res.statusCode || 200, body: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode || 200, body: resData, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (reqData !== undefined) {
      req.write(reqData);
    }
    req.end();
  });
}

// Helper to create test orders
async function createTestOrder(opts: {
  customerId?: string | null;
  status?: any;
  paymentStatus?: any;
  grandTotal?: number;
  currency?: string;
  orderNumber?: string;
}): Promise<any> {
  const orderNumber = opts.orderNumber || `ORD-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const grandTotal = opts.grandTotal !== undefined ? opts.grandTotal : 15000.5;

  let cart = opts.customerId ? await prisma.cart.findFirst({ where: { customerId: opts.customerId } }) : null;
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: opts.customerId || null,
        guestTokenHash: !opts.customerId ? `guest_${Date.now()}_${Math.random()}` : null,
        currency: opts.currency || 'INR',
        status: 'ACTIVE'
      }
    });
  }

  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      cartId: cart.id,
      customerId: opts.customerId || null,
      status: 'COMPLETED',
      email: 'patron@lagoree.com',
      currency: opts.currency || 'INR',
      subtotal: grandTotal,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      grandTotal,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  return await OrderRepository.createOrder({
    orderNumber,
    customerId: opts.customerId || null,
    checkoutSessionId: checkoutSession.id,
    guestOrderTokenHash: null,
    currency: opts.currency || 'INR',
    status: opts.status || 'PENDING',
    paymentStatus: opts.paymentStatus || 'PENDING',
    email: 'patron@lagoree.com',
    subtotal: grandTotal,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grandTotal,
    notes: 'Test payment order',
    items: [
      {
        productId: null,
        variantId: null,
        sku: 'SKU-TEST-1',
        productName: 'Pichwai Canvas Masterpiece',
        quantity: 1,
        unitPrice: grandTotal,
        lineTotal: grandTotal,
        currency: opts.currency || 'INR'
      }
    ],
    addresses: [
      {
        type: 'SHIPPING',
        fullName: 'Aarav Patel',
        firstName: 'Aarav',
        lastName: 'Patel',
        addressLine1: '45 Heritage Boulevard',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
        country: 'India',
        phone: '+919876543210'
      }
    ]
  });
}

async function runTests() {
  console.log('\n🚀 Starting Module 21: Payments Test Suite...\n');

  // Seed DB & Setup
  await runSeed();

  const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
  const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });

  const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({
    sub: superAdminUser.id,
    email: superAdminUser.email,
    role: 'SUPER_ADMIN',
    permissions: ['*']
  });

  const orderMgrUser = prisma.adminUser.create({
    data: {
      email: `ordermgr.${Date.now()}@lagoreearts.com`,
      passwordHash: '$2b$10$xyz',
      name: 'Order Manager Admin',
      roleId: orderManagerRole.id,
      status: 'ACTIVE'
    }
  });
  orderManagerToken = generateAccessToken({
    sub: orderMgrUser.id,
    email: orderMgrUser.email,
    role: 'ORDER_MANAGER',
    permissions: [
      'order.view', 'order.create', 'order.update', 'order.cancel', 'order.manage-status',
      'payment.view', 'payment.create', 'payment.update', 'payment.reconcile', 'payment.refund'
    ]
  });

  const catMgrUser = prisma.adminUser.create({
    data: {
      email: `catmgr.${Date.now()}@lagoreearts.com`,
      passwordHash: '$2b$10$xyz',
      name: 'Catalogue Manager Admin',
      roleId: catalogueManagerRole.id,
      status: 'ACTIVE'
    }
  });
  catalogueManagerToken = generateAccessToken({
    sub: catMgrUser.id,
    email: catMgrUser.email,
    role: 'CATALOGUE_MANAGER',
    permissions: ['category.view', 'product.view']
  });

  customer1 = await prisma.customer.findUnique({ where: { email: 'aarav.patel@example.com' } });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        email: 'aarav.patel@example.com',
        passwordHash: 'hash_placeholder',
        firstName: 'Aarav',
        lastName: 'Patel',
        status: 'ACTIVE'
      }
    });
  }

  customer2 = await prisma.customer.findUnique({ where: { email: 'priya.sharma@example.com' } });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        email: 'priya.sharma@example.com',
        passwordHash: 'hash_placeholder',
        firstName: 'Priya',
        lastName: 'Sharma',
        status: 'ACTIVE'
      }
    });
  }

  customer1Token = generateCustomerAccessToken({ sub: customer1.id, email: customer1.email, status: customer1.status });
  customer2Token = generateCustomerAccessToken({ sub: customer2.id, email: customer2.email, status: customer2.status });

  const app = createApp();
  server = app.listen(TEST_PORT);

  // =========================================================================
  // CATEGORY A: Schema & Database Persistence
  // =========================================================================
  console.log('--- Category A: Schema & Database Persistence ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 25000 });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'MOCK',
        amount: 25000,
        currency: 'INR',
        status: 'CREATED'
      }
    });

    assert(!!payment.id, 'A1: Payment record persisted in database');
    assert(payment.status === 'CREATED', 'A2: Initial status is CREATED');
    assert(payment.amount === 25000, 'A3: Persisted commercial amount matches order');

    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        status: 'INITIATED'
      }
    });
    assert(!!attempt?.id, 'A4: Payment attempt persisted in database');

    const foundPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { attempts: true }
    });
    assert(foundPayment?.attempts?.length === 1, 'A5: Payment attempts hydrated through relation');

    const webhookEvent = await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'MOCK',
        eventId: `evt_${Date.now()}`,
        eventType: 'payment.captured',
        payloadHash: 'hash_test_123',
        signatureVerified: true
      }
    });
    assert(!!webhookEvent?.id, 'A6: Webhook event model records unparsed raw payloads');
  }

  // =========================================================================
  // CATEGORY B: Minor-Unit Precision & Authoritative Amount
  // =========================================================================
  console.log('--- Category B: Minor-Unit Precision & Authoritative Amount ---');
  {
    const paise1 = PaymentCurrencyHelper.toMinorUnits(100.50, 'INR');
    assert(paise1 === 10050, 'B1: 100.50 INR converts precisely to 10050 paise');

    const paise2 = PaymentCurrencyHelper.toMinorUnits('4999.99', 'INR');
    assert(paise2 === 499999, 'B2: 4999.99 INR string converts precisely to 499999 paise');

    const paise3 = PaymentCurrencyHelper.toMinorUnits(0.01, 'INR');
    assert(paise3 === 1, 'B3: 0.01 INR converts to 1 paisa');

    const major1 = PaymentCurrencyHelper.fromMinorUnits(10050, 'INR');
    assert(major1 === 100.50, 'B4: 10050 paise converts back to 100.50 INR');

    const formatted = PaymentCurrencyHelper.formatDecimal(1250.5);
    assert(formatted === '1250.50', 'B5: Formats decimal standard monetary representation');

    let errorThrown = false;
    try {
      PaymentCurrencyHelper.toMinorUnits(-50);
    } catch {
      errorThrown = true;
    }
    assert(errorThrown, 'B6: Negative monetary amounts reject conversion');
  }

  // =========================================================================
  // CATEGORY C: Payment Initiation & Ownership Security
  // =========================================================================
  console.log('--- Category C: Payment Initiation & Ownership Security ---');
  {
    const order1 = await createTestOrder({ customerId: customer1.id, grandTotal: 18500 });

    // 1. Successful initiation by owner
    const res1 = await request('POST', `/api/v1/customer/orders/${order1.id}/payment/initiate`, {
      provider: 'MOCK',
      idempotencyKey: `idem_cust1_${order1.id}`
    }, customer1Token);
    assert(res1.status === 201, 'C1: Owner customer can initiate payment session (HTTP 201)');
    assert(res1.body.data.amount === 18500, 'C2: Initiated payment amount matches order grandTotal');
    assert(res1.body.data.amountInMinor === 1850000, 'C3: Initiated payment provides minor units (1850000 paise)');
    assert(res1.body.data.provider === 'MOCK', 'C4: Provider selected as MOCK');
    assert(!!res1.body.data.providerOrderId, 'C5: Provider order ID returned');

    // 2. IDOR Attempt: customer2 tries to initiate payment on customer1's order
    const res2 = await request('POST', `/api/v1/customer/orders/${order1.id}/payment/initiate`, {
      provider: 'MOCK'
    }, customer2Token);
    assert(res2.status === 404, 'C6: IDOR Protection: Non-owner customer receives 404 ORDER_NOT_FOUND');

    // 3. Client attempts to override price by passing amount in body
    const order2 = await createTestOrder({ customerId: customer1.id, grandTotal: 99000 });
    const res3 = await request('POST', `/api/v1/customer/orders/${order2.id}/payment/initiate`, {
      provider: 'MOCK',
      amount: 10, // Tampered client price
      amountInMinor: 1000
    }, customer1Token);
    assert(res3.status === 201, 'C7: Initiation succeeds but client amount is ignored');
    assert(res3.body.data.amount === 99000, 'C8: Authoritative order amount 99000 is enforced, client amount 10 ignored');
    assert(res3.body.data.amountInMinor === 9900000, 'C9: Minor units strictly calculated from order grandTotal');

    // 4. Invalid order ID format
    const res4 = await request('POST', '/api/v1/customer/orders/invalid-uuid-123/payment/initiate', {}, customer1Token);
    assert(res4.status === 400, 'C10: Invalid order UUID returns 400 INVALID_ID_FORMAT');
  }

  // =========================================================================
  // CATEGORY D: Payable Order State Matrix
  // =========================================================================
  console.log('--- Category D: Payable Order State Matrix ---');
  {
    // 1. Order in PENDING status: Payable
    const pendingOrder = await createTestOrder({ customerId: customer1.id, status: 'PENDING', paymentStatus: 'PENDING' });
    const vPending = PaymentPolicy.validateOrderPayability(pendingOrder);
    assert(vPending.payable === true, 'D1: PENDING order is payable');

    // 2. Order in CONFIRMED status: Payable
    const confirmedOrder = await createTestOrder({ customerId: customer1.id, status: 'CONFIRMED', paymentStatus: 'PENDING' });
    const vConfirmed = PaymentPolicy.validateOrderPayability(confirmedOrder);
    assert(vConfirmed.payable === true, 'D2: CONFIRMED order is payable');

    // 3. Order already PAID: Not payable (HTTP 409)
    const paidOrder = await createTestOrder({ customerId: customer1.id, status: 'CONFIRMED', paymentStatus: 'PAID' });
    const resPaid = await request('POST', `/api/v1/customer/orders/${paidOrder.id}/payment/initiate`, {}, customer1Token);
    assert(resPaid.status === 409 && resPaid.body.error?.code === 'ORDER_ALREADY_PAID', 'D3: Already PAID order rejects payment initiation with 409 ORDER_ALREADY_PAID');

    // 4. Order CANCELLED: Not payable (HTTP 409)
    const cancelledOrder = await createTestOrder({ customerId: customer1.id, status: 'CANCELLED', paymentStatus: 'PENDING' });
    const resCancelled = await request('POST', `/api/v1/customer/orders/${cancelledOrder.id}/payment/initiate`, {}, customer1Token);
    assert(resCancelled.status === 409 && resCancelled.body.error?.code === 'ORDER_NOT_PAYABLE', 'D4: CANCELLED order rejects payment initiation with 409 ORDER_NOT_PAYABLE');

    // 5. Order SHIPPED / DELIVERED: Not payable
    const shippedOrder = await createTestOrder({ customerId: customer1.id, status: 'SHIPPED', paymentStatus: 'PENDING' });
    const resShipped = await request('POST', `/api/v1/customer/orders/${shippedOrder.id}/payment/initiate`, {}, customer1Token);
    assert(resShipped.status === 409 && resShipped.body.error?.code === 'ORDER_NOT_PAYABLE', 'D5: SHIPPED order rejects payment initiation with 409 ORDER_NOT_PAYABLE');
  }

  // =========================================================================
  // CATEGORY E: Idempotency & Replay Protection
  // =========================================================================
  console.log('--- Category E: Idempotency & Replay Protection ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 34000 });
    const idemKey = `idem_replay_${order.id}`;

    // 1. First call
    const res1 = await request('POST', `/api/v1/customer/orders/${order.id}/payment/initiate`, {
      provider: 'MOCK',
      idempotencyKey: idemKey
    }, customer1Token);
    assert(res1.status === 201, 'E1: First payment initiation creates payment');
    const firstPaymentId = res1.body.data.id;

    // 2. Replay with identical idempotencyKey
    const res2 = await request('POST', `/api/v1/customer/orders/${order.id}/payment/initiate`, {
      provider: 'MOCK',
      idempotencyKey: idemKey
    }, customer1Token);
    assert(res2.status === 201, 'E2: Replayed initiation returns HTTP 201 with existing payment');
    assert(res2.body.data.id === firstPaymentId, 'E3: Replayed initiation returns identical payment ID without duplicate row');

    const paymentsInDb = await prisma.payment.findMany({ where: { orderId: order.id } });
    assert(paymentsInDb.length === 1, 'E4: Database contains exactly 1 payment record for idempotent key');

    // 3. Replay same idempotencyKey for DIFFERENT order: conflict
    const otherOrder = await createTestOrder({ customerId: customer1.id, grandTotal: 50000 });
    const res3 = await request('POST', `/api/v1/customer/orders/${otherOrder.id}/payment/initiate`, {
      provider: 'MOCK',
      idempotencyKey: idemKey
    }, customer1Token);
    assert(res3.status === 409, 'E5: Idempotency conflict when key reused across different orders');
  }

  // =========================================================================
  // CATEGORY F: Webhook Cryptographic Verification
  // =========================================================================
  console.log('--- Category F: Webhook Cryptographic Verification ---');
  {
    const secret = 'rzp_test_webhook_secret';
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp_crypto_1',
            order_id: 'order_rzp_mock_1',
            amount: 500000,
            currency: 'INR',
            status: 'captured',
            method: 'card'
          }
        }
      }
    });

    // Valid HMAC SHA-256
    const validSignature = crypto.createHmac('sha256', secret).update(Buffer.from(rawPayload, 'utf8')).digest('hex');

    const resValid = await request('POST', '/api/v1/payments/webhooks/razorpay', rawPayload, undefined, {
      'x-razorpay-signature': validSignature
    });
    assert(resValid.status === 200, 'F1: Valid HMAC-SHA256 signature accepted (HTTP 200)');

    // Invalid Signature
    const resInvalid = await request('POST', '/api/v1/payments/webhooks/razorpay', rawPayload, undefined, {
      'x-razorpay-signature': 'tampered_invalid_signature_hex_12345'
    });
    assert(resInvalid.status === 401 && resInvalid.body.error?.code === 'INVALID_WEBHOOK_SIGNATURE', 'F2: Invalid HMAC signature rejected with 401 INVALID_WEBHOOK_SIGNATURE');

    // Missing Signature Header
    const resMissing = await request('POST', '/api/v1/payments/webhooks/razorpay', rawPayload);
    assert(resMissing.status === 401, 'F3: Missing signature header rejected with HTTP 401');
  }

  // =========================================================================
  // CATEGORY G: Webhook Event Idempotency & Deduplication
  // =========================================================================
  console.log('--- Category G: Webhook Event Idempotency & Deduplication ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 42000 });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    const eventId = `evt_dedup_${Date.now()}`;
    const payload = {
      event_id: eventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_mock_dedup_1',
            order_id: pInit.providerOrderId,
            amount: 4200000,
            currency: 'INR',
            status: 'captured',
            method: 'upi'
          }
        }
      }
    };

    // First webhook delivery
    const res1 = await request('POST', '/api/v1/payments/webhooks/mock', payload, undefined, {
      'x-mock-signature': 'mock_valid_signature'
    });
    assert(res1.status === 200 && res1.body.data.status === 'processed', 'G1: First webhook event processed successfully');

    // Replay duplicate webhook
    const res2 = await request('POST', '/api/v1/payments/webhooks/mock', payload, undefined, {
      'x-mock-signature': 'mock_valid_signature'
    });
    assert(res2.status === 200 && res2.body.data.status === 'ignored', 'G2: Duplicate replayed webhook event is safely ignored');
  }

  // =========================================================================
  // CATEGORY H: Amount & Currency Reconciliation on Capture
  // =========================================================================
  console.log('--- Category H: Amount & Currency Reconciliation on Capture ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 60000 });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    const mismatchPayload = {
      event_id: `evt_mismatch_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_mock_mismatch',
            order_id: pInit.providerOrderId,
            amount: 10000, // 100 INR instead of 60000 INR (6000000 paise)
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };

    const resMismatch = await request('POST', '/api/v1/payments/webhooks/mock', mismatchPayload, undefined, {
      'x-mock-signature': 'mock_valid_signature'
    });
    assert(resMismatch.status === 400 && resMismatch.body.error?.code === 'AMOUNT_MISMATCH', 'H1: Webhook amount mismatch rejected with 400 AMOUNT_MISMATCH');

    const paymentAfterMismatch = await PaymentRepository.findById(pInit.id);
    assert(paymentAfterMismatch?.status !== 'CAPTURED', 'H2: Payment status remains uncaptured on amount mismatch');
  }

  // =========================================================================
  // CATEGORY I: Payment Lifecycle State Machine
  // =========================================================================
  console.log('--- Category I: Payment Lifecycle State Machine ---');
  {
    assert(PaymentPolicy.canTransition('CREATED', 'PENDING'), 'I1: Transition CREATED -> PENDING allowed');
    assert(PaymentPolicy.canTransition('CREATED', 'CAPTURED'), 'I2: Transition CREATED -> CAPTURED allowed');
    assert(PaymentPolicy.canTransition('PENDING', 'CAPTURED'), 'I3: Transition PENDING -> CAPTURED allowed');
    assert(PaymentPolicy.canTransition('CAPTURED', 'REFUNDED'), 'I4: Transition CAPTURED -> REFUNDED allowed');
    assert(PaymentPolicy.canTransition('CAPTURED', 'PARTIALLY_REFUNDED'), 'I5: Transition CAPTURED -> PARTIALLY_REFUNDED allowed');
    assert(PaymentPolicy.canTransition('PARTIALLY_REFUNDED', 'REFUNDED'), 'I6: Transition PARTIALLY_REFUNDED -> REFUNDED allowed');

    assert(!PaymentPolicy.canTransition('CAPTURED', 'PENDING'), 'I7: Illegal transition CAPTURED -> PENDING rejected');
    assert(!PaymentPolicy.canTransition('FAILED', 'CAPTURED'), 'I8: Terminal FAILED state rejects transitions');
    assert(!PaymentPolicy.canTransition('CANCELLED', 'CAPTURED'), 'I9: Terminal CANCELLED state rejects transitions');
    assert(!PaymentPolicy.canTransition('REFUNDED', 'CAPTURED'), 'I10: Terminal REFUNDED state rejects transitions');

    let transitionErr = false;
    try {
      PaymentPolicy.enforceTransition('FAILED', 'CAPTURED');
    } catch (e: any) {
      transitionErr = e.code === 'INVALID_PAYMENT_STATUS_TRANSITION';
    }
    assert(transitionErr, 'I11: enforceTransition throws 409 INVALID_PAYMENT_STATUS_TRANSITION');
  }

  // =========================================================================
  // CATEGORY J: Order Payment State Synchronization
  // =========================================================================
  console.log('--- Category J: Order Payment State Synchronization ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 12000, paymentStatus: 'PENDING' });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    assert(order.paymentStatus === 'PENDING', 'J1: Order starts with paymentStatus PENDING');

    // Customer client-side verify callback
    const resVerify = await request('POST', `/api/v1/customer/orders/${order.id}/payment/verify`, {
      providerPaymentId: 'pay_mock_success_123',
      providerOrderId: pInit.providerOrderId
    }, customer1Token);

    assert(resVerify.status === 200, 'J2: Payment verification succeeds (HTTP 200)');
    assert(resVerify.body.data.status === 'CAPTURED', 'J3: Payment status updated to CAPTURED');

    const updatedOrder = await OrderRepository.findById(order.id);
    assert(updatedOrder?.paymentStatus === 'PAID', 'J4: Order.paymentStatus synchronized to PAID via Module 20 boundary');
  }

  // =========================================================================
  // CATEGORY K: Multiple Payment Attempts & Retry Isolation
  // =========================================================================
  console.log('--- Category K: Multiple Payment Attempts & Retry Isolation ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 7500 });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    // 1. Attempt 1 fails
    const resFail = await request('POST', `/api/v1/customer/orders/${order.id}/payment/verify`, {
      providerPaymentId: 'pay_fail_mock_card_declined',
      providerOrderId: pInit.providerOrderId
    }, customer1Token);
    assert(resFail.status === 400, 'K1: Failed gateway attempt handled gracefully (HTTP 400)');

    const paymentAfterFail = await PaymentRepository.findById(pInit.id);
    assert(paymentAfterFail?.status === 'FAILED', 'K2: Payment marked FAILED');
    assert(paymentAfterFail?.attempts?.length === 2, 'K3: Payment recorded 2 attempt entries in history');

    // 2. Retry payment: New initiation for same order
    const resRetry = await request('POST', `/api/v1/customer/orders/${order.id}/payment/initiate`, {
      provider: 'MOCK'
    }, customer1Token);
    assert(resRetry.status === 201, 'K4: Customer can retry payment by creating a new session');
    const retryPaymentId = resRetry.body.data.id;
    assert(retryPaymentId !== pInit.id, 'K5: Retried session has distinct payment ID');

    // 3. Retry success
    const resRetryVerify = await request('POST', `/api/v1/customer/orders/${order.id}/payment/verify`, {
      providerPaymentId: 'pay_mock_retry_success',
      providerOrderId: resRetry.body.data.providerOrderId
    }, customer1Token);
    assert(resRetryVerify.status === 200 && resRetryVerify.body.data.status === 'CAPTURED', 'K6: Retried payment captures successfully');

    const orderFinal = await OrderRepository.findById(order.id);
    assert(orderFinal?.paymentStatus === 'PAID', 'K7: Order marked PAID after successful retry');
  }

  // =========================================================================
  // CATEGORY L: Customer Payment History & IDOR Security
  // =========================================================================
  console.log('--- Category L: Customer Payment History & IDOR Security ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 22000 });
    await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    // 1. Owner customer retrieves payment status
    const resOwner = await request('GET', `/api/v1/customer/orders/${order.id}/payment`, undefined, customer1Token);
    assert(resOwner.status === 200, 'L1: Owner customer can query payment status (HTTP 200)');
    assert(resOwner.body.data.orderId === order.id, 'L2: Returned payment matches order ID');
    assert(resOwner.body.data.amount === 22000, 'L3: Returned payment amount is 22000');
    assert(resOwner.body.data.providerSignature === undefined, 'L4: Customer view strips internal provider signatures');

    // 2. IDOR: customer2 queries customer1's payment status
    const resIdor = await request('GET', `/api/v1/customer/orders/${order.id}/payment`, undefined, customer2Token);
    assert(resIdor.status === 404, 'L5: IDOR Protection: Non-owner customer receives 404 ORDER_NOT_FOUND');

    // 3. Unauthenticated query
    const resUnauth = await request('GET', `/api/v1/customer/orders/${order.id}/payment`);
    assert(resUnauth.status === 401, 'L6: Unauthenticated request rejected with HTTP 401');
  }

  // =========================================================================
  // CATEGORY M: Admin Payment Operations & RBAC
  // =========================================================================
  console.log('--- Category M: Admin Payment Operations & RBAC ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 30000 });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });
    await PaymentService.verifyPayment(order.id, customer1.id, {
      providerPaymentId: 'pay_mock_admin_test_1',
      providerOrderId: pInit.providerOrderId
    });

    // 1. Super Admin list payments
    const resAdminList = await request('GET', '/api/v1/admin/payments?page=1&limit=10', undefined, superAdminToken);
    assert(resAdminList.status === 200, 'M1: Super Admin can list payments with pagination (HTTP 200)');
    assert(Array.isArray(resAdminList.body.data), 'M2: Admin payment list returns array');
    assert(resAdminList.body.pagination.total >= 1, 'M3: Pagination total matches database records');

    // 2. Order Manager get payment detail
    const resAdminDetail = await request('GET', `/api/v1/admin/payments/${pInit.id}`, undefined, orderManagerToken);
    assert(resAdminDetail.status === 200, 'M4: Order Manager can inspect detailed payment record (HTTP 200)');
    assert(resAdminDetail.body.data.id === pInit.id, 'M5: Detail matches payment ID');
    assert(Array.isArray(resAdminDetail.body.data.attempts), 'M6: Admin view includes full payment attempts history');

    // 3. Catalogue Manager (Unauthorized for payments)
    const resCat = await request('GET', `/api/v1/admin/payments/${pInit.id}`, undefined, catalogueManagerToken);
    assert(resCat.status === 403, 'M7: Catalogue Manager without payment.view permission rejected (HTTP 403)');

    // 4. Admin Manual Reconciliation
    const resReconcile = await request('POST', `/api/v1/admin/payments/${pInit.id}/reconcile`, {}, orderManagerToken);
    assert(resReconcile.status === 200, 'M8: Admin can trigger manual reconciliation (HTTP 200)');

    // 5. Admin Partial & Full Refund
    const resPartialRefund = await request('POST', `/api/v1/admin/payments/${pInit.id}/refund`, {
      amount: 10000,
      reason: 'Atelier frame adjustment discount'
    }, orderManagerToken);
    assert(resPartialRefund.status === 200, 'M9: Admin can issue partial refund (HTTP 200)');
    assert(resPartialRefund.body.data.status === 'PARTIALLY_REFUNDED', 'M10: Payment status updated to PARTIALLY_REFUNDED');

    const resFullRefund = await request('POST', `/api/v1/admin/payments/${pInit.id}/refund`, {
      amount: 20000,
      reason: 'Artwork return requested'
    }, orderManagerToken);
    assert(resFullRefund.status === 200, 'M11: Admin can issue remaining refund to reach full refund (HTTP 200)');
    assert(resFullRefund.body.data.status === 'REFUNDED', 'M12: Payment status updated to REFUNDED');

    const refundedOrder = await OrderRepository.findById(order.id);
    assert(refundedOrder?.paymentStatus === 'REFUNDED', 'M13: Order payment status synchronized to REFUNDED');
  }

  // =========================================================================
  // CATEGORY N: Concurrency & Race-Condition Resistance
  // =========================================================================
  console.log('--- Category N: Concurrency & Race-Condition Resistance ---');
  {
    const order = await createTestOrder({ customerId: customer1.id, grandTotal: 15000 });
    const pInit = await PaymentService.initiatePayment(order.id, customer1.id, { provider: 'MOCK' });

    // Send 5 concurrent capture webhooks with identical eventId
    const eventId = `evt_race_${Date.now()}`;
    const payload = {
      event_id: eventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_mock_race_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            order_id: pInit.providerOrderId,
            amount: 1500000,
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };

    const promises = Array.from({ length: 5 }, () =>
      request('POST', '/api/v1/payments/webhooks/mock', payload, undefined, {
        'x-mock-signature': 'mock_valid_signature'
      })
    );

    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);
    assert(statuses.every((s) => s === 200), 'N1: All 5 concurrent webhooks return HTTP 200 without crashes');

    const paymentDb = await PaymentRepository.findById(pInit.id);
    assert(paymentDb?.status === 'CAPTURED', 'N2: Final state is consistently CAPTURED');

    const orderDb = await OrderRepository.findById(order.id);
    assert(orderDb?.paymentStatus === 'PAID', 'N3: Order paymentStatus is consistently PAID');
  }

  // =========================================================================
  // CATEGORY O: Audit Logging Verification
  // =========================================================================
  console.log('--- Category O: Audit Logging Verification ---');
  {
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: { module: 'PAYMENTS' }
    });

    assert(auditLogs.length > 0, 'O1: Security audit logs recorded for payment actions');
    const actions = auditLogs.map((l: any) => l.action);
    assert(actions.includes('PAYMENT_CAPTURED') || actions.includes('PAYMENT_WEBHOOK_CAPTURED'), 'O2: PAYMENT_CAPTURED action logged in audit trail');
    assert(actions.includes('PAYMENT_RECONCILED'), 'O3: PAYMENT_RECONCILED action logged in audit trail');
    assert(actions.includes('PAYMENT_REFUNDED'), 'O4: PAYMENT_REFUNDED action logged in audit trail');
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n=========================================');
  console.log(`Module 21 Test Suite Complete:`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('=========================================\n');

  server.close();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  if (server) server.close();
  process.exit(1);
});
