/**
 * Module 24: Cross-sell & Upsell — Comprehensive Test Suite
 * Lagoree Arts Luxury E-Commerce Backend
 */

import assert from 'node:assert/strict';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { RecommendationService } from '../modules/recommendations/recommendation.service.ts';
import { ProductRecommendationRepository } from '../modules/recommendations/recommendation.repository.ts';
import { RecommendationValidator } from '../modules/recommendations/recommendation.validator.ts';
import { RecommendationPolicy } from '../modules/recommendations/recommendation.policy.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { createApp } from '../app.ts';
import http from 'node:http';

const TEST_PORT = 5024;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let passedAssertions = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passedAssertions++;
      console.log(`  ✔ ${name}`);
    } catch (err: any) {
      console.error(`  ✖ ${name}`);
      console.error(err);
      process.exit(1);
    }
  })();
}

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
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
      res => {
        let resData = '';
        res.on('data', chunk => {
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

async function runTests() {
  console.log('\n🚀 Starting Module 24: Cross-sell & Upsell Test Suite...\n');

  // 1. Seed database
  await runSeed();

  // 2. Start HTTP server
  const app = createApp();
  await new Promise<void>(resolve => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // Admin Setup & Tokens
  const superAdmin = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  const superAdminToken = generateAccessToken({ sub: superAdmin.id, roleId: superAdmin.roleId });

  const catManagerRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  let catManagerUser = await prisma.adminUser.findUnique({ where: { email: 'catmanager.rec@lagoreearts.com' } });
  if (!catManagerUser) {
    catManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Catalogue Staff',
        email: 'catmanager.rec@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: catManagerRole.id
      }
    });
  }
  const catManagerToken = generateAccessToken({ sub: catManagerUser.id, roleId: catManagerRole.id });

  const contentManagerRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  let contentManagerUser = await prisma.adminUser.findUnique({ where: { email: 'content.rec@lagoreearts.com' } });
  if (!contentManagerUser) {
    contentManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Content Staff',
        email: 'content.rec@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: contentManagerRole.id
      }
    });
  }
  const contentManagerToken = generateAccessToken({ sub: contentManagerUser.id, roleId: contentManagerRole.id });

  const marketingManagerRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  let marketingManagerUser = await prisma.adminUser.findUnique({ where: { email: 'mktg.rec@lagoreearts.com' } });
  if (!marketingManagerUser) {
    marketingManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Marketing Staff',
        email: 'mktg.rec@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: marketingManagerRole.id
      }
    });
  }
  const marketingManagerToken = generateAccessToken({ sub: marketingManagerUser.id, roleId: marketingManagerRole.id });

  const orderManagerRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
  let orderManagerUser = await prisma.adminUser.findUnique({ where: { email: 'order.rec@lagoreearts.com' } });
  if (!orderManagerUser) {
    orderManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Order Staff',
        email: 'order.rec@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: orderManagerRole.id
      }
    });
  }
  const orderManagerToken = generateAccessToken({ sub: orderManagerUser.id, roleId: orderManagerRole.id });

  // Clean recommendation test data
  await prisma.productRecommendation.deleteMany({});

  // Query existing seeded products for test fixtures
  const allProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true, collections: true }
  });

  assert(allProducts.length >= 4, 'Precondition: Seeded database must have at least 4 active products');

  const prodA = allProducts[0];
  const prodB = allProducts[1];
  const prodC = allProducts[2];
  const prodD = allProducts[3];

  // Create additional test fixtures
  const heritageCategory = await prisma.category.findFirst({ where: { status: 'ACTIVE' } });
  const royalCollection = await prisma.collection.findFirst({ where: { status: 'ACTIVE' } });

  const inactiveProduct = await prisma.product.create({
    data: {
      name: 'Hidden Inactive Manuscript',
      slug: `hidden-inactive-manuscript-${Date.now()}`,
      sku: `SKU-INACT-${Date.now()}`,
      status: 'INACTIVE',
      price: 9999,
      categoryId: heritageCategory.id
    }
  });

  const draftProduct = await prisma.product.create({
    data: {
      name: 'Unpublished Draft Miniature',
      slug: `draft-miniature-${Date.now()}`,
      sku: `SKU-DRAFT-${Date.now()}`,
      status: 'DRAFT',
      price: 15000,
      categoryId: heritageCategory.id
    }
  });

  // =========================================================================
  // CATEGORY A: Schema & Database Persistence
  // =========================================================================
  console.log('--- Category A: Schema & Database Persistence ---');

  let rec1: any;
  let rec2: any;

  await test('A1: Creates and persists a ProductRecommendation record', async () => {
    rec1 = await ProductRecommendationRepository.create({
      sourceProductId: prodA.id,
      targetProductId: prodB.id,
      type: 'CROSS_SELL',
      sortOrder: 1,
      isActive: true
    });
    assert.ok(rec1.id);
    assert.equal(rec1.sourceProductId, prodA.id);
    assert.equal(rec1.targetProductId, prodB.id);
    assert.equal(rec1.type, 'CROSS_SELL');
    assert.equal(rec1.sortOrder, 1);
    assert.equal(rec1.isActive, true);
  });

  await test('A2: Finds recommendation by ID with hydrated relations', async () => {
    const found = await ProductRecommendationRepository.findById(rec1.id);
    assert.ok(found);
    assert.equal(found.id, rec1.id);
    assert.equal(found.sourceProduct.name, prodA.name);
    assert.equal(found.targetProduct.name, prodB.name);
  });

  await test('A3: Updates recommendation type and sortOrder', async () => {
    const updated = await ProductRecommendationRepository.update(rec1.id, {
      sortOrder: 5,
      isActive: true
    });
    assert.equal(updated.sortOrder, 5);
  });

  await test('A4: Deletes recommendation record safely without deleting products', async () => {
    const tempRec = await ProductRecommendationRepository.create({
      sourceProductId: prodA.id,
      targetProductId: prodC.id,
      type: 'RELATED',
      sortOrder: 2
    });
    await ProductRecommendationRepository.delete(tempRec.id);
    const checkDeleted = await ProductRecommendationRepository.findById(tempRec.id);
    assert.equal(checkDeleted, null);

    // Products must still exist!
    const checkProdA = await prisma.product.findUnique({ where: { id: prodA.id } });
    const checkProdC = await prisma.product.findUnique({ where: { id: prodC.id } });
    assert.ok(checkProdA);
    assert.ok(checkProdC);
  });

  await test('A5: Deleting a Product cascade-deletes its recommendation relationships in both directions', async () => {
    const tempProd = await prisma.product.create({
      data: {
        name: 'Temporary Artifact to Delete',
        slug: `temp-artifact-${Date.now()}`,
        sku: `SKU-TEMP-${Date.now()}`,
        status: 'ACTIVE',
        price: 2500,
        categoryId: heritageCategory.id
      }
    });

    const rFrom = await ProductRecommendationRepository.create({
      sourceProductId: tempProd.id,
      targetProductId: prodA.id,
      type: 'UPSELL'
    });
    const rTo = await ProductRecommendationRepository.create({
      sourceProductId: prodB.id,
      targetProductId: tempProd.id,
      type: 'CROSS_SELL'
    });

    // Delete temporary product
    await prisma.product.delete({ where: { id: tempProd.id } });

    // Both recommendations must be gone
    const checkRFrom = await ProductRecommendationRepository.findById(rFrom.id);
    const checkRTo = await ProductRecommendationRepository.findById(rTo.id);
    assert.equal(checkRFrom, null);
    assert.equal(checkRTo, null);
  });

  // =========================================================================
  // CATEGORY B: Self-Reference & Duplicate Validation
  // =========================================================================
  console.log('--- Category B: Self-Reference & Duplicate Validation ---');

  await test('B1: Self-reference rejection: sourceProductId === targetProductId throws 400', async () => {
    assert.throws(() => {
      RecommendationPolicy.validateNotSelfReference(prodA.id, prodA.id);
    }, (err: any) => err.statusCode === 400 && err.code === 'PRODUCT_RECOMMENDATION_SELF_REFERENCE');
  });

  await test('B2: Duplicate rejection: Same source, target, and type throws 409', async () => {
    await assert.rejects(async () => {
      await RecommendationPolicy.validateNoDuplicate(prodA.id, prodB.id, 'CROSS_SELL');
    }, (err: any) => err.statusCode === 409 && err.code === 'PRODUCT_RECOMMENDATION_DUPLICATE');
  });

  await test('B3: Distinct relationship type between same pair is permitted', async () => {
    rec2 = await ProductRecommendationRepository.create({
      sourceProductId: prodA.id,
      targetProductId: prodB.id,
      type: 'UPSELL',
      sortOrder: 2
    });
    assert.ok(rec2.id);
    assert.equal(rec2.type, 'UPSELL');
  });

  await test('B4: Validator rejects malformed UUID', async () => {
    assert.throws(() => {
      RecommendationValidator.validateUuid('not-a-uuid');
    }, (err: any) => err.statusCode === 400 && err.code === 'INVALID_ID_FORMAT');
  });

  await test('B5: Validator rejects invalid recommendation type enum', async () => {
    assert.throws(() => {
      RecommendationValidator.validateType('INVALID_TYPE');
    }, (err: any) => err.statusCode === 400 && err.code === 'INVALID_RECOMMENDATION_TYPE');
  });

  await test('B6: Validator rejects negative sortOrder', async () => {
    assert.throws(() => {
      RecommendationValidator.validateCreate({
        targetProductId: prodB.id,
        type: 'CROSS_SELL',
        sortOrder: -5
      });
    }, (err: any) => err.statusCode === 400 && err.code === 'INVALID_SORT_ORDER');
  });

  // =========================================================================
  // CATEGORY C: Cycle Detection & Infinite Traversal Protection
  // =========================================================================
  console.log('--- Category C: Cycle Detection & Infinite Traversal Protection ---');

  await test('C1: Direct reciprocal cycle (A -> UPSELL -> B, then B -> UPSELL -> A) throws 409', async () => {
    await assert.rejects(async () => {
      await RecommendationPolicy.validateNoCycle(prodB.id, prodA.id, 'UPSELL');
    }, (err: any) => err.statusCode === 409 && err.code === 'PRODUCT_RECOMMENDATION_CYCLE');
  });

  await test('C2: Multi-hop indirect cycle (A -> B -> C -> A) throws 409', async () => {
    // prodA -> UPSELL -> prodB already exists (rec2)
    // Add prodB -> UPSELL -> prodC
    const bToC = await ProductRecommendationRepository.create({
      sourceProductId: prodB.id,
      targetProductId: prodC.id,
      type: 'UPSELL',
      sortOrder: 1
    });

    // Now try to add prodC -> UPSELL -> prodA -> MUST THROW 409 CYCLE!
    await assert.rejects(async () => {
      await RecommendationPolicy.validateNoCycle(prodC.id, prodA.id, 'UPSELL');
    }, (err: any) => err.statusCode === 409 && err.code === 'PRODUCT_RECOMMENDATION_CYCLE');

    // Clean up bToC
    await ProductRecommendationRepository.delete(bToC.id);
  });

  await test('C3: Non-cyclic directed chains are permitted (A -> B, B -> C)', async () => {
    const bToD = await ProductRecommendationRepository.create({
      sourceProductId: prodB.id,
      targetProductId: prodD.id,
      type: 'RELATED',
      sortOrder: 1
    });
    assert.ok(bToD);
    await ProductRecommendationRepository.delete(bToD.id);
  });

  // =========================================================================
  // CATEGORY D: Relationship Types (CROSS_SELL, UPSELL, RELATED)
  // =========================================================================
  console.log('--- Category D: Relationship Types ---');

  let recCross: any;
  let recUp: any;
  let recRel: any;

  await test('D1: Creates CROSS_SELL recommendation', async () => {
    recCross = await RecommendationService.createRecommendation(
      prodA.id,
      { targetProductId: prodC.id, type: 'CROSS_SELL', sortOrder: 1 },
      superAdmin.id
    );
    assert.equal(recCross.type, 'CROSS_SELL');
  });

  await test('D2: Creates UPSELL recommendation', async () => {
    recUp = await RecommendationService.createRecommendation(
      prodA.id,
      { targetProductId: prodD.id, type: 'UPSELL', sortOrder: 2 },
      superAdmin.id
    );
    assert.equal(recUp.type, 'UPSELL');
  });

  await test('D3: Creates RELATED recommendation', async () => {
    recRel = await RecommendationService.createRecommendation(
      prodA.id,
      { targetProductId: prodB.id, type: 'RELATED', sortOrder: 3 },
      superAdmin.id
    );
    assert.equal(recRel.type, 'RELATED');
  });

  // =========================================================================
  // CATEGORY E: Public Product Detail Integration (GET /api/v1/products/:slug)
  // =========================================================================
  console.log('--- Category E: Public Product Detail Integration ---');

  await test('E1: GET /api/v1/products/:slug returns product detail with recommendations block', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations);
    assert.ok(Array.isArray(res.body.data.recommendations.crossSell));
    assert.ok(Array.isArray(res.body.data.recommendations.upsell));
    assert.ok(Array.isArray(res.body.data.recommendations.related));
  });

  await test('E2: Public product recommendations include explicit products in corresponding groups', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}`);
    assert.equal(res.status, 200);

    const crossSellIds = res.body.data.recommendations.crossSell.map((p: any) => p.id);
    const upsellIds = res.body.data.recommendations.upsell.map((p: any) => p.id);
    const relatedIds = res.body.data.recommendations.related.map((p: any) => p.id);

    assert.ok(crossSellIds.includes(prodC.id));
    assert.ok(upsellIds.includes(prodD.id));
    assert.ok(relatedIds.includes(prodB.id));
  });

  // =========================================================================
  // CATEGORY F: Dedicated Public Recommendation Endpoint
  // =========================================================================
  console.log('--- Category F: Dedicated Public Recommendation Endpoint ---');

  await test('F1: GET /api/v1/products/:slug/recommendations returns 200 with grouped recommendations', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.product.id, prodA.id);
    assert.ok(res.body.data.recommendations.crossSell.length > 0);
  });

  await test('F2: Query ?type=CROSS_SELL filters only cross-sell items', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?type=CROSS_SELL`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations.crossSell.length > 0);
    assert.equal(res.body.data.recommendations.upsell.length, 0);
    assert.equal(res.body.data.recommendations.related.length, 0);
  });

  await test('F3: Query ?type=UPSELL filters only upsell items', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?type=UPSELL`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations.upsell.length > 0);
    assert.equal(res.body.data.recommendations.crossSell.length, 0);
  });

  await test('F4: Query ?limit=2 bounds recommendation count', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?limit=2`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations.crossSell.length <= 2);
    assert.ok(res.body.data.recommendations.related.length <= 2);
  });

  await test('F5: Invalid query ?limit=0 or ?limit=-1 throws 400 Bad Request', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?limit=0`);
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_LIMIT');
  });

  await test('F6: Excessive query ?limit=99999 is safely clamped to max 20 without error', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?limit=99999`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations.related.length <= 20);
  });

  await test('F7: Non-existent product slug returns 404 Not Found', async () => {
    const res = await request('GET', `/api/v1/products/non-existent-product-xyz/recommendations`);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND');
  });

  // =========================================================================
  // CATEGORY G: Public Inactive / Draft / Archived Product Filtering & Safe Serialization
  // =========================================================================
  console.log('--- Category G: Inactive Product Filtering & Safe Serialization ---');

  await test('G1: Inactive source product returns 404 on public recommendation endpoint', async () => {
    const res = await request('GET', `/api/v1/products/${inactiveProduct.slug}/recommendations`);
    assert.equal(res.status, 404);
  });

  await test('G2: Draft source product returns 404 on public recommendation endpoint', async () => {
    const res = await request('GET', `/api/v1/products/${draftProduct.slug}/recommendations`);
    assert.equal(res.status, 404);
  });

  await test('G3: Inactive target product configured in recommendation is hidden from public storefront', async () => {
    // Configure recommendation prodA -> inactiveProduct
    const inactRec = await RecommendationService.createRecommendation(
      prodA.id,
      { targetProductId: inactiveProduct.id, type: 'CROSS_SELL', sortOrder: 99 },
      superAdmin.id
    );

    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations`);
    assert.equal(res.status, 200);
    const crossIds = res.body.data.recommendations.crossSell.map((p: any) => p.id);
    assert.ok(!crossIds.includes(inactiveProduct.id), 'Inactive product must be hidden from storefront recommendations');

    // Clean up
    await ProductRecommendationRepository.delete(inactRec.id);
  });

  await test('G4: Inactive recommendation record (isActive=false) is hidden from public storefront', async () => {
    const deactRec = await RecommendationService.createRecommendation(
      prodA.id,
      { targetProductId: prodD.id, type: 'CROSS_SELL', sortOrder: 10, isActive: false },
      superAdmin.id
    );

    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations?type=CROSS_SELL`);
    assert.equal(res.status, 200);
    // Should only contain active cross-sell (prodC), not deactivated prodD
    const crossIds = res.body.data.recommendations.crossSell.map((p: any) => p.id);
    assert.ok(!crossIds.includes(prodD.id));

    await ProductRecommendationRepository.delete(deactRec.id);
  });

  await test('G5: Public recommendation response strictly sanitizes costPrice, stockQuantity and internal scores', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations`);
    assert.equal(res.status, 200);

    const item = res.body.data.recommendations.crossSell[0];
    assert.ok(item);
    assert.equal(item.costPrice, undefined, 'costPrice must not be exposed publicly');
    assert.equal(item.stockQuantity, undefined, 'Raw stockQuantity must not be exposed publicly');
    assert.equal(item.score, undefined, 'Internal algorithm score must not be exposed publicly');
    assert.equal(item.rankingReason, undefined, 'Internal rankingReason must not be exposed publicly');
    assert.ok(typeof item.availability.inStock === 'boolean', 'availability.inStock bool must be present');
  });

  // =========================================================================
  // CATEGORY H: Deterministic Fallback Recommendations
  // =========================================================================
  console.log('--- Category H: Deterministic Fallback Recommendations ---');

  await test('H1: Fallback candidate scoring identifies collection and category relationships', async () => {
    // Create an isolated product with NO explicit recommendations
    const isolatedProd = await prisma.product.create({
      data: {
        name: 'Isolated Tanjore Masterpiece',
        slug: `isolated-tanjore-${Date.now()}`,
        sku: `SKU-ISO-${Date.now()}`,
        status: 'ACTIVE',
        price: 18000,
        categoryId: prodA.categoryId
      }
    });

    // Request public recommendations for isolated product -> Fallback must populate 'related'
    const res = await request('GET', `/api/v1/products/${isolatedProd.slug}/recommendations`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.recommendations.related.length > 0, 'Fallback recommendations should populate related products');

    // Clean up
    await prisma.product.delete({ where: { id: isolatedProd.id } });
  });

  await test('H2: Fallback excludes the source product itself from recommendations', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations`);
    assert.equal(res.status, 200);
    const allRecIds = [
      ...res.body.data.recommendations.crossSell.map((p: any) => p.id),
      ...res.body.data.recommendations.upsell.map((p: any) => p.id),
      ...res.body.data.recommendations.related.map((p: any) => p.id)
    ];
    assert.ok(!allRecIds.includes(prodA.id), 'Source product must NEVER be recommended to itself');
  });

  // =========================================================================
  // CATEGORY I: Recommendation Scoring & Deterministic Tie-Breaking
  // =========================================================================
  console.log('--- Category I: Recommendation Scoring & Deterministic Tie-Breaking ---');

  await test('I1: Scoring engine ranks explicit recommendations (1000/950/900) above automatic fallbacks (500/400)', async () => {
    const preview = await RecommendationService.getAdminPreview(prodA.id);
    assert.ok(preview.crossSell.length > 0);
    assert.equal(preview.crossSell[0].score, 1000);
    assert.equal(preview.crossSell[0].source, 'EXPLICIT');
  });

  await test('I2: Deterministic ordering produces 100% consistent results across multiple calls (No Math.random())', async () => {
    const call1 = await RecommendationService.getPublicRecommendations(prodA.id);
    const call2 = await RecommendationService.getPublicRecommendations(prodA.id);
    assert.deepEqual(call1, call2, 'Subsequent recommendation calls must yield identical deterministic responses');
  });

  // =========================================================================
  // CATEGORY J: Fallback Query Limits & Deduplication
  // =========================================================================
  console.log('--- Category J: Fallback Query Limits & Deduplication ---');

  await test('J1: Explicit recommendation takes precedence and is not duplicated by fallback in the same group', async () => {
    const res = await request('GET', `/api/v1/products/${prodA.slug}/recommendations`);
    assert.equal(res.status, 200);

    const relatedIds = res.body.data.recommendations.related.map((p: any) => p.id);
    const uniqueIds = new Set(relatedIds);
    assert.equal(relatedIds.length, uniqueIds.size, 'No duplicate products within related recommendations group');
  });

  // =========================================================================
  // CATEGORY K: Admin Recommendation CRUD Operations
  // =========================================================================
  console.log('--- Category K: Admin Recommendation CRUD Operations ---');

  let adminCreatedRecId: string;

  await test('K1: Admin list recommendations (GET /api/v1/admin/product-recommendations) returns paginated list', async () => {
    const res = await request('GET', '/api/v1/admin/product-recommendations?page=1&limit=10', undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination.total >= 3);
  });

  await test('K2: Admin create recommendation (POST /api/v1/admin/product-recommendations) creates relationship', async () => {
    const res = await request('POST', '/api/v1/admin/product-recommendations', {
      sourceProductId: prodB.id,
      targetProductId: prodC.id,
      type: 'CROSS_SELL',
      sortOrder: 10
    }, superAdminToken);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.sourceProductId, prodB.id);
    assert.equal(res.body.data.targetProductId, prodC.id);
    adminCreatedRecId = res.body.data.id;
  });

  await test('K3: Admin get recommendation by ID (GET /api/v1/admin/product-recommendations/:id)', async () => {
    const res = await request('GET', `/api/v1/admin/product-recommendations/${adminCreatedRecId}`, undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, adminCreatedRecId);
  });

  await test('K4: Admin update recommendation (PATCH /api/v1/admin/product-recommendations/:id)', async () => {
    const res = await request('PATCH', `/api/v1/admin/product-recommendations/${adminCreatedRecId}`, {
      sortOrder: 25,
      isActive: false
    }, superAdminToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.sortOrder, 25);
    assert.equal(res.body.data.isActive, false);
  });

  await test('K5: Admin delete recommendation (DELETE /api/v1/admin/product-recommendations/:id)', async () => {
    const res = await request('DELETE', `/api/v1/admin/product-recommendations/${adminCreatedRecId}`, undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.success, true);
  });

  await test('K6: Nested admin product route: POST /api/v1/admin/products/:productId/recommendations', async () => {
    const res = await request('POST', `/api/v1/admin/products/${prodB.id}/recommendations`, {
      targetProductId: prodD.id,
      type: 'UPSELL',
      sortOrder: 1
    }, superAdminToken);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.sourceProductId, prodB.id);
    adminCreatedRecId = res.body.data.id;
  });

  await test('K7: Nested admin product route: GET /api/v1/admin/products/:productId/recommendations', async () => {
    const res = await request('GET', `/api/v1/admin/products/${prodB.id}/recommendations`, undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((r: any) => r.id === adminCreatedRecId));
  });

  await test('K8: Nested admin product route: DELETE /api/v1/admin/products/:productId/recommendations/:recommendationId', async () => {
    const res = await request('DELETE', `/api/v1/admin/products/${prodB.id}/recommendations/${adminCreatedRecId}`, undefined, superAdminToken);
    assert.equal(res.status, 200);
  });

  // =========================================================================
  // CATEGORY L: Bulk Reordering & Transaction Safety
  // =========================================================================
  console.log('--- Category L: Bulk Reordering & Transaction Safety ---');

  await test('L1: PATCH /api/v1/admin/products/:productId/recommendations/reorder reorders items atomically', async () => {
    const res = await request('PATCH', `/api/v1/admin/products/${prodA.id}/recommendations/reorder`, [
      { id: recCross.id, sortOrder: 50 },
      { id: recUp.id, sortOrder: 10 }
    ], superAdminToken);
    assert.equal(res.status, 200);

    const checkCross = await ProductRecommendationRepository.findById(recCross.id);
    const checkUp = await ProductRecommendationRepository.findById(recUp.id);
    assert.equal(checkCross.sortOrder, 50);
    assert.equal(checkUp.sortOrder, 10);
  });

  await test('L2: Reorder rejects payload containing foreign recommendation ID with 400 Bad Request', async () => {
    const foreignRec = await ProductRecommendationRepository.create({
      sourceProductId: prodB.id,
      targetProductId: prodC.id,
      type: 'RELATED',
      sortOrder: 1
    });

    const res = await request('PATCH', `/api/v1/admin/products/${prodA.id}/recommendations/reorder`, [
      { id: foreignRec.id, sortOrder: 1 }
    ], superAdminToken);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_REORDER_ITEMS');

    await ProductRecommendationRepository.delete(foreignRec.id);
  });

  // =========================================================================
  // CATEGORY M: Admin Diagnostic Preview Endpoint
  // =========================================================================
  console.log('--- Category M: Admin Diagnostic Preview Endpoint ---');

  await test('M1: GET /api/v1/admin/products/:productId/recommendations/preview returns diagnostic scoring metadata', async () => {
    const res = await request('GET', `/api/v1/admin/products/${prodA.id}/recommendations/preview`, undefined, superAdminToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.productId, prodA.id);
    assert.ok(res.body.data.crossSell.length > 0);
    assert.ok(typeof res.body.data.crossSell[0].score === 'number');
    assert.ok(typeof res.body.data.crossSell[0].rankingReason === 'string');
  });

  // =========================================================================
  // CATEGORY N: RBAC Permissions Matrix
  // =========================================================================
  console.log('--- Category N: RBAC Permissions Matrix ---');

  await test('N1: Catalogue Manager can create, update, reorder and delete recommendations', async () => {
    const resCreate = await request('POST', '/api/v1/admin/product-recommendations', {
      sourceProductId: prodC.id,
      targetProductId: prodD.id,
      type: 'UPSELL',
      sortOrder: 1
    }, catManagerToken);
    assert.equal(resCreate.status, 201);

    const recId = resCreate.body.data.id;
    const resUpdate = await request('PATCH', `/api/v1/admin/product-recommendations/${recId}`, {
      sortOrder: 9
    }, catManagerToken);
    assert.equal(resUpdate.status, 200);

    const resDelete = await request('DELETE', `/api/v1/admin/product-recommendations/${recId}`, undefined, catManagerToken);
    assert.equal(resDelete.status, 200);
  });

  await test('N2: Content Manager has view access (200) but cannot create recommendations (403 Forbidden)', async () => {
    const resView = await request('GET', '/api/v1/admin/product-recommendations', undefined, contentManagerToken);
    assert.equal(resView.status, 200);

    const resCreate = await request('POST', '/api/v1/admin/product-recommendations', {
      sourceProductId: prodC.id,
      targetProductId: prodD.id,
      type: 'UPSELL'
    }, contentManagerToken);
    assert.equal(resCreate.status, 403);
  });

  await test('N3: Marketing Manager can view, create, update, reorder but cannot delete recommendations (403)', async () => {
    const resCreate = await request('POST', '/api/v1/admin/product-recommendations', {
      sourceProductId: prodC.id,
      targetProductId: prodD.id,
      type: 'UPSELL',
      sortOrder: 1
    }, marketingManagerToken);
    assert.equal(resCreate.status, 201);
    const recId = resCreate.body.data.id;

    const resDelete = await request('DELETE', `/api/v1/admin/product-recommendations/${recId}`, undefined, marketingManagerToken);
    assert.equal(resDelete.status, 403);

    // Clean up with superAdminToken
    await request('DELETE', `/api/v1/admin/product-recommendations/${recId}`, undefined, superAdminToken);
  });

  await test('N4: Order Manager has view access (200) but cannot create recommendations (403 Forbidden)', async () => {
    const resView = await request('GET', '/api/v1/admin/product-recommendations', undefined, orderManagerToken);
    assert.equal(resView.status, 200);

    const resCreate = await request('POST', '/api/v1/admin/product-recommendations', {
      sourceProductId: prodC.id,
      targetProductId: prodD.id,
      type: 'UPSELL'
    }, orderManagerToken);
    assert.equal(resCreate.status, 403);
  });

  await test('N5: Unauthenticated admin requests are rejected with 401 Unauthorized', async () => {
    const res = await request('GET', '/api/v1/admin/product-recommendations');
    assert.equal(res.status, 401);
  });

  // =========================================================================
  // CATEGORY O: Audit Logging Verification
  // =========================================================================
  console.log('--- Category O: Audit Logging Verification ---');

  await test('O1: Security audit logs recorded for recommendation management operations', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: {
        entityType: 'ProductRecommendation'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    assert.ok(logs.length > 0, 'Audit logs must record recommendation operations');
    const actions = logs.map(l => l.action);
    assert.ok(actions.includes('RECOMMENDATION_CREATED') || actions.includes('RECOMMENDATION_UPDATED'));
  });

  // =========================================================================
  // CATEGORY P: Concurrency & Race-Condition Resistance
  // =========================================================================
  console.log('--- Category P: Concurrency & Race-Condition Resistance ---');

  await test('P1: Concurrent identical recommendation creations safely prevent duplicate records', async () => {
    const uniquePairTarget = prodD.id;

    const promises = [
      request('POST', '/api/v1/admin/product-recommendations', {
        sourceProductId: prodC.id,
        targetProductId: uniquePairTarget,
        type: 'CROSS_SELL'
      }, superAdminToken),
      request('POST', '/api/v1/admin/product-recommendations', {
        sourceProductId: prodC.id,
        targetProductId: uniquePairTarget,
        type: 'CROSS_SELL'
      }, superAdminToken)
    ];

    const results = await Promise.all(promises);
    const statuses = results.map(r => r.status);

    // One must succeed (201) and the duplicate must be rejected (409)
    assert.ok(statuses.includes(201), 'One creation should succeed with 201');
    assert.ok(statuses.includes(409), 'Duplicate concurrent creation should be rejected with 409');
  });

  // Clean up server
  await new Promise<void>(resolve => {
    server.close(() => resolve());
  });

  console.log('\n=========================================');
  console.log(`Module 24 Test Suite Complete:`);
  console.log(`  Passed: ${passedAssertions}`);
  console.log(`  Failed: 0`);
  console.log('=========================================\n');
}

runTests().catch(err => {
  console.error('\nTest Suite Failed:', err);
  if (server) server.close();
  process.exit(1);
});
