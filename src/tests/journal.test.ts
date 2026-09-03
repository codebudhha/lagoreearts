import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5013;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let testAuthorId: string;
let testCategoryId: string;
let testTagId1: string;
let testTagId2: string;
let testMediaId1: string;
let testMediaId2: string;
let testProductId: string;
let testCollectionId: string;
let testArtistId: string;
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function setup() {
  await runSeed();

  const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const catRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const contentRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const mktRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const ordRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({ sub: superAdminUser?.id || 'admin-id', roleId: superAdminRole?.id || '' });

  let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.journal@lagoreearts.com' } });
  if (!catUser) {
    catUser = prisma.adminUser.create({
      data: {
        name: 'Journal Catalogue Manager',
        email: 'cat.journal@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: catRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

  let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.journal@lagoreearts.com' } });
  if (!contentUser) {
    contentUser = prisma.adminUser.create({
      data: {
        name: 'Journal Content Manager',
        email: 'content.journal@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: contentRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentRole!.id });

  let mktUser = prisma.adminUser.findUnique({ where: { email: 'mkt.journal@lagoreearts.com' } });
  if (!mktUser) {
    mktUser = prisma.adminUser.create({
      data: {
        name: 'Journal Marketing Manager',
        email: 'mkt.journal@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: mktRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

  let ordUser = prisma.adminUser.findUnique({ where: { email: 'ord.journal@lagoreearts.com' } });
  if (!ordUser) {
    ordUser = prisma.adminUser.create({
      data: {
        name: 'Journal Order Manager',
        email: 'ord.journal@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        roleId: ordRole!.id,
        status: 'ACTIVE'
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

  // Create baseline entities for testing relations
  const testMedia1 = await prisma.mediaAsset.create({
    data: {
      filename: `journal-cover-${Date.now()}-1.webp`,
      originalFilename: 'cover.png',
      storageKey: `media/journal-cover-${Date.now()}-1.webp`,
      mimeType: 'image/webp',
      mediaType: 'IMAGE',
      fileSize: 124000,
      publicUrl: `/uploads/journal-cover-${Date.now()}-1.webp`,
      altText: 'Gold foil work in Thanjavur art'
    }
  });
  testMediaId1 = testMedia1.id;

  const testMedia2 = await prisma.mediaAsset.create({
    data: {
      filename: `journal-gallery-${Date.now()}-2.webp`,
      originalFilename: 'gallery.png',
      storageKey: `media/journal-gallery-${Date.now()}-2.webp`,
      mimeType: 'image/webp',
      mediaType: 'IMAGE',
      fileSize: 98000,
      publicUrl: `/uploads/journal-gallery-${Date.now()}-2.webp`,
      altText: 'Artisan hand detailing gesso'
    }
  });
  testMediaId2 = testMedia2.id;

  const seedCategory = await prisma.category.findFirst();

  const testProd = await prisma.product.create({
    data: {
      name: 'Thanjavur Ganesha Gold Masterpiece',
      slug: `thanjavur-ganesha-gold-${Date.now()}`,
      sku: `TNJ-GAN-${Date.now()}`,
      description: 'Sacred 24k gold leaf Tanjore painting of Lord Ganesha',
      price: 45000,
      categoryId: seedCategory!.id,
      status: 'ACTIVE'
    }
  });
  testProductId = testProd.id;

  const testCol = await prisma.collection.create({
    data: {
      name: 'Sacred Gold Leaf Series',
      slug: `sacred-gold-leaf-${Date.now()}`,
      description: 'Curated 24k gold leaf masterworks',
      status: 'ACTIVE'
    }
  });
  testCollectionId = testCol.id;

  const testArt = await prisma.artist.create({
    data: {
      name: 'Master Ustad V. Ramamurthy',
      slug: `master-ramamurthy-${Date.now()}`,
      status: 'ACTIVE'
    }
  });
  testArtistId = testArt.id;

  const testSanskrit = await prisma.sanskritEditProfile.create({
    data: {
      productId: testProd.id,
      sanskritTitle: 'वक्रतुण्ड महाकाय',
      devanagariText: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ',
      transliteration: 'Vakratuṇḍa Mahākāya Sūryakoṭi Samaprabha',
      translation: 'O Lord with curved trunk and immense form, radiant as million suns',
      theme: 'DIVINE_INVOCATION',
      isPublished: true
    }
  });
  testSanskritEditId = testSanskrit.id;

  const app = createApp();
  await new Promise<void>(resolve => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });
}

async function teardown() {
  if (server) {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING MODULE 13: JOURNAL / BLOG PUBLISHING TEST SUITE');
  console.log('==================================================\n');

  try {
    await setup();

    // --------------------------------------------------
    // Category A: Authors Management
    // --------------------------------------------------
    console.log('--- Category A: Author Management & Referential Integrity ---');

    const resA1 = await request('POST', '/api/v1/admin/journal/authors', {
      name: 'Dr. Anand Coomaraswamy',
      bio: '<p>Pioneering art historian who introduced Indian aesthetics to the West.</p>',
      avatarMediaId: testMediaId1,
      status: 'ACTIVE'
    }, superAdminToken);
    assert(resA1.status === 201 && resA1.body.data.slug.startsWith('dr-anand-coomaraswamy'), 'A1: Create journal author with slug generation');
    testAuthorId = resA1.body.data.id;

    // Test duplicate author slug auto-increments
    const resA2 = await request('POST', '/api/v1/admin/journal/authors', {
      name: 'Dr. Anand Coomaraswamy'
    }, superAdminToken);
    assert(resA2.status === 201 && resA2.body.data.slug.startsWith('dr-anand-coomaraswamy-'), 'A2: Duplicate author name generates unique candidate slug');
    const duplicateAuthorId = resA2.body.data.id;

    const resA3 = await request('PATCH', `/api/v1/admin/journal/authors/${testAuthorId}`, {
      bio: '<p>Updated bio with <script>alert("xss")</script>sanitized content.</p>'
    }, contentManagerToken);
    assert(resA3.status === 200 && !resA3.body.data.bio.includes('<script>'), 'A3: Update author and sanitize bio content');

    const resA4 = await request('GET', '/api/v1/admin/journal/authors', undefined, catalogueManagerToken);
    assert(resA4.status === 200 && resA4.body.data.items.length >= 2, 'A4: List authors with pagination');

    const resA5 = await request('DELETE', `/api/v1/admin/journal/authors/${duplicateAuthorId}`, undefined, superAdminToken);
    assert(resA5.status === 200, 'A5: Delete unused author successfully');

    // --------------------------------------------------
    // Category B: Categories & Tags Management
    // --------------------------------------------------
    console.log('\n--- Category B: Categories & Tags Management ---');

    const resB1 = await request('POST', '/api/v1/admin/journal/categories', {
      name: 'Temple Aesthetics & Geometry',
      description: 'Architectural and proportional canons of traditional shrines.',
      sortOrder: 1,
      seoTitle: 'Temple Aesthetics - Sacred Geometries',
      seoDescription: 'Canons of traditional shrine layout'
    }, superAdminToken);
    assert(resB1.status === 201 && resB1.body.data.slug.startsWith('temple-aesthetics-geometry'), 'B1: Create journal category');
    testCategoryId = resB1.body.data.id;
    const testCategorySlug = resB1.body.data.slug;

    const resB2 = await request('PUT', '/api/v1/admin/journal/categories/order', {
      items: [{ id: testCategoryId, sortOrder: 5 }]
    }, contentManagerToken);
    assert(resB2.status === 200, 'B2: Reorder journal categories');

    const resB3 = await request('POST', '/api/v1/admin/journal/tags', {
      name: 'Sacred Proportions'
    }, contentManagerToken);
    assert(resB3.status === 201 && resB3.body.data.slug.startsWith('sacred-proportions'), 'B3: Create journal tag 1');
    testTagId1 = resB3.body.data.id;
    const testTagSlug1 = resB3.body.data.slug;

    const resB4 = await request('POST', '/api/v1/admin/journal/tags', {
      name: 'Vijayanagara Dynasty'
    }, contentManagerToken);
    assert(resB4.status === 201 && resB4.body.data.slug.startsWith('vijayanagara-dynasty'), 'B4: Create journal tag 2');
    testTagId2 = resB4.body.data.id;

    // --------------------------------------------------
    // Category C: Post Creation, Slug & Sanitization
    // --------------------------------------------------
    console.log('\n--- Category C: Post Creation, Validation & XSS Sanitization ---');

    const resC1 = await request('POST', '/api/v1/admin/journal', {
      title: 'Sacred Proportions in Vijayanagara Temple Murals',
      excerpt: 'Exploring the tālamāna iconometrical system in 15th-century fresco art.',
      content: '<p>The Lepakshi ceiling paintings represent the zenith of Vijayanagara narrative mural art.<script>stealCookie()</script><a href="javascript:alert(1)">Click</a></p>',
      type: 'ESSAY',
      status: 'DRAFT',
      authorId: testAuthorId,
      categoryId: testCategoryId,
      tags: [testTagId1, testTagId2],
      seoTitle: 'Sacred Proportions in Vijayanagara Murals',
      seoDescription: 'Talamana canon analysis of Vijayanagara murals',
      seoKeywords: 'Lepakshi, Vijayanagara, Talamana, Indian Murals'
    }, superAdminToken);
    assert(resC1.status === 201, 'C1: Create draft journal post with tags and relationships');
    const testPostId = resC1.body.data.id;
    const testPostSlug = resC1.body.data.slug;

    assert(!resC1.body.data.content.includes('<script>') && !resC1.body.data.content.includes('javascript:'), 'C2: HTML content sanitized against script tags and dangerous hrefs');

    // --------------------------------------------------
    // Category D: Editorial Publishing Lifecycle
    // --------------------------------------------------
    console.log('\n--- Category D: Editorial Status Lifecycle & Publishing Rules ---');

    // Try to mark as featured while still DRAFT -> Should fail (400)
    const resD1 = await request('PATCH', `/api/v1/admin/journal/${testPostId}`, {
      featured: true
    }, contentManagerToken);
    assert(resD1.status === 400 && resD1.body.error.code === 'JOURNAL_PUBLISH_VALIDATION_FAILED', 'D1: Reject marking DRAFT post as featured');

    // Publish post
    const resD2 = await request('POST', `/api/v1/admin/journal/${testPostId}/publish`, undefined, contentManagerToken);
    assert(resD2.status === 200 && resD2.body.data.status === 'PUBLISHED' && Boolean(resD2.body.data.publishedAt), 'D2: Publish post sets status=PUBLISHED and populates publishedAt');

    // Now mark as featured
    const resD3 = await request('PATCH', `/api/v1/admin/journal/${testPostId}`, {
      featured: true
    }, contentManagerToken);
    assert(resD3.status === 200 && resD3.body.data.featured === true, 'D3: Successfully mark PUBLISHED post as featured');

    // Unpublish post -> Should automatically unmark featured
    const resD4 = await request('POST', `/api/v1/admin/journal/${testPostId}/unpublish`, undefined, contentManagerToken);
    assert(resD4.status === 200 && resD4.body.data.status === 'DRAFT' && resD4.body.data.featured === false, 'D4: Unpublishing post resets status=DRAFT and featured=false automatically');

    // Re-publish post
    await request('POST', `/api/v1/admin/journal/${testPostId}/publish`, undefined, superAdminToken);

    // --------------------------------------------------
    // Category E: Media Management & Cover Invariant
    // --------------------------------------------------
    console.log('\n--- Category E: Media Management & Single Cover Invariant ---');

    const resE1 = await request('POST', `/api/v1/admin/journal/${testPostId}/media`, {
      mediaId: testMediaId1,
      role: 'COVER',
      sortOrder: 1
    }, contentManagerToken);
    assert(resE1.status === 201 && resE1.body.data.role === 'COVER' && resE1.body.data.isPrimary === true, 'E1: Attach COVER media to post with isPrimary=true');

    const resE2 = await request('POST', `/api/v1/admin/journal/${testPostId}/media`, {
      mediaId: testMediaId2,
      role: 'GALLERY',
      sortOrder: 2
    }, contentManagerToken);
    assert(resE2.status === 201 && resE2.body.data.role === 'GALLERY', 'E2: Attach GALLERY media to post');

    // Attach second COVER -> Should replace previous COVER as primary
    const testMedia3 = await prisma.mediaAsset.create({
      data: {
        filename: `journal-cover-${Date.now()}-3.webp`,
        originalFilename: 'cover2.png',
        storageKey: `media/journal-cover-${Date.now()}-3.webp`,
        mimeType: 'image/webp',
        mediaType: 'IMAGE',
        fileSize: 110000,
        publicUrl: `/uploads/journal-cover-${Date.now()}-3.webp`
      }
    });

    const resE3 = await request('POST', `/api/v1/admin/journal/${testPostId}/media`, {
      mediaId: testMedia3.id,
      role: 'COVER',
      sortOrder: 0
    }, contentManagerToken);
    assert(resE3.status === 201 && resE3.body.data.isPrimary === true, 'E3: Attaching second COVER enforces single primary cover invariant');

    // Detach gallery media
    const resE4 = await request('DELETE', `/api/v1/admin/journal/${testPostId}/media/${testMediaId2}?role=GALLERY`, undefined, contentManagerToken);
    assert(resE4.status === 200, 'E4: Detach media from post');

    // Verify underlying MediaAsset was NOT deleted
    const mediaCheck = await prisma.mediaAsset.findUnique({ where: { id: testMediaId2 } });
    assert(mediaCheck !== null, 'E5: Detaching post media preserves base MediaAsset record');

    // E6: Reorder post media items
    const resE6 = await request('PUT', `/api/v1/admin/journal/${testPostId}/media/order`, {
      items: [
        { mediaId: testMedia3.id, role: 'COVER', sortOrder: 1, isPrimary: true }
      ]
    }, contentManagerToken);
    assert(resE6.status === 200, 'E6: Reorder post media items');

    // --------------------------------------------------
    // Category F: Product, Collection, Artist, Sanskrit Edit & Related Post Junctions
    // --------------------------------------------------
    console.log('\n--- Category F: Entity Junction Relationships ---');

    const resF1 = await request('PUT', `/api/v1/admin/journal/${testPostId}/products`, {
      products: [{ id: testProductId, displayOrder: 1 }]
    }, contentManagerToken);
    assert(resF1.status === 200 && resF1.body.data.products.length === 1, 'F1: Attach curated product to journal post');

    const resF2 = await request('PUT', `/api/v1/admin/journal/${testPostId}/collections`, {
      collections: [{ id: testCollectionId, displayOrder: 1 }]
    }, contentManagerToken);
    assert(resF2.status === 200 && resF2.body.data.collections.length === 1, 'F2: Attach collection to journal post');

    const resF3 = await request('PUT', `/api/v1/admin/journal/${testPostId}/artists`, {
      artists: [{ id: testArtistId, displayOrder: 1 }]
    }, contentManagerToken);
    assert(resF3.status === 200 && resF3.body.data.artists.length === 1, 'F3: Attach artist to journal post');

    const resF4 = await request('PUT', `/api/v1/admin/journal/${testPostId}/sanskrit-edit`, {
      sanskritEdits: [{ id: testSanskritEditId, displayOrder: 1 }]
    }, contentManagerToken);
    assert(resF4.status === 200 && resF4.body.data.sanskritEdits.length === 1, 'F4: Attach Sanskrit Edit profile to journal post');

    // Create a 2nd post to test related posts
    const resF5 = await request('POST', '/api/v1/admin/journal', {
      title: 'The Frescoes of Lepakshi',
      content: '<p>A deep study into Veerabhadra temple ceiling panels.</p>',
      type: 'ARTICLE',
      status: 'PUBLISHED'
    }, superAdminToken);
    const relatedPostId = resF5.body.data.id;

    const resF6 = await request('PUT', `/api/v1/admin/journal/${testPostId}/related-posts`, {
      relatedPosts: [{ id: relatedPostId, displayOrder: 1 }]
    }, contentManagerToken);
    assert(resF6.status === 200 && resF6.body.data.relatedPosts.length === 1, 'F6: Attach related journal post');

    // Reject self-referencing related post
    const resF7 = await request('PUT', `/api/v1/admin/journal/${testPostId}/related-posts`, {
      relatedPosts: [{ id: testPostId }]
    }, contentManagerToken);
    assert(resF7.status === 400 && resF7.body.error.code === 'JOURNAL_RELATION_INVALID', 'F7: Reject self-referencing related post');

    // --------------------------------------------------
    // Category G: Public Storefront API Resolution
    // --------------------------------------------------
    console.log('\n--- Category G: Public Storefront API & Data Sanitization ---');

    const resG1 = await request('GET', '/api/v1/journal');
    assert(resG1.status === 200 && resG1.body.data.items.length >= 1, 'G1: Public storefront lists published journal posts');

    const resG2 = await request('GET', `/api/v1/journal/${testPostSlug}`);
    assert(resG2.status === 200 && resG2.body.data.title === 'Sacred Proportions in Vijayanagara Temple Murals', 'G2: Public storefront retrieves single post by slug');

    assert(resG2.body.data.author.name === 'Dr. Anand Coomaraswamy', 'G3: Public storefront enriches active author details');
    assert(resG2.body.data.category.name === 'Temple Aesthetics & Geometry', 'G4: Public storefront enriches active category details');
    assert(resG2.body.data.relatedProducts.length === 1 && resG2.body.data.relatedProducts[0].name === 'Thanjavur Ganesha Gold Masterpiece', 'G5: Public storefront enriches active products');
    assert(resG2.body.data.relatedProducts[0].costPrice === undefined, 'G6: Public storefront strips internal costPrice and inventory metadata');
    assert(resG2.body.data.relatedSanskritEdits.length === 1 && resG2.body.data.relatedSanskritEdits[0].transliteration.includes('Vakratuṇḍa'), 'G7: Public storefront enriches Sanskrit Edit profile');

    // Filtering public posts by category slug
    const resG8 = await request('GET', `/api/v1/journal?categorySlug=${resB1.body.data.slug}`);
    assert(resG8.status === 200 && resG8.body.data.items.length >= 1, 'G8: Public storefront filters posts by category slug');

    // --------------------------------------------------
    // Category H: Referential Integrity & Deletion Rules
    // --------------------------------------------------
    console.log('\n--- Category H: Referential Integrity & Deletion Rules ---');

    // Try to delete author while in use by post -> Should return 409
    const resH1 = await request('DELETE', `/api/v1/admin/journal/authors/${testAuthorId}`, undefined, superAdminToken);
    assert(resH1.status === 409 && resH1.body.error.code === 'JOURNAL_AUTHOR_IN_USE', 'H1: Reject deleting author referenced by active posts (409 Conflict)');

    // Try to delete category while in use by post -> Should return 409
    const resH2 = await request('DELETE', `/api/v1/admin/journal/categories/${testCategoryId}`, undefined, superAdminToken);
    assert(resH2.status === 409 && resH2.body.error.code === 'JOURNAL_CATEGORY_IN_USE', 'H2: Reject deleting category referenced by active posts (409 Conflict)');

    // Delete a tag -> Should safely detach from post without error
    const resH3 = await request('DELETE', `/api/v1/admin/journal/tags/${testTagId2}`, undefined, superAdminToken);
    assert(resH3.status === 200, 'H3: Safely delete tag and cascade detachment from post');

    // Deleting a related product from database should cascade clean junction without deleting post
    await prisma.product.delete({ where: { id: testProductId } });
    const postAfterProdDel = await prisma.journalPost.findUnique({ where: { id: testPostId }, include: { products: true } });
    assert(postAfterProdDel !== null && postAfterProdDel.products.length === 0, 'H4: Deleting base product cleans junction without destroying journal post');

    // --------------------------------------------------
    // Category I: RBAC Permission Matrix
    // --------------------------------------------------
    console.log('\n--- Category I: RBAC Permission Matrix ---');

    // Order Manager has no Journal permissions -> 403
    const resI1 = await request('GET', '/api/v1/admin/journal', undefined, orderManagerToken);
    assert(resI1.status === 403, 'I1: Order Manager cannot view admin journal posts (403 Forbidden)');

    // Marketing Manager can view/publish but not delete -> delete returns 403
    const resI2 = await request('DELETE', `/api/v1/admin/journal/${relatedPostId}`, undefined, marketingManagerToken);
    assert(resI2.status === 403, 'I2: Marketing Manager cannot delete journal posts (403 Forbidden)');

    // Content Manager can delete posts
    const resI3 = await request('DELETE', `/api/v1/admin/journal/${relatedPostId}`, undefined, contentManagerToken);
    assert(resI3.status === 200, 'I3: Content Manager can delete journal posts');

    // --------------------------------------------------
    // Category J: Validation & Edge Cases
    // --------------------------------------------------
    console.log('\n--- Category J: Validation & Edge Cases ---');

    // J1: Invalid post type
    const resJ1 = await request('POST', '/api/v1/admin/journal', {
      title: 'Invalid Post Type Test',
      content: '<p>Content</p>',
      type: 'RECIPE'
    }, superAdminToken);
    assert(resJ1.status === 400, 'J1: Reject invalid post type');

    // J2: Invalid post status
    const resJ2 = await request('POST', '/api/v1/admin/journal', {
      title: 'Invalid Post Status Test',
      content: '<p>Content</p>',
      status: 'PENDING_APPROVAL'
    }, superAdminToken);
    assert(resJ2.status === 400, 'J2: Reject invalid post status');

    // J3: Empty title rejection
    const resJ3 = await request('POST', '/api/v1/admin/journal', {
      title: '   ',
      content: '<p>Content</p>'
    }, superAdminToken);
    assert(resJ3.status === 400, 'J3: Reject empty post title');

    // J4: Invalid author name rejection
    const resJ4 = await request('POST', '/api/v1/admin/journal/authors', {
      name: '  '
    }, superAdminToken);
    assert(resJ4.status === 400, 'J4: Reject empty author name');

    // J5: Invalid category name rejection
    const resJ5 = await request('POST', '/api/v1/admin/journal/categories', {
      name: ''
    }, superAdminToken);
    assert(resJ5.status === 400, 'J5: Reject empty category name');

    // J6: Invalid tag name rejection
    const resJ6 = await request('POST', '/api/v1/admin/journal/tags', {
      name: '   '
    }, superAdminToken);
    assert(resJ6.status === 400, 'J6: Reject empty tag name');

    // J7: Nonexistent product relation attachment rejection
    const resJ7 = await request('PUT', `/api/v1/admin/journal/${testPostId}/products`, {
      products: [{ id: 'non-existent-product-id-9999' }]
    }, contentManagerToken);
    assert(resJ7.status === 404 && resJ7.body.error.code === 'PRODUCT_NOT_FOUND', 'J7: Reject nonexistent product relation');

    // J8: Duplicate product ID in relations rejection
    const resJ8 = await request('PUT', `/api/v1/admin/journal/${testPostId}/collections`, {
      collections: [{ id: testCollectionId }, { id: testCollectionId }]
    }, contentManagerToken);
    assert(resJ8.status === 400 && resJ8.body.error.code === 'JOURNAL_RELATION_INVALID', 'J8: Reject duplicate collection IDs in relation payload');

    // J9: Empty content post publishing rejection
    const resJ9 = await request('POST', '/api/v1/admin/journal', {
      title: 'Post With Only Script Tag',
      content: '<script>alert("xss")</script>',
      status: 'PUBLISHED'
    }, superAdminToken);
    assert(resJ9.status === 400 && resJ9.body.error.code === 'JOURNAL_PUBLISH_VALIDATION_FAILED', 'J9: Reject publishing post whose content is empty after XSS sanitization');

    // J10: Update post with invalid author ID returns 400
    const resJ10 = await request('PATCH', `/api/v1/admin/journal/${testPostId}`, {
      authorId: 'non-existent-author-id'
    }, contentManagerToken);
    assert(resJ10.status === 400 && resJ10.body.error.code === 'JOURNAL_AUTHOR_NOT_FOUND', 'J10: Reject updating post with nonexistent author ID');

    // --------------------------------------------------
    // Category K: Post Archiving & Status Patching
    // --------------------------------------------------
    console.log('\n--- Category K: Post Archiving & Status Patching ---');

    // K1: Archive post endpoint
    const resK1 = await request('POST', `/api/v1/admin/journal/${testPostId}/archive`, undefined, contentManagerToken);
    assert(resK1.status === 200 && resK1.body.data.status === 'ARCHIVED', 'K1: Archive post sets status=ARCHIVED');

    // K2: Public access to archived post by slug returns 404
    const resK2 = await request('GET', `/api/v1/journal/${testPostSlug}`);
    assert(resK2.status === 404, 'K2: Public access to ARCHIVED post returns 404 Not Found');

    // K3: Direct PATCH status to PUBLISHED
    const resK3 = await request('PATCH', `/api/v1/admin/journal/${testPostId}/status`, {
      status: 'PUBLISHED'
    }, contentManagerToken);
    assert(resK3.status === 200 && resK3.body.data.status === 'PUBLISHED', 'K3: Direct PATCH status to PUBLISHED');

    // --------------------------------------------------
    // Category L: Filtering, Searching & Queries
    // --------------------------------------------------
    console.log('\n--- Category L: Queries, Filters & Search ---');

    // L1: Search admin posts by keyword
    const resL1 = await request('GET', '/api/v1/admin/journal?search=Vijayanagara', undefined, superAdminToken);
    assert(resL1.status === 200 && resL1.body.data.items.length >= 1, 'L1: Admin search posts by query text');

    // L2: Filter public posts by tag slug
    const resL2 = await request('GET', `/api/v1/journal?tagSlug=${testTagSlug1}`);
    assert(resL2.status === 200 && resL2.body.data.items.length >= 1, 'L2: Public storefront filter posts by tag slug');

    // L3: Inactive author excluded from public post author detail
    await prisma.journalAuthor.update({
      where: { id: testAuthorId },
      data: { status: 'INACTIVE' }
    });
    const resL3 = await request('GET', `/api/v1/journal/${testPostSlug}`);
    assert(resL3.status === 200 && resL3.body.data.author === null, 'L3: Public post omits inactive author from storefront payload');

    // Restore author to ACTIVE
    await prisma.journalAuthor.update({
      where: { id: testAuthorId },
      data: { status: 'ACTIVE' }
    });

    // --------------------------------------------------
    // Category M: Security Audit Logging
    // --------------------------------------------------
    console.log('\n--- Category M: Security Audit Logging ---');

    const auditLogs = await prisma.adminAuditLog.findMany({
      where: { module: 'JOURNAL' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    assert(auditLogs.length > 0, 'M1: Security audit logs recorded for journal actions');
    const actions = auditLogs.map(l => l.action);
    assert(actions.includes('JOURNAL_POST_CREATED') || actions.includes('JOURNAL_POST_UPDATED') || actions.includes('JOURNAL_AUTHOR_CREATED'), 'M2: Audit logs record specific journal actions');

    // --------------------------------------------------
    // Category N: Health Check & System Verification
    // --------------------------------------------------
    console.log('\n--- Category N: Health Check & System Verification ---');

    const resN1 = await request('GET', '/api/v1/admin/health');
    assert(resN1.status === 200 && resN1.body.data.modules.includes('Module 13: Journal / Blog'), 'N1: Health check includes Module 13: Journal / Blog');

    console.log('\n==================================================');
    console.log(`📊 MODULE 13 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

  } finally {
    await teardown();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
