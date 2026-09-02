import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import http from 'node:http';

const TEST_PORT = 5004;
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
  console.log('🧪 Starting Lagoree Arts Module 4: Attributes & Dynamic Filter Engine Automated Test Suite...\n');

  // Seed DB and start test server
  await runSeed();

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
  await test('Super Admin Login for Attribute Testing', async () => {
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
  await test('Order Manager Login for RBAC Check', async () => {
    const orderRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    if (!orderRole) throw new Error('ORDER_MANAGER role not found in seed');

    const orderAdminEmail = 'order.curator.attr.test@lagoreearts.com';
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

    // Create token for order manager role
    const { generateAccessToken } = await import('../security/jwt.ts');
    orderManagerToken = generateAccessToken({ sub: orderAdmin.id, roleId: orderRole.id });
  });

  let testAttrId = '';
  let testValueId1 = '';
  let testValueId2 = '';

  // 3. Create Custom Attribute
  await test('Create Custom Attribute (POST /api/v1/admin/attributes)', async () => {
    const res = await request('/api/v1/admin/attributes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Patron Edition',
        slug: 'patron-edition',
        type: 'SELECT',
        description: 'Exclusive archival edition type',
        isFilterable: true,
        sortOrder: 20
      }
    });

    if (res.status !== 201 || !res.body.data.id || res.body.data.slug !== 'patron-edition') {
      throw new Error(`Create attribute failed: ${JSON.stringify(res.body)}`);
    }
    testAttrId = res.body.data.id;
  });

  // 4. Duplicate Attribute Slug Rejection
  await test('Duplicate Attribute Slug Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/attributes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Another Edition',
        slug: 'patron-edition'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SLUG') {
      throw new Error(`Expected 400 DUPLICATE_SLUG, got ${res.status}`);
    }
  });

  // 5. List Attributes with Search and Filtering
  await test('List Attributes with Search & Pagination (GET /api/v1/admin/attributes)', async () => {
    const res = await request('/api/v1/admin/attributes?page=1&limit=5&search=edition', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.data.pagination || res.body.data.items.length === 0) {
      throw new Error(`List attributes failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 6. View Attribute Detail
  await test('View Attribute Detail with Values (GET /api/v1/admin/attributes/:id)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.id !== testAttrId) {
      throw new Error(`Get attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 7. Update Attribute Metadata
  await test('Update Attribute Metadata (PATCH /api/v1/admin/attributes/:id)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        description: 'Updated archival edition tier for masterworks',
        sortOrder: 25
      }
    });
    if (res.status !== 200 || res.body.data.sortOrder !== 25) {
      throw new Error(`Update attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 8. Create Attribute Value 1
  await test('Create Attribute Value 1 (POST /api/v1/admin/attributes/:id/values)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}/values`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Royal Atelier Edition',
        slug: 'royal-atelier-edition',
        sortOrder: 1
      }
    });

    if (res.status !== 201 || !res.body.data.id || res.body.data.slug !== 'royal-atelier-edition') {
      throw new Error(`Create value failed: ${JSON.stringify(res.body)}`);
    }
    testValueId1 = res.body.data.id;
  });

  // 9. Create Attribute Value 2
  await test('Create Attribute Value 2 with Auto-Slug', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}/values`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Curator Gold Edition',
        sortOrder: 2
      }
    });

    if (res.status !== 201 || res.body.data.slug !== 'curator-gold-edition') {
      throw new Error(`Create value 2 failed: ${JSON.stringify(res.body)}`);
    }
    testValueId2 = res.body.data.id;
  });

  // 10. Duplicate Value Name/Slug Rejection under Same Attribute
  await test('Duplicate Value Name Rejection under Same Attribute (HTTP 400)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}/values`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Royal Atelier Edition'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_VALUE_NAME') {
      throw new Error(`Expected 400 DUPLICATE_VALUE_NAME, got ${res.status}`);
    }
  });

  // 11. List Attribute Values
  await test('List Attribute Values (GET /api/v1/admin/attributes/:id/values)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}/values`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length < 2) {
      throw new Error(`List values failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 12. Update Attribute Value
  await test('Update Attribute Value (PATCH /api/v1/admin/attributes/:id/values/:valueId)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}/values/${testValueId1}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Imperial Royal Edition',
        sortOrder: 1
      }
    });
    if (res.status !== 200 || res.body.data.name !== 'Imperial Royal Edition') {
      throw new Error(`Update value failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 13. Safe Deletion: Cannot delete attribute with existing values (HTTP 409)
  await test('Safe Deletion: Blocked When Attribute Has Values (HTTP 409)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 409 || res.body.error?.code !== 'ATTRIBUTE_IN_USE') {
      throw new Error(`Expected 409 ATTRIBUTE_IN_USE, got ${res.status}`);
    }
  });

  // 14. Add Attribute to Category Filter Configuration
  let antiquesCat = prisma.category.findUnique({ where: { slug: 'antiques' } });
  if (!antiquesCat) throw new Error('Antiques category missing');

  await test('Map Attribute to Category Filter (POST /api/v1/admin/categories/:id/attributes)', async () => {
    const res = await request(`/api/v1/admin/categories/${antiquesCat.id}/attributes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        attributeId: testAttrId,
        sortOrder: 10,
        isVisible: true,
        isRequired: false
      }
    });
    if (res.status !== 201 || res.body.data.attributeId !== testAttrId) {
      throw new Error(`Add category attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 15. Duplicate Category-Attribute Binding Rejection
  await test('Duplicate Category-Attribute Binding Rejection (HTTP 400)', async () => {
    const res = await request(`/api/v1/admin/categories/${antiquesCat.id}/attributes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        attributeId: testAttrId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_CATEGORY_ATTRIBUTE') {
      throw new Error(`Expected 400 DUPLICATE_CATEGORY_ATTRIBUTE, got ${res.status}`);
    }
  });

  // 16. List Category Filter Configuration
  await test('List Category Filter Configuration (GET /api/v1/admin/categories/:id/attributes)', async () => {
    const res = await request(`/api/v1/admin/categories/${antiquesCat.id}/attributes`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`List category attributes failed: ${JSON.stringify(res.body)}`);
    }
    const mapped = res.body.data.find((b: any) => b.attributeId === testAttrId);
    if (!mapped || mapped.sortOrder !== 10) {
      throw new Error('Newly mapped category attribute not present or misconfigured');
    }
  });

  // 17. Update Category Filter Settings
  await test('Update Category Filter Configuration (PATCH /api/v1/admin/categories/:id/attributes/:attrId)', async () => {
    const res = await request(`/api/v1/admin/categories/${antiquesCat.id}/attributes/${testAttrId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        sortOrder: 8,
        isRequired: true
      }
    });
    if (res.status !== 200 || res.body.data.sortOrder !== 8 || !res.body.data.isRequired) {
      throw new Error(`Update category attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 18. Storefront Public API: List Active Filterable Attributes
  await test('Public Active Attributes List (GET /api/v1/attributes)', async () => {
    const res = await request('/api/v1/attributes');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Public attributes failed: ${JSON.stringify(res.body)}`);
    }
    const material = res.body.data.find((a: any) => a.slug === 'material');
    if (!material || material.values.length === 0) {
      throw new Error('Public material attribute missing values');
    }
  });

  // 19. Storefront Public Dynamic Category Filters Endpoint
  await test('Public Category Dynamic Filters (GET /api/v1/categories/:slug/filters)', async () => {
    const res = await request('/api/v1/categories/antiques/filters');
    if (res.status !== 200 || !res.body.data.filters || res.body.data.filters.length === 0) {
      throw new Error(`Public category filters failed: ${JSON.stringify(res.body)}`);
    }
    if (res.body.data.category.slug !== 'antiques') {
      throw new Error('Category metadata mismatched in filters response');
    }
    // Verify our custom attribute is included in the filters list
    const customFilter = res.body.data.filters.find((f: any) => f.slug === 'patron-edition');
    if (!customFilter || customFilter.values.length < 2) {
      throw new Error('Custom category filter missing or values not resolved');
    }
  });

  // 20. RBAC Authorization Check: Order Manager denied attribute.create (HTTP 403)
  await test('RBAC Check: Order Manager denied attribute.create (HTTP 403)', async () => {
    const res = await request('/api/v1/admin/attributes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orderManagerToken}` },
      body: { name: 'Unauthorized Attr' }
    });
    if (res.status !== 403 || res.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for unauthorized role, got ${res.status}`);
    }
  });

  // 21. Remove Attribute from Category Filter
  await test('Remove Attribute from Category (DELETE /api/v1/admin/categories/:id/attributes/:attrId)', async () => {
    const res = await request(`/api/v1/admin/categories/${antiquesCat.id}/attributes/${testAttrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Remove category attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 22. Delete Attribute Values
  await test('Delete Attribute Values (DELETE /api/v1/admin/attributes/:id/values/:valId)', async () => {
    const res1 = await request(`/api/v1/admin/attributes/${testAttrId}/values/${testValueId1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const res2 = await request(`/api/v1/admin/attributes/${testAttrId}/values/${testValueId2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res1.status !== 200 || res2.status !== 200) {
      throw new Error('Failed to delete attribute values');
    }
  });

  // 23. Delete Unused Custom Attribute
  await test('Delete Unused Custom Attribute (DELETE /api/v1/admin/attributes/:id)', async () => {
    const res = await request(`/api/v1/admin/attributes/${testAttrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Delete attribute failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 24. Audit Log Verification for Module 4 Events
  await test('Audit Log Recording for Attribute & Filter Events', async () => {
    const logs = prisma.adminAuditLog.findMany({
      where: { module: 'ATTRIBUTES' },
      take: 10
    });
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error('No attribute audit logs recorded');
    }
    const actions = logs.map((l: any) => l.action);
    if (!actions.includes('ATTRIBUTE_CREATED') || !actions.includes('ATTRIBUTE_VALUE_CREATED')) {
      throw new Error(`Missing expected audit actions, got: ${actions.join(', ')}`);
    }
  });

  server.close();

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 4 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal attribute test error:', err);
  if (server) server.close();
  process.exit(1);
});
