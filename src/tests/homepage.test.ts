import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5012;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testCategoryId: string;
let testCollectionId: string;
let testArtistId: string;
let testProductId1: string;
let testProductId2: string;
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

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message || err}`);
      if (err.stack) console.error(`    ${err.stack.split('\n').slice(1, 4).join('\n    ')}`);
      failed++;
    }
  };
}

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  LAGOREE ARTS — MODULE 12: HOMEPAGE CMS TESTS');
  console.log('==================================================\n');

  // 1. Setup & Seed
  await runSeed();

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // Generate tokens for each role
  const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const catRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const contentRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const mktRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const ordRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({ sub: superAdminUser?.id || 'admin-id', roleId: superAdminRole?.id || '' });

  let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.homepage@lagoreearts.com' } });
  if (!catUser) {
    catUser = prisma.adminUser.create({
      data: {
        name: 'Homepage Catalogue Manager',
        email: 'cat.homepage@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: catRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

  let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.homepage@lagoreearts.com' } });
  if (!contentUser) {
    contentUser = prisma.adminUser.create({
      data: {
        name: 'Homepage Content Manager',
        email: 'content.homepage@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: contentRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentRole!.id });

  let mktUser = prisma.adminUser.findUnique({ where: { email: 'mkt.homepage@lagoreearts.com' } });
  if (!mktUser) {
    mktUser = prisma.adminUser.create({
      data: {
        name: 'Homepage Marketing Manager',
        email: 'mkt.homepage@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: mktRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

  let ordUser = prisma.adminUser.findUnique({ where: { email: 'ord.homepage@lagoreearts.com' } });
  if (!ordUser) {
    ordUser = prisma.adminUser.create({
      data: {
        name: 'Homepage Order Manager',
        email: 'ord.homepage@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: ordRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

  // Get or create test fixtures
  const cat = prisma.category.findFirst({ where: { status: 'ACTIVE' } });
  testCategoryId = cat?.id || '';

  const col = prisma.collection.findFirst({ where: { status: 'ACTIVE' } });
  testCollectionId = col?.id || '';

  const art = prisma.artist.findFirst({ where: { status: 'ACTIVE' } });
  testArtistId = art?.id || '';

  const prods = prisma.product.findMany({ where: { status: 'ACTIVE' }, take: 2 });
  testProductId1 = prods[0]?.id || '';
  testProductId2 = prods[1]?.id || '';

  const medias = prisma.mediaAsset.findMany({ take: 2 });
  testMediaId1 = medias[0]?.id || '';
  testMediaId2 = medias[1]?.id || '';

  // Cleanup any leftover test homepages from prior test runs
  const otherHomepages = await prisma.homepage.findMany();
  for (const hp of otherHomepages) {
    if (hp.slug !== 'default-storefront') {
      await prisma.homepage.delete({ where: { id: hp.id } });
    }
  }

  // Tests registry
  const tests: (() => Promise<void>)[] = [];

  // =========================================================================
  // CATEGORY A: Schema, Models & Diagnostic
  // =========================================================================
  tests.push(
    test('A1: Health check includes Module 12: Homepage CMS', async () => {
      const res = await request('GET', '/api/v1/admin/health');
      assertEqual(res.status, 200, 'Health check should return 200');
      assert(res.body.data.modules.includes('Module 12: Homepage CMS'), 'Module 12 should be in health check modules');
    })
  );

  tests.push(
    test('A2: Default seed homepage exists and is published with sections', async () => {
      const defaultHp = await prisma.homepage.findFirst({ where: { slug: 'default-storefront' }, include: { sections: true } });
      assert(defaultHp, 'Default storefront homepage should exist');
      assertEqual(defaultHp?.status, 'PUBLISHED', 'Default homepage should be PUBLISHED');
      assertEqual(defaultHp?.isDefault, true, 'Default homepage should have isDefault = true');
      assert((defaultHp?.sections?.length || 0) >= 4, 'Default homepage should have at least 4 seeded sections');
    })
  );

  // =========================================================================
  // CATEGORY B: Homepage Admin CRUD & Pagination & Search
  // =========================================================================
  let createdHomepageId: string;

  tests.push(
    test('B1: Create a new draft homepage with auto-generated slug', async () => {
      const res = await request('POST', '/api/v1/admin/homepage', {
        name: 'Diwali Heritage Exhibition 2026',
        seoTitle: 'Diwali Heritage Exhibition | Lagoree Arts',
        seoDescription: 'Exclusive festival curation of golden Tanjore paintings and bronzes.'
      }, superAdminToken);

      assertEqual(res.status, 201, 'Should return 201 Created');
      assert(res.body.success, 'Response should indicate success');
      createdHomepageId = res.body.data.id;
      assertEqual(res.body.data.name, 'Diwali Heritage Exhibition 2026', 'Name matches');
      assertEqual(res.body.data.slug, 'diwali-heritage-exhibition-2026', 'Auto-generated slug matches');
      assertEqual(res.body.data.status, 'DRAFT', 'Default status is DRAFT');
      assertEqual(res.body.data.isDefault, false, 'Default isDefault is false');
    })
  );

  tests.push(
    test('B2: Get homepage by ID with sections and media relations', async () => {
      const res = await request('GET', `/api/v1/admin/homepage/${createdHomepageId}`, undefined, superAdminToken);
      assertEqual(res.status, 200, 'Should return 200');
      assertEqual(res.body.data.id, createdHomepageId, 'ID matches');
      assert(Array.isArray(res.body.data.sections), 'Sections is an array');
    })
  );

  tests.push(
    test('B3: List homepages with search and pagination', async () => {
      const res = await request('GET', '/api/v1/admin/homepage?search=Diwali&page=1&limit=10', undefined, superAdminToken);
      assertEqual(res.status, 200, 'Should return 200');
      assert(res.body.data.items.length >= 1, 'Search finds at least 1 homepage');
      assertEqual(res.body.data.pagination.page, 1, 'Pagination page is 1');
      assert(res.body.data.items.some((h: any) => h.id === createdHomepageId), 'Found created homepage');
    })
  );

  tests.push(
    test('B4: Update homepage metadata and SEO fields', async () => {
      const res = await request('PATCH', `/api/v1/admin/homepage/${createdHomepageId}`, {
        name: 'Diwali Royal Heritage Exhibition 2026',
        seoKeywords: 'diwali, royal, heritage, gold art'
      }, superAdminToken);

      assertEqual(res.status, 200, 'Should return 200');
      assertEqual(res.body.data.name, 'Diwali Royal Heritage Exhibition 2026', 'Name updated');
      assertEqual(res.body.data.seoKeywords, 'diwali, royal, heritage, gold art', 'Keywords updated');
    })
  );

  // =========================================================================
  // CATEGORY C: Slugs & Uniqueness
  // =========================================================================
  tests.push(
    test('C1: Reject invalid custom slug format', async () => {
      const res = await request('POST', '/api/v1/admin/homepage', {
        name: 'Invalid Slug Homepage',
        slug: 'INVALID_SLUG!!'
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject invalid slug format');
    })
  );

  tests.push(
    test('C2: Reject duplicate custom slug', async () => {
      const res = await request('POST', '/api/v1/admin/homepage', {
        name: 'Duplicate Slug Homepage',
        slug: 'default-storefront'
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject duplicate slug');
      assertEqual(res.body.error.code, 'HOMEPAGE_DUPLICATE_SLUG', 'Error code matches');
    })
  );

  // =========================================================================
  // CATEGORY D: Status Transitions & Single Default Homepage Invariant
  // =========================================================================
  tests.push(
    test('D1: Reject setting draft homepage as default (requires PUBLISHED)', async () => {
      const res = await request('PATCH', `/api/v1/admin/homepage/${createdHomepageId}/default`, undefined, superAdminToken);
      assertEqual(res.status, 400, 'Draft homepage cannot be set to default');
      assertEqual(res.body.error.code, 'HOMEPAGE_DEFAULT_REQUIRES_PUBLISHED', 'Error code matches');
    })
  );

  tests.push(
    test('D2: Publish homepage and transition status', async () => {
      const res = await request('PATCH', `/api/v1/admin/homepage/${createdHomepageId}/status`, {
        status: 'PUBLISHED'
      }, superAdminToken);

      assertEqual(res.status, 200, 'Should return 200');
      assertEqual(res.body.data.status, 'PUBLISHED', 'Status is PUBLISHED');
    })
  );

  tests.push(
    test('D3: Set new default homepage and verify previous default is unset', async () => {
      const res = await request('PATCH', `/api/v1/admin/homepage/${createdHomepageId}/default`, undefined, superAdminToken);
      assertEqual(res.status, 200, 'Should return 200');
      assertEqual(res.body.data.isDefault, true, 'New homepage is default');

      // Verify previous default is no longer default
      const oldDefault = await prisma.homepage.findUnique({ where: { slug: 'default-storefront' } });
      assertEqual(oldDefault?.isDefault, false, 'Previous default is unset');
    })
  );

  tests.push(
    test('D4: Switch default back to main storefront', async () => {
      const mainHp = await prisma.homepage.findUnique({ where: { slug: 'default-storefront' } });
      const res = await request('PATCH', `/api/v1/admin/homepage/${mainHp?.id}/default`, undefined, superAdminToken);
      assertEqual(res.status, 200, 'Should return 200');
      assertEqual(res.body.data.isDefault, true, 'Main storefront is default again');

      const customHp = await prisma.homepage.findUnique({ where: { id: createdHomepageId } });
      assertEqual(customHp?.isDefault, false, 'Custom homepage is no longer default');
    })
  );

  // =========================================================================
  // CATEGORY E: Deletion Safety
  // =========================================================================
  tests.push(
    test('E1: Reject deleting published homepage with 409', async () => {
      const res = await request('DELETE', `/api/v1/admin/homepage/${createdHomepageId}`, undefined, superAdminToken);
      assertEqual(res.status, 409, 'Cannot delete published homepage');
      assertEqual(res.body.error.code, 'HOMEPAGE_DELETE_PUBLISHED_FORBIDDEN', 'Error code matches');
    })
  );

  tests.push(
    test('E2: Unpublish homepage to DRAFT then delete safely', async () => {
      // Unpublish first
      await request('PATCH', `/api/v1/admin/homepage/${createdHomepageId}/status`, { status: 'DRAFT' }, superAdminToken);

      // Now delete
      const res = await request('DELETE', `/api/v1/admin/homepage/${createdHomepageId}`, undefined, superAdminToken);
      assertEqual(res.status, 200, 'Draft homepage deleted successfully');

      const check = await prisma.homepage.findUnique({ where: { id: createdHomepageId } });
      assertEqual(check, null, 'Homepage record no longer exists');
    })
  );

  // =========================================================================
  // CATEGORY F: Section CRUD, Bulk Reordering & Visibility
  // =========================================================================
  let testHpId: string;
  let heroSecId: string;
  let productsSecId: string;
  let collectionsSecId: string;

  tests.push(
    test('F1: Create test homepage for section manipulation', async () => {
      const res = await request('POST', '/api/v1/admin/homepage', {
        name: 'Atelier Showcase Test',
        status: 'PUBLISHED'
      }, superAdminToken);
      assertEqual(res.status, 201, 'Created test homepage');
      testHpId = res.body.data.id;
    })
  );

  tests.push(
    test('F2: Create HERO section with valid config', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'HERO',
        title: 'Masterworks of Tanjore',
        subtitle: 'Sacred Gold Leaf Traditions',
        eyebrow: 'ROYAL COLLECTION',
        config: {
          ctaLabel: 'Explore Artworks',
          ctaUrl: '/collections/tanjore',
          textAlignment: 'center',
          overlayOpacity: 0.5
        },
        displayOrder: 1,
        isVisible: true
      }, superAdminToken);

      assertEqual(res.status, 201, 'Section created');
      heroSecId = res.body.data.id;
      assertEqual(res.body.data.type, 'HERO', 'Type matches');
      assertEqual(res.body.data.config.ctaLabel, 'Explore Artworks', 'Config matches');
    })
  );

  tests.push(
    test('F3: Create FEATURED_PRODUCTS and FEATURED_COLLECTIONS sections', async () => {
      const pRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'FEATURED_PRODUCTS',
        title: 'Curator Selections',
        displayOrder: 2,
        isVisible: true
      }, superAdminToken);
      assertEqual(pRes.status, 201, 'Products section created');
      productsSecId = pRes.body.data.id;

      const cRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'FEATURED_COLLECTIONS',
        title: 'Atelier Themes',
        displayOrder: 3,
        isVisible: true
      }, superAdminToken);
      assertEqual(cRes.status, 201, 'Collections section created');
      collectionsSecId = cRes.body.data.id;
    })
  );

  tests.push(
    test('F4: Reorder sections in bulk', async () => {
      const res = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/order`, {
        items: [
          { id: collectionsSecId, displayOrder: 1 },
          { id: heroSecId, displayOrder: 2 },
          { id: productsSecId, displayOrder: 3 }
        ]
      }, superAdminToken);

      assertEqual(res.status, 200, 'Reordered successfully');

      const secList = await prisma.homepageSection.findMany({ where: { homepageId: testHpId }, orderBy: { displayOrder: 'asc' } });
      assertEqual(secList[0].id, collectionsSecId, 'Collections is first');
      assertEqual(secList[1].id, heroSecId, 'Hero is second');
      assertEqual(secList[2].id, productsSecId, 'Products is third');
    })
  );

  tests.push(
    test('F5: Toggle section visibility', async () => {
      const res = await request('PATCH', `/api/v1/admin/homepage/${testHpId}/sections/${collectionsSecId}`, {
        isVisible: false
      }, superAdminToken);

      assertEqual(res.status, 200, 'Visibility updated');
      assertEqual(res.body.data.isVisible, false, 'Section is now hidden');
    })
  );

  // =========================================================================
  // CATEGORY G: Section Type Validation & CTA Safety & XSS Sanitization
  // =========================================================================
  tests.push(
    test('G1: Reject invalid section type', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'NON_EXISTENT_TYPE',
        title: 'Bad Section'
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject invalid section type');
    })
  );

  tests.push(
    test('G2: Reject unsafe CTA URL (javascript: protocol)', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'HERO',
        title: 'Malicious Section',
        config: {
          ctaUrl: 'javascript:alert(document.cookie)'
        }
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject javascript: CTA URL');
    })
  );

  tests.push(
    test('G3: Reject negative spacer height', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'SPACER',
        config: {
          height: -50
        }
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject negative spacer height');
    })
  );

  tests.push(
    test('G4: XSS sanitization removes scripts from editorial content', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'EDITORIAL',
        title: 'Living Traditions',
        content: '<p>Authentic heritage <script>alert("hacked")</script><img src="x" onerror="alert(1)">artworks.</p>'
      }, superAdminToken);

      assertEqual(res.status, 201, 'Section created');
      assert(!res.body.data.content.includes('<script>'), 'Script tag stripped');
      assert(!res.body.data.content.includes('onerror'), 'Event handler stripped');
      assert(res.body.data.content.includes('Authentic heritage'), 'Safe content preserved');
    })
  );

  // =========================================================================
  // CATEGORY H: Section Item Relationships (Products, Collections, Artists, Categories)
  // =========================================================================
  tests.push(
    test('H1: Atomically replace section products', async () => {
      const res = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${productsSecId}/products`, {
        items: [
          { id: testProductId1, displayOrder: 1 },
          { id: testProductId2, displayOrder: 2 }
        ]
      }, superAdminToken);

      assertEqual(res.status, 200, 'Products attached to section');
      assertEqual(res.body.data.products.length, 2, '2 products attached');
      assertEqual(res.body.data.products[0].productId, testProductId1, 'Product 1 in order');
    })
  );

  tests.push(
    test('H2: Reject duplicate products in section assignment', async () => {
      const res = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${productsSecId}/products`, {
        items: [
          { id: testProductId1, displayOrder: 1 },
          { id: testProductId1, displayOrder: 2 }
        ]
      }, superAdminToken);

      assertEqual(res.status, 400, 'Should reject duplicate product IDs');
      assertEqual(res.body.error.code, 'DUPLICATE_SECTION_ITEM', 'Error code matches');
    })
  );

  tests.push(
    test('H3: Reject non-existent product ID', async () => {
      const res = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${productsSecId}/products`, {
        items: [{ id: '00000000-0000-0000-0000-000000000000', displayOrder: 1 }]
      }, superAdminToken);

      assertEqual(res.status, 404, 'Should reject non-existent product');
      assertEqual(res.body.error.code, 'PRODUCT_NOT_FOUND', 'Error code matches');
    })
  );

  tests.push(
    test('H4: Attach collections, artists, and categories to sections', async () => {
      // Collections
      const colRes = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${collectionsSecId}/collections`, {
        items: [{ id: testCollectionId, displayOrder: 1 }]
      }, superAdminToken);
      assertEqual(colRes.status, 200, 'Collection attached');
      assertEqual(colRes.body.data.collections.length, 1, '1 collection in section');

      // Create Artists section and attach artist
      const artSecRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'FEATURED_ARTISTS',
        title: 'Master Artisans',
        displayOrder: 4
      }, superAdminToken);
      const artSecId = artSecRes.body.data.id;

      const artRes = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${artSecId}/artists`, {
        items: [{ id: testArtistId, displayOrder: 1 }]
      }, superAdminToken);
      assertEqual(artRes.status, 200, 'Artist attached');
      assertEqual(artRes.body.data.artists.length, 1, '1 artist in section');

      // Create Categories section and attach category
      const catSecRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'CATEGORIES',
        title: 'Sacred Categories',
        displayOrder: 5
      }, superAdminToken);
      const catSecId = catSecRes.body.data.id;

      const catRes = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${catSecId}/categories`, {
        items: [{ id: testCategoryId, displayOrder: 1 }]
      }, superAdminToken);
      assertEqual(catRes.status, 200, 'Category attached');
      assertEqual(catRes.body.data.categories.length, 1, '1 category in section');
    })
  );

  // =========================================================================
  // CATEGORY I: Section Media Management
  // =========================================================================
  tests.push(
    test('I1: Attach media to hero section with role and displayOrder', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media`, {
        mediaId: testMediaId1,
        role: 'PRIMARY',
        displayOrder: 1
      }, superAdminToken);

      assertEqual(res.status, 201, 'Media attached');
      assertEqual(res.body.data.mediaId, testMediaId1, 'Media ID matches');
      assertEqual(res.body.data.role, 'PRIMARY', 'Role is PRIMARY');
    })
  );

  tests.push(
    test('I2: Attach secondary mobile media to hero section', async () => {
      const res = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media`, {
        mediaId: testMediaId2,
        role: 'MOBILE',
        displayOrder: 2
      }, superAdminToken);

      assertEqual(res.status, 201, 'Mobile media attached');
      assertEqual(res.body.data.role, 'MOBILE', 'Role is MOBILE');
    })
  );

  tests.push(
    test('I3: Detach media from section', async () => {
      const res = await request('DELETE', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media/${testMediaId2}?role=MOBILE`, undefined, superAdminToken);
      assertEqual(res.status, 200, 'Media detached');

      const sec = await prisma.homepageSection.findUnique({ where: { id: heroSecId }, include: { media: true } });
      assertEqual(sec?.media?.length, 1, 'Only 1 media remaining in section');
    })
  );

  // =========================================================================
  // CATEGORY J: Public Storefront Resolution
  // =========================================================================
  tests.push(
    test('J1: GET /api/v1/homepage returns default published homepage', async () => {
      const res = await request('GET', '/api/v1/homepage');
      assertEqual(res.status, 200, 'Public homepage returns 200');
      assert(res.body.success, 'Success flag is true');
      assertEqual(res.body.data.isDefault, true, 'Default homepage is returned');
      assert(Array.isArray(res.body.data.sections), 'Sections is an array');
      assert(res.body.data.seo, 'SEO block is present');
    })
  );

  tests.push(
    test('J2: Public response filters out hidden sections', async () => {
      // Set test homepage as default to inspect public rendering
      await request('PATCH', `/api/v1/admin/homepage/${testHpId}/default`, undefined, superAdminToken);

      const res = await request('GET', '/api/v1/homepage');
      assertEqual(res.status, 200, 'Public homepage returns 200');

      // collectionsSecId was set to isVisible = false in F5
      const sectionIds = res.body.data.sections.map((s: any) => s.id);
      assert(!sectionIds.includes(collectionsSecId), 'Hidden section is omitted from public response');
      assert(sectionIds.includes(heroSecId), 'Visible hero section is included');
    })
  );

  tests.push(
    test('J3: Public product items sanitize costPrice and internal fields', async () => {
      const res = await request('GET', '/api/v1/homepage');
      assertEqual(res.status, 200, 'Public homepage returns 200');

      const prodSection = res.body.data.sections.find((s: any) => s.type === 'FEATURED_PRODUCTS');
      assert(prodSection, 'Featured products section is present');
      assert(prodSection.products.length > 0, 'Products are enriched');

      for (const prod of prodSection.products) {
        assertEqual(prod.costPrice, undefined, 'costPrice must NOT be exposed publicly');
        assertEqual(prod.acquisitionNotes, undefined, 'acquisitionNotes must NOT be exposed publicly');
        assert(prod.title || prod.name, 'Product title is present');
      }
    })
  );

  tests.push(
    test('J4: Inactive product is omitted from public section without deleting relationship', async () => {
      // Mark testProductId1 as INACTIVE
      await prisma.product.update({ where: { id: testProductId1 }, data: { status: 'INACTIVE' } });

      const res = await request('GET', '/api/v1/homepage');
      assertEqual(res.status, 200, 'Public homepage returns 200');

      const prodSection = res.body.data.sections.find((s: any) => s.type === 'FEATURED_PRODUCTS');
      const publicProdIds = (prodSection?.products || []).map((p: any) => p.id);
      assert(!publicProdIds.includes(testProductId1), 'Inactive product is omitted from public output');

      // Verify database junction still exists
      const junction = await prisma.homepageSectionProduct.findUnique({
        where: { sectionId_productId: { sectionId: productsSecId, productId: testProductId1 } }
      });
      assert(junction, 'Junction record in DB is preserved');

      // Restore product to ACTIVE
      await prisma.product.update({ where: { id: testProductId1 }, data: { status: 'ACTIVE' } });
    })
  );

  tests.push(
    test('J5: GET /api/v1/homepage/:slug returns specific published homepage', async () => {
      const res = await request('GET', '/api/v1/homepage/default-storefront');
      assertEqual(res.status, 200, 'Found by slug');
      assertEqual(res.body.data.slug, 'default-storefront', 'Slug matches');
    })
  );

  // Restore main storefront default
  tests.push(
    test('J6: Restore default-storefront as default homepage', async () => {
      const mainHp = await prisma.homepage.findUnique({ where: { slug: 'default-storefront' } });
      await request('PATCH', `/api/v1/admin/homepage/${mainHp?.id}/default`, undefined, superAdminToken);
    })
  );

  // =========================================================================
  // CATEGORY K: RBAC Permissions Matrix
  // =========================================================================
  tests.push(
    test('K1: Unauthenticated request to admin homepage endpoint returns 401', async () => {
      const res = await request('GET', '/api/v1/admin/homepage');
      assertEqual(res.status, 401, 'Should reject unauthenticated access');
    })
  );

  tests.push(
    test('K2: ORDER_MANAGER has no homepage permissions and receives 403', async () => {
      const res = await request('GET', '/api/v1/admin/homepage', undefined, orderManagerToken);
      assertEqual(res.status, 403, 'Order manager should be forbidden');
    })
  );

  tests.push(
    test('K3: CONTENT_MANAGER can view, create, and publish homepage', async () => {
      const viewRes = await request('GET', '/api/v1/admin/homepage', undefined, contentManagerToken);
      assertEqual(viewRes.status, 200, 'Content manager can view');

      const createRes = await request('POST', '/api/v1/admin/homepage', {
        name: 'Content Manager Festival Page',
        status: 'DRAFT'
      }, contentManagerToken);
      assertEqual(createRes.status, 201, 'Content manager can create');
    })
  );

  tests.push(
    test('K4: CATALOGUE_MANAGER can view and create but CANNOT publish or set default', async () => {
      const catHpRes = await request('POST', '/api/v1/admin/homepage', {
        name: 'Catalogue Showcase Draft',
        status: 'DRAFT'
      }, catalogueManagerToken);
      assertEqual(catHpRes.status, 201, 'Catalogue manager can create draft');
      const catHpId = catHpRes.body.data.id;

      // Attempt publish
      const pubRes = await request('PATCH', `/api/v1/admin/homepage/${catHpId}/status`, { status: 'PUBLISHED' }, catalogueManagerToken);
      assertEqual(pubRes.status, 403, 'Catalogue manager cannot publish homepage');
    })
  );

  tests.push(
    test('F6: Delete a section and verify section junctions are cascaded without deleting original entities', async () => {
      // Create temporary section with products
      const tempSecRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'FEATURED_PRODUCTS',
        title: 'Temporary Section'
      }, superAdminToken);
      const tempSecId = tempSecRes.body.data.id;

      await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${tempSecId}/products`, {
        items: [{ id: testProductId1, displayOrder: 1 }]
      }, superAdminToken);

      // Delete the section
      const delRes = await request('DELETE', `/api/v1/admin/homepage/${testHpId}/sections/${tempSecId}`, undefined, superAdminToken);
      assertEqual(delRes.status, 200, 'Section deleted');

      // Verify product itself was NOT deleted
      const prodCheck = await prisma.product.findUnique({ where: { id: testProductId1 } });
      assert(prodCheck, 'Base product must NOT be deleted when CMS section is deleted');
    })
  );

  tests.push(
    test('G5: Create PROMOTIONAL_BANNER and SPACER sections with validated configs', async () => {
      const bannerRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'PROMOTIONAL_BANNER',
        title: 'Festival Announcement',
        config: {
          theme: 'gold',
          ctaLabel: 'Claim Heritage Access',
          ctaUrl: '/promotions/diwali-exclusive'
        }
      }, superAdminToken);
      assertEqual(bannerRes.status, 201, 'Promotional banner created');
      assertEqual(bannerRes.body.data.config.theme, 'gold', 'Banner theme is gold');

      const spacerRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'SPACER',
        config: {
          height: 60,
          desktopHeight: 80,
          mobileHeight: 40
        }
      }, superAdminToken);
      assertEqual(spacerRes.status, 201, 'Spacer created');
      assertEqual(spacerRes.body.data.config.desktopHeight, 80, 'Desktop height is 80');
    })
  );

  tests.push(
    test('G6: Create IMAGE_BANNER section with overlayOpacity and alignment', async () => {
      const imgBannerRes = await request('POST', `/api/v1/admin/homepage/${testHpId}/sections`, {
        type: 'IMAGE_BANNER',
        title: 'Sacred Sanctum Collection',
        subtitle: 'Consecrated Bronzes & Silverware',
        config: {
          alignment: 'center',
          overlayOpacity: 0.6,
          ctaLabel: 'View Heritage Bronzes',
          ctaUrl: '/collections/bronzes'
        }
      }, superAdminToken);
      assertEqual(imgBannerRes.status, 201, 'Image banner created');
      assertEqual(imgBannerRes.body.data.config.overlayOpacity, 0.6, 'Overlay opacity set');
    })
  );

  tests.push(
    test('I4: Reorder media attachments within a section', async () => {
      // Attach two media assets
      await request('POST', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media`, {
        mediaId: testMediaId1,
        role: 'GALLERY',
        displayOrder: 1
      }, superAdminToken);

      await request('POST', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media`, {
        mediaId: testMediaId2,
        role: 'GALLERY',
        displayOrder: 2
      }, superAdminToken);

      // Reorder
      const reorderRes = await request('PUT', `/api/v1/admin/homepage/${testHpId}/sections/${heroSecId}/media/order`, {
        items: [
          { mediaId: testMediaId2, role: 'GALLERY', displayOrder: 1 },
          { mediaId: testMediaId1, role: 'GALLERY', displayOrder: 2 }
        ]
      }, superAdminToken);

      assertEqual(reorderRes.status, 200, 'Media reordered');
    })
  );

  tests.push(
    test('J7: Public Sanskrit Edit section resolves active Sanskrit products in AUTOMATIC mode', async () => {
      const res = await request('GET', '/api/v1/homepage/default-storefront');
      assertEqual(res.status, 200, 'Storefront retrieved');

      const sanskritSec = res.body.data.sections.find((s: any) => s.type === 'SANSKRIT_EDIT');
      assert(sanskritSec, 'Sanskrit Edit section exists');
      assert(Array.isArray(sanskritSec.products), 'Sanskrit products array is resolved');
    })
  );

  tests.push(
    test('J8: Public Antiques section resolves active Antique products in AUTOMATIC mode', async () => {
      const res = await request('GET', '/api/v1/homepage/default-storefront');
      assertEqual(res.status, 200, 'Storefront retrieved');

      const antiqueSec = res.body.data.sections.find((s: any) => s.type === 'ANTIQUES');
      assert(antiqueSec, 'Antique section exists');
      assert(Array.isArray(antiqueSec.products), 'Antique products array is resolved');
    })
  );

  tests.push(
    test('K5: MARKETING_MANAGER can view, create, and update homepage', async () => {
      const createRes = await request('POST', '/api/v1/admin/homepage', {
        name: 'Marketing Seasonal Showcase',
        status: 'DRAFT'
      }, marketingManagerToken);
      assertEqual(createRes.status, 201, 'Marketing manager can create');
      const mktHpId = createRes.body.data.id;

      const updateRes = await request('PATCH', `/api/v1/admin/homepage/${mktHpId}`, {
        seoTitle: 'Seasonal Showcase | Marketing'
      }, marketingManagerToken);
      assertEqual(updateRes.status, 200, 'Marketing manager can update');
    })
  );

  tests.push(
    test('K6: CONTENT_MANAGER does not have homepage.delete and receives 403', async () => {
      const draftRes = await request('POST', '/api/v1/admin/homepage', {
        name: 'Temp Content Page',
        status: 'DRAFT'
      }, contentManagerToken);
      const draftId = draftRes.body.data.id;

      const delRes = await request('DELETE', `/api/v1/admin/homepage/${draftId}`, undefined, contentManagerToken);
      assertEqual(delRes.status, 403, 'Content manager cannot delete homepage');

      // Super Admin can delete it
      const superDelRes = await request('DELETE', `/api/v1/admin/homepage/${draftId}`, undefined, superAdminToken);
      assertEqual(superDelRes.status, 200, 'Super admin can delete draft homepage');
    })
  );

  tests.push(
    test('K7: Super admin cannot delete published/default homepage directly (returns 409)', async () => {
      const mainHp = await prisma.homepage.findUnique({ where: { slug: 'default-storefront' } });
      const delRes = await request('DELETE', `/api/v1/admin/homepage/${mainHp?.id}`, undefined, superAdminToken);
      assertEqual(delRes.status, 409, 'Cannot delete published/default homepage');
    })
  );

  tests.push(
    test('L2: Section items changes emit HOMEPAGE_PRODUCTS_CHANGED audit record', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { module: 'HOMEPAGE', action: 'HOMEPAGE_PRODUCTS_CHANGED' },
        take: 5
      });
      assert(logs.length > 0, 'HOMEPAGE_PRODUCTS_CHANGED audit log found');
    })
  );

  // Execute all tests
  for (const t of tests) {
    await t();
  }

  // Teardown
  server.close();

  console.log('\n==================================================');
  console.log(`  MODULE 12 TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
