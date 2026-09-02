import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import http from 'node:http';

const TEST_PORT = 5005;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: any = {}) {
  const url = `${baseUrl}${path}`;
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, body: data };
}

async function runTests() {
  console.log('🧪 Starting Lagoree Arts Module 5: Collections Management Automated Test Suite...\n');

  // Seed DB and start test server
  await runSeed();

  // Clean up any test collections from previous test runs
  const testSlugs = [
    'royal-rajasthan-curation',
    'royal-rajasthan-curation-1',
    'auto-slug-test-collection',
    'in-active-preview-edit',
    'unauthorized-test-collection'
  ];
  for (const slug of testSlugs) {
    const existing = prisma.collection.findUnique({ where: { slug } });
    if (existing) {
      prisma.collection.delete({ where: { id: existing.id } });
    }
  }

  const app = createApp();
  server = app.listen(TEST_PORT);
  baseUrl = `http://localhost:${TEST_PORT}`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`• Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error('  Error:', err.message || err);
      failed++;
    }
  }

  let superAdminToken = '';
  let orderManagerToken = '';

  // 1. Authenticate Super Admin
  await test('Super Admin Login for Collection Testing', async () => {
    const res = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@lagoreearts.com',
        password: 'LagoreeAdmin@2026!'
      }
    });
    if (res.status !== 200 || !res.body.data.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
    superAdminToken = res.body.data.accessToken;
  });

  // 2. Authenticate Order Manager (for RBAC testing)
  await test('Order Manager Setup & Token Generation for RBAC Check', async () => {
    const orderRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    if (!orderRole) throw new Error('ORDER_MANAGER role not found in seed');

    const orderAdminEmail = 'order.curator.coll.test@lagoreearts.com';
    let orderAdmin = prisma.adminUser.findUnique({ where: { email: orderAdminEmail } });
    if (!orderAdmin) {
      orderAdmin = prisma.adminUser.create({
        data: {
          name: 'Order Manager Test',
          email: orderAdminEmail,
          passwordHash: 'dummy_hash',
          roleId: orderRole.id,
          status: 'ACTIVE'
        }
      });
    }

    const { generateAccessToken } = await import('../security/jwt.ts');
    orderManagerToken = generateAccessToken({ sub: orderAdmin.id, roleId: orderRole.id });
  });

  let testCollectionId = '';
  let autoSlugCollectionId = '';

  // 1. Create collection
  await test('1. Create Collection (POST /api/v1/admin/collections)', async () => {
    const res = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Royal Rajasthan Curation',
        slug: 'royal-rajasthan-curation',
        shortDescription: 'Regal portraits, vintage jharokha frames, and gold leaf Pichwai.',
        description: 'An exclusive collection honoring the royal atelier traditions of Mewar and Marwar.',
        heroTitle: 'Imperial Grandeur of Rajasthan',
        status: 'ACTIVE',
        type: 'MANUAL',
        isFeatured: true,
        sortOrder: 10
      }
    });

    if (res.status !== 201 || !res.body.data.id || res.body.data.slug !== 'royal-rajasthan-curation') {
      throw new Error(`Create collection failed: ${JSON.stringify(res.body)}`);
    }
    testCollectionId = res.body.data.id;
  });

  // 2. Create with automatic slug
  await test('2. Create Collection with Automatic Slug Generation', async () => {
    const res = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Auto Slug Test Collection',
        shortDescription: 'Verifying automatic slug generation.'
      }
    });

    if (res.status !== 201 || res.body.data.slug !== 'auto-slug-test-collection') {
      throw new Error(`Auto-slug collection failed: ${JSON.stringify(res.body)}`);
    }
    autoSlugCollectionId = res.body.data.id;
  });

  // 3. Duplicate slug rejected
  await test('3. Duplicate Slug Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Another Collection',
        slug: 'royal-rajasthan-curation'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SLUG') {
      throw new Error(`Expected 400 DUPLICATE_SLUG, got ${res.status}`);
    }
  });

  // 4. Unique slug generation helper
  await test('4. Unique Slug Resolution Helper', async () => {
    const { CollectionsService } = await import('../modules/collections/collections.service.ts');
    const slug1 = await CollectionsService.resolveUniqueSlug('Royal Rajasthan Curation');
    if (!slug1.startsWith('royal-rajasthan-curation-')) {
      throw new Error(`Expected suffix for duplicate candidate, got ${slug1}`);
    }
  });

  // 5. Get collection by ID
  await test('5. Get Collection by ID (GET /api/v1/admin/collections/:id)', async () => {
    const res = await request(`/api/v1/admin/collections/${testCollectionId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.id !== testCollectionId) {
      throw new Error(`Get collection by ID failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 6. Get collection by slug
  await test('6. Get Collection by Slug (GET /api/v1/collections/:slug)', async () => {
    const res = await request('/api/v1/collections/royal-rajasthan-curation');
    if (res.status !== 200 || res.body.data.slug !== 'royal-rajasthan-curation') {
      throw new Error(`Get collection by slug failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 7. Update collection
  await test('7. Update Collection Details (PATCH /api/v1/admin/collections/:id)', async () => {
    const res = await request(`/api/v1/admin/collections/${testCollectionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        heroTitle: 'Magnificent Imperial Heritage of Mewar',
        shortDescription: 'Updated archival royal art curation.'
      }
    });
    if (res.status !== 200 || res.body.data.heroTitle !== 'Magnificent Imperial Heritage of Mewar') {
      throw new Error(`Update collection failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 8. Update slug
  await test('8. Update Collection Slug (PATCH /api/v1/admin/collections/:id)', async () => {
    const res = await request(`/api/v1/admin/collections/${autoSlugCollectionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        slug: 'auto-slug-renamed'
      }
    });
    if (res.status !== 200 || res.body.data.slug !== 'auto-slug-renamed') {
      throw new Error(`Update slug failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 9. Invalid update rejected
  await test('9. Invalid Update Rejection on Duplicate Slug (HTTP 400)', async () => {
    const res = await request(`/api/v1/admin/collections/${autoSlugCollectionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        slug: 'royal-rajasthan-curation'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SLUG') {
      throw new Error(`Expected 400 DUPLICATE_SLUG on update collision, got ${res.status}`);
    }
  });

  // 10. List collections
  await test('10. List Collections (GET /api/v1/admin/collections)', async () => {
    const res = await request('/api/v1/admin/collections', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.body.data.items) || res.body.data.items.length === 0) {
      throw new Error(`List collections failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 11. Pagination
  await test('11. Pagination Support (GET /api/v1/admin/collections?page=1&limit=3)', async () => {
    const res = await request('/api/v1/admin/collections?page=1&limit=3', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length !== 3 || res.body.data.pagination.limit !== 3) {
      throw new Error(`Pagination failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 12. Search
  await test('12. Search Support (GET /api/v1/admin/collections?search=rajasthan)', async () => {
    const res = await request('/api/v1/admin/collections?search=rajasthan', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error(`Search collections failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 13. Status filter
  await test('13. Status Filter (GET /api/v1/admin/collections?status=ACTIVE)', async () => {
    const res = await request('/api/v1/admin/collections?status=ACTIVE', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((c: any) => c.status !== 'ACTIVE')) {
      throw new Error(`Status filter failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 14. Featured filter
  await test('14. Featured Filter (GET /api/v1/admin/collections?featured=true)', async () => {
    const res = await request('/api/v1/admin/collections?featured=true', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((c: any) => !c.isFeatured)) {
      throw new Error(`Featured filter failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 15. Type filter
  await test('15. Type Filter (GET /api/v1/admin/collections?type=MANUAL)', async () => {
    const res = await request('/api/v1/admin/collections?type=MANUAL', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((c: any) => c.type !== 'MANUAL')) {
      throw new Error(`Type filter failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 16. Sorting
  await test('16. Sorting by Name Descending (GET /api/v1/admin/collections?sort=name&order=desc)', async () => {
    const res = await request('/api/v1/admin/collections?sort=name&order=desc', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length < 2) {
      throw new Error('Sorting query failed');
    }
    const names = res.body.data.items.map((i: any) => i.name.toLowerCase());
    for (let i = 0; i < names.length - 1; i++) {
      if (names[i].localeCompare(names[i + 1]) < 0) {
        throw new Error('Names not sorted in descending order');
      }
    }
  });

  // 17. Feature collection
  await test('17. Feature / Unfeature Collection (PATCH /api/v1/admin/collections/:id)', async () => {
    const res = await request(`/api/v1/admin/collections/${autoSlugCollectionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { isFeatured: true }
    });
    if (res.status !== 200 || !res.body.data.isFeatured) {
      throw new Error(`Feature collection failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 18. Change status
  await test('18. Change Collection Status to INACTIVE', async () => {
    const res = await request(`/api/v1/admin/collections/${autoSlugCollectionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'INACTIVE' }
    });
    if (res.status !== 200 || res.body.data.status !== 'INACTIVE') {
      throw new Error(`Change status failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 19. Change sort order
  await test('19. Change Sort Order (PATCH /api/v1/admin/collections/:id/sort)', async () => {
    const res = await request(`/api/v1/admin/collections/${testCollectionId}/sort`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { sortOrder: 15 }
    });
    if (res.status !== 200 || res.body.data.sortOrder !== 15) {
      throw new Error(`Change sort order failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 20. Delete collection
  await test('20. Delete Collection (DELETE /api/v1/admin/collections/:id)', async () => {
    const res = await request(`/api/v1/admin/collections/${autoSlugCollectionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Delete collection failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 21. Public API returns active collections
  await test('21. Public Storefront List Returns Active Collections (GET /api/v1/collections)', async () => {
    const res = await request('/api/v1/collections');
    if (res.status !== 200 || !Array.isArray(res.body.data.items) || res.body.data.items.length === 0) {
      throw new Error(`Public collections failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 22. Public API hides inactive collections
  await test('22. Public API Hides Inactive Collections', async () => {
    // Create inactive collection
    const inactiveRes = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'In Active Preview Edit',
        slug: 'in-active-preview-edit',
        status: 'INACTIVE'
      }
    });
    if (inactiveRes.status !== 201) throw new Error('Failed to create inactive collection');
    const inactiveId = inactiveRes.body.data.id;

    // Public list should not contain it
    const listRes = await request('/api/v1/collections');
    const found = listRes.body.data.items.find((c: any) => c.slug === 'in-active-preview-edit');
    if (found) throw new Error('Inactive collection appeared in public list');

    // Public detail must return 404
    const detailRes = await request('/api/v1/collections/in-active-preview-edit');
    if (detailRes.status !== 404) {
      throw new Error(`Expected 404 for inactive collection, got ${detailRes.status}`);
    }

    // Cleanup
    await request(`/api/v1/admin/collections/${inactiveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  // 23. Public collection detail
  await test('23. Public Collection Detail by Slug with SEO Data', async () => {
    const res = await request('/api/v1/collections/the-sanskrit-edit');
    if (res.status !== 200 || res.body.data.slug !== 'the-sanskrit-edit' || !res.body.data.metaTitle) {
      throw new Error(`Public detail failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 24. Missing collection returns 404
  await test('24. Non-Existent Collection Returns HTTP 404', async () => {
    const res = await request('/api/v1/collections/non-existent-editorial-slug');
    if (res.status !== 404 || res.body.error?.code !== 'NOT_FOUND') {
      throw new Error(`Expected 404 NOT_FOUND, got ${res.status}`);
    }
  });

  // 25. RBAC — Unauthorized role gets 403
  await test('25. RBAC Check: Order Manager Denied collection.create (HTTP 403)', async () => {
    const res = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orderManagerToken}` },
      body: { name: 'Unauthorized Collection' }
    });
    if (res.status !== 403 || res.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for Order Manager, got ${res.status}`);
    }
  });

  // 26. RBAC — Authorized role succeeds
  await test('26. RBAC Check: Super Admin Authorized for collection.create (HTTP 201)', async () => {
    const res = await request('/api/v1/admin/collections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: 'Authorized Curation Test' }
    });
    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Expected 201 for Super Admin, got ${res.status}`);
    }
    // Cleanup
    await request(`/api/v1/admin/collections/${res.body.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  // 27. Audit log on create
  await test('27. Audit Log on Collection Create', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_CREATED' }
    });
    if (!log) throw new Error('COLLECTION_CREATED audit log not recorded');
  });

  // 28. Audit log on update
  await test('28. Audit Log on Collection Update', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_UPDATED' }
    });
    if (!log) throw new Error('COLLECTION_UPDATED audit log not recorded');
  });

  // 29. Audit log on delete
  await test('29. Audit Log on Collection Delete', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_DELETED' }
    });
    if (!log) throw new Error('COLLECTION_DELETED audit log not recorded');
  });

  // 30. Audit log on status change
  await test('30. Audit Log on Collection Status Change', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_STATUS_CHANGED' }
    });
    if (!log) throw new Error('COLLECTION_STATUS_CHANGED audit log not recorded');
  });

  // 31. Audit log on featured change
  await test('31. Audit Log on Collection Featured Change', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_FEATURED_CHANGED' }
    });
    if (!log) throw new Error('COLLECTION_FEATURED_CHANGED audit log not recorded');
  });

  // 32. Audit log on sort change
  await test('32. Audit Log on Collection Sort Change', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'COLLECTIONS', action: 'COLLECTION_SORT_CHANGED' }
    });
    if (!log) throw new Error('COLLECTION_SORT_CHANGED audit log not recorded');
  });

  // Cleanup test collection
  await request(`/api/v1/admin/collections/${testCollectionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });

  server.close();

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 5 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal collections test error:', err);
  if (server) server.close();
  process.exit(1);
});
