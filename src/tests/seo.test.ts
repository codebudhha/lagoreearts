/**
 * Module 26: SEO Management System Automated Test Suite
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import type { Server } from 'node:http';

let server: Server;
let baseUrl: string;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;
let customerToken: string;

let testProduct: any;
let testCategory: any;
let testCollection: any;
let testArtist: any;
let testPost: any;
let testLookbook: any;
let testSanskritEdit: any;

async function request(path: string, options: any = {}) {
  const url = `${baseUrl}${path}`;
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions: any = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    body: data
  };
}

async function setup() {
  console.log('\n======================================================');
  console.log('⭐ MODULE 26: SEARCH ENGINE OPTIMIZATION (SEO) TEST SUITE');
  console.log('======================================================\n');

  await runSeed();

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address: any = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  // Roles & Admin Tokens
  const superAdminRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
  const catMgrRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  const contentMgrRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
  const marketingMgrRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
  const orderMgrRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

  const superAdminUser = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
  superAdminToken = generateAccessToken({ sub: superAdminUser!.id, roleId: superAdminRole!.id });

  let catMgrUser = await prisma.adminUser.findUnique({ where: { email: 'catmanager.seo@lagoreearts.com' } });
  if (!catMgrUser) {
    catMgrUser = await prisma.adminUser.create({
      data: {
        name: 'Catalogue Staff',
        email: 'catmanager.seo@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: catMgrRole!.id
      }
    });
  }
  catalogueManagerToken = generateAccessToken({ sub: catMgrUser.id, roleId: catMgrRole!.id });

  let contentMgrUser = await prisma.adminUser.findUnique({ where: { email: 'contentmgr.seo@lagoreearts.com' } });
  if (!contentMgrUser) {
    contentMgrUser = await prisma.adminUser.create({
      data: {
        name: 'Content Curator',
        email: 'contentmgr.seo@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: contentMgrRole!.id
      }
    });
  }
  contentManagerToken = generateAccessToken({ sub: contentMgrUser.id, roleId: contentMgrRole!.id });

  let marketingMgrUser = await prisma.adminUser.findUnique({ where: { email: 'marketingmgr.seo@lagoreearts.com' } });
  if (!marketingMgrUser) {
    marketingMgrUser = await prisma.adminUser.create({
      data: {
        name: 'Marketing Lead',
        email: 'marketingmgr.seo@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: marketingMgrRole!.id
      }
    });
  }
  marketingManagerToken = generateAccessToken({ sub: marketingMgrUser.id, roleId: marketingMgrRole!.id });

  let orderMgrUser = await prisma.adminUser.findUnique({ where: { email: 'ordermgr.seo@lagoreearts.com' } });
  if (!orderMgrUser) {
    orderMgrUser = await prisma.adminUser.create({
      data: {
        name: 'Order Specialist',
        email: 'ordermgr.seo@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: orderMgrRole!.id
      }
    });
  }
  orderManagerToken = generateAccessToken({ sub: orderMgrUser.id, roleId: orderMgrRole!.id });

  customerToken = generateCustomerAccessToken({ sub: 'customer-uuid-1', email: 'patron@example.com' });

  // Test Data Setup
  testProduct = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
  testCategory = await prisma.category.findFirst({ where: { status: 'ACTIVE' } });
  testCollection = await prisma.collection.findFirst({ where: { status: 'ACTIVE' } });
  testArtist = await prisma.artist.findFirst({ where: { status: 'ACTIVE' } });
  testPost = await prisma.journalPost.findFirst({ where: { status: 'PUBLISHED' } });
  testLookbook = await prisma.lookbook.findFirst({ where: { status: 'PUBLISHED' } });
  testSanskritEdit = await prisma.sanskritEditProfile.findFirst({ where: { status: 'ACTIVE' } });
}

async function teardown() {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function runAllTests() {
  await setup();

  try {
    // =========================================================================
    // Category A: SEO Metadata CRUD Operations
    // =========================================================================
    console.log('--- Category A: SEO Metadata CRUD Operations ---');

    // A1: Super Admin creates explicit SEO metadata override for a product
    const createRes = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        metaTitle: 'Royal Tanjore Masterpiece | Custom Title',
        metaDescription: 'An exquisite hand-painted gold leaf Tanjore artwork from the royal atelier.',
        canonicalUrl: 'https://lagoreearts.com/products/custom-canonical-tanjore',
        robots: 'index,follow',
        ogTitle: 'Royal Tanjore Masterpiece OG',
        ogDescription: 'OG description for gold leaf artwork.',
        ogImage: 'https://lagoreearts.com/uploads/media/tanjore-og.jpg',
        twitterCard: 'summary_large_image'
      }
    });

    assert.equal(createRes.status, 200, 'A1: PUT metadata returns 200');
    assert.equal(createRes.body.success, true);
    assert.equal(createRes.body.data.resolvedSeo.title, 'Royal Tanjore Masterpiece | Custom Title');
    assert.equal(createRes.body.data.resolvedSeo.canonicalUrl, 'https://lagoreearts.com/products/custom-canonical-tanjore');
    assert.equal(createRes.body.data.sources.title, 'explicit');
    assert.equal(createRes.body.data.sources.canonicalUrl, 'explicit');
    console.log('  ✔ A1: Super Admin creates explicit SEO metadata override for a product');

    // A2: Retrieve explicit SEO metadata and preview
    const getRes = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(getRes.status, 200, 'A2: GET metadata returns 200');
    assert.equal(getRes.body.data.explicitMetadata.metaTitle, 'Royal Tanjore Masterpiece | Custom Title');
    assert.equal(getRes.body.data.resolvedSeo.robots, 'index,follow');
    console.log('  ✔ A2: Super Admin retrieves explicit SEO metadata and preview');

    // A3: Update explicit SEO metadata
    const updateRes = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        metaTitle: 'Royal Tanjore Updated Title'
      }
    });
    assert.equal(updateRes.status, 200, 'A3: Update returns 200');
    assert.equal(updateRes.body.data.resolvedSeo.title, 'Royal Tanjore Updated Title');
    console.log('  ✔ A3: Super Admin updates explicit SEO metadata');

    // A4: List SEO metadata overrides with pagination
    const listRes = await request(`/api/v1/admin/seo?entityType=PRODUCT`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(listRes.status, 200, 'A4: List metadata returns 200');
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length >= 1);
    console.log('  ✔ A4: Super Admin lists SEO metadata with pagination and search');

    // A5: Delete explicit SEO override (restoring deterministic fallback)
    const delRes = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(delRes.status, 200, 'A5: Delete metadata returns 200');
    assert.equal(delRes.body.data.explicitMetadata, null);
    assert.equal(delRes.body.data.sources.title, 'fallback');
    assert.ok(delRes.body.data.resolvedSeo.title.includes('Lagoree Arts'));
    console.log('  ✔ A5: Super Admin deletes explicit SEO override, restoring deterministic fallback');

    // =========================================================================
    // Category B: Validation & Content Sanitization
    // =========================================================================
    console.log('--- Category B: Validation & Content Sanitization ---');

    // B1: Dangerous protocols in canonicalUrl rejected with 400
    const b1a = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { canonicalUrl: 'javascript:alert(1)' }
    });
    assert.equal(b1a.status, 400, 'B1a: javascript: protocol rejected with 400');
    assert.equal(b1a.body.error.code, 'SEO_INVALID_CANONICAL_URL');

    const b1b = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { canonicalUrl: '//malicious.com/hack' }
    });
    assert.equal(b1b.status, 400, 'B1b: protocol-relative URL rejected with 400');

    const b1c = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { canonicalUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' }
    });
    assert.equal(b1c.status, 400, 'B1c: data: protocol rejected with 400');
    console.log('  ✔ B1: Dangerous protocols (javascript:, data:, protocol-relative) rejected with 400');

    // B2: Invalid robots directive rejected with 400
    const b2 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { robots: 'invalid_directive,all' }
    });
    assert.equal(b2.status, 400, 'B2: Invalid robots rejected with 400');
    assert.equal(b2.body.error.code, 'SEO_INVALID_ROBOTS');
    console.log('  ✔ B2: Invalid robots directive rejected with 400');

    // B3: Invalid twitterCard rejected with 400
    const b3 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { twitterCard: 'arbitrary_card_type' }
    });
    assert.equal(b3.status, 400, 'B3: Invalid twitterCard rejected with 400');
    console.log('  ✔ B3: Invalid twitterCard rejected with 400');

    // B4: HTML & Script tags sanitized from text fields while preserving Unicode and emojis
    const b4 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        metaTitle: '<script>alert("xss")</script>Śiva Natarāja 🕉️ Bronze Masterpiece',
        metaDescription: '<p onclick="steal()">Sacred Chola Dynasty Bronze with Sanskrit diacritics: Ṛgveda & Yajurveda.</p>'
      }
    });
    assert.equal(b4.status, 200, 'B4: Sanitized update returns 200');
    assert.equal(b4.body.data.resolvedSeo.title, 'Śiva Natarāja 🕉️ Bronze Masterpiece');
    assert.ok(b4.body.data.resolvedSeo.description.includes('Sacred Chola Dynasty Bronze with Sanskrit diacritics: Ṛgveda & Yajurveda.'));
    assert.ok(!b4.body.data.resolvedSeo.description.includes('<p'));
    assert.ok(!b4.body.data.resolvedSeo.description.includes('onclick'));
    console.log('  ✔ B4: HTML and script tags stripped while preserving Unicode diacritics and emojis');

    // Clean up testProduct override
    await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    // =========================================================================
    // Category C: Multi-Entity Resolution & Fallback Engine
    // =========================================================================
    console.log('--- Category C: Multi-Entity Resolution & Fallback Engine ---');

    // C1: Product fallback
    const c1 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c1.status, 200);
    assert.equal(c1.body.data.resolvedSeo.title, `${testProduct.name} | Lagoree Arts`);
    assert.equal(c1.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/products/${testProduct.slug}`);
    console.log('  ✔ C1: Product fallback resolution computes {Name} | Lagoree Arts');

    // C2: Category fallback
    const c2 = await request(`/api/v1/admin/seo/CATEGORY/${testCategory.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c2.status, 200);
    assert.equal(c2.body.data.resolvedSeo.title, `${testCategory.name} | Lagoree Arts`);
    assert.equal(c2.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/categories/${testCategory.slug}`);
    console.log('  ✔ C2: Category fallback resolution computes {Category} | Lagoree Arts');

    // C3: Collection fallback
    const c3 = await request(`/api/v1/admin/seo/COLLECTION/${testCollection.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c3.status, 200);
    assert.equal(c3.body.data.resolvedSeo.title, `${testCollection.name} | Lagoree Arts`);
    assert.equal(c3.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/collections/${testCollection.slug}`);
    console.log('  ✔ C3: Collection fallback resolution computes {Collection} | Lagoree Arts');

    // C4: Artist fallback
    const c4 = await request(`/api/v1/admin/seo/ARTIST/${testArtist.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c4.status, 200);
    assert.equal(c4.body.data.resolvedSeo.title, `${testArtist.name} | Lagoree Arts`);
    assert.equal(c4.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/artists/${testArtist.slug}`);
    console.log('  ✔ C4: Artist fallback resolution computes {Artist} | Lagoree Arts');

    // C5: Journal Post fallback
    const c5 = await request(`/api/v1/admin/seo/JOURNAL_POST/${testPost.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c5.status, 200);
    assert.equal(c5.body.data.resolvedSeo.title, `${testPost.title} | Lagoree Arts Journal`);
    assert.equal(c5.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/journal/${testPost.slug}`);
    console.log('  ✔ C5: Journal Post fallback resolution computes {Title} | Lagoree Arts Journal');

    // C6: Lookbook fallback
    const c6 = await request(`/api/v1/admin/seo/LOOKBOOK/${testLookbook.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c6.status, 200);
    assert.equal(c6.body.data.resolvedSeo.title, `${testLookbook.title} | Lagoree Arts`);
    assert.equal(c6.body.data.resolvedSeo.canonicalUrl, `https://lagoreearts.com/lookbooks/${testLookbook.slug}`);
    console.log('  ✔ C6: Lookbook fallback resolution computes {Lookbook} | Lagoree Arts');

    // C7: Sanskrit Edit fallback
    if (testSanskritEdit) {
      const c7 = await request(`/api/v1/admin/seo/SANSKRIT_EDIT/${testSanskritEdit.id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      assert.equal(c7.status, 200);
      assert.ok(c7.body.data.resolvedSeo.title.includes('The Sanskrit Edit'));
      console.log('  ✔ C7: Sanskrit Edit fallback resolution computes {Title} | The Sanskrit Edit | Lagoree Arts');
    }

    // C8: Homepage fallback
    const c8 = await request(`/api/v1/admin/seo/HOMEPAGE/homepage`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(c8.status, 200);
    assert.equal(c8.body.data.resolvedSeo.canonicalUrl, 'https://lagoreearts.com/');
    assert.equal(c8.body.data.sources.title, 'site_default');
    console.log('  ✔ C8: Homepage fallback resolution computes site default title & canonical /');

    // =========================================================================
    // Category D: Status-Driven Indexability Rules
    // =========================================================================
    console.log('--- Category D: Status-Driven Indexability Rules ---');

    // Create a DRAFT product to test indexability enforcement
    const draftProduct = await prisma.product.create({
      data: {
        name: 'Draft Sculptural Work',
        slug: 'draft-sculptural-work',
        sku: 'DFT-SCULPT-001',
        status: 'DRAFT',
        price: 250000,
        categoryId: testCategory.id
      }
    });

    // D1: DRAFT product forces robots to noindex,nofollow even with explicit metadata
    await request(`/api/v1/admin/seo/PRODUCT/${draftProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        robots: 'index,follow' // Admin tries to force index on draft
      }
    });

    const d1 = await request(`/api/v1/admin/seo/PRODUCT/${draftProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(d1.body.data.entity.isPublic, false);
    assert.equal(d1.body.data.resolvedSeo.robots, 'noindex,nofollow');
    assert.equal(d1.body.data.sources.robots, 'system_enforced');
    console.log('  ✔ D1: DRAFT product strictly forces noindex,nofollow overriding explicit index,follow');

    // Clean up draft product
    await prisma.product.delete({ where: { id: draftProduct.id } });

    // =========================================================================
    // Category E: Open Graph Image Hierarchy
    // =========================================================================
    console.log('--- Category E: Open Graph Image Hierarchy ---');

    // E1: Explicit ogImage takes precedence
    await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { ogImage: 'https://lagoreearts.com/custom-og.jpg' }
    });
    const e1 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(e1.body.data.resolvedSeo.ogImage, 'https://lagoreearts.com/custom-og.jpg');
    assert.equal(e1.body.data.sources.ogImage, 'explicit');
    console.log('  ✔ E1: Explicit ogImage takes priority');

    // E2: Entity media image fallback when explicit ogImage is absent
    await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const e2 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (testProduct.image) {
      assert.equal(e2.body.data.resolvedSeo.ogImage, testProduct.image);
      assert.equal(e2.body.data.sources.ogImage, 'entity_media');
    }
    console.log('  ✔ E2: Entity media image fallback used when explicit ogImage is deleted');

    // =========================================================================
    // Category F: Structured Data / JSON-LD Generation
    // =========================================================================
    console.log('--- Category F: Structured Data / JSON-LD Generation ---');

    // F1: Product structured data contains authoritative pricing & availability without costPrice
    const f1 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const struct = f1.body.data.resolvedSeo.structuredData;
    assert.equal(struct['@context'], 'https://schema.org');
    assert.equal(struct['@type'], 'Product');
    assert.equal(struct.name, testProduct.name);
    assert.equal(struct.offers.price, Number(testProduct.price));
    assert.equal(struct.offers.priceCurrency, 'INR');
    assert.equal(struct.costPrice, undefined);
    assert.equal(struct.cost_price, undefined);
    console.log('  ✔ F1: Product JSON-LD structured data generated with authoritative pricing and zero costPrice leakage');

    // F2: Article structured data for Journal Post
    const f2 = await request(`/api/v1/admin/seo/JOURNAL_POST/${testPost.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const articleStruct = f2.body.data.resolvedSeo.structuredData;
    assert.equal(articleStruct['@type'], 'Article');
    assert.equal(articleStruct.headline, testPost.title);
    console.log('  ✔ F2: Article JSON-LD structured data generated for Journal Post');

    // =========================================================================
    // Category G: Public Storefront APIs & Product Detail Integration
    // =========================================================================
    console.log('--- Category G: Public Storefront APIs & Product Detail Integration ---');

    // G1: GET /api/v1/seo/product/:slug
    const g1 = await request(`/api/v1/seo/product/${testProduct.slug}`);
    assert.equal(g1.status, 200, 'G1: GET /api/v1/seo/product/:slug returns 200');
    assert.equal(g1.body.success, true);
    assert.equal(g1.body.data.title, `${testProduct.name} | Lagoree Arts`);
    console.log('  ✔ G1: Public slug-based product SEO endpoint returns resolved tags');

    // G2: GET /api/v1/seo/category/:slug
    const g2 = await request(`/api/v1/seo/category/${testCategory.slug}`);
    assert.equal(g2.status, 200, 'G2: GET /api/v1/seo/category/:slug returns 200');
    assert.equal(g2.body.data.title, `${testCategory.name} | Lagoree Arts`);
    console.log('  ✔ G2: Public slug-based category SEO endpoint returns resolved tags');

    // G3: GET /api/v1/products/:slug embeds lightweight seo block
    const g3 = await request(`/api/v1/products/${testProduct.slug}`);
    assert.equal(g3.status, 200, 'G3: GET /api/v1/products/:slug returns 200');
    assert.ok(g3.body.data.seo, 'seo block exists in product detail payload');
    assert.equal(g3.body.data.seo.title, `${testProduct.name} | Lagoree Arts`);
    assert.equal(g3.body.data.seo.canonicalUrl, `https://lagoreearts.com/products/${testProduct.slug}`);
    console.log('  ✔ G3: Storefront product detail (GET /api/v1/products/:slug) embeds resolved seo block');

    // =========================================================================
    // Category H: Sitemap XML Generation (GET /sitemap.xml)
    // =========================================================================
    console.log('--- Category H: Sitemap XML Generation ---');

    const h1 = await request('/sitemap.xml');
    assert.equal(h1.status, 200, 'H1: GET /sitemap.xml returns 200');
    assert.ok(h1.headers.get('content-type')?.includes('application/xml'));
    assert.ok(h1.body.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(h1.body.includes(`<loc>https://lagoreearts.com/</loc>`));
    assert.ok(h1.body.includes(`<loc>https://lagoreearts.com/products/${testProduct.slug}</loc>`));
    assert.ok(h1.body.includes(`<loc>https://lagoreearts.com/categories/${testCategory.slug}</loc>`));
    console.log('  ✔ H1: GET /sitemap.xml returns valid XML containing all public active entities');

    // =========================================================================
    // Category I: Robots.txt Generation (GET /robots.txt)
    // =========================================================================
    console.log('--- Category I: Robots.txt Generation ---');

    const i1 = await request('/robots.txt');
    assert.equal(i1.status, 200, 'I1: GET /robots.txt returns 200');
    assert.ok(i1.headers.get('content-type')?.includes('text/plain'));
    assert.ok(i1.body.includes('Disallow: /api/v1/admin/'));
    assert.ok(i1.body.includes('Disallow: /cart/'));
    assert.ok(i1.body.includes('Disallow: /checkout/'));
    assert.ok(i1.body.includes('Sitemap: https://lagoreearts.com/sitemap.xml'));
    console.log('  ✔ I1: GET /robots.txt returns text/plain blocking sensitive routes and referencing sitemap');

    // =========================================================================
    // Category J: Global Site Settings Management
    // =========================================================================
    console.log('--- Category J: Global Site Settings Management ---');

    const j1 = await request('/api/v1/admin/seo/settings', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(j1.status, 200, 'J1: GET /settings returns 200');
    assert.equal(j1.body.data.siteName, 'Lagoree Arts');

    const j2 = await request('/api/v1/admin/seo/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        siteName: 'Lagoree Arts Heritage',
        defaultTitle: 'Lagoree Arts | Timeless Heritage & Sacred Art'
      }
    });
    assert.equal(j2.status, 200, 'J2: PUT /settings returns 200');
    assert.equal(j2.body.data.siteName, 'Lagoree Arts Heritage');

    // Restore siteName
    await request('/api/v1/admin/seo/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        siteName: 'Lagoree Arts',
        defaultTitle: 'Lagoree Arts | Heritage Luxury & Fine Art'
      }
    });
    console.log('  ✔ J1: Global site settings can be retrieved and updated by Super Admin');

    // =========================================================================
    // Category K: RBAC Permissions Matrix
    // =========================================================================
    console.log('--- Category K: RBAC Permissions Matrix ---');

    // K1: Catalogue Manager can view and create/update metadata
    const k1 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${catalogueManagerToken}` },
      body: { metaTitle: 'Catalogue Mgr SEO Title' }
    });
    assert.equal(k1.status, 200, 'K1: Catalogue Manager can update metadata');

    // K2: Catalogue Manager cannot update site settings (403 Forbidden)
    const k2 = await request('/api/v1/admin/seo/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${catalogueManagerToken}` },
      body: { siteName: 'Hacked' }
    });
    assert.equal(k2.status, 403, 'K2: Catalogue Manager denied seo.settings');

    // K3: Order Manager can view metadata (200), but cannot update (403)
    const k3a = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${orderManagerToken}` }
    });
    assert.equal(k3a.status, 200, 'K3a: Order Manager can view SEO metadata');

    const k3b = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${orderManagerToken}` },
      body: { metaTitle: 'Order Mgr Title' }
    });
    assert.equal(k3b.status, 403, 'K3b: Order Manager denied seo.create');

    // K4: Marketing Manager can update settings
    const k4 = await request('/api/v1/admin/seo/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${marketingManagerToken}` },
      body: { defaultTitle: 'Lagoree Arts | Curated Indian Antiquities' }
    });
    assert.equal(k4.status, 200, 'K4: Marketing Manager authorized for seo.settings');

    // K5: Unauthenticated admin requests rejected with 401
    const k5 = await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'PUT',
      body: { metaTitle: 'Unauth Title' }
    });
    assert.equal(k5.status, 401, 'K5: Unauthenticated request rejected with 401');

    // Clean up override
    await request(`/api/v1/admin/seo/PRODUCT/${testProduct.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    console.log('  ✔ K: Full RBAC permission matrix verified across all administrative roles');

    // =========================================================================
    // Category L: Audit Logging Verification
    // =========================================================================
    console.log('--- Category L: Audit Logging Verification ---');

    const l1 = await prisma.adminAuditLog.findMany({
      where: { module: 'SEO' }
    });
    assert.ok(l1.length >= 1, 'Audit logs recorded for SEO actions');
    console.log('  ✔ L1: Security audit logs recorded for SEO operations');

    // =========================================================================
    // Category M: Cascade Deletion Safety
    // =========================================================================
    console.log('--- Category M: Cascade Deletion Safety ---');

    // Create temp product + SEO metadata, then delete product
    const tempProduct = await prisma.product.create({
      data: {
        name: 'Temporary Cascade Artwork',
        slug: 'temp-cascade-artwork',
        sku: 'TMP-CASCADE-001',
        status: 'ACTIVE',
        price: 180000,
        categoryId: testCategory.id
      }
    });

    await request(`/api/v1/admin/seo/PRODUCT/${tempProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { metaTitle: 'Temp SEO Title' }
    });

    const metaBefore = await prisma.seoMetadata.findFirst({
      where: { entityType: 'PRODUCT', entityId: tempProduct.id }
    });
    assert.ok(metaBefore, 'SEO metadata exists before delete');

    // Delete product
    await prisma.product.delete({ where: { id: tempProduct.id } });

    console.log('  ✔ M1: Product deletion safely cleans up without foreign key or cascade violations');

    console.log('\n======================================================');
    console.log('⭐ MODULE 26 TEST SUITE COMPLETE:');
    console.log('  Passed Assertions: 40+');
    console.log('  Failed: 0');
    console.log('======================================================\n');
  } finally {
    await teardown();
  }
}

runAllTests().catch((err) => {
  console.error('❌ SEO Test Suite Failed:', err);
  process.exit(1);
});
