import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5010;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testCategoryId: string;
let testCollectionId: string;
let testProductId1: string;
let testProductId2: string;
let testProductSanskritSlug: string;

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
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 200, body: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode || 200, body: data, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ [TEST ${passed + failed + 1}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL ${passed + failed + 1}] ${name}`);
    failed++;
    throw err;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🕉️  MODULE 10: THE SANSKRIT EDIT TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize Seed & In-Process HTTP Server
  console.log('--- Phase 0: Setup & Seed ---');
  await runSeed();

  // Clean up any test products from previous test executions
  const testSkus = ['LA-SAN-T1-001', 'LA-SAN-T2-002', 'LA-SAN-T3-003', 'LA-SAN-T4-004'];
  for (const sku of testSkus) {
    const existingP = await prisma.product.findUnique({ where: { sku } });
    if (existingP) {
      await prisma.sanskritEditProfile.deleteMany({ where: { productId: existingP.id } });
      await prisma.product.delete({ where: { id: existingP.id } });
    }
  }

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`✓ Test server running on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  // 2. Obtain RBAC Tokens
  const superRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const catRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const contentRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const mktRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const ordRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superUser = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({ sub: superUser!.id, roleId: superRole!.id });

  let catUser = await prisma.adminUser.findUnique({ where: { email: 'curator.sanskrit@lagoreearts.com' } });
  if (!catUser) {
    catUser = await prisma.adminUser.create({
      data: {
        name: 'Sanskrit Catalogue Manager',
        email: 'curator.sanskrit@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: catRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

  let contUser = await prisma.adminUser.findUnique({ where: { email: 'content.sanskrit@lagoreearts.com' } });
  if (!contUser) {
    contUser = await prisma.adminUser.create({
      data: {
        name: 'Sanskrit Content Manager',
        email: 'content.sanskrit@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: contentRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contUser.id, roleId: contentRole!.id });

  let mktUser = await prisma.adminUser.findUnique({ where: { email: 'marketing.sanskrit@lagoreearts.com' } });
  if (!mktUser) {
    mktUser = await prisma.adminUser.create({
      data: {
        name: 'Sanskrit Marketing Manager',
        email: 'marketing.sanskrit@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: mktRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

  let ordUser = await prisma.adminUser.findUnique({ where: { email: 'order.sanskrit@lagoreearts.com' } });
  if (!ordUser) {
    ordUser = await prisma.adminUser.create({
      data: {
        name: 'Sanskrit Order Manager',
        email: 'order.sanskrit@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: ordRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

  const cat = await prisma.category.findFirst({ where: { slug: 'sculptures' } });
  testCategoryId = cat ? cat.id : (await prisma.category.findFirst())!.id;

  const col = await prisma.collection.findFirst({ where: { slug: 'divine-pantheon' } });
  testCollectionId = col ? col.id : (await prisma.collection.findFirst())!.id;

  // Create isolated test products
  const p1Res = await request('POST', '/api/v1/admin/products', {
    name: 'Gita Upadesha Kurukshetra Bronze Tableau',
    slug: 'gita-upadesha-kurukshetra-bronze-tableau',
    sku: 'LA-SAN-T1-001',
    price: 185000,
    costPrice: 90000,
    stockQuantity: 4,
    trackInventory: true,
    allowBackorder: false,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductId1 = p1Res.body.data.id;
  testProductSanskritSlug = p1Res.body.data.slug;

  const p2Res = await request('POST', '/api/v1/admin/products', {
    name: 'Ashtalakshmi Sacred Yantra Wall Relief',
    slug: 'ashtalakshmi-sacred-yantra-wall-relief',
    sku: 'LA-SAN-T2-002',
    price: 95000,
    costPrice: 45000,
    stockQuantity: 3,
    trackInventory: true,
    allowBackorder: false,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductId2 = p2Res.body.data.id;

  console.log('✓ Test environment ready.\n');

  try {
    // ==========================================
    // CATEGORY A: PROFILE CRUD
    // ==========================================
    console.log('--- Category A: Profile CRUD & Invariants ---');

    await test('Create Sanskrit Edit Profile (POST /api/v1/admin/products/:id/sanskrit-edit)', async () => {
      const res = await request('POST', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        sanskritTitle: 'कर्मण्येवाधिकारस्ते',
        devanagariText: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
        transliteration: 'karmaṇyevādhikāraste mā phaleṣu kadācana | mā karmaphalaheturbhūrmā te saṅgo\'stvakarmaṇi ||',
        translation: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
        meaning: 'Selfless action without attachment to outcomes leads to spiritual freedom and peace of mind.',
        pronunciation: 'Kar-man-ye-vaa-dhi-kaa-ras-te',
        pronunciationGuide: 'Accentuate the long vowels "ā" and compound "ṇy".',
        source: 'Bhagavad Gita',
        sourceReference: 'Chapter 2, Verse 47',
        theme: 'Karma Yoga',
        context: 'Delivered by Sri Krishna to Arjuna on the battlefield of Kurukshetra as the cornerstone of righteous duty.',
        editorialContent: 'This majestic bronze sculpture depicts Sri Krishna imparting timeless spiritual guidance to Arjuna.',
        featuredExcerpt: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
        featuredExcerptTranslation: 'Your right is to work only, never to its fruits',
        editorialNote: 'Verified with Vedic advisory board.',
        displayOrder: 2,
        isFeatured: true,
        isPublished: true
      }, superAdminToken);

      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      assert(res.body.success === true, 'Expected success: true');
      assert(res.body.data.sanskritTitle === 'कर्मण्येवाधिकारस्ते', 'Sanskrit title matches');
      assert(res.body.data.theme === 'Karma Yoga', 'Theme matches');
      assert(res.body.data.isPublished === true, 'isPublished is true');
      assert(res.body.data.isFeatured === true, 'isFeatured is true');
      assert(res.body.data.displayOrder === 2, 'displayOrder is 2');
    });

    await test('Reject duplicate profile creation for same product with 409 Conflict', async () => {
      const res = await request('POST', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        sanskritTitle: 'Duplicate Sanskrit Title',
        isPublished: true
      }, superAdminToken);

      assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
      assert(res.body.error.code === 'SANSKRIT_EDIT_ALREADY_EXISTS', 'Error code is SANSKRIT_EDIT_ALREADY_EXISTS');
    });

    await test('Get Sanskrit Edit profile (GET /api/v1/admin/products/:id/sanskrit-edit)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.sanskritTitle === 'कर्मण्येवाधिकारस्ते', 'Title matches');
      assert(res.body.data.editorialNote === 'Verified with Vedic advisory board.', 'Admin view includes internal editorial note');
    });

    await test('Update Sanskrit Edit profile (PATCH /api/v1/admin/products/:id/sanskrit-edit)', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        translation: 'You have a right to action alone, never to its fruits.',
        displayOrder: 1
      }, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.translation === 'You have a right to action alone, never to its fruits.', 'Translation updated');
      assert(res.body.data.displayOrder === 1, 'displayOrder updated');
    });

    await test('Reject creating profile for non-existent product with 404', async () => {
      const res = await request('POST', `/api/v1/admin/products/00000000-0000-0000-0000-000000000000/sanskrit-edit`, {
        sanskritTitle: 'Test Title'
      }, superAdminToken);

      assert(res.status === 404, `Expected 404, got ${res.status}`);
      assert(res.body.error.code === 'PRODUCT_NOT_FOUND', 'Error code is PRODUCT_NOT_FOUND');
    });

    await test('Reject getting profile for non-existent product with 404', async () => {
      const res = await request('GET', `/api/v1/admin/products/00000000-0000-0000-0000-000000000000/sanskrit-edit`, undefined, superAdminToken);

      assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    // ==========================================
    // CATEGORY B: UNICODE & DEVANAGARI FIDELITY
    // ==========================================
    console.log('\n--- Category B: Unicode & Devanagari Script Fidelity ---');

    await test('Preserve complex Devanagari glyphs, conjuncts, and danda punctuation', async () => {
      const complexDevanagari = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥';
      const transliteration = 'oṃ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṃ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt ||';

      const res = await request('POST', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, {
        sanskritTitle: 'गायत्री मन्त्रः',
        devanagariText: complexDevanagari,
        transliteration,
        translation: 'May the divine light of the Sun illuminate our intellect.',
        meaning: 'A sacred Vedic invocation to Savitr seeking wisdom and spiritual illumination.',
        source: 'Rigveda',
        sourceReference: 'Mandala 3, Sukta 62, Verse 10',
        theme: 'Wisdom & Light',
        isPublished: true,
        isFeatured: false,
        displayOrder: 2
      }, superAdminToken);

      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      assert(res.body.data.devanagariText === complexDevanagari, 'Devanagari text preserved with 100% exact fidelity');
      assert(res.body.data.transliteration === transliteration, 'IAST transliteration preserved with diacritics');
    });

    await test('Preserve multiline verses with line breaks', async () => {
      const multiline = `विद्या ददाति विनयं विनयाद्याति पात्रताम्।\nपात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम्॥`;
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, {
        devanagariText: multiline
      }, superAdminToken);

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.data.devanagariText === multiline, 'Multiline Sanskrit text with line breaks is intact');
    });

    // ==========================================
    // CATEGORY C: EDITORIAL FIELDS VALIDATION
    // ==========================================
    console.log('\n--- Category C: Editorial Fields & Length Validations ---');

    await test('Reject overlong sanskritTitle (> 255 chars)', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        sanskritTitle: 'A'.repeat(256)
      }, superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    await test('Reject overlong theme (> 100 chars)', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        theme: 'T'.repeat(101)
      }, superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    await test('Reject negative displayOrder', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        displayOrder: -5
      }, superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    // ==========================================
    // CATEGORY D: PUBLISHING LIFECYCLE & INVARIANTS
    // ==========================================
    console.log('\n--- Category D: Publishing Lifecycle & Invariants ---');

    await test('Reject isFeatured: true when isPublished: false on CREATE (400)', async () => {
      // Create a 3rd test product
      const p3Res = await request('POST', '/api/v1/admin/products', {
        name: 'Saraswati Veena Classical Relief',
        slug: 'saraswati-veena-classical-relief',
        sku: 'LA-SAN-T3-003',
        price: 75000,
        status: 'ACTIVE',
        categoryId: testCategoryId
      }, superAdminToken);
      const p3Id = p3Res.body.data.id;

      const res = await request('POST', `/api/v1/admin/products/${p3Id}/sanskrit-edit`, {
        sanskritTitle: 'सरस्वती वन्दना',
        isFeatured: true,
        isPublished: false
      }, superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      assert(res.body.error.code === 'SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED', 'Code is SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED');
    });

    await test('Reject isFeatured: true when isPublished: false on UPDATE (400)', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        isFeatured: true,
        isPublished: false
      }, superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      assert(res.body.error.code === 'SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED', 'Code is SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED');
    });

    await test('Allow setting isPublished: false when isFeatured is also false (200)', async () => {
      const res = await request('PATCH', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, {
        isFeatured: false,
        isPublished: false
      }, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.isPublished === false, 'isPublished is false');
    });

    await test('Unpublished Sanskrit Edit product is omitted from public storefront listing', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const foundUnpublished = res.body.data.find((item: any) => item.id === testProductId2);
      assert(!foundUnpublished, 'Unpublished product testProductId2 is hidden from public storefront');
    });

    await test('Republish Sanskrit Edit product (isPublished: true) makes it visible publicly', async () => {
      const patchRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, {
        isPublished: true
      }, superAdminToken);
      assert(patchRes.status === 200, 'Republished successfully');

      const res = await request('GET', '/api/v1/sanskrit-edit');
      assert(res.status === 200, '200 OK');
      const found = res.body.data.find((item: any) => item.id === testProductId2);
      assert(Boolean(found), 'Product testProductId2 is now visible publicly in Sanskrit Edit');
    });

    // ==========================================
    // CATEGORY E: ORDERING & BULK REORDER
    // ==========================================
    console.log('\n--- Category E: Editorial Ordering & Bulk Reorder ---');

    await test('Bulk reorder display orders (PUT /api/v1/admin/sanskrit-edit/order)', async () => {
      const res = await request('PUT', '/api/v1/admin/sanskrit-edit/order', [
        { productId: testProductId1, displayOrder: 10 },
        { productId: testProductId2, displayOrder: 5 }
      ], superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.success === true, 'Success is true');

      const prof1 = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, superAdminToken);
      const prof2 = await request('GET', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, undefined, superAdminToken);
      assert(prof1.body.data.displayOrder === 10, 'Product 1 displayOrder is 10');
      assert(prof2.body.data.displayOrder === 5, 'Product 2 displayOrder is 5');
    });

    await test('Reject invalid reorder payload with 400', async () => {
      const res = await request('PUT', '/api/v1/admin/sanskrit-edit/order', [
        { productId: testProductId1, displayOrder: -1 }
      ], superAdminToken);

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      assert(res.body.error.code === 'SANSKRIT_EDIT_INVALID_ORDER', 'Error code is SANSKRIT_EDIT_INVALID_ORDER');
    });

    // ==========================================
    // CATEGORY F: PRODUCT INTEGRATION
    // ==========================================
    console.log('\n--- Category F: Product Integration & Multi-System Harmony ---');

    await test('Link collection and attribute to Sanskrit product', async () => {
      const res = await request('POST', `/api/v1/admin/products/${testProductId1}/collections`, {
        collectionId: testCollectionId
      }, superAdminToken);

      assert(res.status === 200 || res.status === 201, 'Linked collection successfully');
    });

    await test('Retrieve product detail by slug with integrated sanskritEdit profile', async () => {
      const res = await request('GET', `/api/v1/products/${testProductSanskritSlug}`);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(Boolean(res.body.data.sanskritEdit), 'sanskritEdit object is present');
      assert(res.body.data.sanskritEdit.sanskritTitle === 'कर्मण्येवाधिकारस्ते', 'Sanskrit title matches');
      assert(res.body.data.sanskritEdit.theme === 'Karma Yoga', 'Theme matches');
      assert(res.body.data.sanskritEdit.editorialNote === undefined, 'editorialNote is NOT exposed on public product endpoint');
    });

    // ==========================================
    // CATEGORY G: ADMIN LISTING & FACETED FILTERS
    // ==========================================
    console.log('\n--- Category G: Admin Listing & Search ---');

    await test('Admin listing (GET /api/v1/admin/sanskrit-edit) returns list with pagination', async () => {
      const res = await request('GET', '/api/v1/admin/sanskrit-edit?page=1&limit=10', undefined, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(Array.isArray(res.body.data), 'Data is array');
      assert(res.body.pagination.total >= 2, 'Total contains seeded and test products');
    });

    await test('Admin listing filter by theme', async () => {
      const res = await request('GET', '/api/v1/admin/sanskrit-edit?theme=Karma Yoga', undefined, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.length >= 1, 'Found at least 1 Karma Yoga profile');
      assert(res.body.data[0].theme === 'Karma Yoga', 'Theme matches');
    });

    await test('Admin listing search by Sanskrit text query', async () => {
      const res = await request('GET', '/api/v1/admin/sanskrit-edit?search=कर्मण्येवाधिकारस्ते', undefined, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.length >= 1, 'Found matching item by Devanagari text query');
    });

    // ==========================================
    // CATEGORY H: STOREFRONT PUBLIC CATALOG & SANITIZATION
    // ==========================================
    console.log('\n--- Category H: Storefront Public Catalog & Security Sanitization ---');

    await test('Public storefront listing (GET /api/v1/sanskrit-edit) returns 200 OK', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(Array.isArray(res.body.data), 'Returns array of public products');
      assert(res.body.data.length >= 1, 'Returns active published items');
    });

    await test('Public storefront sanitizes costPrice and internal editorial notes', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit');
      const item = res.body.data.find((p: any) => p.id === testProductId1);

      assert(Boolean(item), 'Found item in public listing');
      assert(item.costPrice === undefined, 'costPrice is sanitized');
      assert(item.sanskritEdit.editorialNote === undefined, 'editorialNote is stripped from public response');
      assert(item.sanskritEdit.sanskritTitle === 'कर्मण्येवाधिकारस्ते', 'sanskritTitle is present');
      assert(item.sanskritEdit.translation !== undefined, 'translation is present');
    });

    await test('Public storefront filter by featured (GET /api/v1/sanskrit-edit?featured=true)', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit?featured=true');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      for (const p of res.body.data) {
        assert(p.sanskritEdit.isFeatured === true, 'All returned items are featured');
      }
    });

    // ==========================================
    // CATEGORY I: RBAC & PERMISSION MATRIX
    // ==========================================
    console.log('\n--- Category I: RBAC & Permission Matrix ---');

    await test('SUPER_ADMIN has full Sanskrit Edit access', async () => {
      const res = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, superAdminToken);
      assert(res.status === 200, 'Super admin authorized');
    });

    await test('CATALOGUE_MANAGER can view, update, delete Sanskrit Edit profiles', async () => {
      const getRes = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, catalogueManagerToken);
      assert(getRes.status === 200, 'Catalogue manager can view');

      const patchRes = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        context: 'Updated by catalogue manager'
      }, catalogueManagerToken);
      assert(patchRes.status === 200, 'Catalogue manager can update');
    });

    await test('CONTENT_MANAGER can view and update, but is DENIED delete (403)', async () => {
      const getRes = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, contentManagerToken);
      assert(getRes.status === 200, 'Content manager can view');

      const deleteRes = await request('DELETE', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, contentManagerToken);
      assert(deleteRes.status === 403, `Expected 403 Forbidden, got ${deleteRes.status}`);
    });

    await test('MARKETING_MANAGER can view listing, but is DENIED update (403)', async () => {
      const listRes = await request('GET', '/api/v1/admin/sanskrit-edit', undefined, marketingManagerToken);
      assert(listRes.status === 200, 'Marketing manager can view');

      const patchRes = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        theme: 'Marketing Attempt'
      }, marketingManagerToken);
      assert(patchRes.status === 403, `Expected 403 Forbidden, got ${patchRes.status}`);
    });

    await test('ORDER_MANAGER is DENIED all Sanskrit Edit endpoints (403)', async () => {
      const listRes = await request('GET', '/api/v1/admin/sanskrit-edit', undefined, orderManagerToken);
      assert(listRes.status === 403, `Expected 403 Forbidden, got ${listRes.status}`);

      const getRes = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, undefined, orderManagerToken);
      assert(getRes.status === 403, `Expected 403 Forbidden, got ${getRes.status}`);
    });

    await test('Unauthenticated request is rejected with 401', async () => {
      const res = await request('GET', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`);
      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    });

    // ==========================================
    // CATEGORY J: AUDIT LOGGING VERIFICATION
    // ==========================================
    console.log('\n--- Category J: Audit Logging Verification ---');

    await test('Audit logs recorded for Sanskrit Edit actions', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { module: 'SANSKRIT_EDIT' }
      });

      assert(logs.length >= 2, `Expected at least 2 Sanskrit audit logs, got ${logs.length}`);
      const actions = logs.map((l: any) => l.action);
      assert(actions.includes('SANSKRIT_EDIT_CREATED'), 'SANSKRIT_EDIT_CREATED action was logged');
      assert(actions.includes('SANSKRIT_EDIT_UPDATED'), 'SANSKRIT_EDIT_UPDATED action was logged');
      assert(actions.includes('SANSKRIT_EDIT_REORDERED'), 'SANSKRIT_EDIT_REORDERED action was logged');
    });

    // ==========================================
    // CATEGORY K: DELETION SAFETY & CASCADE
    // ==========================================
    console.log('\n--- Category K: Non-Destructive Deletion & Cascade Safety ---');

    await test('Delete Sanskrit Edit Profile (DELETE /api/v1/admin/products/:id/sanskrit-edit) returns 200 OK', async () => {
      const res = await request('DELETE', `/api/v1/admin/products/${testProductId2}/sanskrit-edit`, undefined, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.success === true, 'Success is true');
    });

    await test('Base Product remains intact after Sanskrit Edit profile deletion', async () => {
      const prod = await prisma.product.findUnique({ where: { id: testProductId2 } });
      assert(Boolean(prod), 'Base product still exists in database');
      assert(prod!.sku === 'LA-SAN-T2-002', 'Product SKU is preserved');
    });

    await test('Cascade deletion: deleting Product automatically removes its SanskritEditProfile', async () => {
      // Create a 4th test product with profile
      const p4Res = await request('POST', '/api/v1/admin/products', {
        name: 'Cascade Test Sanskrit Product',
        slug: 'cascade-test-sanskrit-product',
        sku: 'LA-SAN-T4-004',
        price: 50000,
        status: 'ACTIVE',
        categoryId: testCategoryId
      }, superAdminToken);
      const p4Id = p4Res.body.data.id;

      await request('POST', `/api/v1/admin/products/${p4Id}/sanskrit-edit`, {
        sanskritTitle: 'कास्केड परीक्षणम्',
        isPublished: true
      }, superAdminToken);

      const profBefore = await prisma.sanskritEditProfile.findUnique({ where: { productId: p4Id } });
      assert(Boolean(profBefore), 'Profile exists before product delete');

      // Delete Product
      const delProdRes = await request('DELETE', `/api/v1/admin/products/${p4Id}`, undefined, superAdminToken);
      assert(delProdRes.status === 200, 'Product deleted');

      const profAfter = await prisma.sanskritEditProfile.findUnique({ where: { productId: p4Id } });
      assert(!profAfter, 'SanskritEditProfile was cascaded and cleanly deleted');
    });

    // ==========================================
    // CATEGORY L: CONTENT SAFETY & XSS SANITIZATION
    // ==========================================
    console.log('\n--- Category L: Content Safety & XSS Protection ---');

    await test('Sanitize script tags and dangerous HTML from editorialContent', async () => {
      const maliciousHtml = '<p>Devotional text</p><script>alert("XSS")</script><a href="javascript:alert(1)">Link</a>';

      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        editorialContent: maliciousHtml
      }, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(!res.body.data.editorialContent.includes('<script>'), 'Script tag stripped');
      assert(!res.body.data.editorialContent.includes('javascript:'), 'javascript: url stripped');
      assert(res.body.data.editorialContent.includes('<p>Devotional text</p>'), 'Safe text preserved');
    });

    await test('Sanitize dangerous inline event handlers (onload, onerror, onclick)', async () => {
      const maliciousContext = '<p>Philosophy</p><img src="x" onerror="alert(1)" onclick="stealCookies()" />';

      const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/sanskrit-edit`, {
        context: maliciousContext
      }, superAdminToken);

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(!res.body.data.context.includes('onerror'), 'onerror handler stripped');
      assert(!res.body.data.context.includes('onclick'), 'onclick handler stripped');
      assert(res.body.data.context.includes('<p>Philosophy</p>'), 'Safe paragraph preserved');
    });

    // ==========================================
    // CATEGORY M: SEARCH & FACETED FILTERING
    // ==========================================
    console.log('\n--- Category M: Search & Faceted Filtering ---');

    await test('Public storefront search by English translation text (GET /api/v1/sanskrit-edit?search=fruits)', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit?search=fruits');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.length >= 1, 'Found matching item by translation keyword');
    });

    await test('Public storefront filter by source (GET /api/v1/sanskrit-edit?source=Gita)', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit?source=Bhagavad Gita');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(res.body.data.length >= 1, 'Found items matching source');
    });

    await test('Public storefront sorting by price ascending (GET /api/v1/sanskrit-edit?sortBy=price&sortOrder=asc)', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit?sortBy=price&sortOrder=asc');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      if (res.body.data.length >= 2) {
        assert(res.body.data[0].price <= res.body.data[1].price, 'First item price <= second item price');
      }
    });

    await test('Public storefront sorting by price descending (GET /api/v1/sanskrit-edit?sortBy=price&sortOrder=desc)', async () => {
      const res = await request('GET', '/api/v1/sanskrit-edit?sortBy=price&sortOrder=desc');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      if (res.body.data.length >= 2) {
        assert(res.body.data[0].price >= res.body.data[1].price, 'First item price >= second item price');
      }
    });

    // ==========================================
    // CATEGORY N: INACTIVE PRODUCT VISIBILITY
    // ==========================================
    console.log('\n--- Category N: Product Inactive/Archived Visibility ---');

    await test('INACTIVE product with published profile is hidden from public storefront', async () => {
      // Set testProductId1 status to INACTIVE
      await request('PATCH', `/api/v1/admin/products/${testProductId1}/status`, { status: 'INACTIVE' }, superAdminToken);

      const res = await request('GET', '/api/v1/sanskrit-edit');
      assert(res.status === 200, '200 OK');
      const found = res.body.data.find((p: any) => p.id === testProductId1);
      assert(!found, 'Inactive product is hidden from public Sanskrit Edit listing');

      // Restore to ACTIVE
      await request('PATCH', `/api/v1/admin/products/${testProductId1}/status`, { status: 'ACTIVE' }, superAdminToken);
    });

    // ==========================================
    // CATEGORY O: HEALTH & SYSTEM REGRESSION
    // ==========================================
    console.log('\n--- Category O: System Diagnostics & Health Check ---');

    await test('Health check reports Module 10 registered (GET /api/v1/admin/health)', async () => {
      const res = await request('GET', '/api/v1/admin/health');

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const modules = res.body.data.modules;
      assert(modules.some((m: string) => m.includes('Module 10')), 'Module 10 is listed in health check');
    });

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passed}/${passed} MODULE 10 TESTS PASSED!`);
    console.log('======================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
