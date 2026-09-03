import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import http from 'node:http';

const TEST_PORT = 5003;
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
  console.log('🧪 Starting Lagoree Arts Module 3: Category Management Automated Test Suite...\n');

  // Seed DB and start test server
  await runSeed();

  // Clean up any test categories/products from previous test runs
  const prod = prisma.product.findUnique({ where: { slug: 'nataraja-bronze-idols' } });
  if (prod) {
    prisma.product.delete({ where: { id: prod.id } });
  }

  const testSlugs = ['bronze-sculptures', 'fine-sculptures', 'hidden-secret-artifacts'];
  for (const slug of testSlugs) {
    const existing = prisma.category.findUnique({ where: { slug } });
    if (existing) {
      prisma.category.delete({ where: { id: existing.id } });
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
  await test('Super Admin Login for Category Testing', async () => {
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
  await test('Order Manager Setup & Login for RBAC Check', async () => {
    const orderRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    if (!orderRole) throw new Error('ORDER_MANAGER role not found in seed');

    const orderAdminEmail = 'order.curator.test@lagoreearts.com';
    let orderAdmin = prisma.adminUser.findUnique({ where: { email: orderAdminEmail } });
    if (!orderAdmin) {
      // Create test order manager
      const res = await request('/api/v1/admin/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          name: 'Order Manager Test',
          email: orderAdminEmail,
          password: 'OrderManager@2026!',
          roleId: orderRole.id,
          status: 'ACTIVE'
        }
      });
      if (res.status !== 201) throw new Error(`Failed to create order admin: ${JSON.stringify(res.body)}`);
    }

    const loginRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: orderAdminEmail, password: 'OrderManager@2026!' }
    });
    if (loginRes.status !== 200) throw new Error('Order manager login failed');
    orderManagerToken = loginRes.body.data.accessToken;
  });

  let testRootId = '';
  let testChildId = '';
  let testGrandchildId = '';

  // 3. Create Root Category
  await test('Create Root Category (POST /api/v1/admin/categories)', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Fine Sculptures',
        slug: 'fine-sculptures',
        shortDescription: 'Masterpiece sculptures and idols',
        status: 'ACTIVE',
        isFeatured: true,
        sortOrder: 10
      }
    });

    if (res.status !== 201 || !res.body.data.id || res.body.data.slug !== 'fine-sculptures') {
      throw new Error(`Create root category failed: ${JSON.stringify(res.body)}`);
    }
    testRootId = res.body.data.id;
  });

  // 4. Create Child Category
  await test('Create Child Category with Parent Hierarchy', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Bronze Sculptures',
        slug: 'bronze-sculptures',
        parentId: testRootId,
        shortDescription: 'Chola bronze editions',
        status: 'ACTIVE',
        isFeatured: true,
        sortOrder: 1
      }
    });

    if (res.status !== 201 || res.body.data.parentId !== testRootId) {
      throw new Error(`Create child category failed: ${JSON.stringify(res.body)}`);
    }
    testChildId = res.body.data.id;
  });

  // 5. Create Grandchild Category (Deep hierarchy)
  await test('Create Grandchild Category (Unlimited Nesting)', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Nataraja Bronze Idols',
        slug: 'nataraja-bronze-idols',
        parentId: testChildId,
        shortDescription: 'Sacred dance form of Shiva',
        status: 'ACTIVE'
      }
    });

    if (res.status !== 201 || res.body.data.parentId !== testChildId) {
      throw new Error(`Create grandchild failed: ${JSON.stringify(res.body)}`);
    }
    testGrandchildId = res.body.data.id;
  });

  // 6. Duplicate slug rejection
  await test('Duplicate Slug Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Another Sculptures',
        slug: 'fine-sculptures'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SLUG') {
      throw new Error(`Expected 400 DUPLICATE_SLUG, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 7. Duplicate sibling name rejection
  await test('Duplicate Sibling Name Rejection under Same Parent', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Bronze Sculptures',
        parentId: testRootId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SIBLING_NAME') {
      throw new Error(`Expected 400 DUPLICATE_SIBLING_NAME, got ${res.status}`);
    }
  });

  // 8. Invalid parent ID rejection
  await test('Invalid Parent ID Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Invalid Parent Category',
        parentId: 'non-existent-uuid-12345'
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'INVALID_PARENT') {
      throw new Error(`Expected 400 INVALID_PARENT, got ${res.status}`);
    }
  });

  // 9. Self-parenting rejection
  await test('Self-Parenting Rejection (parentId = id)', async () => {
    const res = await request(`/api/v1/admin/categories/${testRootId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { parentId: testRootId }
    });
    if (res.status !== 400 || res.body.error?.code !== 'SELF_PARENT_NOT_ALLOWED') {
      throw new Error(`Expected 400 SELF_PARENT_NOT_ALLOWED, got ${res.status}`);
    }
  });

  // 10. Circular Hierarchy Prevention (A -> B -> C -> A)
  await test('Circular Hierarchy Cycle Rejection (A -> B -> C -> A)', async () => {
    // Attempt to set Root's parent to its Grandchild
    const res = await request(`/api/v1/admin/categories/${testRootId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { parentId: testGrandchildId }
    });
    if (res.status !== 400 || res.body.error?.code !== 'CIRCULAR_HIERARCHY') {
      throw new Error(`Expected 400 CIRCULAR_HIERARCHY, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 11. Deletion Safety: Cannot delete category with children
  await test('Deletion Protection on Parent Category with Children (HTTP 409)', async () => {
    const res = await request(`/api/v1/admin/categories/${testRootId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 409 || res.body.error?.code !== 'CATEGORY_IN_USE') {
      throw new Error(`Expected 409 CATEGORY_IN_USE, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 12. Update Category Details & SEO
  await test('Update Category Details & SEO Fields', async () => {
    const res = await request(`/api/v1/admin/categories/${testGrandchildId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Sacred Nataraja Bronzes',
        metaTitle: 'Sacred Nataraja Bronzes | Lagoree Arts',
        metaDescription: 'Authentic handcrafted Chola style Nataraja bronze sculptures'
      }
    });

    if (res.status !== 200 || res.body.data.name !== 'Sacred Nataraja Bronzes') {
      throw new Error(`Category update failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 13. Admin Category Tree
  await test('Admin Full Category Tree (GET /api/v1/admin/categories/tree)', async () => {
    const res = await request('/api/v1/admin/categories/tree', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Admin category tree empty or invalid');
    }
    const root = res.body.data.find((n: any) => n.id === testRootId);
    if (!root || root.children.length === 0) {
      throw new Error('Root category children not nested correctly in tree');
    }
  });

  // 14. Admin Filtered & Paginated List
  await test('Admin Paginated & Filtered Category List', async () => {
    const res = await request('/api/v1/admin/categories?page=1&limit=5&search=sculpture', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.data.pagination || res.body.data.items.length === 0) {
      throw new Error(`Admin list query failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 15. RBAC Permission Gate: Order Manager denied category.create (HTTP 403)
  await test('RBAC Check: Order Manager denied category.create (HTTP 403)', async () => {
    const res = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orderManagerToken}` },
      body: { name: 'Unauthorized Category' }
    });
    if (res.status !== 403 || res.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for order manager, got ${res.status}`);
    }
  });

  // 16. Storefront Public API: Active categories list
  await test('Public Category List (GET /api/v1/categories)', async () => {
    const res = await request('/api/v1/categories');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Public category list failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 17. Storefront Public Category Tree
  await test('Public Active Tree (GET /api/v1/categories/tree)', async () => {
    const res = await request('/api/v1/categories/tree');
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error('Public tree failed');
    }
  });

  // 18. Storefront Public Category Detail by Slug
  await test('Public Category Detail by Slug (GET /api/v1/categories/:slug)', async () => {
    const res = await request('/api/v1/categories/fine-sculptures');
    if (res.status !== 200 || res.body.data.slug !== 'fine-sculptures' || !Array.isArray(res.body.data.children)) {
      throw new Error(`Public category detail failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 19. Storefront Breadcrumbs
  await test('Storefront Breadcrumb Generation (Root -> Ancestors -> Leaf)', async () => {
    const res = await request('/api/v1/categories/nataraja-bronze-idols/breadcrumb');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 3) {
      throw new Error(`Breadcrumb generation failed: ${JSON.stringify(res.body)}`);
    }
    const names = res.body.data.map((b: any) => b.name);
    if (names[0] !== 'Fine Sculptures' || names[1] !== 'Bronze Sculptures') {
      throw new Error(`Unexpected breadcrumb path: ${names.join(' -> ')}`);
    }
  });

  // 20. Inactive Category Hidden from Storefront
  await test('Inactive Category Hidden from Public Storefront (HTTP 404)', async () => {
    // Create inactive category
    const inactiveRes = await request('/api/v1/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Hidden Secret Artifacts',
        slug: 'hidden-secret-artifacts',
        status: 'INACTIVE'
      }
    });
    if (inactiveRes.status !== 201) throw new Error('Failed to create inactive test category');

    // Public lookup by slug must return 404
    const publicRes = await request('/api/v1/categories/hidden-secret-artifacts');
    if (publicRes.status !== 404) {
      throw new Error(`Expected 404 for inactive category on storefront, got ${publicRes.status}`);
    }
  });

  // 21. Safe Deletion of Leaf Category
  await test('Safe Deletion of Leaf Category (DELETE /api/v1/admin/categories/:id)', async () => {
    const res = await request(`/api/v1/admin/categories/${testGrandchildId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Leaf category deletion failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 22. Audit Log Verification for Category Actions
  await test('Audit Log Recording for Category Actions', async () => {
    const logs = prisma.adminAuditLog.findMany({
      where: { module: 'CATEGORIES' },
      take: 10
    });
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error('No category audit logs recorded');
    }
    const actions = logs.map((l: any) => l.action);
    if (!actions.includes('CATEGORY_CREATED') || !actions.includes('CATEGORY_DELETED')) {
      throw new Error(`Missing expected audit actions, got: ${actions.join(', ')}`);
    }
  });

  // Cleanup test categories created in tests
  prisma.category.delete({ where: { id: testChildId } });
  prisma.category.delete({ where: { id: testRootId } });

  server.close();

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 3 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal category test error:', err);
  if (server) server.close();
  process.exit(1);
});
