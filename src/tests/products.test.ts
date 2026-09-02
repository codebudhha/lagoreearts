import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5006;
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
  console.log('🧪 Starting Lagoree Arts Module 6: Product Catalogue Management Automated Test Suite...\n');

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
  let contentManagerToken = '';
  let marketingManagerToken = '';
  let orderManagerToken = '';

  let rootCategoryId = '';
  let testCollectionId = '';
  let testAttributeId = '';
  let testAttributeValueId = '';

  // Setup Tokens & Helpers
  await test('0. Environment & Admin Roles Setup', async () => {
    // 1. Super Admin
    const superLogin = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@lagoreearts.com', password: 'LagoreeAdmin@2026!' }
    });
    if (superLogin.status !== 200 || !superLogin.body.data.accessToken) {
      throw new Error(`Super admin login failed: ${JSON.stringify(superLogin.body)}`);
    }
    superAdminToken = superLogin.body.data.accessToken;

    // 2. Content Manager
    const contentRole = prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
    let contentUser = prisma.adminUser.findUnique({ where: { email: 'content.test@lagoreearts.com' } });
    if (!contentUser) {
      contentUser = prisma.adminUser.create({
        data: {
          name: 'Content Manager Test',
          email: 'content.test@lagoreearts.com',
          passwordHash: 'dummy',
          roleId: contentRole.id,
          status: 'ACTIVE'
        }
      });
    }
    contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentRole.id });

    // 3. Marketing Manager
    const marketingRole = prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
    let marketingUser = prisma.adminUser.findUnique({ where: { email: 'marketing.test@lagoreearts.com' } });
    if (!marketingUser) {
      marketingUser = prisma.adminUser.create({
        data: {
          name: 'Marketing Manager Test',
          email: 'marketing.test@lagoreearts.com',
          passwordHash: 'dummy',
          roleId: marketingRole.id,
          status: 'ACTIVE'
        }
      });
    }
    marketingManagerToken = generateAccessToken({ sub: marketingUser.id, roleId: marketingRole.id });

    // 4. Order Manager
    const orderRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    let orderUser = prisma.adminUser.findUnique({ where: { email: 'order.test@lagoreearts.com' } });
    if (!orderUser) {
      orderUser = prisma.adminUser.create({
        data: {
          name: 'Order Manager Test',
          email: 'order.test@lagoreearts.com',
          passwordHash: 'dummy',
          roleId: orderRole.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: orderUser.id, roleId: orderRole.id });

    // Query Category, Collection, Attribute
    const cat = prisma.category.findUnique({ where: { slug: 'antiques' } });
    if (!cat) throw new Error('Category antiques not found');
    rootCategoryId = cat.id;

    const col = prisma.collection.findUnique({ where: { slug: 'antique-treasures' } });
    if (!col) throw new Error('Collection antique-treasures not found');
    testCollectionId = col.id;

    const attr = prisma.attribute.findUnique({ where: { slug: 'material' } });
    if (!attr) throw new Error('Attribute material not found');
    testAttributeId = attr.id;

    const val = prisma.attributeValue.findFirst({ where: { attributeId: attr.id } });
    if (!val) throw new Error('Attribute value for material not found');
    testAttributeValueId = val.id;
  });

  // ==========================================
  // SECTION 1: DATABASE & CONSTRAINTS (1–8)
  // ==========================================
  let createdProductId = '';

  await test('1. Product Migration / Schema Initialization', async () => {
    const products = prisma.product.findMany();
    if (!Array.isArray(products)) throw new Error('Product table query failed');
  });

  await test('2. Product Creation via Service & DB Persistence', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Royal Heritage Bronze Buddha',
        slug: 'royal-heritage-bronze-buddha',
        sku: 'LA-BUD-0001',
        shortDescription: 'Ancient Chola-style seated Buddha bronze statue.',
        description: 'Cast in heavy bronze with antique greenish patina finish.',
        price: 18500,
        compareAtPrice: 22000,
        costPrice: 9000,
        status: 'ACTIVE',
        productType: 'SIMPLE',
        stockQuantity: 8,
        lowStockThreshold: 2,
        trackInventory: true,
        allowBackorder: false,
        isFeatured: true,
        isNewArrival: true,
        isBestseller: false,
        sortOrder: 10,
        categoryId: rootCategoryId,
        collectionIds: [testCollectionId],
        attributes: [
          { attributeId: testAttributeId, attributeValueId: testAttributeValueId }
        ]
      }
    });

    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Create product failed: ${JSON.stringify(res.body)}`);
    }
    createdProductId = res.body.data.id;
  });

  await test('3. Product Database Constraints Verification', async () => {
    const prod = prisma.product.findUnique({ where: { id: createdProductId }, include: { category: true, collections: true, attributes: true } });
    if (!prod || prod.sku !== 'LA-BUD-0001' || prod.price !== 18500) {
      throw new Error('Product record does not match expected values');
    }
  });

  await test('4. Unique SKU Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Another Buddha Statue',
        sku: 'LA-BUD-0001',
        price: 15000,
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SKU') {
      throw new Error(`Expected 400 DUPLICATE_SKU, got ${res.status}`);
    }
  });

  await test('5. Unique Slug Resolution / Conflict Prevention', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Royal Heritage Bronze Buddha',
        slug: 'royal-heritage-bronze-buddha',
        sku: 'LA-BUD-0002',
        price: 19000,
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SLUG') {
      throw new Error(`Expected 400 DUPLICATE_SLUG, got ${res.status}`);
    }
  });

  await test('6. Category Relationship Verification', async () => {
    const prod = prisma.product.findUnique({ where: { id: createdProductId }, include: { category: true } });
    if (!prod?.category || prod.category.id !== rootCategoryId) {
      throw new Error('Category relationship failed to resolve');
    }
  });

  await test('7. Collection Relationship Verification', async () => {
    const pColls = prisma.productCollection.findMany({ where: { productId: createdProductId } });
    if (pColls.length !== 1 || pColls[0].collectionId !== testCollectionId) {
      throw new Error('Collection relationship failed to resolve');
    }
  });

  await test('8. Product Attribute Relationship Verification', async () => {
    const pavs = prisma.productAttributeValue.findMany({ where: { productId: createdProductId } });
    if (pavs.length !== 1 || pavs[0].attributeId !== testAttributeId) {
      throw new Error('Attribute relationship failed to resolve');
    }
  });

  // ==========================================
  // SECTION 2: ADMIN CRUD (9–16)
  // ==========================================
  let tempProductId = '';

  await test('9. Create Product (POST /api/v1/admin/products)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Handcrafted Sandalwood Ganesha',
        sku: 'LA-SAN-GAN-001',
        price: 7500,
        compareAtPrice: 8500,
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Create product failed: ${JSON.stringify(res.body)}`);
    }
    tempProductId = res.body.data.id;
  });

  await test('10. Get Product by ID (GET /api/v1/admin/products/:id)', async () => {
    const res = await request(`/api/v1/admin/products/${tempProductId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.id !== tempProductId) {
      throw new Error(`Get by ID failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('11. Get Product by Slug Search', async () => {
    const res = await request('/api/v1/admin/products?search=sandalwood-ganesha', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error(`Search by slug failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('12. Update Product (PATCH /api/v1/admin/products/:id)', async () => {
    const res = await request(`/api/v1/admin/products/${tempProductId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        shortDescription: 'Updated fragrant sandalwood statue.',
        price: 7800
      }
    });
    if (res.status !== 200 || res.body.data.price !== 7800) {
      throw new Error(`Update product failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('13. Delete Product (DELETE /api/v1/admin/products/:id)', async () => {
    const res = await request(`/api/v1/admin/products/${tempProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Delete product failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('14. Status Update (PATCH /api/v1/admin/products/:id/status)', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'INACTIVE' }
    });
    if (res.status !== 200 || res.body.data.status !== 'INACTIVE') {
      throw new Error(`Update status failed: ${JSON.stringify(res.body)}`);
    }
    // Revert to ACTIVE
    await request(`/api/v1/admin/products/${createdProductId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'ACTIVE' }
    });
  });

  await test('15. Featured Update (PATCH /api/v1/admin/products/:id/featured)', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { isFeatured: false }
    });
    if (res.status !== 200 || res.body.data.isFeatured !== false) {
      throw new Error(`Update featured failed: ${JSON.stringify(res.body)}`);
    }
    // Revert to true
    await request(`/api/v1/admin/products/${createdProductId}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { isFeatured: true }
    });
  });

  await test('16. Sort Update (PATCH /api/v1/admin/products/:id/sort)', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/sort`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { sortOrder: 42 }
    });
    if (res.status !== 200 || res.body.data.sortOrder !== 42) {
      throw new Error(`Update sort failed: ${JSON.stringify(res.body)}`);
    }
  });

  // ==========================================
  // SECTION 3: VALIDATION (17–24)
  // ==========================================

  await test('17. Invalid Product Name Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: '', sku: 'LA-INV-NAME', price: 1000, categoryId: rootCategoryId }
    });
    if (res.status !== 400) throw new Error(`Expected 400 for empty name, got ${res.status}`);
  });

  await test('18. Invalid SKU Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: 'Valid Name', sku: '', price: 1000, categoryId: rootCategoryId }
    });
    if (res.status !== 400) throw new Error(`Expected 400 for empty SKU, got ${res.status}`);
  });

  await test('19. Negative Price Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: 'Negative Price Art', sku: 'LA-NEG-PRICE', price: -500, categoryId: rootCategoryId }
    });
    if (res.status !== 400) throw new Error(`Expected 400 for negative price, got ${res.status}`);
  });

  await test('20. Negative Stock Quantity Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: 'Negative Stock Art', sku: 'LA-NEG-STOCK', price: 1000, stockQuantity: -5, categoryId: rootCategoryId }
    });
    if (res.status !== 400) throw new Error(`Expected 400 for negative stock, got ${res.status}`);
  });

  await test('21. Invalid Category ID Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { name: 'Missing Cat Art', sku: 'LA-MISS-CAT', price: 1000, categoryId: 'non-existent-cat-uuid' }
    });
    if (res.status !== 400 || res.body.error?.code !== 'CATEGORY_NOT_FOUND') {
      throw new Error(`Expected 400 CATEGORY_NOT_FOUND, got ${res.status}`);
    }
  });

  await test('22. Invalid Collection ID Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Missing Coll Art',
        sku: 'LA-MISS-COL',
        price: 1000,
        categoryId: rootCategoryId,
        collectionIds: ['non-existent-collection-uuid']
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'COLLECTION_NOT_FOUND') {
      throw new Error(`Expected 400 COLLECTION_NOT_FOUND, got ${res.status}`);
    }
  });

  await test('23. Invalid Attribute Value ID Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Invalid Attr Val Art',
        sku: 'LA-INV-AVAL',
        price: 1000,
        categoryId: rootCategoryId,
        attributes: [{ attributeId: testAttributeId, attributeValueId: 'non-existent-value-id' }]
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'INVALID_ATTRIBUTE_VALUE') {
      throw new Error(`Expected 400 INVALID_ATTRIBUTE_VALUE, got ${res.status}`);
    }
  });

  await test('24. Attribute Type Mismatch Rejection (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Missing Value ID Art',
        sku: 'LA-MISS-VID',
        price: 1000,
        categoryId: rootCategoryId,
        attributes: [{ attributeId: testAttributeId }] // material is SELECT/MULTI_SELECT, requires valueId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'ATTRIBUTE_TYPE_MISMATCH') {
      throw new Error(`Expected 400 ATTRIBUTE_TYPE_MISMATCH, got ${res.status}`);
    }
  });

  // ==========================================
  // SECTION 4: LISTING & FILTERING (25–36)
  // ==========================================

  await test('25. Pagination Support (page & limit)', async () => {
    const res = await request('/api/v1/admin/products?page=1&limit=2', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length !== 2 || res.body.data.pagination.limit !== 2) {
      throw new Error(`Pagination failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('26. Search by Product Name', async () => {
    const res = await request('/api/v1/admin/products?search=Pichwai', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error(`Name search failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('27. Search by SKU', async () => {
    const res = await request('/api/v1/admin/products?search=LA-PIC-0001', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0 || res.body.data.items[0].sku !== 'LA-PIC-0001') {
      throw new Error(`SKU search failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('28. Status Filter (ACTIVE / INACTIVE)', async () => {
    const res = await request('/api/v1/admin/products?status=ACTIVE', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => p.status !== 'ACTIVE')) {
      throw new Error('Status filter failed');
    }
  });

  await test('29. Category Filter', async () => {
    const res = await request(`/api/v1/admin/products?categoryId=${rootCategoryId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => p.categoryId !== rootCategoryId)) {
      throw new Error('Category filter failed');
    }
  });

  await test('30. Collection Filter', async () => {
    const res = await request(`/api/v1/admin/products?collectionId=${testCollectionId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error('Collection filter failed');
    }
  });

  await test('31. Featured Filter (isFeatured=true)', async () => {
    const res = await request('/api/v1/admin/products?featured=true', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => !p.isFeatured)) {
      throw new Error('Featured filter failed');
    }
  });

  await test('32. New Arrival Filter (newArrival=true)', async () => {
    const res = await request('/api/v1/admin/products?newArrival=true', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => !p.isNewArrival)) {
      throw new Error('New arrival filter failed');
    }
  });

  await test('33. Bestseller Filter (bestseller=true)', async () => {
    const res = await request('/api/v1/admin/products?bestseller=true', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => !p.isBestseller)) {
      throw new Error('Bestseller filter failed');
    }
  });

  await test('34. Price Filtering (minPrice & maxPrice)', async () => {
    const res = await request('/api/v1/admin/products?minPrice=4000&maxPrice=15000', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.some((p: any) => p.price < 4000 || p.price > 15000)) {
      throw new Error('Price range filter failed');
    }
  });

  await test('35. Stock State Filtering (in_stock & out_of_stock)', async () => {
    const res = await request('/api/v1/admin/products?stockState=in_stock', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error('Stock state in_stock filter failed');
    }
  });

  await test('36. Multi-Field Sorting (price desc)', async () => {
    const res = await request('/api/v1/admin/products?sort=price&order=desc', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.items.length < 2) throw new Error('Sorting query failed');
    const prices = res.body.data.items.map((i: any) => i.price);
    for (let i = 0; i < prices.length - 1; i++) {
      if (prices[i] < prices[i + 1]) throw new Error('Prices not sorted in descending order');
    }
  });

  // ==========================================
  // SECTION 5: PUBLIC STOREFRONT API (37–42)
  // ==========================================

  await test('37. Public Product List (GET /api/v1/products)', async () => {
    const res = await request('/api/v1/products');
    if (res.status !== 200 || !Array.isArray(res.body.data.items) || res.body.data.items.length === 0) {
      throw new Error(`Public product list failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('38. Public Product Detail by Slug with SEO & Availability', async () => {
    const res = await request('/api/v1/products/pichwai-lotus-painting');
    if (res.status !== 200 || res.body.data.slug !== 'pichwai-lotus-painting' || !res.body.data.availability?.inStock) {
      throw new Error(`Public detail failed: ${JSON.stringify(res.body)}`);
    }
  });

  let draftProductId = '';

  await test('39. DRAFT Product Hidden from Public API', async () => {
    const draftRes = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Hidden Draft Masterwork',
        sku: 'LA-DRF-001',
        price: 5000,
        status: 'DRAFT',
        categoryId: rootCategoryId
      }
    });
    draftProductId = draftRes.body.data.id;
    const slug = draftRes.body.data.slug;

    const listRes = await request('/api/v1/products');
    if (listRes.body.data.items.some((p: any) => p.slug === slug)) {
      throw new Error('DRAFT product appeared in public list');
    }

    const detailRes = await request(`/api/v1/products/${slug}`);
    if (detailRes.status !== 404) {
      throw new Error(`Expected 404 for DRAFT product, got ${detailRes.status}`);
    }
  });

  await test('40. INACTIVE Product Hidden from Public API', async () => {
    const slug = 'hidden-inactive-masterwork';
    const inactRes = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Hidden Inactive Masterwork',
        slug,
        sku: 'LA-INA-001',
        price: 5000,
        status: 'INACTIVE',
        categoryId: rootCategoryId
      }
    });
    const inactId = inactRes.body.data.id;

    const detailRes = await request(`/api/v1/products/${slug}`);
    if (detailRes.status !== 404) {
      throw new Error(`Expected 404 for INACTIVE product, got ${detailRes.status}`);
    }

    // Cleanup
    await request(`/api/v1/admin/products/${inactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  await test('41. ARCHIVED Product Hidden from Public API', async () => {
    const slug = 'hidden-archived-masterwork';
    const archRes = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Hidden Archived Masterwork',
        slug,
        sku: 'LA-ARC-001',
        price: 5000,
        status: 'ARCHIVED',
        categoryId: rootCategoryId
      }
    });
    const archId = archRes.body.data.id;

    const detailRes = await request(`/api/v1/products/${slug}`);
    if (detailRes.status !== 404) {
      throw new Error(`Expected 404 for ARCHIVED product, got ${detailRes.status}`);
    }

    // Cleanup
    await request(`/api/v1/admin/products/${archId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  await test('42. Non-Existent Product Slug Returns HTTP 404', async () => {
    const res = await request('/api/v1/products/non-existent-masterpiece-slug');
    if (res.status !== 404 || res.body.error?.code !== 'NOT_FOUND') {
      throw new Error(`Expected 404 NOT_FOUND, got ${res.status}`);
    }
  });

  // ==========================================
  // SECTION 6: DYNAMIC ATTRIBUTES (43–47)
  // ==========================================

  await test('43. Assign Dynamic Attribute to Product', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/attributes`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        attributes: [
          { attributeId: testAttributeId, attributeValueId: testAttributeValueId }
        ]
      }
    });
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Assign attributes failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('44. Update Product Dynamic Attribute', async () => {
    const styleAttr = prisma.attribute.findUnique({ where: { slug: 'style' } });
    const val = prisma.attributeValue.findFirst({ where: { attributeId: styleAttr.id } });

    const res = await request(`/api/v1/admin/products/${createdProductId}/attributes`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        attributes: [
          { attributeId: testAttributeId, attributeValueId: testAttributeValueId },
          { attributeId: styleAttr.id, attributeValueId: val.id }
        ]
      }
    });
    if (res.status !== 200 || res.body.data.length !== 2) {
      throw new Error(`Update attributes failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('45. Retrieve Product Dynamic Attributes', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/attributes`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || res.body.data.length !== 2) {
      throw new Error('Get product attributes failed');
    }
  });

  await test('46. Inactive / Invalid Attribute Value Rejection', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/attributes`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        attributes: [
          { attributeId: testAttributeId, attributeValueId: 'invalid-val-uuid' }
        ]
      }
    });
    if (res.status !== 400) throw new Error('Expected 400 for invalid attribute value');
  });

  await test('47. Public Storefront Dynamic Faceted Filter (?material=brass)', async () => {
    const res = await request('/api/v1/products?material=brass');
    if (res.status !== 200 || res.body.data.items.length === 0) {
      throw new Error(`Dynamic filter failed: ${JSON.stringify(res.body)}`);
    }
    const hasBrass = res.body.data.items.every((p: any) =>
      p.attributes.some((a: any) => a.attributeSlug === 'material' && (a.valueSlug === 'brass' || a.textValue === 'brass'))
    );
    if (!hasBrass) throw new Error('Filtered products do not match material=brass');
  });

  // ==========================================
  // SECTION 7: COLLECTIONS (48–51)
  // ==========================================

  await test('48. Assign Collection to Product (POST /api/v1/admin/products/:id/collections)', async () => {
    const sEditCol = prisma.collection.findUnique({ where: { slug: 'the-sanskrit-edit' } });
    const res = await request(`/api/v1/admin/products/${createdProductId}/collections`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { collectionId: sEditCol.id }
    });
    if (res.status !== 201) throw new Error(`Assign collection failed: ${JSON.stringify(res.body)}`);
  });

  await test('49. Remove Collection from Product', async () => {
    const sEditCol = prisma.collection.findUnique({ where: { slug: 'the-sanskrit-edit' } });
    const res = await request(`/api/v1/admin/products/${createdProductId}/collections/${sEditCol.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Remove collection failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('50. Replace Collections on Product (PUT /api/v1/admin/products/:id/collections)', async () => {
    const res = await request(`/api/v1/admin/products/${createdProductId}/collections`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { collectionIds: [testCollectionId] }
    });
    if (res.status !== 200 || res.body.data.length !== 1) {
      throw new Error(`Replace collections failed: ${JSON.stringify(res.body)}`);
    }
  });

  await test('51. Duplicate Collection Association Prevented (Idempotent)', async () => {
    await request(`/api/v1/admin/products/${createdProductId}/collections`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { collectionId: testCollectionId }
    });
    const colCount = prisma.productCollection.findMany({ where: { productId: createdProductId } });
    if (colCount.length !== 1) throw new Error('Duplicate collection record inserted');
  });

  // ==========================================
  // SECTION 8: RBAC (52–56)
  // ==========================================

  await test('52. RBAC Check: SUPER_ADMIN Authorized for All Actions', async () => {
    const res = await request('/api/v1/admin/products', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error(`SUPER_ADMIN denied: ${res.status}`);
  });

  await test('53. RBAC Check: CATALOGUE_MANAGER Authorized for Product Actions', async () => {
    const catRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
    let catUser = prisma.adminUser.findUnique({ where: { email: 'catalogue.test@lagoreearts.com' } });
    if (!catUser) {
      catUser = prisma.adminUser.create({
        data: { name: 'Catalogue User', email: 'catalogue.test@lagoreearts.com', passwordHash: 'dummy', roleId: catRole.id, status: 'ACTIVE' }
      });
    }
    const catToken = generateAccessToken({ sub: catUser.id, roleId: catRole.id });

    const res = await request('/api/v1/admin/products', {
      headers: { Authorization: `Bearer ${catToken}` }
    });
    if (res.status !== 200) throw new Error(`CATALOGUE_MANAGER denied: ${res.status}`);
  });

  await test('54. RBAC Check: CONTENT_MANAGER Allowed for Create & Update', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${contentManagerToken}` },
      body: {
        name: 'Content Manager Test Art',
        sku: 'LA-CNT-001',
        price: 2000,
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 201) throw new Error(`CONTENT_MANAGER create failed: ${JSON.stringify(res.body)}`);
    const id = res.body.data.id;

    // Delete should be denied (CONTENT_MANAGER lacks product.delete)
    const delRes = await request(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${contentManagerToken}` }
    });
    if (delRes.status !== 403) throw new Error(`Expected 403 on delete for CONTENT_MANAGER, got ${delRes.status}`);

    // Cleanup using superAdmin
    await request(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  await test('55. RBAC Check: MARKETING_MANAGER View-Only (POST Denied HTTP 403)', async () => {
    const viewRes = await request('/api/v1/admin/products', {
      headers: { Authorization: `Bearer ${marketingManagerToken}` }
    });
    if (viewRes.status !== 200) throw new Error('MARKETING_MANAGER failed to view products');

    const postRes = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${marketingManagerToken}` },
      body: { name: 'Marketing Art', sku: 'LA-MKT-001', price: 1000, categoryId: rootCategoryId }
    });
    if (postRes.status !== 403 || postRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for marketing create, got ${postRes.status}`);
    }
  });

  await test('56. RBAC Check: ORDER_MANAGER Denied All Product Endpoints (HTTP 403)', async () => {
    const res = await request('/api/v1/admin/products', {
      headers: { Authorization: `Bearer ${orderManagerToken}` }
    });
    if (res.status !== 403 || res.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for order manager, got ${res.status}`);
    }
  });

  // ==========================================
  // SECTION 9: AUDIT LOGGING (57–63)
  // ==========================================

  await test('57. Audit Log on Product Create (PRODUCT_CREATED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_CREATED' }
    });
    if (!log) throw new Error('PRODUCT_CREATED audit log not found');
  });

  await test('58. Audit Log on Product Update (PRODUCT_UPDATED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_UPDATED' }
    });
    if (!log) throw new Error('PRODUCT_UPDATED audit log not found');
  });

  await test('59. Audit Log on Product Delete (PRODUCT_DELETED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_DELETED' }
    });
    if (!log) throw new Error('PRODUCT_DELETED audit log not found');
  });

  await test('60. Audit Log on Status Change (PRODUCT_STATUS_CHANGED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_STATUS_CHANGED' }
    });
    if (!log) throw new Error('PRODUCT_STATUS_CHANGED audit log not found');
  });

  await test('61. Audit Log on Featured Change (PRODUCT_FEATURED_CHANGED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_FEATURED_CHANGED' }
    });
    if (!log) throw new Error('PRODUCT_FEATURED_CHANGED audit log not found');
  });

  await test('62. Audit Log on Collection Change (PRODUCT_COLLECTIONS_CHANGED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_COLLECTIONS_CHANGED' }
    });
    if (!log) throw new Error('PRODUCT_COLLECTIONS_CHANGED audit log not found');
  });

  await test('63. Audit Log on Attribute Change (PRODUCT_ATTRIBUTES_CHANGED)', async () => {
    const log = prisma.adminAuditLog.findFirst({
      where: { module: 'PRODUCTS', action: 'PRODUCT_ATTRIBUTES_CHANGED' }
    });
    if (!log) throw new Error('PRODUCT_ATTRIBUTES_CHANGED audit log not found');
  });

  // ==========================================
  // SECTION 10: SECURITY & MISC (64–68)
  // ==========================================

  await test('64. Admin Endpoints Require Authentication (HTTP 401 on Missing Token)', async () => {
    const res = await request('/api/v1/admin/products');
    if (res.status !== 401 || (res.body.error?.code !== 'UNAUTHENTICATED' && res.body.error?.code !== 'UNAUTHORIZED')) {
      throw new Error(`Expected 401 UNAUTHENTICATED, got ${res.status}`);
    }
  });

  await test('65. Public Storefront API Sanitizes costPrice', async () => {
    const res = await request('/api/v1/products/pichwai-lotus-painting');
    if (res.body.data.costPrice !== undefined) {
      throw new Error('costPrice was leaked in public response');
    }
  });

  await test('66. CompareAtPrice Lower Than Price Rejected (HTTP 400)', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Invalid Discount Art',
        sku: 'LA-INV-DISC',
        price: 5000,
        compareAtPrice: 3000, // lower than price!
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 400 || res.body.error?.code !== 'INVALID_COMPARE_PRICE') {
      throw new Error(`Expected 400 INVALID_COMPARE_PRICE, got ${res.status}`);
    }
  });

  await test('67. Automatic Slug Generation When Omitted', async () => {
    const res = await request('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: 'Automated Slug Test Art',
        sku: 'LA-AUTO-SLUG',
        price: 1200,
        categoryId: rootCategoryId
      }
    });
    if (res.status !== 201 || res.body.data.slug !== 'automated-slug-test-art') {
      throw new Error(`Auto slug generation failed: ${JSON.stringify(res.body)}`);
    }
    // Cleanup
    await request(`/api/v1/admin/products/${res.body.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  });

  await test('68. Deterministic Unique Slug Resolution Helper', async () => {
    const { ProductsService } = await import('../modules/products/products.service.ts');
    const slug = await ProductsService.resolveUniqueSlug('Pichwai Lotus Painting');
    if (!slug.startsWith('pichwai-lotus-painting-')) {
      throw new Error(`Expected suffixed slug, got ${slug}`);
    }
  });

  // Cleanup main test product and draft
  await request(`/api/v1/admin/products/${createdProductId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  if (draftProductId) {
    await request(`/api/v1/admin/products/${draftProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
  }

  server.close();

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 6 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal products test error:', err);
  if (server) server.close();
  process.exit(1);
});
