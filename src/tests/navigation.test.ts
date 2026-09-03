import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5015;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testCategoryId: string;
let testCollectionId: string;
let testProductId: string;
let testArtistId: string;
let testJournalPostId: string;
let testLookbookId: string;
let testSanskritEditId: string;

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

async function runNavigationTests() {
  console.log('\n======================================================');
  console.log(' MODULE 15: NAVIGATION / MENUS TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize server and seed
  const app = createApp();
  server = app.listen(TEST_PORT);

  try {
    await runSeed();

    // 2. Setup admin users & JWT tokens
    const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
    const contentManagerRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
    const marketingManagerRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
    const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

    const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
    superAdminToken = generateAccessToken({ sub: superAdminUser!.id, roleId: superAdminRole!.id });

    let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.nav@lagoreearts.com' } });
    if (!catUser) {
      catUser = prisma.adminUser.create({
        data: {
          name: 'Navigation Catalogue Manager',
          email: 'cat.nav@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: catalogueManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catalogueManagerRole!.id });

    let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.nav@lagoreearts.com' } });
    if (!contentUser) {
      contentUser = prisma.adminUser.create({
        data: {
          name: 'Navigation Content Manager',
          email: 'content.nav@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: contentManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentManagerRole!.id });

    let mktUser = prisma.adminUser.findUnique({ where: { email: 'mkt.nav@lagoreearts.com' } });
    if (!mktUser) {
      mktUser = prisma.adminUser.create({
        data: {
          name: 'Navigation Marketing Manager',
          email: 'mkt.nav@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: marketingManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: marketingManagerRole!.id });

    let ordUser = prisma.adminUser.findUnique({ where: { email: 'ord.nav@lagoreearts.com' } });
    if (!ordUser) {
      ordUser = prisma.adminUser.create({
        data: {
          name: 'Navigation Order Manager',
          email: 'ord.nav@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: orderManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: orderManagerRole!.id });

    // 3. Clean test fixtures
    prisma.navigationItem.deleteMany({});
    prisma.navigation.deleteMany({});

    // 4. Create referenced target entities
    const cat = await prisma.category.create({
      data: { name: 'Sacred Bronze Sculptures', slug: `nav-cat-${Date.now()}`, status: 'ACTIVE' }
    });
    testCategoryId = cat.id;

    const coll = await prisma.collection.create({
      data: { name: 'Chola Dynasty Artworks', slug: `nav-coll-${Date.now()}`, status: 'ACTIVE', type: 'CURATED' }
    });
    testCollectionId = coll.id;

    const prod = await prisma.product.create({
      data: {
        title: 'Dancing Nataraja Bronze',
        slug: `nav-prod-${Date.now()}`,
        sku: `SKU-NAV-${Date.now()}`,
        status: 'PUBLISHED',
        basePrice: 120000,
        categoryId: cat.id
      }
    });
    testProductId = prod.id;

    const art = await prisma.artist.create({
      data: { name: 'Master Sthapati Govind', slug: `nav-art-${Date.now()}`, status: 'ACTIVE', tradition: 'Swamimalai Bronze' }
    });
    testArtistId = art.id;

    const post = await prisma.journalPost.create({
      data: {
        title: 'Lost-Wax Bronze Casting Traditions',
        slug: `nav-jrn-${Date.now()}`,
        content: '<p>Exploring the ancient cire perdue method.</p>',
        status: 'PUBLISHED'
      }
    });
    testJournalPostId = post.id;

    const lb = await prisma.lookbook.create({
      data: {
        title: 'Autumn Bronzes 2026',
        slug: `nav-lb-${Date.now()}`,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString()
      }
    });
    testLookbookId = lb.id;

    const skt = await prisma.sanskritEditProfile.create({
      data: {
        productId: prod.id,
        sanskritTitle: 'आनन्दताण्डव नटराज',
        isPublished: true
      }
    });
    testSanskritEditId = skt.id;

    console.log('--- CATEGORY A: Navigation CRUD, Search & Pagination ---');
    let navHeaderId: string;
    let navHeaderSlug: string;

    // A1. Create Navigation
    const resA1 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Main Storefront Header Navigation',
      location: 'HEADER',
      status: 'ACTIVE',
      isDefault: true
    }, superAdminToken);

    assert(resA1.status === 201, 'A1. Create navigation returns 201 Created');
    assert(resA1.body.data.name === 'Main Storefront Header Navigation', 'A1. Name persisted');
    assert(resA1.body.data.slug === 'main-storefront-header-navigation', 'A1. Slug auto-generated');
    assert(resA1.body.data.location === 'HEADER', 'A1. Location is HEADER');
    assert(resA1.body.data.status === 'ACTIVE', 'A1. Status is ACTIVE');
    assert(resA1.body.data.isDefault === true, 'A1. isDefault is true');
    navHeaderId = resA1.body.data.id;
    navHeaderSlug = resA1.body.data.slug;

    // A2. Get Navigation by ID
    const resA2 = await request('GET', `/api/v1/admin/navigation/${navHeaderId}`, undefined, superAdminToken);
    assert(resA2.status === 200, 'A2. Get navigation by ID returns 200 OK');
    assert(resA2.body.data.id === navHeaderId, 'A2. Navigation ID matches');

    // A3. List Navigations with Search & Pagination
    const resA3 = await request('GET', '/api/v1/admin/navigation?search=Header&page=1&limit=10', undefined, superAdminToken);
    assert(resA3.status === 200, 'A3. List navigations returns 200 OK');
    assert(resA3.body.data.items.length === 1, 'A3. Found 1 matching navigation');
    assert(resA3.body.data.pagination.total === 1, 'A3. Pagination total matches');

    // A4. Update Navigation Details
    const resA4 = await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}`, {
      name: 'Royal Heritage Header Navigation'
    }, superAdminToken);
    assert(resA4.status === 200, 'A4. Update navigation returns 200 OK');
    assert(resA4.body.data.name === 'Royal Heritage Header Navigation', 'A4. Updated name persisted');

    console.log('--- CATEGORY B: Locations Support ---');
    // B1. Create FOOTER Navigation
    const resB1 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Main Storefront Footer Navigation',
      location: 'FOOTER',
      status: 'ACTIVE',
      isDefault: true
    }, superAdminToken);
    assert(resB1.status === 201, 'B1. Create FOOTER navigation returns 201 Created');
    assert(resB1.body.data.location === 'FOOTER', 'B1. Location is FOOTER');
    const navFooterId = resB1.body.data.id;

    // B2. Create MOBILE Navigation
    const resB2 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Mobile Drawer Navigation',
      location: 'MOBILE',
      status: 'ACTIVE',
      isDefault: true
    }, superAdminToken);
    assert(resB2.status === 201, 'B2. Create MOBILE navigation returns 201 Created');

    // B3. Create SECONDARY Navigation
    const resB3 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Top Bar Secondary Navigation',
      location: 'SECONDARY',
      status: 'ACTIVE',
      isDefault: true
    }, superAdminToken);
    assert(resB3.status === 201, 'B3. Create SECONDARY navigation returns 201 Created');

    console.log('--- CATEGORY C: Default Navigation Invariant & Deletion Protection ---');
    // C1. Cannot set INACTIVE navigation as default
    const resC1 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Draft Header Navigation',
      location: 'HEADER',
      status: 'INACTIVE',
      isDefault: true
    }, superAdminToken);
    assert(resC1.status === 400, 'C1. Setting INACTIVE navigation as default returns 400 Bad Request');
    assert(resC1.body.error.code === 'NAVIGATION_INACTIVE_CANNOT_BE_DEFAULT', 'C1. Error code is NAVIGATION_INACTIVE_CANNOT_BE_DEFAULT');

    // C2. Creating a second ACTIVE default HEADER navigation atomically replaces the previous default
    const resC2 = await request('POST', '/api/v1/admin/navigation', {
      name: 'Seasonal Festival Header Navigation',
      location: 'HEADER',
      status: 'ACTIVE',
      isDefault: true
    }, superAdminToken);
    assert(resC2.status === 201, 'C2. Create new default HEADER navigation succeeds');
    const seasonalNavId = resC2.body.data.id;

    // Verify first navigation is no longer default
    const resC2Check = await request('GET', `/api/v1/admin/navigation/${navHeaderId}`, undefined, superAdminToken);
    assert(resC2Check.body.data.isDefault === false, 'C2. Previous default HEADER navigation isDefault was reset to false');

    // C3. Deleting active default navigation is blocked (409)
    const resC3 = await request('DELETE', `/api/v1/admin/navigation/${seasonalNavId}`, undefined, superAdminToken);
    assert(resC3.status === 409, 'C3. Deleting active default navigation returns 409 Conflict');
    assert(resC3.body.error.code === 'NAVIGATION_DEFAULT_DELETE_FORBIDDEN', 'C3. Error code is NAVIGATION_DEFAULT_DELETE_FORBIDDEN');

    // C4. Switch default back to first navigation, then delete seasonal navigation
    await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}`, { isDefault: true }, superAdminToken);
    const resC4 = await request('DELETE', `/api/v1/admin/navigation/${seasonalNavId}`, undefined, superAdminToken);
    assert(resC4.status === 200, 'C4. Deleting non-default navigation succeeds');

    console.log('--- CATEGORY D: Navigation Items Management ---');
    let artGroupId: string;
    let paintingsItemId: string;
    let sculpturesItemId: string;
    let bronzesItemId: string;

    // D1. Create Root Item (Group / Mega Menu)
    const resD1 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Art & Heritage',
      description: 'Explore royal paintings, bronzes, and temple collections',
      targetType: 'NONE',
      displayType: 'MEGA_MENU',
      isFeatured: true
    }, superAdminToken);
    assert(resD1.status === 201, 'D1. Create root menu item returns 201 Created');
    assert(resD1.body.data.label === 'Art & Heritage', 'D1. Label matches');
    assert(resD1.body.data.displayType === 'MEGA_MENU', 'D1. Display type is MEGA_MENU');
    assert(resD1.body.data.sortOrder === 0, 'D1. Initial sortOrder is 0');
    artGroupId = resD1.body.data.id;

    // D2. Create Child Item referencing CATEGORY
    const resD2 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      parentId: artGroupId,
      label: 'Sacred Bronzes',
      targetType: 'CATEGORY',
      targetId: testCategoryId
    }, superAdminToken);
    assert(resD2.status === 201, 'D2. Create child item referencing CATEGORY returns 201 Created');
    assert(resD2.body.data.parentId === artGroupId, 'D2. parentId matches artGroupId');
    assert(resD2.body.data.targetType === 'CATEGORY', 'D2. Target type is CATEGORY');
    paintingsItemId = resD2.body.data.id;

    // D3. Create Second Child Item referencing COLLECTION
    const resD3 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      parentId: artGroupId,
      label: 'Chola Dynasty',
      targetType: 'COLLECTION',
      targetId: testCollectionId
    }, superAdminToken);
    assert(resD3.status === 201, 'D3. Create child item referencing COLLECTION returns 201 Created');
    assert(resD3.body.data.sortOrder === 1, 'D3. sortOrder auto-incremented to 1');
    sculpturesItemId = resD3.body.data.id;

    // D4. Create Third Child Item referencing INTERNAL_URL
    const resD4 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      parentId: artGroupId,
      label: 'Curated Lookbooks',
      targetType: 'INTERNAL_URL',
      url: '/lookbooks'
    }, superAdminToken);
    assert(resD4.status === 201, 'D4. Create child item with INTERNAL_URL returns 201 Created');
    bronzesItemId = resD4.body.data.id;

    // D5. Toggle Item Visibility & Featured
    const resD5 = await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}/items/${bronzesItemId}`, {
      isVisible: false,
      isFeatured: true
    }, superAdminToken);
    assert(resD5.status === 200, 'D5. Update item isVisible and isFeatured returns 200 OK');
    assert(resD5.body.data.isVisible === false, 'D5. isVisible updated to false');
    assert(resD5.body.data.isFeatured === true, 'D5. isFeatured updated to true');

    console.log('--- CATEGORY E: Hierarchy, Nested Menus & Cycle Prevention ---');
    // E1. Self-Parenting Rejection (400)
    const resE1 = await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}/items/${artGroupId}`, {
      parentId: artGroupId
    }, superAdminToken);
    assert(resE1.status === 400, 'E1. Self-parenting item returns 400 Bad Request');
    assert(resE1.body.error.code === 'NAVIGATION_ITEM_SELF_PARENT', 'E1. Error code is NAVIGATION_ITEM_SELF_PARENT');

    // E2. Circular Parent Relationship Rejection (A -> B -> A)
    const resE2 = await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}/items/${artGroupId}`, {
      parentId: paintingsItemId
    }, superAdminToken);
    assert(resE2.status === 400, 'E2. Setting descendant as parent returns 400 Bad Request (Circular)');
    assert(resE2.body.error.code === 'NAVIGATION_ITEM_CIRCULAR_PARENT', 'E2. Error code is NAVIGATION_ITEM_CIRCULAR_PARENT');

    // E3. Parent belonging to different navigation rejection (400)
    const resE3 = await request('POST', `/api/v1/admin/navigation/${navFooterId}/items`, {
      parentId: artGroupId, // Belongs to navHeaderId
      label: 'Invalid Cross-Navigation Item',
      targetType: 'INTERNAL_URL',
      url: '/about'
    }, superAdminToken);
    assert(resE3.status === 400, 'E3. Cross-navigation parenting returns 400 Bad Request');
    assert(resE3.body.error.code === 'NAVIGATION_ITEM_PARENT_MISMATCH', 'E3. Error code is NAVIGATION_ITEM_PARENT_MISMATCH');

    // E4. Move Item to another parent or root
    const resE4 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items/${paintingsItemId}/move`, {
      parentId: null,
      sortOrder: 5
    }, superAdminToken);
    assert(resE4.status === 200, 'E4. Move item to root returns 200 OK');
    assert(resE4.body.data.parentId === null, 'E4. parentId is now null (root)');

    // Move it back under artGroupId
    await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items/${paintingsItemId}/move`, {
      parentId: artGroupId,
      sortOrder: 0
    }, superAdminToken);

    // E5. Deleting parent with children is blocked (409)
    const resE5 = await request('DELETE', `/api/v1/admin/navigation/${navHeaderId}/items/${artGroupId}`, undefined, superAdminToken);
    assert(resE5.status === 409, 'E5. Deleting parent item with children returns 409 Conflict');
    assert(resE5.body.error.code === 'NAVIGATION_ITEM_HAS_CHILDREN', 'E5. Error code is NAVIGATION_ITEM_HAS_CHILDREN');

    console.log('--- CATEGORY F: Entity Target Types ---');
    // F1. PRODUCT Target
    const resF1 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Masterpiece Bronze',
      targetType: 'PRODUCT',
      targetId: testProductId
    }, superAdminToken);
    assert(resF1.status === 201, 'F1. Create PRODUCT target item returns 201 Created');

    // F2. ARTIST Target
    const resF2 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Master Sthapati',
      targetType: 'ARTIST',
      targetId: testArtistId
    }, superAdminToken);
    assert(resF2.status === 201, 'F2. Create ARTIST target item returns 201 Created');

    // F3. JOURNAL Target
    const resF3 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Lost-Wax Traditions',
      targetType: 'JOURNAL',
      targetId: testJournalPostId
    }, superAdminToken);
    assert(resF3.status === 201, 'F3. Create JOURNAL target item returns 201 Created');

    // F4. LOOKBOOK Target
    const resF4 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Autumn Lookbook 2026',
      targetType: 'LOOKBOOK',
      targetId: testLookbookId
    }, superAdminToken);
    assert(resF4.status === 201, 'F4. Create LOOKBOOK target item returns 201 Created');

    // F5. SANSKRIT_EDIT Target
    const resF5 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'The Sanskrit Edit: Nataraja',
      targetType: 'SANSKRIT_EDIT',
      targetId: testSanskritEditId
    }, superAdminToken);
    assert(resF5.status === 201, 'F5. Create SANSKRIT_EDIT target item returns 201 Created');

    // F6. EXTERNAL_URL Target
    const resF6 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Heritage Museum Trust',
      targetType: 'EXTERNAL_URL',
      url: 'https://nationalmuseumindia.gov.in',
      openInNewTab: true
    }, superAdminToken);
    assert(resF6.status === 201, 'F6. Create EXTERNAL_URL target item returns 201 Created');
    assert(resF6.body.data.openInNewTab === true, 'F6. openInNewTab is true');

    console.log('--- CATEGORY G: Target Validation & Safety ---');
    // G1. Missing targetId for entity target returns 400
    const resG1 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Missing Target ID Item',
      targetType: 'CATEGORY'
    }, superAdminToken);
    assert(resG1.status === 400, 'G1. Missing targetId for CATEGORY returns 400 Bad Request');

    // G2. Non-existent category ID returns 404
    const resG2 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Non-existent Category Item',
      targetType: 'CATEGORY',
      targetId: '00000000-0000-0000-0000-000000000000'
    }, superAdminToken);
    assert(resG2.status === 404, 'G2. Non-existent targetId returns 404 Not Found');
    assert(resG2.body.error.code === 'CATEGORY_NOT_FOUND', 'G2. Error code is CATEGORY_NOT_FOUND');

    console.log('--- CATEGORY H: Public Storefront API & Tree Resolution ---');
    // Re-enable item 4 (bronzesItemId) for public tree test
    await request('PATCH', `/api/v1/admin/navigation/${navHeaderId}/items/${bronzesItemId}`, { isVisible: true }, superAdminToken);

    // H1. Get Public Header Navigation
    const resH1 = await request('GET', '/api/v1/navigation/HEADER');
    assert(resH1.status === 200, 'H1. Public navigation returns 200 OK');
    assert(resH1.body.data.location === 'HEADER', 'H1. Location is HEADER');
    assert(Array.isArray(resH1.body.data.items), 'H1. Items array returned');

    // Find Art & Heritage root item and inspect resolved children
    const publicArtGroup = resH1.body.data.items.find((i: any) => i.label === 'Art & Heritage');
    assert(publicArtGroup !== undefined, 'H1. Root group item Art & Heritage found');
    assert(Array.isArray(publicArtGroup.children), 'H1. Children array populated for group');
    assert(publicArtGroup.children.length === 3, 'H1. All 3 child items present');

    // H2. Derived destination URLs
    const catChild = publicArtGroup.children.find((c: any) => c.label === 'Sacred Bronzes');
    assert(catChild !== undefined, 'H2. Category child found');
    assert(catChild.resolvedUrl.startsWith('/categories/'), 'H2. Category URL derived as /categories/:slug');

    const collChild = publicArtGroup.children.find((c: any) => c.label === 'Chola Dynasty');
    assert(collChild !== undefined, 'H2. Collection child found');
    assert(collChild.resolvedUrl.startsWith('/collections/'), 'H2. Collection URL derived as /collections/:slug');

    console.log('--- CATEGORY I: Public Entity Availability Filtering ---');
    // I1. Inactive category is automatically omitted from public tree without deleting config
    await prisma.category.update({ where: { id: testCategoryId }, data: { status: 'INACTIVE' } });

    const resI1 = await request('GET', '/api/v1/navigation/HEADER');
    const artGroupAfterInactive = resI1.body.data.items.find((i: any) => i.label === 'Art & Heritage');
    const inactiveCatInPublic = artGroupAfterInactive.children?.find((c: any) => c.label === 'Sacred Bronzes');
    assert(inactiveCatInPublic === undefined, 'I1. Inactive category item omitted from public storefront');

    // Admin item still exists in database
    const adminItemCheck = await request('GET', `/api/v1/admin/navigation/${navHeaderId}/items/${paintingsItemId}`, undefined, superAdminToken);
    assert(adminItemCheck.status === 200, 'I1. Admin item record preserved intact in database');

    // Restore category to ACTIVE
    await prisma.category.update({ where: { id: testCategoryId }, data: { status: 'ACTIVE' } });

    console.log('--- CATEGORY J: URL Security & Protocol Validation ---');
    // J1. Reject javascript: in URL
    const resJ1 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Malicious Link',
      targetType: 'INTERNAL_URL',
      url: 'javascript:alert(1)'
    }, superAdminToken);
    assert(resJ1.status === 400, 'J1. javascript: URL rejected with 400 Bad Request');

    // J2. Reject data: in URL
    const resJ2 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Malicious Data Link',
      targetType: 'INTERNAL_URL',
      url: 'data:text/html,<script>alert(1)</script>'
    }, superAdminToken);
    assert(resJ2.status === 400, 'J2. data: URL rejected with 400 Bad Request');

    // J3. Reject protocol-relative //evil.com URL
    const resJ3 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'Protocol Relative Link',
      targetType: 'INTERNAL_URL',
      url: '//evil.com/phish'
    }, superAdminToken);
    assert(resJ3.status === 400, 'J3. Protocol-relative URL rejected with 400 Bad Request');

    console.log('--- CATEGORY K: Input Sanitization & Unicode Preservation ---');
    // K1. Strip HTML and script tags from label
    const resK1 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: '<b>Bold Art</b> <script>alert("XSS")</script>',
      targetType: 'INTERNAL_URL',
      url: '/art'
    }, superAdminToken);
    assert(resK1.status === 201, 'K1. Item with script tags created');
    assert(resK1.body.data.label === 'Bold Art', 'K1. Script tags and HTML stripped cleanly');

    // K2. Preserve Devanagari & Sanskrit IAST Unicode text
    const resK2 = await request('POST', `/api/v1/admin/navigation/${navHeaderId}/items`, {
      label: 'दिव्य शिल्पकला — Divya Śilpakalā',
      targetType: 'INTERNAL_URL',
      url: '/heritage'
    }, superAdminToken);
    assert(resK2.status === 201, 'K2. Item with Devanagari Unicode created');
    assert(resK2.body.data.label === 'दिव्य शिल्पकला — Divya Śilpakalā', 'K2. Devanagari & IAST diacritics preserved');

    console.log('--- CATEGORY L: RBAC Permission Matrix ---');
    // L1. Super Admin has full access
    const resL1 = await request('GET', '/api/v1/admin/navigation', undefined, superAdminToken);
    assert(resL1.status === 200, 'L1. Super Admin can view navigations');

    // L2. Content Manager can view, create, update, delete
    const resL2Create = await request('POST', '/api/v1/admin/navigation', {
      name: 'Content Manager Navigation',
      location: 'FOOTER'
    }, contentManagerToken);
    assert(resL2Create.status === 201, 'L2. Content Manager can create navigation');
    const cmNavId = resL2Create.body.data.id;

    const resL2Del = await request('DELETE', `/api/v1/admin/navigation/${cmNavId}`, undefined, contentManagerToken);
    assert(resL2Del.status === 200, 'L2. Content Manager can delete navigation');

    // L3. Catalogue Manager can view and create, but cannot delete
    const resL3Create = await request('POST', '/api/v1/admin/navigation', {
      name: 'Catalogue Manager Navigation',
      location: 'SECONDARY'
    }, catalogueManagerToken);
    assert(resL3Create.status === 201, 'L3. Catalogue Manager can create navigation');
    const catNavId = resL3Create.body.data.id;

    const resL3Del = await request('DELETE', `/api/v1/admin/navigation/${catNavId}`, undefined, catalogueManagerToken);
    assert(resL3Del.status === 403, 'L3. Catalogue Manager cannot delete navigation (403 Forbidden)');

    // L4. Marketing Manager can view, create, update, but cannot delete
    const resL4Del = await request('DELETE', `/api/v1/admin/navigation/${catNavId}`, undefined, marketingManagerToken);
    assert(resL4Del.status === 403, 'L4. Marketing Manager cannot delete navigation (403 Forbidden)');

    // L5. Order Manager has no access (403)
    const resL5 = await request('GET', '/api/v1/admin/navigation', undefined, orderManagerToken);
    assert(resL5.status === 403, 'L5. Order Manager is denied access to navigation module (403 Forbidden)');

    console.log('--- CATEGORY M: Bulk Reorder & Move ---');
    // M1. Bulk Reorder items within navigation
    const resM1 = await request('PUT', `/api/v1/admin/navigation/${navHeaderId}/items/order`, {
      items: [
        { id: sculpturesItemId, parentId: artGroupId, sortOrder: 0 },
        { id: paintingsItemId, parentId: artGroupId, sortOrder: 1 },
        { id: bronzesItemId, parentId: artGroupId, sortOrder: 2 }
      ]
    }, superAdminToken);
    assert(resM1.status === 200, 'M1. Bulk reorder items returns 200 OK');

    // M2. Duplicate ID in reorder array rejected
    const resM2 = await request('PUT', `/api/v1/admin/navigation/${navHeaderId}/items/order`, {
      items: [
        { id: sculpturesItemId, sortOrder: 0 },
        { id: sculpturesItemId, sortOrder: 1 }
      ]
    }, superAdminToken);
    assert(resM2.status === 400, 'M2. Duplicate ID in reorder payload returns 400 Bad Request');

    console.log('--- CATEGORY N: Audit Logging Verification ---');
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        module: 'NAVIGATION'
      }
    });
    assert(auditLogs.length > 0, 'N1. Audit logs recorded for NAVIGATION module');
    const actions = auditLogs.map(a => a.action);
    assert(actions.includes('NAVIGATION_CREATED'), 'N2. Audit log recorded NAVIGATION_CREATED');
    assert(actions.includes('NAVIGATION_ITEM_CREATED'), 'N3. Audit log recorded NAVIGATION_ITEM_CREATED');

    console.log('\n======================================================');
    console.log(` NAVIGATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runNavigationTests();
