/**
 * Module 20: Orders — Comprehensive Test Suite
 * Lagoree Arts Backend
 */

import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { hashPassword } from '../security/password.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { CartGuestService } from '../modules/cart/cart-guest.service.ts';
import { OrderService } from '../modules/orders/order.service.ts';
import { OrderRepository } from '../modules/orders/order.repository.ts';
import { OrderNumberService } from '../modules/orders/order-number.service.ts';
import http from 'node:http';

const TEST_PORT = 5020;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let orderManagerToken: string;
let catalogueManagerToken: string;

let customer1: any;
let customer2: any;
let customer1Token: string;
let customer2Token: string;

let simpleProduct: any;
let antiqueProduct: any;

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
          let parsed: any = {};
          try {
            parsed = resData ? JSON.parse(resData) : {};
          } catch (e) {
            parsed = { raw: resData };
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

function clearCustomerCart(customerId: string) {
  const cart = prisma.cart.findFirst({ where: { customerId } });
  if (cart) {
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

function clearGuestCart(guestTokenHash: string) {
  const cart = prisma.cart.findFirst({ where: { guestTokenHash } });
  if (cart) {
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

async function runTests() {
  console.log('======================================================');
  console.log(' MODULE 20: ORDER MANAGEMENT TEST SUITE');
  console.log('======================================================\n');

  try {
    // 1. Seed Database
    await runSeed();

    // 2. Start Application Server
    const app = createApp();
    await new Promise<void>(resolve => {
      server = app.listen(TEST_PORT, () => {
        resolve();
      });
    });

    // 3. Setup Roles, Users and Customers
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
        passwordHash: await hashPassword('AdminSecurePass123!'),
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
        'cart.view', 'checkout.view', 'customer.view'
      ]
    });

    const catMgrUser = prisma.adminUser.create({
      data: {
        email: `catmgr.${Date.now()}@lagoreearts.com`,
        passwordHash: await hashPassword('AdminSecurePass123!'),
        name: 'Catalogue Specialist',
        roleId: catalogueManagerRole.id,
        status: 'ACTIVE'
      }
    });
    catalogueManagerToken = generateAccessToken({
      sub: catMgrUser.id,
      email: catMgrUser.email,
      role: 'CATALOGUE_MANAGER',
      permissions: ['category.view', 'product.view', 'variant.view']
    });

    // Customers
    customer1 = prisma.customer.create({
      data: {
        email: `patron1.${Date.now()}@example.com`,
        normalizedEmail: `patron1.${Date.now()}@example.com`.toLowerCase(),
        passwordHash: await hashPassword('PatronPass123!'),
        firstName: 'Aarav',
        lastName: 'Shah',
        phone: '9876543210',
        status: 'ACTIVE'
      }
    });
    customer1Token = generateCustomerAccessToken({
      sub: customer1.id,
      email: customer1.email
    });

    // Setup Customer 1 Saved Addresses
    prisma.customerAddress.create({
      data: {
        customerId: customer1.id,
        type: 'HOME',
        firstName: 'Aarav',
        lastName: 'Shah',
        companyName: 'Shah Heritage Ltd',
        addressLine1: '42 Juhu Tara Road',
        addressLine2: 'Sea Breeze Apt 4B',
        landmark: 'Near Sea Princess',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400049',
        country: 'INDIA',
        phone: '9876543210',
        isDefaultShipping: true,
        isDefaultBilling: true
      }
    });

    customer2 = prisma.customer.create({
      data: {
        email: `patron2.${Date.now()}@example.com`,
        normalizedEmail: `patron2.${Date.now()}@example.com`.toLowerCase(),
        passwordHash: await hashPassword('PatronPass123!'),
        firstName: 'Meera',
        lastName: 'Kapoor',
        phone: '9876543211',
        status: 'ACTIVE'
      }
    });
    customer2Token = generateCustomerAccessToken({
      sub: customer2.id,
      email: customer2.email
    });

    // Dedicated Products for Order Suite
    let orderCategory = prisma.category.findUnique({ where: { slug: 'fine-art-orders' } });
    if (!orderCategory) {
      orderCategory = prisma.category.create({
        data: {
          name: 'Fine Art Orders',
          slug: 'fine-art-orders',
          status: 'ACTIVE'
        }
      });
    }

    simpleProduct = prisma.product.findUnique({ where: { slug: 'tanjore-royal-court-gold' } });
    if (!simpleProduct) {
      simpleProduct = prisma.product.create({
        data: {
          name: 'Tanjore Royal Court Gold Foil Painting',
          slug: 'tanjore-royal-court-gold',
          sku: 'ART-TNJ-ORD',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 25000,
          currency: 'INR',
          stockQuantity: 50,
          trackInventory: true,
          allowBackorder: false,
          categoryId: orderCategory.id
        }
      });
    } else {
      prisma.product.update({
        where: { id: simpleProduct.id },
        data: { price: 25000, name: 'Tanjore Royal Court Gold Foil Painting', stockQuantity: 50 }
      });
    }

    antiqueProduct = prisma.product.findUnique({ where: { slug: 'chola-bronze-nataraja-ord' } });
    if (!antiqueProduct) {
      antiqueProduct = prisma.product.create({
        data: {
          name: '11th Century Chola Bronze Nataraja',
          slug: 'chola-bronze-nataraja-ord',
          sku: 'ANT-CHO-ORD',
          status: 'ACTIVE',
          productType: 'ANTIQUE',
          price: 150000,
          currency: 'INR',
          stockQuantity: 1,
          trackInventory: true,
          allowBackorder: false,
          categoryId: orderCategory.id
        }
      });
    }

    // Helper: Create completed customer checkout
    const createCompletedCustomerCheckout = async (token: string, customerId?: string, items = [{ productId: simpleProduct.id, quantity: 2 }]) => {
      if (customerId) {
        clearCustomerCart(customerId);
      }
      for (const item of items) {
        const cartRes = await request('POST', '/api/v1/cart/items', item, token);
        if (cartRes.status !== 200 && cartRes.status !== 201) {
          console.error('Cart item add failed:', cartRes.status, cartRes.body);
        }
      }
      const chkRes = await request('POST', '/api/v1/checkout', {}, token);
      if (chkRes.status !== 200 && chkRes.status !== 201) {
        console.error('Checkout creation failed:', chkRes.status, chkRes.body);
      }

      const chkId = chkRes.body.data?.id;
      const compRes = await request('POST', `/api/v1/checkout/${chkId}/complete`, {}, token);
      if (compRes.status !== 200 && compRes.status !== 201) {
        console.error('Checkout complete failed:', compRes.status, compRes.body);
      }
      return chkId;
    };

    // Helper: Create completed guest checkout
    const createCompletedGuestCheckout = async (guestToken: string) => {
      const guestTokenHash = CartGuestService.hashGuestToken(guestToken);
      clearGuestCart(guestTokenHash);

      const cartRes = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, undefined, { 'x-guest-cart-token': guestToken });
      if (cartRes.status !== 200 && cartRes.status !== 201) {
        console.error('Guest cart item add failed:', cartRes.status, cartRes.body);
      }

      const chkRes = await request('POST', '/api/v1/checkout', {
        email: 'guest.patron@example.com',
        shippingAddress: {
          firstName: 'Rohan',
          lastName: 'Verma',
          addressLine1: '15 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9123456780'
        }
      }, undefined, { 'x-guest-cart-token': guestToken });

      if (chkRes.status !== 200 && chkRes.status !== 201) {
        console.error('Guest checkout create failed:', chkRes.status, chkRes.body);
      }

      const chkId = chkRes.body.data?.id;
      const compRes = await request('POST', `/api/v1/checkout/${chkId}/complete`, {}, undefined, { 'x-guest-cart-token': guestToken });
      if (compRes.status !== 200 && compRes.status !== 201) {
        console.error('Guest checkout complete failed:', compRes.status, compRes.body);
      }
      return chkId;
    };

    // ========================================================
    // CATEGORY A: ORDER CREATION FROM COMPLETED CHECKOUT
    // ========================================================
    console.log('\n--- CATEGORY A: ORDER CREATION FROM COMPLETED CHECKOUT ---');

    const chk1Id = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    let res = await request('POST', '/api/v1/orders/create', { checkoutId: chk1Id, notes: 'Deliver after 5 PM' }, customer1Token);

    assert(res.status === 201, 'A1. Order created from completed customer checkout returns 201 Created');
    assert(res.body.data && res.body.data.orderNumber.startsWith('LA-'), 'A1. Order assigned unique human-readable orderNumber');
    assert(res.body.data && res.body.data.status === 'PENDING', 'A2. Initial order status is PENDING');
    assert(res.body.data && res.body.data.paymentStatus === 'PENDING', 'A2. Initial payment status is PENDING');
    assert(Boolean(res.body.data && res.body.data.placedAt), 'A2. Order placedAt timestamp recorded');
    assert(res.body.data && res.body.data.subtotal === 50000, 'A6. Order subtotal matches checkout total (₹50,000)');
    assert(res.body.data && res.body.data.grandTotal === 50000, 'A6. Order grandTotal matches checkout grandTotal (₹50,000)');
    assert(res.body.data && res.body.data.items && res.body.data.items.length === 1, 'A4. Frozen item snapshot copied into OrderItem');
    assert(res.body.data && res.body.data.items[0].quantity === 2, 'A4. Item quantity preserved');
    assert(res.body.data && res.body.data.items[0].unitPrice === 25000, 'A4. Item unit price frozen');
    assert(res.body.data && res.body.data.items[0].lineTotal === 50000, 'A4. Item line total frozen');
    assert(res.body.data && res.body.data.addresses && res.body.data.addresses.length === 2, 'A5. Shipping and billing address snapshots copied');
    const shippingSnap = res.body.data?.addresses?.find((a: any) => a.type === 'SHIPPING');
    assert(shippingSnap && shippingSnap.postalCode === '400049', 'A5. Shipping address snapshot postal code matches 400049');

    // A3. Guest Order Creation
    const guestTokenA = CartGuestService.generateGuestToken();
    const chkGuestId = await createCompletedGuestCheckout(guestTokenA);
    res = await request('POST', '/api/v1/orders/create', { checkoutId: chkGuestId }, undefined, { 'x-guest-cart-token': guestTokenA });

    assert(res.status === 201, 'A3. Guest order created from completed guest checkout returns 201 Created');
    assert(res.body.data && res.body.data.customerId === null, 'A3. Guest order has customerId = null');
    assert(res.body.data && res.body.data.email === 'guest.patron@example.com', 'A3. Guest email stored on order');
    assert(res.body.data && res.body.data.grandTotal === 25000, 'A3. Guest order grandTotal is ₹25,000');

    // ========================================================
    // CATEGORY B: IMMUTABLE SNAPSHOTS & CATALOG MUTATION IMMUNITY
    // ========================================================
    console.log('\n--- CATEGORY B: IMMUTABLE SNAPSHOTS & CATALOG MUTATION IMMUNITY ---');

    const originalOrder = await OrderRepository.findByCheckoutSessionId(chk1Id);

    // Mutate catalog product price and name
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { price: 99000, name: 'Mutated Modern Painting Title' }
    });

    // Mutate customer address book
    prisma.customerAddress.updateMany({
      where: { customerId: customer1.id },
      data: { addressLine1: '999 Completely Changed Street' }
    });

    const refetchedOrder = await OrderRepository.findById(originalOrder!.id);

    assert(refetchedOrder!.subtotal === 50000, 'B1. Order subtotal unchanged after catalog price increase');
    assert(refetchedOrder!.grandTotal === 50000, 'B1. Order grandTotal unchanged after catalog price increase');
    assert(refetchedOrder!.items![0].productName === 'Tanjore Royal Court Gold Foil Painting', 'B2. Item snapshot product name immutable to catalog rename');
    assert(refetchedOrder!.items![0].unitPrice === 25000, 'B1. Item snapshot unit price immutable');
    const refetchedShipping = refetchedOrder!.addresses!.find(a => a.type === 'SHIPPING');
    assert(refetchedShipping!.addressLine1 === '42 Juhu Tara Road', 'B4. Order address snapshot immutable to customer address book mutations');

    // Restore product catalog price
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { price: 25000, name: 'Tanjore Royal Court Gold Foil Painting' }
    });

    // ========================================================
    // CATEGORY C: CHECKOUT GATING & STATE PRECONDITIONS
    // ========================================================
    console.log('\n--- CATEGORY C: CHECKOUT GATING & STATE PRECONDITIONS ---');

    // Active checkout
    clearCustomerCart(customer1.id);
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const activeChk = await request('POST', '/api/v1/checkout', {}, customer1Token);
    res = await request('POST', '/api/v1/orders/create', { checkoutId: activeChk.body.data.id }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'CHECKOUT_NOT_COMPLETED', 'C1. Active checkout rejected with 400 CHECKOUT_NOT_COMPLETED');

    // Expired checkout
    prisma.checkoutSession.update({
      where: { id: activeChk.body.data.id },
      data: { status: 'EXPIRED' }
    });
    res = await request('POST', '/api/v1/orders/create', { checkoutId: activeChk.body.data.id }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'CHECKOUT_NOT_COMPLETED', 'C2. Expired checkout rejected with 400 CHECKOUT_NOT_COMPLETED');

    // Cancelled checkout
    prisma.checkoutSession.update({
      where: { id: activeChk.body.data.id },
      data: { status: 'CANCELLED' }
    });
    res = await request('POST', '/api/v1/orders/create', { checkoutId: activeChk.body.data.id }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'CHECKOUT_NOT_COMPLETED', 'C3. Cancelled checkout rejected with 400 CHECKOUT_NOT_COMPLETED');

    // Non-existent checkout
    res = await request('POST', '/api/v1/orders/create', { checkoutId: '00000000-0000-0000-0000-000000000000' }, customer1Token);
    assert(res.status === 404 && res.body.error.code === 'CHECKOUT_NOT_FOUND', 'C4. Non-existent checkout ID rejected with 404 CHECKOUT_NOT_FOUND');

    // Malformed checkout ID
    res = await request('POST', '/api/v1/orders/create', { checkoutId: 'not-a-uuid' }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'INVALID_CHECKOUT_ID', 'C5. Malformed checkout ID rejected with 400 INVALID_CHECKOUT_ID');

    // ========================================================
    // CATEGORY D: IDEMPOTENCY & DUPLICATE ORDER PREVENTION
    // ========================================================
    console.log('\n--- CATEGORY D: IDEMPOTENCY & DUPLICATE ORDER PREVENTION ---');

    // Submitting the same completed checkout again returns the existing order
    res = await request('POST', '/api/v1/orders/create', { checkoutId: chk1Id }, customer1Token);
    assert(res.status === 201 || res.status === 200, 'D1. Duplicate order creation for same checkout returns successful response');
    assert(res.body.data.id === originalOrder!.id, 'D1. Duplicate creation returns identical existing order ID');
    assert(res.body.data.orderNumber === originalOrder!.orderNumber, 'D1. Duplicate creation returns identical orderNumber');

    // ========================================================
    // CATEGORY E: HUMAN-READABLE ORDER NUMBERING
    // ========================================================
    console.log('\n--- CATEGORY E: HUMAN-READABLE ORDER NUMBERING ---');

    const currentYear = new Date().getFullYear();
    const orderNumRegex = new RegExp(`^LA-${currentYear}-\\d{6}$`);
    assert(orderNumRegex.test(originalOrder!.orderNumber), `E1. Order number format verified (${originalOrder!.orderNumber})`);

    const num1 = await OrderNumberService.generateOrderNumber(currentYear);
    const num2 = await OrderNumberService.generateOrderNumber(currentYear);
    const seq1 = parseInt(num1.split('-')[2], 10);
    const seq2 = parseInt(num2.split('-')[2], 10);
    assert(seq2 === seq1 + 1, 'E2. Sequential order numbers are strictly unique and monotonically incrementing');

    // ========================================================
    // CATEGORY F: ORDER STATUS LIFECYCLE & STATE MACHINE
    // ========================================================
    console.log('\n--- CATEGORY F: ORDER STATUS LIFECYCLE & STATE MACHINE ---');

    const chkFId = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    const orderF = await request('POST', '/api/v1/orders/create', { checkoutId: chkFId }, customer1Token);
    const orderFId = orderF.body.data.id;

    // F1. PENDING -> CONFIRMED
    res = await request('PATCH', `/api/v1/admin/orders/${orderFId}/status`, { status: 'CONFIRMED' }, superAdminToken);
    assert(res.status === 200 && res.body.data.status === 'CONFIRMED', 'F1. PENDING -> CONFIRMED transition succeeds');
    assert(Boolean(res.body.data.confirmedAt), 'F1. confirmedAt timestamp set on CONFIRMED');

    // F2. CONFIRMED -> PROCESSING
    res = await request('PATCH', `/api/v1/admin/orders/${orderFId}/status`, { status: 'PROCESSING' }, superAdminToken);
    assert(res.status === 200 && res.body.data.status === 'PROCESSING', 'F2. CONFIRMED -> PROCESSING transition succeeds');

    // F3. PROCESSING -> SHIPPED
    res = await request('PATCH', `/api/v1/admin/orders/${orderFId}/status`, { status: 'SHIPPED' }, superAdminToken);
    assert(res.status === 200 && res.body.data.status === 'SHIPPED', 'F3. PROCESSING -> SHIPPED transition succeeds');
    assert(Boolean(res.body.data.shippedAt), 'F3. shippedAt timestamp set on SHIPPED');

    // F4. SHIPPED -> DELIVERED
    res = await request('PATCH', `/api/v1/admin/orders/${orderFId}/status`, { status: 'DELIVERED' }, superAdminToken);
    assert(res.status === 200 && res.body.data.status === 'DELIVERED', 'F4. SHIPPED -> DELIVERED transition succeeds');
    assert(Boolean(res.body.data.deliveredAt), 'F4. deliveredAt timestamp set on DELIVERED');

    // F5. Invalid transition from terminal DELIVERED -> PENDING
    res = await request('PATCH', `/api/v1/admin/orders/${orderFId}/status`, { status: 'PENDING' }, superAdminToken);
    assert(res.status === 409 && res.body.error.code === 'INVALID_ORDER_STATUS_TRANSITION', 'F5. DELIVERED -> PENDING rejected with 409 INVALID_ORDER_STATUS_TRANSITION');

    // F6. Invalid jump transition: PENDING -> DELIVERED
    const chkJmp = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    const orderJmp = await request('POST', '/api/v1/orders/create', { checkoutId: chkJmp }, customer1Token);
    res = await request('PATCH', `/api/v1/admin/orders/${orderJmp.body.data.id}/status`, { status: 'DELIVERED' }, superAdminToken);
    assert(res.status === 409 && res.body.error.code === 'INVALID_ORDER_STATUS_TRANSITION', 'F6. PENDING -> DELIVERED jump rejected with 409');

    // F7. Admin cancel from PENDING
    res = await request('POST', `/api/v1/admin/orders/${orderJmp.body.data.id}/cancel`, { reason: 'Customer requested cancellation' }, superAdminToken);
    assert(res.status === 200 && res.body.data.status === 'CANCELLED', 'F7. POST /api/v1/admin/orders/:id/cancel cancels order');
    assert(res.body.data.cancellationReason === 'Customer requested cancellation', 'F7. cancellationReason saved');
    assert(Boolean(res.body.data.cancelledAt), 'F7. cancelledAt timestamp saved');

    // F8. Cannot cancel terminal CANCELLED order
    res = await request('POST', `/api/v1/admin/orders/${orderJmp.body.data.id}/cancel`, { reason: 'Double cancel' }, superAdminToken);
    assert(res.status === 409 && res.body.error.code === 'INVALID_ORDER_STATUS_TRANSITION', 'F8. Cancelling already CANCELLED order rejected with 409');

    // ========================================================
    // CATEGORY G: PAYMENT STATUS LIFECYCLE & BOUNDARY
    // ========================================================
    console.log('\n--- CATEGORY G: PAYMENT STATUS LIFECYCLE & BOUNDARY ---');

    const chkPay = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    const orderPay = await request('POST', '/api/v1/orders/create', { checkoutId: chkPay }, customer1Token);
    const orderPayId = orderPay.body.data.id;

    assert(orderPay.body.data.paymentStatus === 'PENDING', 'G1. Default payment status is PENDING');

    // G2. PENDING -> PAID
    res = await request('PATCH', `/api/v1/admin/orders/${orderPayId}/payment-status`, { paymentStatus: 'PAID' }, superAdminToken);
    assert(res.status === 200 && res.body.data.paymentStatus === 'PAID', 'G2. PENDING -> PAID payment transition succeeds');

    // G3. PAID -> REFUNDED
    res = await request('PATCH', `/api/v1/admin/orders/${orderPayId}/payment-status`, { paymentStatus: 'REFUNDED' }, superAdminToken);
    assert(res.status === 200 && res.body.data.paymentStatus === 'REFUNDED', 'G3. PAID -> REFUNDED payment transition succeeds');

    // G4. Illegal payment transition: REFUNDED -> PAID
    res = await request('PATCH', `/api/v1/admin/orders/${orderPayId}/payment-status`, { paymentStatus: 'PAID' }, superAdminToken);
    assert(res.status === 409 && res.body.error.code === 'INVALID_PAYMENT_STATUS_TRANSITION', 'G4. Terminal REFUNDED -> PAID rejected with 409 INVALID_PAYMENT_STATUS_TRANSITION');

    // ========================================================
    // CATEGORY H: CUSTOMER ORDER HISTORY & IDOR SECURITY
    // ========================================================
    console.log('\n--- CATEGORY H: CUSTOMER ORDER HISTORY & IDOR SECURITY ---');

    // H1. Customer 1 lists their orders
    res = await request('GET', '/api/v1/customer/orders', undefined, customer1Token);
    assert(res.status === 200 && Array.isArray(res.body.data), 'H1. Customer 1 can list their orders');
    assert(res.body.pagination && res.body.pagination.total >= 1, 'H1. Paginated response includes total and page count');

    // H2. Filter customer orders by status
    res = await request('GET', '/api/v1/customer/orders?status=PENDING', undefined, customer1Token);
    assert(res.status === 200 && res.body.data.every((o: any) => o.status === 'PENDING'), 'H2. Customer orders filtered accurately by status');

    // H3. Customer 1 views own order detail
    res = await request('GET', `/api/v1/customer/orders/${originalOrder!.id}`, undefined, customer1Token);
    assert(res.status === 200 && res.body.data.id === originalOrder!.id, 'H3. Customer 1 can view details of their own order');
    assert(res.body.data.notes === undefined, 'H8. Customer view safely strips internal admin operational notes');

    // H4. IDOR Protection: Customer 2 cannot access Customer 1 order
    res = await request('GET', `/api/v1/customer/orders/${originalOrder!.id}`, undefined, customer2Token);
    assert(res.status === 404 && res.body.error.code === 'ORDER_NOT_FOUND', 'H4. Customer 2 viewing Customer 1 order returns 404 ORDER_NOT_FOUND (IDOR safe)');

    // H5. Customer self-cancellation for PENDING order
    const chkCustCancel = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    const orderCustCancel = await request('POST', '/api/v1/orders/create', { checkoutId: chkCustCancel }, customer1Token);
    res = await request('POST', `/api/v1/customer/orders/${orderCustCancel.body.data.id}/cancel`, { reason: 'Changed mind' }, customer1Token);
    assert(res.status === 200 && res.body.data.status === 'CANCELLED', 'H5. Customer can cancel their own PENDING order');

    // H6. Customer cannot cancel CONFIRMED order
    const chkCustConf = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    const orderCustConf = await request('POST', '/api/v1/orders/create', { checkoutId: chkCustConf }, customer1Token);
    await request('PATCH', `/api/v1/admin/orders/${orderCustConf.body.data.id}/status`, { status: 'CONFIRMED' }, superAdminToken);
    res = await request('POST', `/api/v1/customer/orders/${orderCustConf.body.data.id}/cancel`, { reason: 'Too late' }, customer1Token);
    assert(res.status === 409 && res.body.error.code === 'ORDER_CANNOT_BE_CANCELLED', 'H6. Customer cannot cancel CONFIRMED order (409 ORDER_CANNOT_BE_CANCELLED)');

    // H7. Customer 2 cannot cancel Customer 1 order
    res = await request('POST', `/api/v1/customer/orders/${orderCustCancel.body.data.id}/cancel`, {}, customer2Token);
    assert(res.status === 404 && res.body.error.code === 'ORDER_NOT_FOUND', 'H7. Customer 2 cannot cancel Customer 1 order (404 IDOR protected)');

    // ========================================================
    // CATEGORY I: SECURE GUEST ORDER LOOKUP
    // ========================================================
    console.log('\n--- CATEGORY I: SECURE GUEST ORDER LOOKUP ---');

    const guestOrder = await OrderRepository.findByCheckoutSessionId(chkGuestId);

    // I1. Lookup with orderNumber + email
    res = await request('POST', '/api/v1/orders/guest-lookup', {
      orderNumber: guestOrder!.orderNumber,
      email: 'guest.patron@example.com'
    });
    assert(res.status === 200 && res.body.data.orderNumber === guestOrder!.orderNumber, 'I1. Guest lookup with matching email succeeds');

    // I2. Lookup with orderNumber + guestToken
    res = await request('POST', '/api/v1/orders/guest-lookup', {
      orderNumber: guestOrder!.orderNumber,
      guestToken: guestTokenA
    });
    assert(res.status === 200 && res.body.data.orderNumber === guestOrder!.orderNumber, 'I2. Guest lookup with matching guest token succeeds');

    // I3. Lookup with mismatched email returns 404
    res = await request('POST', '/api/v1/orders/guest-lookup', {
      orderNumber: guestOrder!.orderNumber,
      email: 'wrong.email@example.com'
    });
    assert(res.status === 404 && res.body.error.code === 'ORDER_NOT_FOUND', 'I3. Guest lookup with mismatched email returns 404');

    // I4. Guest lookup on customer order returns 404 (prevents customer enumeration)
    res = await request('POST', '/api/v1/orders/guest-lookup', {
      orderNumber: originalOrder!.orderNumber,
      email: 'guest@example.com'
    });
    assert(res.status === 404 && res.body.error.code === 'ORDER_NOT_FOUND', 'I4. Guest lookup cannot access customer order (404)');

    // I5. Missing order number returns 400
    res = await request('POST', '/api/v1/orders/guest-lookup', { email: 'guest@example.com' });
    assert(res.status === 400 && res.body.error.code === 'ORDER_NUMBER_REQUIRED', 'I5. Missing orderNumber rejected with 400 ORDER_NUMBER_REQUIRED');

    // ========================================================
    // CATEGORY J: ADMIN ORDER MANAGEMENT & INSPECTION
    // ========================================================
    console.log('\n--- CATEGORY J: ADMIN ORDER MANAGEMENT & INSPECTION ---');

    // J1. Admin list orders
    res = await request('GET', '/api/v1/admin/orders', undefined, superAdminToken);
    assert(res.status === 200 && Array.isArray(res.body.data), 'J1. Super Admin can list all orders');
    assert(res.body.pagination && res.body.pagination.total >= 1, 'J1. Admin list includes pagination metadata');

    // J2. Admin search by order number
    res = await request('GET', `/api/v1/admin/orders?orderNumber=${originalOrder!.orderNumber}`, undefined, superAdminToken);
    assert(res.status === 200 && res.body.data.length === 1 && res.body.data[0].id === originalOrder!.id, 'J2. Admin order search by orderNumber returns exact match');

    // J3. Admin search by customer email
    res = await request('GET', `/api/v1/admin/orders?email=${customer1.email}`, undefined, superAdminToken);
    assert(res.status === 200 && res.body.data.every((o: any) => o.email === customer1.email), 'J3. Admin order search by email returns filtered list');

    // J4. Admin inspect single order
    res = await request('GET', `/api/v1/admin/orders/${originalOrder!.id}`, undefined, superAdminToken);
    assert(res.status === 200 && res.body.data.id === originalOrder!.id, 'J4. Admin can inspect single order by ID');
    assert(res.body.data.checkoutSessionId === chk1Id, 'J4. Admin view exposes checkoutSessionId');
    assert(res.body.data.customer && res.body.data.customer.email === customer1.email, 'J4. Admin view exposes associated customer details');

    // ========================================================
    // CATEGORY K: RBAC & PERMISSIONS
    // ========================================================
    console.log('\n--- CATEGORY K: RBAC & PERMISSIONS ---');

    // K1. Super Admin has full order access
    res = await request('GET', '/api/v1/admin/orders', undefined, superAdminToken);
    assert(res.status === 200, 'K1. Super Admin can access admin orders list');

    // K2. Order Manager has full order access
    res = await request('GET', '/api/v1/admin/orders', undefined, orderManagerToken);
    assert(res.status === 200, 'K2. Order Manager can access admin orders list');

    // K3. Catalogue Manager without order permissions rejected with 403
    res = await request('GET', '/api/v1/admin/orders', undefined, catalogueManagerToken);
    assert(res.status === 403, 'K3. Catalogue Manager without order.view rejected with 403 Forbidden');

    // K4. Unauthenticated request to admin endpoints rejected with 401
    res = await request('GET', '/api/v1/admin/orders');
    assert(res.status === 401, 'K4. Unauthenticated request to admin orders rejected with 401');

    // K5. Customer token rejected on admin endpoints with 401
    res = await request('GET', '/api/v1/admin/orders', undefined, customer1Token);
    assert(res.status === 401, 'K5. Customer token rejected on admin orders endpoint with 401');

    // ========================================================
    // CATEGORY L: SECURITY & TAMPERING RESISTANCE
    // ========================================================
    console.log('\n--- CATEGORY L: SECURITY & TAMPERING RESISTANCE ---');

    // L1. Malformed UUIDs
    res = await request('GET', '/api/v1/admin/orders/not-a-valid-uuid', undefined, superAdminToken);
    assert(res.status === 400 && res.body.error.code === 'INVALID_ORDER_ID', 'L1. Malformed order UUID rejected with 400 INVALID_ORDER_ID');

    // L2. Client price/subtotal tampering during order creation is ignored
    const chkTamper = await createCompletedCustomerCheckout(customer1Token, customer1.id);
    res = await request('POST', '/api/v1/orders/create', {
      checkoutId: chkTamper,
      subtotal: 10,
      grandTotal: 10,
      orderNumber: 'LA-FAKE-000000',
      status: 'DELIVERED',
      paymentStatus: 'PAID'
    }, customer1Token);
    assert(res.status === 201, 'L2. Order creation succeeds while ignoring client-forged financial fields');
    assert(res.body.data.grandTotal === 50000, 'L2. Grand total taken from checkout snapshot (₹50,000), not forged ₹10');
    assert(res.body.data.status === 'PENDING', 'L2. Status set by server (PENDING), forged DELIVERED ignored');
    assert(res.body.data.paymentStatus === 'PENDING', 'L2. Payment status set by server (PENDING), forged PAID ignored');
    assert(res.body.data.orderNumber !== 'LA-FAKE-000000', 'L2. Order number generated server-side, forged number ignored');

    // L3. SQL injection resistance in search queries
    res = await request('GET', `/api/v1/admin/orders?orderNumber=${encodeURIComponent("' OR '1'='1")}`, undefined, superAdminToken);
    assert(res.status === 200 && res.body.data.length === 0, 'L3. SQL injection query safely handled with 0 matches');

    // ========================================================
    // CATEGORY M: CUSTOMER ACCOUNT DELETION SAFETY
    // ========================================================
    console.log('\n--- CATEGORY M: CUSTOMER ACCOUNT DELETION SAFETY ---');

    // Create a temporary customer and an order
    const tempCust = prisma.customer.create({
      data: {
        email: `temp.cust.${Date.now()}@example.com`,
        normalizedEmail: `temp.cust.${Date.now()}@example.com`.toLowerCase(),
        passwordHash: await hashPassword('TempPass123!'),
        firstName: 'Temp',
        lastName: 'Customer',
        phone: '9000000000',
        status: 'ACTIVE'
      }
    });
    prisma.customerAddress.create({
      data: {
        customerId: tempCust.id,
        type: 'HOME',
        firstName: 'Temp',
        lastName: 'Customer',
        addressLine1: '99 Temporary Rd',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'INDIA',
        phone: '9000000000',
        isDefaultShipping: true,
        isDefaultBilling: true
      }
    });
    const tempCustToken = generateCustomerAccessToken({
      sub: tempCust.id,
      email: tempCust.email
    });

    const chkTemp = await createCompletedCustomerCheckout(tempCustToken, tempCust.id);
    const orderTemp = await request('POST', '/api/v1/orders/create', { checkoutId: chkTemp }, tempCustToken);
    const orderTempId = orderTemp.body.data.id;

    // Delete temporary customer
    prisma.customerAddress.deleteMany({ where: { customerId: tempCust.id } });
    prisma.customer.delete({ where: { id: tempCust.id } });

    // Verify historical order still exists with customerId = null
    const survivingOrder = await OrderRepository.findById(orderTempId);
    assert(Boolean(survivingOrder), 'M1. Historical order survives customer account deletion');
    assert(survivingOrder!.customerId === null, 'M1. Surviving order customerId set to null');
    assert(survivingOrder!.items && survivingOrder!.items.length > 0, 'M1. Surviving order items remain fully intact');

    // ========================================================
    // CATEGORY N: AUDIT LOGGING VERIFICATION
    // ========================================================
    console.log('\n--- CATEGORY N: AUDIT LOGGING VERIFICATION ---');

    const orderLogs = prisma.adminAuditLog.findMany({
      where: { module: 'ORDERS' }
    });
    assert(orderLogs.length > 0, 'N1. Audit logs recorded for ORDERS module');
    const auditActions = orderLogs.map((l: any) => l.action);
    assert(auditActions.includes('ORDER_CREATED'), 'N2. ORDER_CREATED action recorded in audit log');
    assert(auditActions.includes('ORDER_STATUS_CHANGED'), 'N3. ORDER_STATUS_CHANGED action recorded in audit log');
    assert(auditActions.includes('ORDER_PAYMENT_STATUS_CHANGED'), 'N4. ORDER_PAYMENT_STATUS_CHANGED action recorded in audit log');
    assert(auditActions.includes('ORDER_CANCELLED'), 'N5. ORDER_CANCELLED action recorded in audit log');

    // ========================================================
    // FINAL TEST SUMMARY
    // ========================================================
    console.log('\n======================================================');
    console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('======================================================\n');

    if (server) {
      server.close();
    }

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with unhandled error:', err);
    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

runTests();
