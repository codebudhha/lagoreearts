import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5014;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testMediaId1: string;
let testMediaId2: string;
let testProductId: string;
let testCollectionId: string;
let testArtistId: string;
let testCategoryId: string;
let testJournalPostId: string;
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

async function runLookbookTests() {
  console.log('\n======================================================');
  console.log(' MODULE 14: LOOKBOOK TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize server and seed
  const app = createApp();
  server = app.listen(TEST_PORT);

  try {
    await runSeed();

    // 2. Fetch role IDs and create access tokens
    const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
    const contentManagerRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
    const marketingManagerRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
    const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

    const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
    superAdminToken = generateAccessToken({ sub: superAdminUser!.id, roleId: superAdminRole!.id });

    let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.lookbook@lagoreearts.com' } });
    if (!catUser) {
      catUser = prisma.adminUser.create({
        data: {
          name: 'Lookbook Catalogue Manager',
          email: 'cat.lookbook@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: catalogueManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catalogueManagerRole!.id });

    let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.lookbook@lagoreearts.com' } });
    if (!contentUser) {
      contentUser = prisma.adminUser.create({
        data: {
          name: 'Lookbook Content Manager',
          email: 'content.lookbook@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: contentManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentManagerRole!.id });

    let mktUser = prisma.adminUser.findUnique({ where: { email: 'mkt.lookbook@lagoreearts.com' } });
    if (!mktUser) {
      mktUser = prisma.adminUser.create({
        data: {
          name: 'Lookbook Marketing Manager',
          email: 'mkt.lookbook@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: marketingManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: marketingManagerRole!.id });

    let ordUser = prisma.adminUser.findUnique({ where: { email: 'ord.lookbook@lagoreearts.com' } });
    if (!ordUser) {
      ordUser = prisma.adminUser.create({
        data: {
          name: 'Lookbook Order Manager',
          email: 'ord.lookbook@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: orderManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: orderManagerRole!.id });

    // 3. Clean and prepare test fixtures
    prisma.lookbook.deleteMany({});
    prisma.lookbookSection.deleteMany({});

    // Create test media
    const media1 = await prisma.mediaAsset.create({
      data: {
        filename: 'lookbook-cover.jpg',
        storageKey: `lookbook-cover-${Date.now()}.jpg`,
        publicUrl: '/uploads/lookbook-cover.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        mediaType: 'IMAGE',
        checksum: `chk-cover-${Date.now()}`
      }
    });
    testMediaId1 = media1.id;

    const media2 = await prisma.mediaAsset.create({
      data: {
        filename: 'lookbook-gallery.jpg',
        storageKey: `lookbook-gallery-${Date.now()}.jpg`,
        publicUrl: '/uploads/lookbook-gallery.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 204800,
        mediaType: 'IMAGE',
        checksum: `chk-gal-${Date.now()}`
      }
    });
    testMediaId2 = media2.id;

    // Create Category, Collection, Product, Artist, Sanskrit Edit, Journal Post
    const category = await prisma.category.create({
      data: { name: 'Lookbook Art Category', slug: `lb-cat-${Date.now()}`, status: 'ACTIVE' }
    });
    testCategoryId = category.id;

    const collection = await prisma.collection.create({
      data: { name: 'Royal Heritage Lookbook Collection', slug: `lb-coll-${Date.now()}`, status: 'ACTIVE', type: 'CURATED' }
    });
    testCollectionId = collection.id;

    const artist = await prisma.artist.create({
      data: { name: 'Maharaja Art Studio', slug: `lb-art-${Date.now()}`, status: 'ACTIVE', tradition: 'Tanjore' }
    });
    testArtistId = artist.id;

    const product = await prisma.product.create({
      data: {
        title: 'Gilded Tanjore Masterpiece',
        slug: `lb-prod-${Date.now()}`,
        sku: `SKU-LB-${Date.now()}`,
        status: 'PUBLISHED',
        basePrice: 75000,
        categoryId: category.id
      }
    });
    testProductId = product.id;

    const sanskritEdit = await prisma.sanskritEditProfile.create({
      data: {
        productId: product.id,
        sanskritTitle: 'सुवर्ण सौन्दर्यम्',
        isPublished: true
      }
    });
    testSanskritEditId = sanskritEdit.id;

    const journalPost = await prisma.journalPost.create({
      data: {
        title: 'Sacred Gold Leaf Craftsmanship',
        slug: `lb-journal-${Date.now()}`,
        content: '<p>Exploring the divine history of gold leaf art.</p>',
        status: 'PUBLISHED'
      }
    });
    testJournalPostId = journalPost.id;

    console.log('--- CATEGORY A: Lookbook Lifecycle & Publishing ---');
    let createdLookbookId: string;
    let createdSlug: string;

    // A1. Create Draft Lookbook
    const resA1 = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Varanasi Heritage Autumn 2026',
      shortDescription: 'A visual celebration of sacred temple heritage',
      description: '<p>Curated archival pieces and stories.</p>',
      coverMediaId: testMediaId1,
      seoTitle: 'Varanasi Heritage Lookbook',
      seoDescription: 'Discover our luxury temple art lookbook.'
    }, superAdminToken);

    assert(resA1.status === 201, 'A1. Create Draft Lookbook returns 201 Created');
    assert(resA1.body.data.status === 'DRAFT', 'A1. Initial status defaults to DRAFT');
    assert(resA1.body.data.slug === 'varanasi-heritage-autumn-2026', 'A1. Slug auto-generated correctly');
    assert(resA1.body.data.featured === false, 'A1. featured defaults to false');
    assert(resA1.body.data.publishedAt === null, 'A1. publishedAt is null for DRAFT');
    createdLookbookId = resA1.body.data.id;
    createdSlug = resA1.body.data.slug;

    // A2. Cannot set featured=true on DRAFT
    const resA2 = await request('PATCH', `/api/v1/admin/lookbooks/${createdLookbookId}`, {
      featured: true
    }, superAdminToken);
    assert(resA2.status === 400, 'A2. Setting featured=true on DRAFT returns 400 Bad Request');
    assert(resA2.body.error.code === 'LOOKBOOK_FEATURED_REQUIRES_PUBLISHED', 'A2. Error code is LOOKBOOK_FEATURED_REQUIRES_PUBLISHED');

    // A3. Publish Lookbook
    const resA3 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/publish`, {}, superAdminToken);
    assert(resA3.status === 200, 'A3. Publish lookbook returns 200 OK');
    assert(resA3.body.data.status === 'PUBLISHED', 'A3. Status is now PUBLISHED');
    assert(resA3.body.data.publishedAt !== null, 'A3. publishedAt automatically populated upon publishing');

    // A4. Set featured=true on PUBLISHED Lookbook
    const resA4 = await request('PATCH', `/api/v1/admin/lookbooks/${createdLookbookId}`, {
      featured: true
    }, superAdminToken);
    assert(resA4.status === 200, 'A4. Set featured=true on PUBLISHED lookbook succeeds');
    assert(resA4.body.data.featured === true, 'A4. featured is now true');

    // A5. Unpublish resets featured to false
    const resA5 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/unpublish`, {}, superAdminToken);
    assert(resA5.status === 200, 'A5. Unpublish lookbook returns 200 OK');
    assert(resA5.body.data.status === 'DRAFT', 'A5. Status transitioned back to DRAFT');
    assert(resA5.body.data.featured === false, 'A5. featured automatically reset to false upon unpublishing');

    // A6. Archive resets featured to false
    await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/publish`, {}, superAdminToken);
    await request('PATCH', `/api/v1/admin/lookbooks/${createdLookbookId}`, { featured: true }, superAdminToken);
    const resA6 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/archive`, {}, superAdminToken);
    assert(resA6.status === 200, 'A6. Archive lookbook returns 200 OK');
    assert(resA6.body.data.status === 'ARCHIVED', 'A6. Status transitioned to ARCHIVED');
    assert(resA6.body.data.featured === false, 'A6. featured automatically reset to false upon archiving');

    console.log('--- CATEGORY B: Slug Generation & Uniqueness ---');
    // B1. Automatic deduplication on duplicate title
    const resB1 = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Varanasi Heritage Autumn 2026'
    }, superAdminToken);
    assert(resB1.status === 201, 'B1. Duplicate title generates unique slug');
    assert(resB1.body.data.slug === 'varanasi-heritage-autumn-2026-2', 'B1. Slug appended with -2 increment');
    const secondLookbookId = resB1.body.data.id;

    // B2. Slug format validation
    const resB2 = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Invalid Slug Lookbook',
      slug: 'Invalid Slug With Spaces!!'
    }, superAdminToken);
    assert(resB2.status === 400, 'B2. Invalid custom slug format returns 400 Bad Request');

    console.log('--- CATEGORY C: Input Sanitization & Safety ---');
    // C1. XSS payload stripped from rich text fields
    const resC1 = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Sanitization Test Lookbook',
      description: '<p>Welcome <script>alert("XSS")</script>to sacred arts.</p>',
      shortDescription: 'Short <iframe src="evil.com"></iframe>description'
    }, superAdminToken);
    assert(resC1.status === 201, 'C1. Lookbook with script tags created');
    assert(!resC1.body.data.description.includes('<script>'), 'C1. Script tags sanitized from description');
    assert(!resC1.body.data.shortDescription.includes('<iframe>'), 'C1. Iframe tags sanitized from shortDescription');

    console.log('--- CATEGORY D: Deletion Rules & Cascading Protection ---');
    // D1. Cannot delete PUBLISHED lookbook (409)
    await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/publish`, {}, superAdminToken);
    const resD1 = await request('DELETE', `/api/v1/admin/lookbooks/${createdLookbookId}`, undefined, superAdminToken);
    assert(resD1.status === 409, 'D1. Attempt to delete PUBLISHED lookbook returns 409 Conflict');
    assert(resD1.body.error.code === 'LOOKBOOK_DELETE_PUBLISHED_FORBIDDEN', 'D1. Error code is LOOKBOOK_DELETE_PUBLISHED_FORBIDDEN');

    // D2. Can delete ARCHIVED or DRAFT lookbook
    await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/unpublish`, {}, superAdminToken);
    const resD2 = await request('DELETE', `/api/v1/admin/lookbooks/${createdLookbookId}`, undefined, superAdminToken);
    assert(resD2.status === 200, 'D2. Deleting unpublished DRAFT lookbook succeeds');

    // Recreate primary test lookbook for section tests
    const resRecreate = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Tanjore Royal Edit 2026',
      shortDescription: 'Visual curation of royal gold leaf heritage',
      status: 'PUBLISHED'
    }, superAdminToken);
    createdLookbookId = resRecreate.body.data.id;
    createdSlug = resRecreate.body.data.slug;

    console.log('--- CATEGORY E: Lookbook Section Management ---');
    let heroSectionId: string;
    let productsSectionId: string;
    let mixedSectionId: string;

    // E1. Create HERO Section
    const resE1 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/sections`, {
      type: 'HERO',
      title: 'Sacred Gold Leaf Heritage',
      subtitle: 'Century Old Royal Traditions',
      ctaLabel: 'Explore Curated Collection',
      ctaUrl: '/collections/tanjore-royal',
      layout: 'full-width',
      config: { overlayOpacity: 0.4, textAlignment: 'center' }
    }, superAdminToken);
    assert(resE1.status === 201, 'E1. Create HERO section returns 201 Created');
    assert(resE1.body.data.type === 'HERO', 'E1. Section type is HERO');
    assert(resE1.body.data.displayOrder === 0, 'E1. Initial displayOrder is 0');
    heroSectionId = resE1.body.data.id;

    // E2. Create PRODUCTS Section
    const resE2 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/sections`, {
      type: 'PRODUCTS',
      title: 'Featured Masterpieces',
      subtitle: 'Authentic 24K gold foil creations',
      layout: 'grid',
      config: { columns: 3, showPrice: true }
    }, superAdminToken);
    assert(resE2.status === 201, 'E2. Create PRODUCTS section returns 201 Created');
    assert(resE2.body.data.displayOrder === 1, 'E2. displayOrder auto-incremented to 1');
    productsSectionId = resE2.body.data.id;

    // E3. Create MIXED Section
    const resE3 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/sections`, {
      type: 'MIXED',
      title: 'The Royal Ensemble',
      subtitle: 'Stories, Art, and Heritage'
    }, superAdminToken);
    assert(resE3.status === 201, 'E3. Create MIXED section returns 201 Created');
    mixedSectionId = resE3.body.data.id;

    // E4. Reorder Sections
    const resE4 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/sections/reorder`, {
      items: [
        { id: productsSectionId, displayOrder: 0 },
        { id: heroSectionId, displayOrder: 1 },
        { id: mixedSectionId, displayOrder: 2 }
      ]
    }, superAdminToken);
    assert(resE4.status === 200, 'E4. Reorder sections returns 200 OK');
    const reordered = resE4.body.data;
    assert(reordered[0].id === productsSectionId && reordered[0].displayOrder === 0, 'E4. Products section is now first');

    // E5. Toggle Section Visibility
    const resE5 = await request('PATCH', `/api/v1/admin/lookbooks/sections/${mixedSectionId}`, {
      isVisible: false
    }, superAdminToken);
    assert(resE5.status === 200, 'E5. Update section isVisible returns 200 OK');
    assert(resE5.body.data.isVisible === false, 'E5. isVisible updated to false');

    console.log('--- CATEGORY F: Section Entity Relationships ---');
    // F1. Set Section Products
    const resF1 = await request('POST', `/api/v1/admin/lookbooks/sections/${productsSectionId}/products`, {
      products: [{ id: testProductId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF1.status === 200, 'F1. Set section products returns 200 OK');
    assert(resF1.body.data.products.length === 1, 'F1. Product linked to section');
    assert(resF1.body.data.products[0].productId === testProductId, 'F1. Product ID matches');

    // F2. Duplicate product ID rejected with DUPLICATE_SECTION_ITEM
    const resF2 = await request('POST', `/api/v1/admin/lookbooks/sections/${productsSectionId}/products`, {
      products: [
        { id: testProductId, displayOrder: 0 },
        { id: testProductId, displayOrder: 1 }
      ]
    }, superAdminToken);
    assert(resF2.status === 400, 'F2. Duplicate product ID in section returns 400 Bad Request');
    assert(resF2.body.error.code === 'DUPLICATE_SECTION_ITEM', 'F2. Error code is DUPLICATE_SECTION_ITEM');

    // F3. Non-existent product ID returns 404
    const resF3 = await request('POST', `/api/v1/admin/lookbooks/sections/${productsSectionId}/products`, {
      products: [{ id: 'non-existent-product-id' }]
    }, superAdminToken);
    assert(resF3.status === 404, 'F3. Non-existent product ID returns 404 Not Found');

    // F4. Set Section Collections, Artists, Categories, Journals, Sanskrit Edits on Mixed Section
    const resF4Coll = await request('POST', `/api/v1/admin/lookbooks/sections/${mixedSectionId}/collections`, {
      collections: [{ id: testCollectionId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF4Coll.status === 200, 'F4. Set section collections returns 200 OK');

    const resF4Art = await request('POST', `/api/v1/admin/lookbooks/sections/${mixedSectionId}/artists`, {
      artists: [{ id: testArtistId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF4Art.status === 200, 'F4. Set section artists returns 200 OK');

    const resF4Cat = await request('POST', `/api/v1/admin/lookbooks/sections/${mixedSectionId}/categories`, {
      categories: [{ id: testCategoryId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF4Cat.status === 200, 'F4. Set section categories returns 200 OK');

    const resF4Jrn = await request('POST', `/api/v1/admin/lookbooks/sections/${mixedSectionId}/journals`, {
      journals: [{ id: testJournalPostId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF4Jrn.status === 200, 'F4. Set section journals returns 200 OK');

    const resF4Skt = await request('POST', `/api/v1/admin/lookbooks/sections/${mixedSectionId}/sanskrit-edits`, {
      sanskritEdits: [{ id: testSanskritEditId, displayOrder: 0 }]
    }, superAdminToken);
    assert(resF4Skt.status === 200, 'F4. Set section sanskrit edits returns 200 OK');

    console.log('--- CATEGORY G: Section Media Management ---');
    // G1. Attach Media to Section
    const resG1 = await request('POST', `/api/v1/admin/lookbooks/sections/${heroSectionId}/media`, {
      mediaId: testMediaId1,
      role: 'BACKGROUND',
      isPrimary: true
    }, superAdminToken);
    assert(resG1.status === 201, 'G1. Attach media to section returns 201 Created');
    assert(resG1.body.data.role === 'BACKGROUND', 'G1. Media role is BACKGROUND');
    assert(resG1.body.data.isPrimary === true, 'G1. Media isPrimary is true');

    // G2. Attach second media
    const resG2 = await request('POST', `/api/v1/admin/lookbooks/sections/${heroSectionId}/media`, {
      mediaId: testMediaId2,
      role: 'GALLERY',
      isPrimary: false
    }, superAdminToken);
    assert(resG2.status === 201, 'G2. Attach second media returns 201 Created');

    // G3. Set Primary Media
    const resG3 = await request('POST', `/api/v1/admin/lookbooks/sections/${heroSectionId}/media/primary`, {
      mediaId: testMediaId2,
      role: 'GALLERY'
    }, superAdminToken);
    assert(resG3.status === 200, 'G3. Set primary media returns 200 OK');

    // G4. Detach Media
    const resG4 = await request('DELETE', `/api/v1/admin/lookbooks/sections/${heroSectionId}/media/${testMediaId1}/BACKGROUND`, undefined, superAdminToken);
    assert(resG4.status === 200, 'G4. Detach media returns 200 OK');

    console.log('--- CATEGORY H: Lookbook Duplication ---');
    // H1. Duplicate Lookbook
    const resH1 = await request('POST', `/api/v1/admin/lookbooks/${createdLookbookId}/duplicate`, {}, superAdminToken);
    assert(resH1.status === 201, 'H1. Duplicate lookbook returns 201 Created');
    assert(resH1.body.data.title.includes('(Copy)'), 'H1. Duplicate title has (Copy)');
    assert(resH1.body.data.status === 'DRAFT', 'H1. Duplicated lookbook defaults to DRAFT');
    assert(resH1.body.data.sections.length === 3, 'H1. All 3 sections cloned into duplicated lookbook');

    console.log('--- CATEGORY I: Public Storefront API ---');
    // I1. List Published Lookbooks (excludes DRAFT/ARCHIVED)
    const resI1 = await request('GET', '/api/v1/lookbooks');
    assert(resI1.status === 200, 'I1. Public lookbooks list returns 200 OK');
    assert(Array.isArray(resI1.body.data.items), 'I1. Returns items array');
    const publishedSlugs = resI1.body.data.items.map((i: any) => i.slug);
    assert(publishedSlugs.includes(createdSlug), 'I1. Includes published lookbook');

    // I2. Get Published Lookbook by Slug
    const resI2 = await request('GET', `/api/v1/lookbooks/${createdSlug}`);
    assert(resI2.status === 200, 'I2. Public lookbook by slug returns 200 OK');
    assert(resI2.body.data.slug === createdSlug, 'I2. Correct lookbook slug returned');
    // Section 3 (mixedSection) is hidden (isVisible=false), so only 2 sections returned
    assert(resI2.body.data.sections.length === 2, 'I2. Invisible sections omitted from public payload');

    // I3. Internal fields stripped (costPrice not in product payload)
    const prodSection = resI2.body.data.sections.find((s: any) => s.type === 'PRODUCTS');
    assert(prodSection !== undefined, 'I3. Products section is present');
    assert(prodSection.products.length > 0, 'I3. Products array populated');
    assert(prodSection.products[0].costPrice === undefined, 'I3. costPrice stripped from public storefront response');

    // I4. Non-existent slug returns 404
    const resI4 = await request('GET', '/api/v1/lookbooks/non-existent-lookbook-slug');
    assert(resI4.status === 404, 'I4. Non-existent slug returns 404 Not Found');

    console.log('--- CATEGORY J: RBAC Permission Matrix ---');
    // J1. Super Admin has full access
    const resJ1 = await request('GET', '/api/v1/admin/lookbooks', undefined, superAdminToken);
    assert(resJ1.status === 200, 'J1. Super Admin can view lookbooks');

    // J2. Content Manager can create and publish lookbooks
    const resJ2Create = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Content Manager Lookbook'
    }, contentManagerToken);
    assert(resJ2Create.status === 201, 'J2. Content Manager can create lookbook');
    const cmLookbookId = resJ2Create.body.data.id;

    const resJ2Pub = await request('POST', `/api/v1/admin/lookbooks/${cmLookbookId}/publish`, {}, contentManagerToken);
    assert(resJ2Pub.status === 200, 'J2. Content Manager can publish lookbook');

    // J3. Catalogue Manager can view and create, but cannot publish
    const resJ3Create = await request('POST', '/api/v1/admin/lookbooks', {
      title: 'Catalogue Manager Lookbook'
    }, catalogueManagerToken);
    assert(resJ3Create.status === 201, 'J3. Catalogue Manager can create lookbook');
    const catLookbookId = resJ3Create.body.data.id;

    const resJ3Pub = await request('POST', `/api/v1/admin/lookbooks/${catLookbookId}/publish`, {}, catalogueManagerToken);
    assert(resJ3Pub.status === 403, 'J3. Catalogue Manager cannot publish lookbook (403 Forbidden)');

    // J4. Marketing Manager can view, create, publish, but cannot delete
    const resJ4Pub = await request('POST', `/api/v1/admin/lookbooks/${catLookbookId}/publish`, {}, marketingManagerToken);
    assert(resJ4Pub.status === 200, 'J4. Marketing Manager can publish lookbook');

    const resJ4Del = await request('DELETE', `/api/v1/admin/lookbooks/${catLookbookId}`, undefined, marketingManagerToken);
    assert(resJ4Del.status === 403, 'J4. Marketing Manager cannot delete lookbook (403 Forbidden)');

    // J5. Order Manager has no access (403)
    const resJ5 = await request('GET', '/api/v1/admin/lookbooks', undefined, orderManagerToken);
    assert(resJ5.status === 403, 'J5. Order Manager is forbidden from lookbook module (403 Forbidden)');

    console.log('--- CATEGORY K: Audit Logging Verification ---');
    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        entityType: 'LOOKBOOK'
      }
    });
    assert(auditLogs.length > 0, 'K1. Audit logs recorded for LOOKBOOK operations');
    const actions = auditLogs.map(a => a.action);
    assert(actions.includes('LOOKBOOK_CREATED'), 'K2. Audit log recorded LOOKBOOK_CREATED');
    assert(actions.includes('LOOKBOOK_PUBLISHED') || actions.includes('LOOKBOOK_UPDATED'), 'K3. Audit log recorded status change');

    console.log('\n======================================================');
    console.log(` LOOKBOOK TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runLookbookTests();
