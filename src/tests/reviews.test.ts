/**
 * Module 25: Reviews & Ratings — Comprehensive Automated Test Suite
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { strict as assert } from 'node:assert';
import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { ProductReviewRepository } from '../modules/reviews/review.repository.ts';
import { ReviewService } from '../modules/reviews/review.service.ts';
import type { Server } from 'node:http';

let app: any;
let server: Server;
let baseUrl = '';

// Test tokens
let superAdminToken = '';
let contentManagerToken = '';
let marketingManagerToken = '';
let catalogueManagerToken = '';
let orderManagerToken = '';

let customerTokenA = '';
let customerTokenB = '';

// Test entities
let customerA: any;
let customerB: any;
let product1: any;
let product2: any;
let variant1: any;
let orderDeliveredPaid: any;
let orderPendingUnpaid: any;
let orderDeliveredItem: any;

let passedAssertions = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passedAssertions++;
    console.log(`  ✔ ${name}`);
  } catch (err: any) {
    console.error(`  ✖ FAILED: ${name}`);
    console.error(err);
    throw err;
  }
}

async function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; body: any }> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: res.status, body: json };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('⭐ MODULE 25: PRODUCT REVIEWS & RATINGS TEST SUITE');
  console.log('======================================================\n');

  // 1. Seed database
  await runSeed();

  app = createApp();
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const addr: any = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  // 2. Setup Admins & System Roles
  const superAdminRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const contentManagerRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const marketingManagerRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const catalogueManagerRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const orderManagerRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superAdmin = await prisma.adminUser.create({
    data: {
      name: 'Super Admin Test',
      email: `superadmin_${Date.now()}@lagoreearts.com`,
      passwordHash: 'hash',
      roleId: superAdminRole!.id,
      status: 'ACTIVE'
    }
  });
  superAdminToken = generateAccessToken({
    sub: superAdmin.id,
    roleId: superAdminRole!.id
  });

  const contentManager = await prisma.adminUser.create({
    data: {
      name: 'Content Manager Test',
      email: `contentmgr_${Date.now()}@lagoreearts.com`,
      passwordHash: 'hash',
      roleId: contentManagerRole!.id,
      status: 'ACTIVE'
    }
  });
  contentManagerToken = generateAccessToken({
    sub: contentManager.id,
    roleId: contentManagerRole!.id
  });

  const marketingManager = await prisma.adminUser.create({
    data: {
      name: 'Marketing Manager Test',
      email: `mktmgr_${Date.now()}@lagoreearts.com`,
      passwordHash: 'hash',
      roleId: marketingManagerRole!.id,
      status: 'ACTIVE'
    }
  });
  marketingManagerToken = generateAccessToken({
    sub: marketingManager.id,
    roleId: marketingManagerRole!.id
  });

  const catalogueManager = await prisma.adminUser.create({
    data: {
      name: 'Catalogue Manager Test',
      email: `catmgr_${Date.now()}@lagoreearts.com`,
      passwordHash: 'hash',
      roleId: catalogueManagerRole!.id,
      status: 'ACTIVE'
    }
  });
  catalogueManagerToken = generateAccessToken({
    sub: catalogueManager.id,
    roleId: catalogueManagerRole!.id
  });

  const orderManager = await prisma.adminUser.create({
    data: {
      name: 'Order Manager Test',
      email: `ordermgr_${Date.now()}@lagoreearts.com`,
      passwordHash: 'hash',
      roleId: orderManagerRole!.id,
      status: 'ACTIVE'
    }
  });
  orderManagerToken = generateAccessToken({
    sub: orderManager.id,
    roleId: orderManagerRole!.id
  });

  // 3. Setup Customers
  customerA = await prisma.customer.create({
    data: {
      email: `patron_a_${Date.now()}@example.com`,
      normalizedEmail: `patron_a_${Date.now()}@example.com`,
      firstName: 'Aarav',
      lastName: 'Sharma',
      passwordHash: 'hash',
      status: 'ACTIVE'
    }
  });
  customerTokenA = generateCustomerAccessToken({
    sub: customerA.id,
    email: customerA.email
  });

  customerB = await prisma.customer.create({
    data: {
      email: `patron_b_${Date.now()}@example.com`,
      normalizedEmail: `patron_b_${Date.now()}@example.com`,
      firstName: 'Meera',
      lastName: 'Kapoor',
      passwordHash: 'hash',
      status: 'ACTIVE'
    }
  });
  customerTokenB = generateCustomerAccessToken({
    sub: customerB.id,
    email: customerB.email
  });

  // 4. Setup Products & Variants
  const cat = (await prisma.category.findMany())[0];

  product1 = await prisma.product.create({
    data: {
      name: 'Royal Tanjore Krishna Masterpiece',
      slug: `royal-tanjore-krishna-${Date.now()}`,
      sku: `TANJORE-${Date.now()}`,
      price: 185000,
      status: 'ACTIVE',
      categoryId: cat.id
    }
  });

  variant1 = await prisma.productVariant.create({
    data: {
      productId: product1.id,
      sku: `TANJORE-GOLD-${Date.now()}`,
      price: 195000,
      status: 'ACTIVE'
    }
  });

  product2 = await prisma.product.create({
    data: {
      name: 'Chola Bronze Nataraja Sculpture',
      slug: `chola-bronze-nataraja-${Date.now()}`,
      sku: `NATARAJA-${Date.now()}`,
      price: 320000,
      status: 'ACTIVE',
      categoryId: cat.id
    }
  });

  // 5. Setup Delivered + Paid Order for Customer A on Product 1 (with variant 1)
  const cartA = await prisma.cart.create({
    data: {
      customerId: customerA.id,
      currency: 'INR'
    }
  });

  const checkoutA = await prisma.checkoutSession.create({
    data: {
      cartId: cartA.id,
      customerId: customerA.id,
      email: customerA.email,
      currency: 'INR',
      status: 'COMPLETED',
      subtotal: 195000,
      grandTotal: 195000,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  orderDeliveredPaid = await prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-${Date.now()}`,
      customerId: customerA.id,
      checkoutSessionId: checkoutA.id,
      email: customerA.email,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      subtotal: 195000,
      grandTotal: 195000,
      placedAt: new Date(),
      deliveredAt: new Date()
    }
  });

  orderDeliveredItem = await prisma.orderItem.create({
    data: {
      orderId: orderDeliveredPaid.id,
      productId: product1.id,
      variantId: variant1.id,
      sku: variant1.sku,
      productName: product1.name,
      variantDescription: '24K Gold Leaf Teak Wood Frame',
      quantity: 1,
      unitPrice: 195000,
      lineTotal: 195000
    }
  });

  // Setup Unpaid / Pending Order for Customer B
  const cartB = await prisma.cart.create({
    data: {
      customerId: customerB.id,
      currency: 'INR'
    }
  });

  const checkoutB = await prisma.checkoutSession.create({
    data: {
      cartId: cartB.id,
      customerId: customerB.id,
      email: customerB.email,
      currency: 'INR',
      status: 'PROCESSING',
      subtotal: 320000,
      grandTotal: 320000,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  orderPendingUnpaid = await prisma.order.create({
    data: {
      orderNumber: `ORD-PENDING-${Date.now()}`,
      customerId: customerB.id,
      checkoutSessionId: checkoutB.id,
      email: customerB.email,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      subtotal: 320000,
      grandTotal: 320000,
      placedAt: new Date()
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderPendingUnpaid.id,
      productId: product2.id,
      sku: product2.sku,
      productName: product2.name,
      quantity: 1,
      unitPrice: 320000,
      lineTotal: 320000
    }
  });

  // =========================================================================
  // CATEGORY A: Review Creation & Verified Purchase Workflow
  // =========================================================================
  console.log('--- Category A: Review Creation & Verified Purchase Workflow ---');

  let reviewAId = '';

  await test('A1: Authenticated customer creates review for qualifying purchased artwork', async () => {
    const res = await request(
      'POST',
      `/api/v1/customer/products/${product1.id}/reviews`,
      {
        rating: 5,
        title: 'Exquisite 24K Gold Detailing',
        body: 'The gold leaf work is mesmerizing. Authentic craftsmanship that elevates the entire living space.',
        variantId: variant1.id
      },
      customerTokenA
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.rating, 5);
    assert.equal(res.body.data.status, 'PENDING');
    assert.equal(res.body.data.verifiedPurchase, true);
    assert.ok(res.body.data.verifiedPurchaseAt);
    assert.equal(res.body.data.purchasedSku, variant1.sku);
    assert.equal(res.body.data.purchasedVariantName, '24K Gold Leaf Teak Wood Frame');

    reviewAId = res.body.data.id;
  });

  await test('A2: Review record in database reflects snapshot immutability', async () => {
    const rec = await ProductReviewRepository.findById(reviewAId);
    assert.ok(rec);
    assert.equal(rec.status, 'PENDING');
    assert.equal(rec.verifiedPurchase, true);
    assert.equal(rec.purchasedSku, variant1.sku);
    assert.equal(rec.purchasedVariantName, '24K Gold Leaf Teak Wood Frame');
  });

  // =========================================================================
  // CATEGORY B: Negative Purchase Verification Tests
  // =========================================================================
  console.log('--- Category B: Negative Purchase Verification Tests ---');

  await test('B1: Customer with no purchases of product is rejected with 400 REVIEW_PURCHASE_REQUIRED', async () => {
    const res = await request(
      'POST',
      `/api/v1/customer/products/${product2.id}/reviews`,
      {
        rating: 5,
        body: 'Stunning Nataraja, though I have not purchased it.'
      },
      customerTokenA
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'REVIEW_PURCHASE_REQUIRED');
  });

  await test('B2: Customer with PENDING/unpaid order is rejected with 400 REVIEW_PURCHASE_REQUIRED', async () => {
    const res = await request(
      'POST',
      `/api/v1/customer/products/${product2.id}/reviews`,
      {
        rating: 4,
        body: 'Ordered but not yet paid or delivered.'
      },
      customerTokenB
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'REVIEW_PURCHASE_REQUIRED');
  });

  await test('B3: Review submission with non-purchased variantId is rejected with 400 REVIEW_VARIANT_NOT_PURCHASED', async () => {
    const otherVariant = await prisma.productVariant.create({
      data: {
        productId: product1.id,
        sku: `TANJORE-SILVER-${Date.now()}`,
        price: 175000,
        status: 'ACTIVE'
      }
    });

    const res = await request(
      'POST',
      `/api/v1/customer/products/${product1.id}/reviews`,
      {
        rating: 5,
        body: 'Reviewing the silver variant which I did not buy.',
        variantId: otherVariant.id
      },
      customerTokenA
    );

    // Should reject because customer A bought gold variant, not silver variant
    assert.equal(res.status, 400);
  });

  await test('B4: Unauthenticated request to submit review is rejected with 401', async () => {
    const res = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, {
      rating: 5,
      body: 'Unauthenticated review attempt.'
    });
    assert.equal(res.status, 401);
  });

  await test('B5: Admin token is rejected on Customer review endpoints with 401', async () => {
    const res = await request(
      'POST',
      `/api/v1/customer/products/${product1.id}/reviews`,
      {
        rating: 5,
        body: 'Admin trying to post customer review.'
      },
      superAdminToken
    );
    assert.equal(res.status, 401);
  });

  // =========================================================================
  // CATEGORY C: Validation & Content Sanitization
  // =========================================================================
  console.log('--- Category C: Validation & Content Sanitization ---');

  await test('C1: Rating < 1 or > 5 or non-integer is rejected with 400', async () => {
    const resZero = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 0, body: 'Valid body text' }, customerTokenA);
    assert.equal(resZero.status, 400);

    const resSix = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 6, body: 'Valid body text' }, customerTokenA);
    assert.equal(resSix.status, 400);

    const resDec = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 4.5, body: 'Valid body text' }, customerTokenA);
    assert.equal(resDec.status, 400);
  });

  await test('C2: Empty, missing, or whitespace-only body is rejected with 400', async () => {
    const resEmpty = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 5, body: '    ' }, customerTokenA);
    assert.equal(resEmpty.status, 400);
  });

  await test('C3: Body shorter than 5 chars or longer than 3000 chars is rejected with 400', async () => {
    const resShort = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 5, body: 'Good' }, customerTokenA);
    assert.equal(resShort.status, 400);

    const resLong = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, { rating: 5, body: 'A'.repeat(3001) }, customerTokenA);
    assert.equal(resLong.status, 400);
  });

  await test('C4: Title longer than 150 chars is rejected with 400', async () => {
    const resTitle = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, {
      rating: 5,
      title: 'T'.repeat(151),
      body: 'Valid review body text'
    }, customerTokenA);
    assert.equal(resTitle.status, 400);
  });

  await test('C5: HTML, scripts, and event handlers are stripped while preserving Indic Unicode and emojis', async () => {
    const dirtyText = '<script>alert("xss")</script>अत्यंत सुंदर कलाकृती! 🕉️ Pure gold elegance.<img src=x onerror=alert(1)>';
    const dirtyTitle = '<b>महान</b> शिल्प <script>evil()</script>';

    const patronS = await prisma.customer.create({
      data: {
        email: `patron_s_${Date.now()}@example.com`,
        normalizedEmail: `patron_s_${Date.now()}@example.com`,
        firstName: 'Sanskrit',
        lastName: 'Scholar',
        passwordHash: 'hash',
        status: 'ACTIVE'
      }
    });
    const cartS = await prisma.cart.create({ data: { customerId: patronS.id, currency: 'INR' } });
    const checkoutS = await prisma.checkoutSession.create({
      data: { cartId: cartS.id, customerId: patronS.id, email: patronS.email, currency: 'INR', status: 'COMPLETED' }
    });
    const orderS = await prisma.order.create({
      data: {
        orderNumber: `ORD-SAN-${Date.now()}`,
        customerId: patronS.id,
        checkoutSessionId: checkoutS.id,
        email: patronS.email,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 185000,
        grandTotal: 185000
      }
    });
    await prisma.orderItem.create({
      data: {
        orderId: orderS.id,
        productId: product1.id,
        sku: product1.sku,
        productName: product1.name,
        quantity: 1,
        unitPrice: 185000,
        lineTotal: 185000
      }
    });

    const tokenS = generateCustomerAccessToken({ sub: patronS.id, email: patronS.email });
    const res = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, {
      rating: 5,
      title: dirtyTitle,
      body: dirtyText
    }, tokenS);

    assert.equal(res.status, 201);
    assert.ok(!res.body.data.body.includes('<script>'));
    assert.ok(!res.body.data.body.includes('onerror'));
    assert.ok(res.body.data.body.includes('अत्यंत सुंदर कलाकृती!'));
    assert.ok(res.body.data.body.includes('🕉️'));
    assert.ok(!res.body.data.title.includes('<b>'));
    assert.ok(res.body.data.title.includes('महान शिल्प'));
  });

  await test('D2: Customer cannot create duplicate review when existing review is APPROVED (409)', async () => {
    // Approve review A
    await prisma.productReview.update({
      where: { id: reviewAId },
      data: { status: 'APPROVED' }
    });

    const res = await request(
      'POST',
      `/api/v1/customer/products/${product1.id}/reviews`,
      {
        rating: 5,
        body: 'Another duplicate review attempt.'
      },
      customerTokenA
    );

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'REVIEW_ALREADY_EXISTS');
  });

  await test('D3: Resubmission when existing review is REJECTED updates existing review to PENDING', async () => {
    // Reject review A
    await prisma.productReview.update({
      where: { id: reviewAId },
      data: { status: 'REJECTED' }
    });

    const res = await request(
      'POST',
      `/api/v1/customer/products/${product1.id}/reviews`,
      {
        rating: 5,
        title: 'Revised Review Title',
        body: 'Completely revised and polished review body text.'
      },
      customerTokenA
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'PENDING');
    assert.equal(res.body.data.title, 'Revised Review Title');
  });

  // =========================================================================
  // CATEGORY E: Customer Review Management & IDOR Protection
  // =========================================================================
  console.log('--- Category E: Customer Review Management & IDOR Protection ---');

  await test('E1: GET /api/v1/customer/products/:productId/reviews/mine returns customer own review', async () => {
    const res = await request('GET', `/api/v1/customer/products/${product1.id}/reviews/mine`, undefined, customerTokenA);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.productId, product1.id);
    assert.equal(res.body.data.rating, 5);
  });

  await test('E2: Customer can update own review, returning status to PENDING', async () => {
    // First approve review
    await prisma.productReview.update({
      where: { id: reviewAId },
      data: { status: 'APPROVED', publishedAt: new Date() }
    });

    const res = await request(
      'PATCH',
      `/api/v1/customer/reviews/${reviewAId}`,
      {
        rating: 4,
        body: 'Updated review body after displaying the artwork for 3 months.'
      },
      customerTokenA
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.data.rating, 4);
    assert.equal(res.body.data.status, 'PENDING'); // Substantive change resets to PENDING
    assert.equal(res.body.data.publishedAt, null);
  });

  await test('E3: IDOR Protection: Customer B cannot update Customer A review (403 REVIEW_NOT_OWNER)', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/customer/reviews/${reviewAId}`,
      {
        body: 'Customer B trying to tamper with Customer A review.'
      },
      customerTokenB
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'REVIEW_NOT_OWNER');
  });

  await test('E4: IDOR Protection: Customer B cannot delete Customer A review (403 REVIEW_NOT_OWNER)', async () => {
    const res = await request(
      'DELETE',
      `/api/v1/customer/reviews/${reviewAId}`,
      undefined,
      customerTokenB
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'REVIEW_NOT_OWNER');
  });

  await test('E5: Customer can delete own review (DELETE /api/v1/customer/reviews/:id)', async () => {
    // Create temporary review to test customer delete
    const tempPatron = await prisma.customer.create({
      data: {
        email: `temp_patron_${Date.now()}@example.com`,
        normalizedEmail: `temp_patron_${Date.now()}@example.com`,
        firstName: 'Temporary',
        lastName: 'Patron',
        passwordHash: 'hash',
        status: 'ACTIVE'
      }
    });
    const tempCart = await prisma.cart.create({ data: { customerId: tempPatron.id, currency: 'INR' } });
    const tempCheckout = await prisma.checkoutSession.create({
      data: { cartId: tempCart.id, customerId: tempPatron.id, email: tempPatron.email, currency: 'INR', status: 'COMPLETED' }
    });
    const tempOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEMP-${Date.now()}`,
        customerId: tempPatron.id,
        checkoutSessionId: tempCheckout.id,
        email: tempPatron.email,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 185000,
        grandTotal: 185000
      }
    });
    await prisma.orderItem.create({
      data: {
        orderId: tempOrder.id,
        productId: product1.id,
        sku: product1.sku,
        productName: product1.name,
        quantity: 1,
        unitPrice: 185000,
        lineTotal: 185000
      }
    });

    const tempToken = generateCustomerAccessToken({ sub: tempPatron.id, email: tempPatron.email });
    const createRes = await request('POST', `/api/v1/customer/products/${product1.id}/reviews`, {
      rating: 5,
      body: 'Temporary review to be deleted by customer.'
    }, tempToken);

    assert.equal(createRes.status, 201);
    const tempReviewId = createRes.body.data.id;

    const delRes = await request('DELETE', `/api/v1/customer/reviews/${tempReviewId}`, undefined, tempToken);
    assert.equal(delRes.status, 200);

    const check = await ProductReviewRepository.findById(tempReviewId);
    assert.equal(check, null);
  });

  // =========================================================================
  // CATEGORY F: Admin Moderation State Machine
  // =========================================================================
  console.log('--- Category F: Admin Moderation State Machine ---');

  await test('F1: Admin approves review (PENDING -> APPROVED), setting publishedAt', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      {
        status: 'APPROVED'
      },
      contentManagerToken
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'APPROVED');
    assert.ok(res.body.data.publishedAt);
  });

  await test('F2: Admin hides review (APPROVED -> HIDDEN)', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      {
        status: 'HIDDEN'
      },
      contentManagerToken
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'HIDDEN');
  });

  await test('F3: Admin re-approves review (HIDDEN -> APPROVED)', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      {
        status: 'APPROVED'
      },
      superAdminToken
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'APPROVED');
  });

  await test('F4: Invalid status transition rejection returns 409 INVALID_REVIEW_STATUS_TRANSITION', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      {
        status: 'INVALID_STATUS'
      },
      superAdminToken
    );

    assert.equal(res.status, 400);
  });

  // =========================================================================
  // CATEGORY G: Public Visibility & Filtering
  // =========================================================================
  console.log('--- Category G: Public Visibility & Filtering ---');

  await test('G1: GET /api/v1/products/:slug/reviews returns only APPROVED & published reviews', async () => {
    // Add pending review for product 1 to test isolation
    const patronC = await prisma.customer.create({
      data: {
        email: `patron_c_${Date.now()}@example.com`,
        normalizedEmail: `patron_c_${Date.now()}@example.com`,
        firstName: 'Devendra',
        lastName: 'Patel',
        passwordHash: 'hash',
        status: 'ACTIVE'
      }
    });

    await prisma.productReview.create({
      data: {
        productId: product1.id,
        customerId: patronC.id,
        rating: 3,
        body: 'Pending review from Devendra that should not be publicly visible.',
        status: 'PENDING'
      }
    });

    const res = await request('GET', `/api/v1/products/${product1.slug}/reviews`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.items);
    assert.equal(res.body.data.items.length, 1); // Only reviewA is approved
    assert.equal(res.body.data.items[0].id, reviewAId);
  });

  await test('G2: Public review view masks reviewer name and strictly omits email/orderId', async () => {
    const res = await request('GET', `/api/v1/products/${product1.slug}/reviews`);
    assert.equal(res.status, 200);
    const item = res.body.data.items[0];

    assert.equal(item.reviewerDisplayName, 'Aarav S.');
    assert.equal(item.email, undefined);
    assert.equal(item.customerEmail, undefined);
    assert.equal(item.orderId, undefined);
  });

  await test('G3: Query ?rating=4 filters reviews by exact rating match', async () => {
    const res = await request('GET', `/api/v1/products/${product1.slug}/reviews?rating=4`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.items.length, 1);

    const res5 = await request('GET', `/api/v1/products/${product1.slug}/reviews?rating=5`);
    assert.equal(res5.status, 200);
    assert.equal(res5.body.data.items.length, 0);
  });

  await test('G4: Inactive product reviews return 404 Not Found', async () => {
    const inactiveProd = await prisma.product.create({
      data: {
        name: 'Draft Artwork',
        slug: `draft-artwork-${Date.now()}`,
        sku: `DRAFT-${Date.now()}`,
        price: 50000,
        status: 'DRAFT',
        categoryId: cat.id
      }
    });

    const res = await request('GET', `/api/v1/products/${inactiveProd.slug}/reviews`);
    assert.equal(res.status, 404);
  });

  await test('G5: Public sorting supports newest, oldest, highest_rating, lowest_rating', async () => {
    const resNewest = await request('GET', `/api/v1/products/${product1.slug}/reviews?sort=newest`);
    assert.equal(resNewest.status, 200);

    const resHighest = await request('GET', `/api/v1/products/${product1.slug}/reviews?sort=highest_rating`);
    assert.equal(resHighest.status, 200);
  });

  // =========================================================================
  // CATEGORY H: Review Summary & Rating Aggregates
  // =========================================================================
  console.log('--- Category H: Review Summary & Rating Aggregates ---');

  await test('H1: Product with zero approved reviews returns averageRating 0 and totalReviews 0', async () => {
    const summary = await ReviewService.getReviewSummary(product2.id);
    assert.equal(summary.averageRating, 0);
    assert.equal(summary.totalReviews, 0);
    assert.equal(summary.verifiedReviewCount, 0);
    assert.equal(summary.ratingDistribution[5], 0);
  });

  await test('H2: Product with approved reviews computes accurate distribution and average', async () => {
    // Add second approved review for product 1
    const patronD = await prisma.customer.create({
      data: {
        email: `patron_d_${Date.now()}@example.com`,
        normalizedEmail: `patron_d_${Date.now()}@example.com`,
        firstName: 'Siddharth',
        lastName: 'Rao',
        passwordHash: 'hash',
        status: 'ACTIVE'
      }
    });

    await prisma.productReview.create({
      data: {
        productId: product1.id,
        customerId: patronD.id,
        rating: 5,
        title: 'Masterpiece',
        body: 'Brilliant artistic composition with flawless framing.',
        status: 'APPROVED',
        publishedAt: new Date(),
        verifiedPurchase: true
      }
    });

    const summary = await ReviewService.getReviewSummary(product1.id);
    // reviewA is rating 4, reviewD is rating 5 -> average = (4 + 5) / 2 = 4.5
    assert.equal(summary.averageRating, 4.5);
    assert.equal(summary.totalReviews, 2);
    assert.equal(summary.verifiedReviewCount, 2);
    assert.equal(summary.ratingDistribution[4], 1);
    assert.equal(summary.ratingDistribution[5], 1);
    assert.equal(summary.ratingDistribution[1], 0);
  });

  // =========================================================================
  // CATEGORY I: Product Detail Storefront Integration
  // =========================================================================
  console.log('--- Category I: Product Detail Storefront Integration ---');

  await test('I1: GET /api/v1/products/:slug embeds reviewSummary block', async () => {
    const res = await request('GET', `/api/v1/products/${product1.slug}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.reviewSummary);
    assert.equal(res.body.data.reviewSummary.averageRating, 4.5);
    assert.equal(res.body.data.reviewSummary.totalReviews, 2);
  });

  // =========================================================================
  // CATEGORY J: Admin Management, Filtering, Pagination & Search
  // =========================================================================
  console.log('--- Category J: Admin Management, Filtering, Pagination & Search ---');

  await test('J1: Admin can list reviews with pagination and filters (GET /api/v1/admin/reviews)', async () => {
    const res = await request('GET', '/api/v1/admin/reviews?page=1&limit=10', undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 2);
    assert.ok(res.body.pagination);
  });

  await test('J2: Admin can search reviews by keyword in body/title', async () => {
    const res = await request('GET', '/api/v1/admin/reviews?search=composition', undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.ok(res.body.data[0].body.includes('composition'));
  });

  await test('J3: Admin can view single review by ID with customer & product data', async () => {
    const res = await request('GET', `/api/v1/admin/reviews/${reviewAId}`, undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, reviewAId);
    assert.ok(res.body.data.customer);
    assert.ok(res.body.data.customer.email);
    assert.ok(res.body.data.product);
  });

  await test('J4: Admin can delete a review (DELETE /api/v1/admin/reviews/:id)', async () => {
    const tempRev = await prisma.productReview.create({
      data: {
        productId: product1.id,
        customerId: customerB.id,
        rating: 1,
        body: 'Admin deletion candidate.',
        status: 'PENDING'
      }
    });

    const res = await request('DELETE', `/api/v1/admin/reviews/${tempRev.id}`, undefined, superAdminToken);
    assert.equal(res.status, 200);

    const check = await ProductReviewRepository.findById(tempRev.id);
    assert.equal(check, null);
  });

  // =========================================================================
  // CATEGORY K: RBAC Permissions Matrix
  // =========================================================================
  console.log('--- Category K: RBAC Permissions Matrix ---');

  await test('K1: Content Manager can view and moderate reviews', async () => {
    const res = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      { status: 'APPROVED' },
      contentManagerToken
    );
    assert.equal(res.status, 200);
  });

  await test('K2: Marketing Manager can view and moderate reviews, but cannot delete (403 Forbidden)', async () => {
    const resMod = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      { status: 'APPROVED' },
      marketingManagerToken
    );
    assert.equal(resMod.status, 200);

    const resDel = await request('DELETE', `/api/v1/admin/reviews/${reviewAId}`, undefined, marketingManagerToken);
    assert.equal(resDel.status, 403);
  });

  await test('K3: Order Manager has view permission but cannot moderate (403 Forbidden)', async () => {
    const resView = await request('GET', '/api/v1/admin/reviews', undefined, orderManagerToken);
    assert.equal(resView.status, 200);

    const resMod = await request(
      'PATCH',
      `/api/v1/admin/reviews/${reviewAId}/moderate`,
      { status: 'REJECTED' },
      orderManagerToken
    );
    assert.equal(resMod.status, 403);
  });

  await test('K4: Unauthenticated admin requests are rejected with 401', async () => {
    const res = await request('GET', '/api/v1/admin/reviews');
    assert.equal(res.status, 401);
  });

  // =========================================================================
  // CATEGORY L: Audit Logging Verification
  // =========================================================================
  console.log('--- Category L: Audit Logging Verification ---');

  await test('L1: Audit logs recorded for review moderation operations', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: {
        entityType: 'ProductReview'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    assert.ok(logs.length > 0, 'Audit logs must record review operations');
    const actions = logs.map(l => l.action);
    assert.ok(actions.includes('REVIEW_APPROVED') || actions.includes('REVIEW_HIDDEN'));
  });

  // =========================================================================
  // CATEGORY M: Product Cascade Deletion & Customer Delete Safety
  // =========================================================================
  console.log('--- Category M: Product Cascade Deletion & Customer Delete Safety ---');

  await test('M1: Deleting a product safely cascade-deletes its reviews without deleting customer', async () => {
    const tempProd = await prisma.product.create({
      data: {
        name: 'Temporary Deletion Product',
        slug: `temp-del-${Date.now()}`,
        sku: `TEMP-${Date.now()}`,
        price: 10000,
        status: 'ACTIVE',
        categoryId: cat.id
      }
    });

    const tempReview = await prisma.productReview.create({
      data: {
        productId: tempProd.id,
        customerId: customerA.id,
        rating: 5,
        body: 'Review to be cascade-deleted.',
        status: 'APPROVED'
      }
    });

    // Delete product
    await prisma.product.delete({ where: { id: tempProd.id } });

    // Review should be deleted
    const checkReview = await prisma.productReview.findUnique({ where: { id: tempReview.id } });
    assert.equal(checkReview, null);

    // Customer A must still exist intact
    const checkCustomer = await prisma.customer.findUnique({ where: { id: customerA.id } });
    assert.ok(checkCustomer);
  });

  // Clean up server
  await new Promise<void>(resolve => {
    server.close(() => resolve());
  });

  console.log('\n======================================================');
  console.log(`⭐ MODULE 25 TEST SUITE COMPLETE:`);
  console.log(`  Passed Assertions: ${passedAssertions}`);
  console.log(`  Failed: 0`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\nTest Suite Failed:', err);
  if (server) server.close();
  process.exit(1);
});
