import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5011;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testCategoryId: string;
let testProductId1: string;
let testProductId2: string;
let testProductId3: string;
let testMediaId1: string;
let testMediaId2: string;

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
  console.log('🎨 MODULE 11: ARTISTS & MAKERS TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize Seed & In-Process HTTP Server
  console.log('--- Phase 0: Setup & Seed ---');
  await runSeed();

  const superRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const catRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const contentRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const mktRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const ordRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superUser = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({ sub: superUser!.id, roleId: superRole!.id });

  let catUser = await prisma.adminUser.findUnique({ where: { email: 'curator.artist@lagoreearts.com' } });
  if (!catUser) {
    catUser = await prisma.adminUser.create({
      data: {
        name: 'Artist Catalogue Manager',
        email: 'curator.artist@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: catRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

  let contUser = await prisma.adminUser.findUnique({ where: { email: 'content.artist@lagoreearts.com' } });
  if (!contUser) {
    contUser = await prisma.adminUser.create({
      data: {
        name: 'Artist Content Manager',
        email: 'content.artist@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: contentRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contUser.id, roleId: contentRole!.id });

  let mktUser = await prisma.adminUser.findUnique({ where: { email: 'marketing.artist@lagoreearts.com' } });
  if (!mktUser) {
    mktUser = await prisma.adminUser.create({
      data: {
        name: 'Artist Marketing Manager',
        email: 'marketing.artist@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: mktRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

  let ordUser = await prisma.adminUser.findUnique({ where: { email: 'order.artist@lagoreearts.com' } });
  if (!ordUser) {
    ordUser = await prisma.adminUser.create({
      data: {
        name: 'Artist Order Manager',
        email: 'order.artist@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: ordRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // Cleanup any test products/artists from previous runs
  const testSkus = ['LA-ART-001', 'LA-ART-002', 'LA-ART-003', 'LA-TEMP-001'];
  for (const sku of testSkus) {
    const existingP = await prisma.product.findUnique({ where: { sku } });
    if (existingP) {
      await prisma.productArtist.deleteMany({ where: { productId: existingP.id } });
      await prisma.antiqueProfile.deleteMany({ where: { productId: existingP.id } });
      await prisma.product.delete({ where: { id: existingP.id } });
    }
  }

  const testArtistSlugs = [
    'raja-ravi-varma-heritage-trust',
    'raja-ravi-varma-heritage-trust-2',
    'nandalal-bose-santiniketan',
    'xss-test-artist',
    'abanindranath-tagore',
    'kalamkari-master-jonnalagadda-gurappa-chetty',
    'temporary-attached-artist',
    'catalogue-manager-test-artist',
    'content-manager-test-artist'
  ];
  for (const slug of testArtistSlugs) {
    const existingA = await prisma.artist.findUnique({ where: { slug } });
    if (existingA) {
      await prisma.productArtist.deleteMany({ where: { artistId: existingA.id } });
      await prisma.artistMedia.deleteMany({ where: { artistId: existingA.id } });
      await prisma.artist.delete({ where: { id: existingA.id } });
    }
  }

  const testMediaKeys = ['uploads/artist-portrait.jpg', 'uploads/atelier-studio.jpg'];
  for (const key of testMediaKeys) {
    const existingM = await prisma.mediaAsset.findFirst({ where: { storageKey: key } });
    if (existingM) {
      await prisma.artistMedia.deleteMany({ where: { mediaId: existingM.id } });
      await prisma.mediaAsset.delete({ where: { id: existingM.id } });
    }
  }

  // Setup test products & media
  let cat = await prisma.category.findUnique({ where: { slug: 'sculptures' } });
  if (!cat) cat = (await prisma.category.findMany())[0];
  testCategoryId = cat.id;

  const p1 = await prisma.product.create({
    data: {
      name: 'Chola Bronze Dancing Nataraja Masterpiece',
      slug: 'chola-bronze-dancing-nataraja-masterpiece',
      sku: 'LA-ART-001',
      price: 350000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      categoryId: testCategoryId
    }
  });
  testProductId1 = p1.id;

  const p2 = await prisma.product.create({
    data: {
      name: 'Pahari Style Radha Krishna Miniature Panel',
      slug: 'pahari-style-radha-krishna-miniature-panel',
      sku: 'LA-ART-002',
      price: 180000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      categoryId: testCategoryId
    }
  });
  testProductId2 = p2.id;

  const p3 = await prisma.product.create({
    data: {
      name: 'Tanjore Gold Foil Royal Darbar Artwork',
      slug: 'tanjore-gold-foil-royal-darbar-artwork',
      sku: 'LA-ART-003',
      price: 95000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      categoryId: testCategoryId
    }
  });
  testProductId3 = p3.id;

  const m1 = await prisma.mediaAsset.create({
    data: {
      originalFilename: 'artist-portrait.jpg',
      filename: 'artist-portrait.jpg',
      storageKey: 'uploads/artist-portrait.jpg',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mimeType: 'image/jpeg',
      fileSize: 1048576,
      publicUrl: 'https://cdn.lagoree.com/artists/artist-portrait.jpg',
      altText: 'Portrait of Master Sculptor',
      title: 'Master Sculptor Portrait'
    }
  });
  testMediaId1 = m1.id;

  const m2 = await prisma.mediaAsset.create({
    data: {
      originalFilename: 'atelier-studio.jpg',
      filename: 'atelier-studio.jpg',
      storageKey: 'uploads/atelier-studio.jpg',
      checksum: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      mimeType: 'image/jpeg',
      fileSize: 2048576,
      publicUrl: 'https://cdn.lagoree.com/artists/atelier-studio.jpg',
      altText: 'Sculptor Studio Atelier in Patan',
      title: 'Studio Atelier'
    }
  });
  testMediaId2 = m2.id;

  console.log('--- Starting Module 11 Automated Tests ---\n');

  let createdArtistId1: string;
  let createdArtistId2: string;
  let createdArtistId3: string;

  // ==========================================
  // Category A: Schema, Model & Entity Integrity
  // ==========================================
  console.log('--- Category A: Schema, Model & Entity Integrity ---');

  await test('A1: Verify health endpoint includes Module 11', async () => {
    const res = await request('GET', '/api/v1/admin/health', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.modules.includes('Module 11: Artists & Makers'), 'Expected Module 11 in health list');
  });

  await test('A2: Verify seed artists exist in database', async () => {
    const sompura = await prisma.artist.findUnique({ where: { slug: 'master-sculptor-sompura' } });
    assert(sompura !== null, 'Expected master-sculptor-sompura in DB');
    assert(sompura.status === 'ACTIVE', 'Expected ACTIVE status');
    assert(sompura.isFeatured === true, 'Expected isFeatured true');
  });

  // ==========================================
  // Category B: Artist Creation
  // ==========================================
  console.log('\n--- Category B: Artist Creation ---');

  await test('B1: Create Artist with required and optional fields', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Raja Ravi Varma Heritage Trust',
      shortBio: 'Pioneering modern Indian realism combining European academic technique with pure Indian sensibility.',
      biography: '<p>Raja Ravi Varma was an iconic Indian painter whose work is held in royal and national collections.</p>',
      birthYear: 1848,
      deathYear: 1906,
      nationality: 'Indian',
      origin: 'Travancore, Kerala',
      tradition: 'Indo-European Academic Realism',
      medium: 'Oil on Canvas & Oleography',
      specialization: 'Mythological & Royal Portraiture',
      signature: 'Ravi Varma',
      status: 'ACTIVE',
      isFeatured: true,
      sortOrder: 10
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Expected success true');
    assert(res.body.data.id !== undefined, 'Expected created artist id');
    assert(res.body.data.name === 'Raja Ravi Varma Heritage Trust', 'Expected correct name');
    assert(res.body.data.slug === 'raja-ravi-varma-heritage-trust', 'Expected generated slug');
    assert(res.body.data.birthYear === 1848, 'Expected birthYear 1848');
    assert(res.body.data.deathYear === 1906, 'Expected deathYear 1906');
    createdArtistId1 = res.body.data.id;
  });

  await test('B2: Reject creation when name is missing or empty', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      shortBio: 'Anonymous master'
    }, superAdminToken);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('B3: Reject creation with invalid status enum', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Invalid Status Artist',
      status: 'SUSPENDED'
    }, superAdminToken);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ==========================================
  // Category C: Artist Name & Slug Handling
  // ==========================================
  console.log('\n--- Category C: Artist Name & Slug Handling ---');

  await test('C1: Auto-generate slug with collision resolution', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Raja Ravi Varma Heritage Trust'
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.slug === 'raja-ravi-varma-heritage-trust-2', `Expected slug collision -2, got ${res.body.data.slug}`);
    createdArtistId2 = res.body.data.id;
  });

  await test('C2: Explicit custom slug accepted', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Nandalal Bose Heritage',
      slug: 'nandalal-bose-santiniketan'
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.slug === 'nandalal-bose-santiniketan', 'Expected custom slug');
    createdArtistId3 = res.body.data.id;
  });

  await test('C3: Reject duplicate explicit slug', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Another Trust',
      slug: 'nandalal-bose-santiniketan'
    }, superAdminToken);

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error.code === 'ARTIST_DUPLICATE_SLUG', `Expected ARTIST_DUPLICATE_SLUG, got ${res.body.error.code}`);
  });

  // ==========================================
  // Category D: Artist Bio & Rich-text Sanitization
  // ==========================================
  console.log('\n--- Category D: Bio & Rich-text Sanitization ---');

  await test('D1: Strip harmful scripts and event handlers from biography', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'XSS Test Artist',
      biography: '<p>Master sculptor <script>alert("hacked")</script><a href="javascript:void(0)" onclick="steal()">Click</a></p>'
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(!res.body.data.biography.includes('<script>'), 'Expected script tags stripped');
    assert(!res.body.data.biography.includes('onclick='), 'Expected event handlers stripped');
    assert(!res.body.data.biography.includes('javascript:'), 'Expected javascript pseudo-protocol stripped');
  });

  await test('D2: Reject bio longer than 500 characters', async () => {
    const longBio = 'A'.repeat(501);
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Long Bio Artist',
      shortBio: longBio
    }, superAdminToken);

    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ==========================================
  // Category E: Artist Dates & Lifespan
  // ==========================================
  console.log('\n--- Category E: Dates & Lifespan ---');

  await test('E1: Accept valid birth and death year range', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Abanindranath Tagore',
      birthYear: 1871,
      deathYear: 1951
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.birthYear === 1871, 'Expected 1871');
    assert(res.body.data.deathYear === 1951, 'Expected 1951');
  });

  await test('E2: Reject deathYear earlier than birthYear', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Time Traveler Artist',
      birthYear: 1950,
      deathYear: 1920
    }, superAdminToken);

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error.code === 'ARTIST_INVALID_DATE_RANGE', `Expected ARTIST_INVALID_DATE_RANGE, got ${res.body.error.code}`);
  });

  await test('E3: Reject out-of-range birthYear', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Future Artist',
      birthYear: 2500
    }, superAdminToken);

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error.code === 'ARTIST_INVALID_BIRTH_YEAR', `Expected ARTIST_INVALID_BIRTH_YEAR, got ${res.body.error.code}`);
  });

  // ==========================================
  // Category F: Regional, Tradition & Medium Metadata
  // ==========================================
  console.log('\n--- Category F: Regional, Tradition & Medium Metadata ---');

  await test('F1: Store and retrieve cultural provenance metadata', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Kalamkari Master Jonnalagadda Gurappa Chetty',
      origin: 'Srikalahasti, Andhra Pradesh',
      tradition: 'Srikalahasti Kalamkari Sacred Textiles',
      medium: 'Natural Vegetable Dyes on Handspun Cotton',
      specialization: 'Ramayana & Mahabharata Narrative Scrolls',
      signature: 'J. Gurappa Chetty'
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.origin === 'Srikalahasti, Andhra Pradesh', 'Expected origin match');
    assert(res.body.data.tradition === 'Srikalahasti Kalamkari Sacred Textiles', 'Expected tradition match');
    assert(res.body.data.medium === 'Natural Vegetable Dyes on Handspun Cotton', 'Expected medium match');
  });

  // ==========================================
  // Category G: Status & Lifecycle
  // ==========================================
  console.log('\n--- Category G: Status & Lifecycle ---');

  await test('G1: Update artist status to INACTIVE', async () => {
    const res = await request('PATCH', `/api/v1/admin/artists/${createdArtistId2}/status`, {
      status: 'INACTIVE'
    }, superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.status === 'INACTIVE', 'Expected status INACTIVE');
  });

  // ==========================================
  // Category H: Featured Flag
  // ==========================================
  console.log('\n--- Category H: Featured Flag ---');

  await test('H1: Toggle artist featured flag', async () => {
    const res = await request('PATCH', `/api/v1/admin/artists/${createdArtistId3}/featured`, {
      isFeatured: true
    }, superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.isFeatured === true, 'Expected isFeatured true');
  });

  // ==========================================
  // Category I: Artist Sort Ordering
  // ==========================================
  console.log('\n--- Category I: Artist Sort Ordering ---');

  await test('I1: Bulk reorder artists', async () => {
    const res = await request('PUT', '/api/v1/admin/artists/order', [
      { id: createdArtistId1, sortOrder: 1 },
      { id: createdArtistId3, sortOrder: 2 }
    ], superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const a1 = await prisma.artist.findUnique({ where: { id: createdArtistId1 } });
    assert(a1.sortOrder === 1, `Expected sortOrder 1, got ${a1.sortOrder}`);
  });

  // ==========================================
  // Category J & K: Search, Filter, Pagination
  // ==========================================
  console.log('\n--- Categories J & K: Search, Filter & Pagination ---');

  await test('J1: Admin search by name query', async () => {
    const res = await request('GET', '/api/v1/admin/artists?search=Ravi Varma', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.length >= 2, `Expected >= 2 matches, got ${res.body.data.length}`);
    assert(res.body.pagination.total >= 2, 'Expected total >= 2');
  });

  await test('J2: Admin filter by status', async () => {
    const res = await request('GET', '/api/v1/admin/artists?status=INACTIVE', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.some((a: any) => a.id === createdArtistId2), 'Expected inactive artist in list');
  });

  await test('K1: Admin pagination limit & page', async () => {
    const res = await request('GET', '/api/v1/admin/artists?page=1&limit=2', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.length === 2, `Expected 2 items, got ${res.body.data.length}`);
    assert(res.body.pagination.page === 1, 'Expected page 1');
    assert(res.body.pagination.limit === 2, 'Expected limit 2');
  });

  // ==========================================
  // Category L: Artist Update Operations
  // ==========================================
  console.log('\n--- Category L: Artist Update Operations ---');

  await test('L1: Update artist details and SEO tags', async () => {
    const res = await request('PATCH', `/api/v1/admin/artists/${createdArtistId1}`, {
      shortBio: 'Updated bio for Raja Ravi Varma Heritage Trust.',
      metaTitle: 'Raja Ravi Varma Masterpieces | Lagoree Arts',
      metaDescription: 'Discover authentic provenance artwork by the Raja Ravi Varma atelier.'
    }, superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.shortBio === 'Updated bio for Raja Ravi Varma Heritage Trust.', 'Expected updated bio');
    assert(res.body.data.metaTitle === 'Raja Ravi Varma Masterpieces | Lagoree Arts', 'Expected updated metaTitle');
  });

  // ==========================================
  // Category M & N: Deletion Safety & Cascades
  // ==========================================
  console.log('\n--- Categories M & N: Deletion Safety & Product Cascades ---');

  let deletableArtistId: string;
  let tempProductId: string;

  await test('M1: Prepare artist and attach to product', async () => {
    const art = await prisma.artist.create({
      data: { name: 'Temporary Attached Artist', slug: 'temporary-attached-artist' }
    });
    deletableArtistId = art.id;

    const prod = await prisma.product.create({
      data: {
        name: 'Temporary Cascade Test Product',
        slug: 'temp-cascade-test-product',
        sku: 'LA-TEMP-001',
        price: 10000,
        categoryId: testCategoryId
      }
    });
    tempProductId = prod.id;

    const attachRes = await request('POST', `/api/v1/admin/products/${tempProductId}/artists`, {
      artistId: deletableArtistId,
      role: 'ARTIST',
      isPrimary: true
    }, superAdminToken);

    assert(attachRes.status === 201, `Expected 201, got ${attachRes.status}`);
  });

  await test('M2: Prevent deletion of artist associated with products (409 ARTIST_IN_USE)', async () => {
    const res = await request('DELETE', `/api/v1/admin/artists/${deletableArtistId}`, undefined, superAdminToken);
    assert(res.status === 409, `Expected 409, got ${res.status}`);
    assert(res.body.error.code === 'ARTIST_IN_USE', `Expected ARTIST_IN_USE, got ${res.body.error.code}`);
  });

  await test('N1: Deleting a product cascades to delete its ProductArtist relationships', async () => {
    const res = await request('DELETE', `/api/v1/admin/products/${tempProductId}`, undefined, superAdminToken);
    assert(res.status === 200, `Expected 200 on product delete, got ${res.status}`);

    const links = await prisma.productArtist.findMany({ where: { productId: tempProductId } });
    assert(links.length === 0, 'Expected product_artists links deleted via product cascade');
  });

  await test('M3: Delete artist successfully once unlinked from products', async () => {
    const res = await request('DELETE', `/api/v1/admin/artists/${deletableArtistId}`, undefined, superAdminToken);
    assert(res.status === 200, `Expected 200 on artist delete, got ${res.status}`);
  });

  // ==========================================
  // Categories O, P, Q: Normalized Junction & Roles
  // ==========================================
  console.log('\n--- Categories O, P, Q: Junction Architecture & Roles ---');

  await test('O1: Attach artist to product with composite key (productId, artistId, role)', async () => {
    const res = await request('POST', `/api/v1/admin/products/${testProductId1}/artists`, {
      artistId: createdArtistId1,
      role: 'ARTIST',
      isPrimary: true,
      sortOrder: 1
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.productId === testProductId1, 'Expected productId match');
    assert(res.body.data.artistId === createdArtistId1, 'Expected artistId match');
    assert(res.body.data.role === 'ARTIST', 'Expected role ARTIST');
    assert(res.body.data.isPrimary === true, 'Expected isPrimary true');
  });

  await test('O2: Reject duplicate attachment with same (productId, artistId, role)', async () => {
    const res = await request('POST', `/api/v1/admin/products/${testProductId1}/artists`, {
      artistId: createdArtistId1,
      role: 'ARTIST'
    }, superAdminToken);

    assert(res.status === 409, `Expected 409, got ${res.status}`);
    assert(res.body.error.code === 'PRODUCT_ARTIST_DUPLICATE', `Expected PRODUCT_ARTIST_DUPLICATE, got ${res.body.error.code}`);
  });

  await test('P1: Allow multiple distinct roles for same artist on same product', async () => {
    const res = await request('POST', `/api/v1/admin/products/${testProductId1}/artists`, {
      artistId: createdArtistId1,
      role: 'DESIGNER',
      isPrimary: false
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.role === 'DESIGNER', 'Expected role DESIGNER');
  });

  await test('Q1: Attach second artist with MAKER role to product', async () => {
    const res = await request('POST', `/api/v1/admin/products/${testProductId1}/artists`, {
      artistId: createdArtistId3,
      role: 'MAKER',
      isPrimary: false,
      sortOrder: 2
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.artistId === createdArtistId3, 'Expected createdArtistId3');
    assert(res.body.data.role === 'MAKER', 'Expected role MAKER');
  });

  // ==========================================
  // Category R & S: Single Primary Artist Rule
  // ==========================================
  console.log('\n--- Categories R & S: Single Primary Artist Rule ---');

  await test('R1: Setting a new primary artist unsets the previous primary artist', async () => {
    const res = await request('PATCH', `/api/v1/admin/products/${testProductId1}/artists/${createdArtistId3}?role=MAKER`, {
      isPrimary: true
    }, superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.isPrimary === true, 'Expected artist3 now primary');

    const previousPrimary = await prisma.productArtist.findUnique({
      where: { productId_artistId_role: { productId: testProductId1, artistId: createdArtistId1, role: 'ARTIST' } }
    });
    assert(previousPrimary.isPrimary === false, 'Expected previous primary isPrimary to be false');
  });

  // ==========================================
  // Category T & U: Detach & Reordering
  // ==========================================
  console.log('\n--- Categories T & U: Detach & Reordering ---');

  await test('U1: Reorder product artists', async () => {
    const res = await request('PUT', `/api/v1/admin/products/${testProductId1}/artists/order`, [
      { artistId: createdArtistId1, role: 'ARTIST', sortOrder: 1 },
      { artistId: createdArtistId3, role: 'MAKER', sortOrder: 2 },
      { artistId: createdArtistId1, role: 'DESIGNER', sortOrder: 3 }
    ], superAdminToken);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('T1: Detach specific role of an artist from product', async () => {
    const res = await request('DELETE', `/api/v1/admin/products/${testProductId1}/artists/${createdArtistId1}?role=DESIGNER`, undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const remaining = await prisma.productArtist.findMany({ where: { productId: testProductId1 } });
    assert(remaining.length === 2, `Expected 2 remaining artists, got ${remaining.length}`);
  });

  // ==========================================
  // Categories V, W, X: Artist Media Junction
  // ==========================================
  console.log('\n--- Categories V, W, X: Artist Media Junction ---');

  await test('V1: Attach PROFILE image to artist', async () => {
    const res = await request('POST', `/api/v1/admin/artists/${createdArtistId1}/media`, {
      mediaId: testMediaId1,
      role: 'PROFILE',
      isPrimary: true,
      sortOrder: 1
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.artistId === createdArtistId1, 'Expected artistId match');
    assert(res.body.data.mediaId === testMediaId1, 'Expected mediaId match');
    assert(res.body.data.isPrimary === true, 'Expected isPrimary true');
  });

  await test('V2: Attach GALLERY image to artist', async () => {
    const res = await request('POST', `/api/v1/admin/artists/${createdArtistId1}/media`, {
      mediaId: testMediaId2,
      role: 'GALLERY',
      isPrimary: false,
      sortOrder: 2
    }, superAdminToken);

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.role === 'GALLERY', 'Expected role GALLERY');
  });

  await test('W1: Set new primary media unsets previous primary', async () => {
    const res = await request('PATCH', `/api/v1/admin/artists/${createdArtistId1}/media/${testMediaId2}/primary?role=GALLERY`, undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.isPrimary === true, 'Expected media2 primary');
  });

  await test('X1: Detach media from artist', async () => {
    const res = await request('DELETE', `/api/v1/admin/artists/${createdArtistId1}/media/${testMediaId2}?role=GALLERY`, undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const mediaList = await prisma.artistMedia.findMany({ where: { artistId: createdArtistId1 } });
    assert(mediaList.length === 1, `Expected 1 media remaining, got ${mediaList.length}`);
  });

  // ==========================================
  // Category Y: Antique Attribution Migration
  // ==========================================
  console.log('\n--- Category Y: Antique Attribution Migration ---');

  await test('Y1: Dry run migration reports matches and ignores ambiguous phrases', async () => {
    // Create an antique profile with canonical artist name
    await prisma.antiqueProfile.create({
      data: {
        productId: testProductId2,
        artistMaker: 'Master Sculptor Sompura',
        attribution: 'Direct Atelier'
      }
    });

    // Create an antique profile with ambiguous phrase
    await prisma.antiqueProfile.create({
      data: {
        productId: testProductId3,
        artistMaker: 'School of Pahari Masters',
        attribution: 'Attributed to 18th Century Guild'
      }
    });

    const res = await request('POST', '/api/v1/admin/artists/migrate?dryRun=true', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.scanned >= 2, 'Expected scanned >= 2');
    assert(res.body.data.matched >= 1, `Expected >= 1 matched, got ${res.body.data.matched}`);
    assert(res.body.data.ambiguous >= 1, `Expected >= 1 ambiguous, got ${res.body.data.ambiguous}`);

    // Verify dry run did NOT insert to DB
    const sompura = await prisma.artist.findUnique({ where: { slug: 'master-sculptor-sompura' } });
    const link = await prisma.productArtist.findUnique({
      where: { productId_artistId_role: { productId: testProductId2, artistId: sompura.id, role: 'ARTIST' } }
    });
    assert(link === null, 'Expected dry run not to create real DB link');
  });

  await test('Y2: Live migration links canonical artists non-destructively', async () => {
    const res = await request('POST', '/api/v1/admin/artists/migrate?dryRun=false', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.matched >= 1, 'Expected matched >= 1');

    // Verify DB link created
    const sompura = await prisma.artist.findUnique({ where: { slug: 'master-sculptor-sompura' } });
    const link = await prisma.productArtist.findUnique({
      where: { productId_artistId_role: { productId: testProductId2, artistId: sompura.id, role: 'ARTIST' } }
    });
    assert(link !== null, 'Expected live migration to create ProductArtist link');

    // Verify original AntiqueProfile text fields are completely intact
    const prof = await prisma.antiqueProfile.findUnique({ where: { productId: testProductId2 } });
    assert(prof.artistMaker === 'Master Sculptor Sompura', 'Expected artistMaker intact');
    assert(prof.attribution === 'Direct Atelier', 'Expected attribution intact');
  });

  await test('Y3: Migration is idempotent on subsequent runs', async () => {
    const res = await request('POST', '/api/v1/admin/artists/migrate?dryRun=false', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.alreadyLinked >= 1, 'Expected alreadyLinked >= 1 on second run');
  });

  // ==========================================
  // Category Z, AA, AB: Public Storefront APIs
  // ==========================================
  console.log('\n--- Categories Z, AA, AB: Public Storefront APIs ---');

  await test('Z1: Public artists list returns ACTIVE artists only', async () => {
    const res = await request('GET', '/api/v1/artists?limit=100');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected array data');
    assert(!res.body.data.some((a: any) => a.id === createdArtistId2), 'Expected inactive artist NOT in public list');
    assert(res.body.data.some((a: any) => a.id === createdArtistId1), 'Expected active artist in public list');
  });

  await test('AA1: Public artist detail returns active products and sanitized profile', async () => {
    const res = await request('GET', '/api/v1/artists/raja-ravi-varma-heritage-trust');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.name === 'Raja Ravi Varma Heritage Trust', 'Expected artist name');
    assert(Array.isArray(res.body.data.products), 'Expected products array');
    assert(res.body.data.products.some((p: any) => p.id === testProductId1), 'Expected product1 in artist portfolio');
    // Ensure admin cost price is sanitized
    assert(res.body.data.products[0].costPrice === undefined, 'Expected costPrice sanitized');
  });

  await test('AB1: Public product detail includes enriched active artists array', async () => {
    const res = await request('GET', '/api/v1/products/chola-bronze-dancing-nataraja-masterpiece');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data.artists), 'Expected artists array on product');
    assert(res.body.data.artists.length >= 1, `Expected >= 1 artists, got ${res.body.data.artists.length}`);
    assert(res.body.data.artists[0].artist.name !== undefined, 'Expected nested artist object');
  });

  // ==========================================
  // Category AC: RBAC Permissions
  // ==========================================
  console.log('\n--- Category AC: RBAC Permissions Matrix ---');

  await test('AC1: Super Admin has full permissions', async () => {
    const res = await request('GET', '/api/v1/admin/artists', undefined, superAdminToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('AC2: Catalogue Manager can create, view, update, delete artists', async () => {
    const res = await request('POST', '/api/v1/admin/artists', {
      name: 'Catalogue Manager Test Artist'
    }, catalogueManagerToken);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
  });

  await test('AC3: Content Manager can view, create, update but CANNOT delete artist', async () => {
    const createRes = await request('POST', '/api/v1/admin/artists', {
      name: 'Content Manager Test Artist'
    }, contentManagerToken);
    assert(createRes.status === 201, `Expected 201, got ${createRes.status}`);

    const deleteRes = await request('DELETE', `/api/v1/admin/artists/${createRes.body.data.id}`, undefined, contentManagerToken);
    assert(deleteRes.status === 403, `Expected 403 for Content Manager delete, got ${deleteRes.status}`);
  });

  await test('AC4: Marketing Manager can view artists but CANNOT create', async () => {
    const viewRes = await request('GET', '/api/v1/admin/artists', undefined, marketingManagerToken);
    assert(viewRes.status === 200, `Expected 200, got ${viewRes.status}`);

    const createRes = await request('POST', '/api/v1/admin/artists', {
      name: 'Marketing Should Fail Artist'
    }, marketingManagerToken);
    assert(createRes.status === 403, `Expected 403, got ${createRes.status}`);
  });

  await test('AC5: Order Manager has NO artist permissions', async () => {
    const viewRes = await request('GET', '/api/v1/admin/artists', undefined, orderManagerToken);
    assert(viewRes.status === 403, `Expected 403, got ${viewRes.status}`);
  });

  // ==========================================
  // Category AD: Audit Logging
  // ==========================================
  console.log('\n--- Category AD: Audit Logging ---');

  await test('AD1: Verify audit logs created for artist operations', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: { module: 'ARTISTS' }
    });
    assert(logs.length >= 5, `Expected >= 5 audit logs, got ${logs.length}`);
    const actions = logs.map(l => l.action);
    assert(actions.includes('ARTIST_CREATED'), 'Expected ARTIST_CREATED in audit logs');
    assert(actions.includes('PRODUCT_ARTIST_ATTACHED'), 'Expected PRODUCT_ARTIST_ATTACHED in audit logs');
  });

  // ==========================================
  // Category AE: Cross-Module Invariant Verification
  // ==========================================
  console.log('\n--- Category AE: Cross-Module Invariant Verification ---');

  await test('AE1: Sanskrit Edit product has associated Master Sculptor artist', async () => {
    const prod = await prisma.product.findUnique({
      where: { slug: 'dharmachakra-pravartana-sacred-brass-wall-panel' },
      include: { artists: { include: { artist: true } }, sanskritEditProfile: true }
    });

    assert(prod !== null, 'Expected Sanskrit Edit product in DB');
    assert(prod.sanskritEditProfile !== null, 'Expected sanskritEditProfile attached');
    assert(prod.artists.length === 1, `Expected 1 artist, got ${prod.artists.length}`);
    assert(prod.artists[0].artist.name === 'Master Sculptor Sompura', `Expected Sompura artist, got ${prod.artists[0].artist.name}`);
    assert(prod.artists[0].isPrimary === true, 'Expected isPrimary true');
  });

  await test('AE2: All baseline Module 1-10 endpoints remain intact', async () => {
    const catRes = await request('GET', '/api/v1/categories');
    assert(catRes.status === 200, 'Categories OK');
    const colRes = await request('GET', '/api/v1/collections');
    assert(colRes.status === 200, 'Collections OK');
    const prodRes = await request('GET', '/api/v1/products');
    assert(prodRes.status === 200, 'Products OK');
    const antRes = await request('GET', '/api/v1/antiques');
    assert(antRes.status === 200, 'Antiques OK');
    const sanRes = await request('GET', '/api/v1/sanskrit-edit');
    assert(sanRes.status === 200, 'Sanskrit Edit OK');
  });

  // Teardown
  server.close();

  console.log('\n======================================================');
  console.log(`🎉 MODULE 11 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  if (server) server.close();
  process.exit(1);
});
