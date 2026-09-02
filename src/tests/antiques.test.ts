import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5009;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken = '';
let catalogueManagerToken = '';
let contentManagerToken = '';
let marketingManagerToken = '';
let orderManagerToken = '';

let testCategoryId = '';
let testCollectionId = '';
let testProductId1 = '';
let testProductId2 = '';
let testProductIdMultiStock = '';
let testProductIdBackorder = '';
let testProductAntiqueSlug = '';

// Helper: Make HTTP requests
async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: any }> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = { 'Accept': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let reqBody: any = undefined;
  if (body !== undefined) {
    if (typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      reqBody = JSON.stringify(body);
    } else {
      reqBody = String(body);
    }
  }

  const res = await fetch(url, { method, headers, body: reqBody });
  let parsed: any;
  const text = await res.text();
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${message}`);
  } else {
    console.error(`  ✗ [FAIL ${totalTests}] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🏛️  MODULE 9: ANTIQUES & COLLECTIBLES TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize Seed & In-Process HTTP Server
  console.log('--- Phase 0: Setup & Seed ---');
  await runSeed();

  // Clean up any test products from previous test executions
  const testSkus = ['LA-ANT-P1-001', 'LA-ANT-P2-002', 'LA-ANT-MULTI-003', 'LA-ANT-BO-004'];
  for (const sku of testSkus) {
    const existingP = await prisma.product.findUnique({ where: { sku } });
    if (existingP) {
      await prisma.antiqueProfile.deleteMany({ where: { productId: existingP.id } });
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

  let catUser = await prisma.adminUser.findUnique({ where: { email: 'curator.antiques@lagoreearts.com' } });
  if (!catUser) {
    catUser = await prisma.adminUser.create({
      data: {
        name: 'Antiques Catalogue Manager',
        email: 'curator.antiques@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: catRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

  let contUser = await prisma.adminUser.findUnique({ where: { email: 'content.antiques@lagoreearts.com' } });
  if (!contUser) {
    contUser = await prisma.adminUser.create({
      data: {
        name: 'Antiques Content Manager',
        email: 'content.antiques@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: contentRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contUser.id, roleId: contentRole!.id });

  let mktUser = await prisma.adminUser.findUnique({ where: { email: 'marketing.antiques@lagoreearts.com' } });
  if (!mktUser) {
    mktUser = await prisma.adminUser.create({
      data: {
        name: 'Antiques Marketing Manager',
        email: 'marketing.antiques@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: mktRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

  let ordUser = await prisma.adminUser.findUnique({ where: { email: 'order.antiques@lagoreearts.com' } });
  if (!ordUser) {
    ordUser = await prisma.adminUser.create({
      data: {
        name: 'Antiques Order Manager',
        email: 'order.antiques@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: ordRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

  const cat = await prisma.category.findFirst({ where: { slug: 'tanjore-painting' } });
  testCategoryId = cat ? cat.id : (await prisma.category.findFirst())!.id;

  const col = await prisma.collection.findFirst({ where: { slug: 'antique-treasures' } });
  testCollectionId = col ? col.id : (await prisma.collection.findFirst())!.id;

  // Create isolated test products
  const p1Res = await request('POST', '/api/v1/admin/products', {
    name: 'Antique Chola Bronze Parvati Idol',
    slug: 'antique-chola-bronze-parvati-idol',
    sku: 'LA-ANT-P1-001',
    price: 350000,
    costPrice: 180000,
    stockQuantity: 1,
    trackInventory: true,
    allowBackorder: false,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductId1 = p1Res.body.data.id;
  testProductAntiqueSlug = p1Res.body.data.slug;

  const p2Res = await request('POST', '/api/v1/admin/products', {
    name: '18th Century Mughal Miniature Quran Box',
    slug: '18th-century-mughal-miniature-quran-box',
    sku: 'LA-ANT-P2-002',
    price: 120000,
    costPrice: 60000,
    stockQuantity: 1,
    trackInventory: true,
    allowBackorder: false,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductId2 = p2Res.body.data.id;

  const pMultiRes = await request('POST', '/api/v1/admin/products', {
    name: 'Vintage Reproduction Brass Urli',
    slug: 'vintage-reproduction-brass-urli',
    sku: 'LA-ANT-MULTI-003',
    price: 8500,
    costPrice: 4000,
    stockQuantity: 15,
    trackInventory: true,
    allowBackorder: false,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductIdMultiStock = pMultiRes.body.data.id;

  const pBackorderRes = await request('POST', '/api/v1/admin/products', {
    name: 'Artisan Bronze Diya with Backorder',
    slug: 'artisan-bronze-diya-with-backorder',
    sku: 'LA-ANT-BO-004',
    price: 12000,
    costPrice: 6000,
    stockQuantity: 0,
    trackInventory: true,
    allowBackorder: true,
    status: 'ACTIVE',
    categoryId: testCategoryId
  }, superAdminToken);
  testProductIdBackorder = pBackorderRes.body.data.id;

  console.log('✓ Setup complete and test products provisioned\n');

  // =========================================================================
  // CATEGORY A: Antique Profile Lifecycle & CRUD
  // =========================================================================
  console.log('--- Category A: Antique Profile Lifecycle & CRUD ---');

  const createRes1 = await request('POST', `/api/v1/admin/products/${testProductId1}/antique`, {
    era: '12th Century',
    period: 'Late Chola Dynasty',
    approximateAgeFrom: 1150,
    approximateAgeTo: 1190,
    ageDescription: 'Circa 1175 CE',
    origin: 'Thanjavur, Tamil Nadu',
    region: 'South India',
    countryOfOrigin: 'India',
    artistMaker: 'Chola Imperial Bronze Guild',
    attribution: 'Attributed to Royal Sthapati Workshop',
    schoolOrTradition: 'Chola Lost-Wax Bronze Tradition',
    material: 'Ashtadhatu (Eight-Metal Bronze Alloy)',
    technique: 'Cire Perdue (Lost-Wax Casting) & Hand Tooling',
    condition: 'EXCELLENT',
    conditionNotes: 'Magnificent deep malachite and cuprite patina intact with minor natural surface oxidation.',
    restorationStatus: 'ORIGINAL',
    restorationNotes: 'Completely uncleaned, untouched historic temple patina.',
    provenance: 'Acquired from aristocratic private collection, Chennai.',
    provenanceNotes: 'Documented in family collection since 1928.',
    authenticityStatus: 'VERIFIED',
    authenticityNotes: 'Thermoluminescence analysis and metal alloy testing confirm 12th century metallurgy.',
    acquisitionSource: 'Heritage Private Estate Auction, 2025',
    acquisitionNotes: 'Acquisition documentation verified under Antiquities Act.',
    dimensionsDescription: 'Solid cast lost-wax bronze sculpture mounted on original bronze base',
    height: 48.5,
    width: 22.0,
    depth: 18.5,
    diameter: null,
    dimensionUnit: 'CM',
    weight: 9.8,
    weightUnit: 'KG',
    isOneOfAKind: true,
    isCertified: true,
    certificateNumber: 'LA-ANT-CERT-2026-0881',
    certificateIssuer: 'Lagoree Archaeological Council & Heritage Antiquities Board',
    certificateDate: '2026-01-20T00:00:00.000Z'
  }, superAdminToken);

  assert(createRes1.status === 201, 'Create antique profile returns 201 Created');
  assert(createRes1.body.success === true, 'Response indicates success');
  assert(createRes1.body.data.era === '12th Century', 'Profile era is correctly recorded');
  assert(createRes1.body.data.restorationStatus === 'ORIGINAL', 'Restoration status is ORIGINAL');
  assert(createRes1.body.data.authenticityStatus === 'VERIFIED', 'Authenticity status is VERIFIED');
  assert(createRes1.body.data.isOneOfAKind === true, 'One-of-a-kind flag is true');

  // Retrieve profile
  const getRes1 = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`, undefined, superAdminToken);
  assert(getRes1.status === 200, 'Get antique profile returns 200 OK');
  assert(getRes1.body.data.period === 'Late Chola Dynasty', 'Retrieved profile period matches');
  assert(getRes1.body.data.height === 48.5, 'Retrieved height decimal matches');
  assert(getRes1.body.data.weight === 9.8, 'Retrieved weight decimal matches');

  // Update profile
  const updateRes1 = await request('PATCH', `/api/v1/admin/products/${testProductId1}/antique`, {
    condition: 'VERY_GOOD',
    conditionNotes: 'Updated condition notes: Patina is stunning and pristine.'
  }, superAdminToken);
  assert(updateRes1.status === 200, 'Update antique profile returns 200 OK');
  assert(updateRes1.body.data.condition === 'VERY_GOOD', 'Updated condition is VERY_GOOD');
  assert(updateRes1.body.data.conditionNotes.includes('Updated condition notes'), 'Updated condition notes saved');

  // Reject duplicate profile
  const dupRes = await request('POST', `/api/v1/admin/products/${testProductId1}/antique`, {
    era: '12th Century'
  }, superAdminToken);
  assert(dupRes.status === 409, 'Reject duplicate antique profile with 409 Conflict');
  assert(dupRes.body.error.code === 'ANTIQUE_PROFILE_EXISTS', 'Error code is ANTIQUE_PROFILE_EXISTS');

  // Reject non-existent product
  const nonExistentId = '00000000-0000-0000-0000-000000000000';
  const nonExistentCreate = await request('POST', `/api/v1/admin/products/${nonExistentId}/antique`, {
    era: '18th Century'
  }, superAdminToken);
  assert(nonExistentCreate.status === 404, 'Reject creating profile for non-existent product (404)');

  const nonExistentGet = await request('GET', `/api/v1/admin/products/${nonExistentId}/antique`, undefined, superAdminToken);
  assert(nonExistentGet.status === 404, 'Reject getting profile for non-existent product (404)');

  const nonExistentUpdate = await request('PATCH', `/api/v1/admin/products/${nonExistentId}/antique`, {
    era: '18th Century'
  }, superAdminToken);
  assert(nonExistentUpdate.status === 404, 'Reject updating profile for non-existent product (404)');

  // Create & delete profile on Product 2 to verify safe deletion
  await request('POST', `/api/v1/admin/products/${testProductId2}/antique`, {
    era: '18th Century',
    period: 'Mughal Period',
    origin: 'Delhi, India',
    condition: 'GOOD',
    isOneOfAKind: true
  }, superAdminToken);

  const delProfileRes = await request('DELETE', `/api/v1/admin/products/${testProductId2}/antique`, undefined, superAdminToken);
  assert(delProfileRes.status === 200, 'Delete antique profile returns 200 OK');

  const checkParentProd = await request('GET', `/api/v1/admin/products/${testProductId2}`, undefined, superAdminToken);
  assert(checkParentProd.status === 200, 'Parent product remains intact after profile deletion');
  assert(checkParentProd.body.data.id === testProductId2, 'Parent product ID matches');

  const checkDeletedProfile = await request('GET', `/api/v1/admin/products/${testProductId2}/antique`, undefined, superAdminToken);
  assert(checkDeletedProfile.status === 404, 'Antique profile is 404 after deletion');

  // =========================================================================
  // CATEGORY B: Age & Chronology Validations
  // =========================================================================
  console.log('\n--- Category B: Age & Chronology Validations ---');

  // Re-create profile on Product 2 with valid age range
  const validAgeRes = await request('POST', `/api/v1/admin/products/${testProductId2}/antique`, {
    era: '18th Century',
    approximateAgeFrom: 1720,
    approximateAgeTo: 1780,
    ageDescription: 'Circa mid-18th Century',
    isOneOfAKind: true
  }, superAdminToken);
  assert(validAgeRes.status === 201, 'Accept valid age range where from <= to');

  // Reject invalid age range (from > to)
  const invalidAgeRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    approximateAgeFrom: 1850,
    approximateAgeTo: 1700
  }, superAdminToken);
  assert(invalidAgeRes.status === 400, 'Reject age range where from > to with 400 Bad Request');

  // Reject negative approximate age
  const negativeAgeRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    approximateAgeFrom: -50
  }, superAdminToken);
  assert(negativeAgeRes.status === 400, 'Reject negative approximate age from with 400 Bad Request');

  const negativeAgeToRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    approximateAgeTo: -100
  }, superAdminToken);
  assert(negativeAgeToRes.status === 400, 'Reject negative approximate age to with 400 Bad Request');

  // Update with valid age range
  const updateAgeValid = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    approximateAgeFrom: 1740,
    approximateAgeTo: 1760
  }, superAdminToken);
  assert(updateAgeValid.status === 200, 'Update age range with valid boundaries succeeds (200 OK)');
  assert(updateAgeValid.body.data.approximateAgeFrom === 1740, 'approximateAgeFrom updated');
  assert(updateAgeValid.body.data.approximateAgeTo === 1760, 'approximateAgeTo updated');

  // =========================================================================
  // CATEGORY C: Dimensions & Weight Measurement Validations
  // =========================================================================
  console.log('\n--- Category C: Dimensions & Weight Measurement Validations ---');

  // Reject negative height
  const negHeightRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { height: -5 }, superAdminToken);
  assert(negHeightRes.status === 400, 'Reject negative height (400)');

  // Reject negative width
  const negWidthRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { width: -10 }, superAdminToken);
  assert(negWidthRes.status === 400, 'Reject negative width (400)');

  // Reject negative depth
  const negDepthRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { depth: -2 }, superAdminToken);
  assert(negDepthRes.status === 400, 'Reject negative depth (400)');

  // Reject negative diameter
  const negDiamRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { diameter: -8 }, superAdminToken);
  assert(negDiamRes.status === 400, 'Reject negative diameter (400)');

  // Reject negative weight
  const negWeightRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { weight: -1 }, superAdminToken);
  assert(negWeightRes.status === 400, 'Reject negative weight (400)');

  // Valid dimension units test (MM, CM, M, IN, FT)
  for (const unit of ['MM', 'CM', 'M', 'IN', 'FT']) {
    const unitRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { dimensionUnit: unit }, superAdminToken);
    assert(unitRes.status === 200, `Accept valid dimension unit ${unit}`);
  }

  // Reject invalid dimension unit
  const invDimUnit = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { dimensionUnit: 'LIGHTYEARS' }, superAdminToken);
  assert(invDimUnit.status === 400, 'Reject invalid dimension unit (400)');

  // Valid weight units test (G, KG, OZ, LB)
  for (const unit of ['G', 'KG', 'OZ', 'LB']) {
    const unitRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { weightUnit: unit }, superAdminToken);
    assert(unitRes.status === 200, `Accept valid weight unit ${unit}`);
  }

  // Reject invalid weight unit
  const invWeightUnit = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { weightUnit: 'TONS' }, superAdminToken);
  assert(invWeightUnit.status === 400, 'Reject invalid weight unit (400)');

  // =========================================================================
  // CATEGORY D: Condition, Restoration & Authenticity Lifecycle
  // =========================================================================
  console.log('\n--- Category D: Condition, Restoration & Authenticity Lifecycle ---');

  // Test condition enums
  const conditions = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'RESTORED', 'FOR_RESTORATION'];
  for (const cond of conditions) {
    const cRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { condition: cond }, superAdminToken);
    assert(cRes.status === 200, `Accept condition enum ${cond}`);
  }

  const invCondRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { condition: 'MINT_CONDITION' }, superAdminToken);
  assert(invCondRes.status === 400, 'Reject invalid condition enum (400)');

  // Test restoration statuses
  const restStatuses = ['ORIGINAL', 'PARTIALLY_RESTORED', 'FULLY_RESTORED', 'UNKNOWN'];
  for (const rStat of restStatuses) {
    const rRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { restorationStatus: rStat }, superAdminToken);
    assert(rRes.status === 200, `Accept restoration status ${rStat}`);
  }

  const invRestRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, { restorationStatus: 'REMODELED' }, superAdminToken);
  assert(invRestRes.status === 400, 'Reject invalid restoration status (400)');

  // Authenticity status update & certification
  const authRes = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    authenticityStatus: 'VERIFIED',
    authenticityNotes: 'Authenticated by Indian Archaeological Council.',
    isCertified: true,
    certificateNumber: 'LA-ANT-MUGHAL-2026-99',
    certificateIssuer: 'Lagoree Heritage Authentications',
    certificateDate: '2026-02-01T00:00:00.000Z'
  }, superAdminToken);
  assert(authRes.status === 200, 'Update authenticity to VERIFIED with certificate details');
  assert(authRes.body.data.authenticityStatus === 'VERIFIED', 'Authenticity status is VERIFIED');
  assert(authRes.body.data.isCertified === true, 'isCertified is true');
  assert(authRes.body.data.certificateNumber === 'LA-ANT-MUGHAL-2026-99', 'Certificate number saved');

  // Reject invalid certificate date
  const invCertDate = await request('PATCH', `/api/v1/admin/products/${testProductId2}/antique`, {
    certificateDate: 'not-a-valid-date-string'
  }, superAdminToken);
  assert(invCertDate.status === 400, 'Reject invalid certificate date format (400)');

  // =========================================================================
  // CATEGORY E: One-of-a-Kind Strict Inventory Rules
  // =========================================================================
  console.log('\n--- Category E: One-of-a-Kind Strict Inventory Rules ---');

  // Reject creating 1-of-a-kind profile on product with stock > 1
  const multiStockProfileRes = await request('POST', `/api/v1/admin/products/${testProductIdMultiStock}/antique`, {
    era: 'Victorian Era',
    isOneOfAKind: true
  }, superAdminToken);
  assert(multiStockProfileRes.status === 400, 'Reject 1-of-a-kind profile creation when product stock > 1 (400)');
  assert(multiStockProfileRes.body.error.code === 'ONE_OF_A_KIND_STOCK_LIMIT', 'Error code is ONE_OF_A_KIND_STOCK_LIMIT');

  // Reject creating 1-of-a-kind profile on product with allowBackorder: true
  const backorderProfileRes = await request('POST', `/api/v1/admin/products/${testProductIdBackorder}/antique`, {
    era: 'Victorian Era',
    isOneOfAKind: true
  }, superAdminToken);
  assert(backorderProfileRes.status === 400, 'Reject 1-of-a-kind profile creation when allowBackorder is true (400)');
  assert(backorderProfileRes.body.error.code === 'ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED', 'Error code is ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED');

  // Allow creating profile with isOneOfAKind: false for multi-stock items
  const nonOneOfAKindRes = await request('POST', `/api/v1/admin/products/${testProductIdMultiStock}/antique`, {
    era: 'Vintage 20th Century',
    isOneOfAKind: false
  }, superAdminToken);
  assert(nonOneOfAKindRes.status === 201, 'Allow isOneOfAKind: false profile creation for multi-stock items (201)');

  // Reject updating base product stock to > 1 when product has 1-of-a-kind antique profile
  const updateProdStockRes = await request('PATCH', `/api/v1/admin/products/${testProductId1}`, {
    stockQuantity: 5
  }, superAdminToken);
  assert(updateProdStockRes.status === 400, 'Reject updating stock > 1 for 1-of-a-kind antique product (400)');
  assert(updateProdStockRes.body.error.code === 'ONE_OF_A_KIND_STOCK_LIMIT', 'Error code is ONE_OF_A_KIND_STOCK_LIMIT');

  // Reject enabling backorder on base product when product has 1-of-a-kind antique profile
  const updateProdBoRes = await request('PATCH', `/api/v1/admin/products/${testProductId1}`, {
    allowBackorder: true
  }, superAdminToken);
  assert(updateProdBoRes.status === 400, 'Reject enabling backorder for 1-of-a-kind antique product (400)');
  assert(updateProdBoRes.body.error.code === 'ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED', 'Error code is ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED');

  // Allow updating base product stock to 0 or 1 for 1-of-a-kind
  const updateStockZero = await request('PATCH', `/api/v1/admin/products/${testProductId1}`, { stockQuantity: 0 }, superAdminToken);
  assert(updateStockZero.status === 200, 'Allow updating stock to 0 for 1-of-a-kind antique (200)');

  const updateStockOne = await request('PATCH', `/api/v1/admin/products/${testProductId1}`, { stockQuantity: 1 }, superAdminToken);
  assert(updateStockOne.status === 200, 'Allow updating stock to 1 for 1-of-a-kind antique (200)');

  // =========================================================================
  // CATEGORY F: Product Integration & Multi-System Harmony
  // =========================================================================
  console.log('\n--- Category F: Product Integration & Multi-System Harmony ---');

  // Link Collection to Antique Product
  const collLinkRes = await request('PATCH', `/api/v1/admin/products/${testProductId1}`, {
    collectionIds: [testCollectionId]
  }, superAdminToken);
  assert(collLinkRes.status === 200, 'Link collection to antique product (200)');

  // Verify Product detail loads Category, Collection, and Antique Profile seamlessly
  const fullProdRes = await request('GET', `/api/v1/admin/products/${testProductId1}`, undefined, superAdminToken);
  assert(fullProdRes.status === 200, 'Get full antique product (200)');
  assert(fullProdRes.body.data.category !== null, 'Category is attached');
  assert(fullProdRes.body.data.collections.length > 0, 'Collection is attached');
  assert(fullProdRes.body.data.antiqueProfile !== null, 'Antique profile is attached in admin product query');

  // =========================================================================
  // CATEGORY G: Admin Antiques Listing & Faceted Filters
  // =========================================================================
  console.log('\n--- Category G: Admin Antiques Listing & Faceted Filters ---');

  const adminListRes = await request('GET', '/api/v1/admin/antiques', undefined, superAdminToken);
  assert(adminListRes.status === 200, 'List admin antiques (200 OK)');
  assert(adminListRes.body.data.items.length >= 2, 'Returns list of antique products');

  // Filter by era
  const filterEraRes = await request('GET', '/api/v1/admin/antiques?era=12th', undefined, superAdminToken);
  assert(filterEraRes.status === 200, 'Filter admin antiques by era (200 OK)');
  assert(filterEraRes.body.data.items.some((p: any) => p.id === testProductId1), 'Found Chola bronze by era');

  // Filter by condition
  const filterCondRes = await request('GET', '/api/v1/admin/antiques?condition=VERY_GOOD', undefined, superAdminToken);
  assert(filterCondRes.status === 200, 'Filter admin antiques by condition (200 OK)');

  // Filter by authenticityStatus
  const filterAuthRes = await request('GET', '/api/v1/admin/antiques?authenticityStatus=VERIFIED', undefined, superAdminToken);
  assert(filterAuthRes.status === 200, 'Filter admin antiques by authenticityStatus (200 OK)');

  // Filter by isOneOfAKind
  const filterOneRes = await request('GET', '/api/v1/admin/antiques?isOneOfAKind=true', undefined, superAdminToken);
  assert(filterOneRes.status === 200, 'Filter admin antiques by isOneOfAKind (200 OK)');

  // Search by keyword in maker / school / attribution
  const searchRes = await request('GET', '/api/v1/admin/antiques?search=Chola', undefined, superAdminToken);
  assert(searchRes.status === 200, 'Search admin antiques by keyword (200 OK)');

  // =========================================================================
  // CATEGORY H: Storefront Public Catalog & Security Sanitization
  // =========================================================================
  console.log('\n--- Category H: Storefront Public Catalog & Security Sanitization ---');

  const pubListRes = await request('GET', '/api/v1/antiques');
  assert(pubListRes.status === 200, 'Public storefront listing GET /api/v1/antiques returns 200 OK');
  assert(Array.isArray(pubListRes.body.data), 'Returns array of public antique products');
  assert(pubListRes.body.data.length >= 2, 'Contains active antique products');

  // Check sanitization on public product list
  const pubItem1 = pubListRes.body.data.find((p: any) => p.id === testProductId1);
  assert(pubItem1 !== undefined, 'Found test antique in public listing');
  assert(pubItem1.costPrice === undefined, 'costPrice is sanitized from public output');
  assert(pubItem1.antique !== undefined, 'antique profile object is present on public product');
  assert(pubItem1.antique.acquisitionSource === undefined, 'acquisitionSource is sanitized from public output');
  assert(pubItem1.antique.acquisitionNotes === undefined, 'acquisitionNotes is sanitized from public output');
  assert(pubItem1.antique.era === '12th Century', 'Public era field matches');
  assert(pubItem1.antique.authenticityStatus === 'VERIFIED', 'Public authenticityStatus matches');
  assert(pubItem1.antique.dimensions.height === 48.5, 'Public dimensions height formatted');
  assert(pubItem1.antique.certification.isCertified === true, 'Public certification status formatted');

  // Public product detail by slug
  const pubDetailRes = await request('GET', `/api/v1/products/${testProductAntiqueSlug}`);
  assert(pubDetailRes.status === 200, 'Public product detail GET /api/v1/products/:slug returns 200 OK');
  assert(pubDetailRes.body.data.antique !== undefined, 'Public product detail includes antique profile');
  assert(pubDetailRes.body.data.antique.period === 'Late Chola Dynasty', 'Public product detail period matches');
  assert(pubDetailRes.body.data.costPrice === undefined, 'Detail costPrice is sanitized');
  assert(pubDetailRes.body.data.antique.acquisitionNotes === undefined, 'Detail acquisitionNotes is sanitized');

  // =========================================================================
  // CATEGORY I: RBAC & Permission Matrix
  // =========================================================================
  console.log('\n--- Category I: RBAC & Permission Matrix ---');

  // Super Admin: full access
  const saCheck = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`, undefined, superAdminToken);
  assert(saCheck.status === 200, 'SUPER_ADMIN has full antique access');

  // Catalogue Manager: full antique access (create, view, update, delete)
  const catMgrView = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`, undefined, catalogueManagerToken);
  assert(catMgrView.status === 200, 'CATALOGUE_MANAGER can view antique profiles (200)');

  const catMgrUpdate = await request('PATCH', `/api/v1/admin/products/${testProductId1}/antique`, {
    provenance: 'Verified historical provenance.'
  }, catalogueManagerToken);
  assert(catMgrUpdate.status === 200, 'CATALOGUE_MANAGER can update antique profiles (200)');

  // Content Manager: view & update allowed, delete denied
  const contMgrView = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`, undefined, contentManagerToken);
  assert(contMgrView.status === 200, 'CONTENT_MANAGER can view antique profiles (200)');

  const contMgrUpdate = await request('PATCH', `/api/v1/admin/products/${testProductId1}/antique`, {
    ageDescription: 'Circa 1175 CE - Chola Golden Age'
  }, contentManagerToken);
  assert(contMgrUpdate.status === 200, 'CONTENT_MANAGER can update antique profiles (200)');

  const contMgrDel = await request('DELETE', `/api/v1/admin/products/${testProductId1}/antique`, undefined, contentManagerToken);
  assert(contMgrDel.status === 403, 'CONTENT_MANAGER is denied deleting antique profiles (403 Forbidden)');

  // Marketing Manager: view allowed, update/delete denied
  const mktMgrView = await request('GET', '/api/v1/admin/antiques', undefined, marketingManagerToken);
  assert(mktMgrView.status === 200, 'MARKETING_MANAGER can view antiques listing (200)');

  const mktMgrUpdate = await request('PATCH', `/api/v1/admin/products/${testProductId1}/antique`, { era: '13th Century' }, marketingManagerToken);
  assert(mktMgrUpdate.status === 403, 'MARKETING_MANAGER is denied updating antique profiles (403 Forbidden)');

  const mktMgrDel = await request('DELETE', `/api/v1/admin/products/${testProductId1}/antique`, undefined, marketingManagerToken);
  assert(mktMgrDel.status === 403, 'MARKETING_MANAGER is denied deleting antique profiles (403 Forbidden)');

  // Order Manager: all antique endpoints denied
  const ordMgrList = await request('GET', '/api/v1/admin/antiques', undefined, orderManagerToken);
  assert(ordMgrList.status === 403, 'ORDER_MANAGER is denied listing antiques (403 Forbidden)');

  const ordMgrView = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`, undefined, orderManagerToken);
  assert(ordMgrView.status === 403, 'ORDER_MANAGER is denied viewing antique profile (403 Forbidden)');

  // Unauthenticated: 401
  const unauthRes = await request('GET', `/api/v1/admin/products/${testProductId1}/antique`);
  assert(unauthRes.status === 401, 'Unauthenticated request is rejected (401 Unauthorized)');

  // =========================================================================
  // CATEGORY J: Audit Logging Verification
  // =========================================================================
  console.log('\n--- Category J: Audit Logging Verification ---');

  const auditLogs = await prisma.adminAuditLog.findMany({
    where: { entityType: 'AntiqueProfile' }
  });
  assert(auditLogs.length > 0, 'Audit logs recorded for AntiqueProfile actions');

  const createdAction = auditLogs.some((l: any) => l.action === 'ANTIQUE_PROFILE_CREATED');
  assert(createdAction, 'ANTIQUE_PROFILE_CREATED action was logged');

  const updatedAction = auditLogs.some((l: any) => l.action === 'ANTIQUE_PROFILE_UPDATED');
  assert(updatedAction, 'ANTIQUE_PROFILE_UPDATED action was logged');

  const deletedAction = auditLogs.some((l: any) => l.action === 'ANTIQUE_PROFILE_DELETED');
  assert(deletedAction, 'ANTIQUE_PROFILE_DELETED action was logged');

  // =========================================================================
  // CATEGORY K: Cascade Deletion Safety
  // =========================================================================
  console.log('\n--- Category K: Cascade Deletion Safety ---');

  // Deleting parent Product cascades and removes AntiqueProfile
  const delProdRes = await request('DELETE', `/api/v1/admin/products/${testProductId2}`, undefined, superAdminToken);
  assert(delProdRes.status === 200, 'Delete parent product (200 OK)');

  const profileAfterCascade = await prisma.antiqueProfile.findUnique({ where: { productId: testProductId2 } });
  assert(profileAfterCascade === null, 'Associated AntiqueProfile was automatically cleaned up on Product deletion');

  // 4. Teardown
  server.close();
  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} MODULE 9 TESTS PASSED!`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
