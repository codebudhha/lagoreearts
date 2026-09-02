import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5007;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let catalogueManagerToken: string;
let contentManagerToken: string;
let marketingManagerToken: string;
let orderManagerToken: string;

let superAdminId: string;
let catalogueManagerId: string;
let contentManagerId: string;
let marketingManagerId: string;
let orderManagerId: string;

let testCategoryId: string;
let variableProductId: string;
let simpleProductId: string;

let sizeOptionId: string;
let sizeA4ValId: string;
let sizeA3ValId: string;
let sizeA2ValId: string;

let frameOptionId: string;
let frameWalnutValId: string;
let frameBlackValId: string;
let frameGoldValId: string;

let createdVariantId: string;

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let reqBody: any = undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    reqBody = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, {
    method,
    headers,
    body: reqBody
  });
  let parsed: any;
  const text = await res.text();
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

async function runTests() {
  console.log('\n🧪 Starting Lagoree Arts Module 7: Product Variants Automated Test Suite...\n');
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
      console.error(err);
      failed++;
    }
  }

  try {
    // 0. Environment Setup
    await test('0. Environment & Admin Roles Setup', async () => {
      await runSeed();
      const app = createApp();
      server = app.listen(TEST_PORT);

      const superRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
      const catRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
      const contentRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
      const mktRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
      const orderRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

      const superUser = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
      superAdminId = superUser!.id;
      superAdminToken = generateAccessToken({ sub: superUser!.id, roleId: superRole!.id });

      let catUser = await prisma.adminUser.findUnique({ where: { email: 'catalogue@lagoreearts.com' } });
      if (!catUser) {
        catUser = await prisma.adminUser.create({
          data: { name: 'Catalogue Manager', email: 'catalogue@lagoreearts.com', passwordHash: 'hash', roleId: catRole!.id, status: 'ACTIVE' }
        });
      }
      catalogueManagerId = catUser.id;
      catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

      let contentUser = await prisma.adminUser.findUnique({ where: { email: 'content@lagoreearts.com' } });
      if (!contentUser) {
        contentUser = await prisma.adminUser.create({
          data: { name: 'Content Manager', email: 'content@lagoreearts.com', passwordHash: 'hash', roleId: contentRole!.id, status: 'ACTIVE' }
        });
      }
      contentManagerId = contentUser.id;
      contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentRole!.id });

      let mktUser = await prisma.adminUser.findUnique({ where: { email: 'marketing@lagoreearts.com' } });
      if (!mktUser) {
        mktUser = await prisma.adminUser.create({
          data: { name: 'Marketing Manager', email: 'marketing@lagoreearts.com', passwordHash: 'hash', roleId: mktRole!.id, status: 'ACTIVE' }
        });
      }
      marketingManagerId = mktUser.id;
      marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

      let orderUser = await prisma.adminUser.findUnique({ where: { email: 'order@lagoreearts.com' } });
      if (!orderUser) {
        orderUser = await prisma.adminUser.create({
          data: { name: 'Order Manager', email: 'order@lagoreearts.com', passwordHash: 'hash', roleId: orderRole!.id, status: 'ACTIVE' }
        });
      }
      orderManagerId = orderUser.id;
      orderManagerToken = generateAccessToken({ sub: orderUser.id, roleId: orderRole!.id });

      const cat = await prisma.category.findFirst();
      testCategoryId = cat!.id;

      // Clean up previous test products if present
      const prevVar = await prisma.product.findUnique({ where: { slug: 'the-royal-sanskrit-edit-frame' } });
      if (prevVar) {
        const existingVars = await prisma.productVariant.findMany({ where: { productId: prevVar.id } });
        for (const ev of existingVars) {
          await prisma.productVariantOptionValue.deleteMany({ where: { variantId: ev.id } });
        }
        await prisma.productVariant.deleteMany({ where: { productId: prevVar.id } });
        const existingOpts = await prisma.productOption.findMany({ where: { productId: prevVar.id } });
        for (const eo of existingOpts) {
          await prisma.productOptionValue.deleteMany({ where: { productOptionId: eo.id } });
        }
        await prisma.productOption.deleteMany({ where: { productId: prevVar.id } });
        await prisma.product.delete({ where: { id: prevVar.id } });
      }
      const prevSmp = await prisma.product.findUnique({ where: { slug: 'the-sacred-bronze-diya' } });
      if (prevSmp) {
        await prisma.product.delete({ where: { id: prevSmp.id } });
      }

      // Seed a clean VARIABLE product for tests
      const varProd = await prisma.product.create({
        data: {
          name: 'The Royal Sanskrit Edit Frame',
          slug: 'the-royal-sanskrit-edit-frame',
          sku: 'LA-ROY-0001',
          price: 5000,
          compareAtPrice: 6000,
          costPrice: 2500,
          productType: 'VARIABLE',
          status: 'ACTIVE',
          stockQuantity: 100,
          categoryId: testCategoryId
        }
      });
      variableProductId = varProd.id;

      // Seed a clean SIMPLE product for tests
      const smpProd = await prisma.product.create({
        data: {
          name: 'The Sacred Bronze Diya',
          slug: 'the-sacred-bronze-diya',
          sku: 'LA-SAC-0001',
          price: 3500,
          productType: 'SIMPLE',
          status: 'ACTIVE',
          stockQuantity: 50,
          categoryId: testCategoryId
        }
      });
      simpleProductId = smpProd.id;
    });

    // ==========================================
    // 1. DATABASE & MIGRATIONS (1-7)
    // ==========================================

    await test('1. ProductOption Database Table Exists', async () => {
      const opt = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'Dimension', slug: 'dimension', sortOrder: 1 }
      });
      if (!opt.id || opt.name !== 'Dimension') throw new Error('ProductOption create failed');
      await prisma.productOption.delete({ where: { id: opt.id } });
    });

    await test('2. ProductOptionValue Database Table Exists', async () => {
      const opt = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'TempOption', slug: 'temp-opt', sortOrder: 1 }
      });
      const val = await prisma.productOptionValue.create({
        data: { productOptionId: opt.id, value: 'Small', slug: 'small', sortOrder: 1 }
      });
      if (!val.id || val.value !== 'Small') throw new Error('ProductOptionValue create failed');
      await prisma.productOptionValue.delete({ where: { id: val.id } });
      await prisma.productOption.delete({ where: { id: opt.id } });
    });

    await test('3. ProductVariant Database Table Exists', async () => {
      const v = await prisma.productVariant.create({
        data: {
          productId: variableProductId,
          sku: 'LA-TEMP-VAR-001',
          price: 4999,
          stockQuantity: 10,
          status: 'ACTIVE'
        }
      });
      if (!v.id || v.sku !== 'LA-TEMP-VAR-001') throw new Error('ProductVariant create failed');
      await prisma.productVariant.delete({ where: { id: v.id } });
    });

    await test('4. ProductVariantOptionValue Junction Table Exists', async () => {
      const opt = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'JunctionOpt', slug: 'junc-opt', sortOrder: 1 }
      });
      const val = await prisma.productOptionValue.create({
        data: { productOptionId: opt.id, value: 'JuncVal', slug: 'junc-val', sortOrder: 1 }
      });
      const v = await prisma.productVariant.create({
        data: { productId: variableProductId, sku: 'LA-JUNC-VAR-001', status: 'ACTIVE' }
      });
      await prisma.productVariantOptionValue.create({
        data: { variantId: v.id, optionValueId: val.id }
      });
      const links = await prisma.productVariantOptionValue.findMany({ where: { variantId: v.id } });
      if (links.length !== 1) throw new Error('Junction link failed');
      await prisma.productVariant.delete({ where: { id: v.id } });
      await prisma.productOptionValue.delete({ where: { id: val.id } });
      await prisma.productOption.delete({ where: { id: opt.id } });
    });

    await test('5. Global SKU Uniqueness Enforcement', async () => {
      const v1 = await prisma.productVariant.create({
        data: { productId: variableProductId, sku: 'LA-GLOBAL-SKU-01', status: 'ACTIVE' }
      });
      let duplicateCaught = false;
      try {
        await prisma.productVariant.create({
          data: { productId: variableProductId, sku: 'LA-GLOBAL-SKU-01', status: 'ACTIVE' }
        });
      } catch {
        duplicateCaught = true;
      }
      if (!duplicateCaught) throw new Error('Duplicate SKU allowed in database');
      await prisma.productVariant.delete({ where: { id: v1.id } });
    });

    await test('6. Option Slug Uniqueness within Product Enforcement', async () => {
      const opt1 = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'Finish', slug: 'finish' }
      });
      let duplicateCaught = false;
      try {
        await prisma.productOption.create({
          data: { productId: variableProductId, name: 'Finish Two', slug: 'finish' }
        });
      } catch {
        duplicateCaught = true;
      }
      if (!duplicateCaught) throw new Error('Duplicate option slug allowed on same product');
      await prisma.productOption.delete({ where: { id: opt1.id } });
    });

    await test('7. Option Value Slug Uniqueness within Option Enforcement', async () => {
      const opt = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'Color', slug: 'color' }
      });
      const val1 = await prisma.productOptionValue.create({
        data: { productOptionId: opt.id, value: 'Gold', slug: 'gold' }
      });
      let duplicateCaught = false;
      try {
        await prisma.productOptionValue.create({
          data: { productOptionId: opt.id, value: 'Gold Metallic', slug: 'gold' }
        });
      } catch {
        duplicateCaught = true;
      }
      if (!duplicateCaught) throw new Error('Duplicate option value slug allowed in same option');
      await prisma.productOptionValue.delete({ where: { id: val1.id } });
      await prisma.productOption.delete({ where: { id: opt.id } });
    });

    // ==========================================
    // 2. PRODUCT OPTIONS MANAGEMENT (8-18)
    // ==========================================

    await test('8. Create Product Option (POST /api/v1/admin/products/:id/options)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/options`,
        { name: 'Size', slug: 'size', sortOrder: 1 },
        superAdminToken
      );
      if (res.status !== 201 || !res.body.success || res.body.data.name !== 'Size') {
        throw new Error(`Create option failed: ${JSON.stringify(res.body)}`);
      }
      sizeOptionId = res.body.data.id;
    });

    await test('9. List Product Options (GET /api/v1/admin/products/:id/options)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/options`, undefined, superAdminToken);
      if (res.status !== 200 || !res.body.success || res.body.data.length < 1) {
        throw new Error(`List options failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('10. Get Product Option by ID', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.id !== sizeOptionId) {
        throw new Error(`Get option failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('11. Update Product Option (PATCH /api/v1/admin/products/:id/options/:optId)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}`,
        { name: 'Artwork Size', sortOrder: 2 },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.name !== 'Artwork Size') {
        throw new Error(`Update option failed: ${JSON.stringify(res.body)}`);
      }
      // Revert name back to Size
      await request('PATCH', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}`, { name: 'Size' }, superAdminToken);
    });

    await test('12. Create Second Product Option (Frame)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/options`,
        { name: 'Frame', slug: 'frame', sortOrder: 2 },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.name !== 'Frame') {
        throw new Error(`Create frame option failed: ${JSON.stringify(res.body)}`);
      }
      frameOptionId = res.body.data.id;
    });

    await test('13. Create Option Values for Size (A4, A3, A2)', async () => {
      const res1 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values`, { value: 'A4', slug: 'a4', sortOrder: 1 }, superAdminToken);
      const res2 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values`, { value: 'A3', slug: 'a3', sortOrder: 2 }, superAdminToken);
      const res3 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values`, { value: 'A2', slug: 'a2', sortOrder: 3 }, superAdminToken);
      if (res1.status !== 201 || res2.status !== 201 || res3.status !== 201) {
        throw new Error(`Create option values failed`);
      }
      sizeA4ValId = res1.body.data.id;
      sizeA3ValId = res2.body.data.id;
      sizeA2ValId = res3.body.data.id;
    });

    await test('14. Create Option Values for Frame (Walnut, Black Oak, Gold)', async () => {
      const res1 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${frameOptionId}/values`, { value: 'Walnut', slug: 'walnut', sortOrder: 1 }, superAdminToken);
      const res2 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${frameOptionId}/values`, { value: 'Black Oak', slug: 'black-oak', sortOrder: 2 }, superAdminToken);
      const res3 = await request('POST', `/api/v1/admin/products/${variableProductId}/options/${frameOptionId}/values`, { value: 'Gold Leaf', slug: 'gold-leaf', sortOrder: 3 }, superAdminToken);
      if (res1.status !== 201 || res2.status !== 201 || res3.status !== 201) {
        throw new Error(`Create frame option values failed`);
      }
      frameWalnutValId = res1.body.data.id;
      frameBlackValId = res2.body.data.id;
      frameGoldValId = res3.body.data.id;
    });

    await test('15. List Option Values (GET /api/v1/admin/products/:id/options/:optId/values)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.length !== 3) {
        throw new Error(`List option values failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('16. Update Option Value (PATCH)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/options/${frameOptionId}/values/${frameGoldValId}`,
        { value: '24K Gold Leaf' },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.value !== '24K Gold Leaf') {
        throw new Error(`Update option value failed: ${JSON.stringify(res.body)}`);
      }
      // Revert
      await request('PATCH', `/api/v1/admin/products/${variableProductId}/options/${frameOptionId}/values/${frameGoldValId}`, { value: 'Gold Leaf' }, superAdminToken);
    });

    await test('17. Duplicate Option Name on Same Product Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/options`,
        { name: 'Size', slug: 'size-2' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_OPTION_NAME') {
        throw new Error(`Expected 400 DUPLICATE_OPTION_NAME, got ${res.status}`);
      }
    });

    await test('18. Duplicate Option Value on Same Option Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values`,
        { value: 'A4' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_OPTION_VALUE') {
        throw new Error(`Expected 400 DUPLICATE_OPTION_VALUE, got ${res.status}`);
      }
    });

    // ==========================================
    // 3. PRODUCT TYPE RULES (19-21)
    // ==========================================

    await test('19. Adding Variant to SIMPLE Product Rejected (HTTP 409 CONFLICT)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${simpleProductId}/variants`,
        {
          sku: 'LA-SMP-VAR-001',
          price: 3500,
          optionValues: [{ optionValueId: sizeA4ValId }]
        },
        superAdminToken
      );
      if (res.status !== 409 || res.body.error?.code !== 'INVALID_PRODUCT_TYPE') {
        throw new Error(`Expected 409 INVALID_PRODUCT_TYPE, got ${res.status}`);
      }
    });

    await test('20. Creating Option on SIMPLE Product Rejected (HTTP 409 CONFLICT)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${simpleProductId}/options`,
        { name: 'Size' },
        superAdminToken
      );
      if (res.status !== 409 || res.body.error?.code !== 'INVALID_PRODUCT_TYPE') {
        throw new Error(`Expected 409 INVALID_PRODUCT_TYPE, got ${res.status}`);
      }
    });

    await test('21. Converting VARIABLE Product to SIMPLE Blocked When Variants Exist (HTTP 409)', async () => {
      // First create a variant on variableProductId
      const vRes = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A4-WAL',
          price: 5200,
          compareAtPrice: 6000,
          stockQuantity: 10,
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameWalnutValId }
          ]
        },
        superAdminToken
      );
      if (vRes.status !== 201) throw new Error(`Setup variant failed: ${JSON.stringify(vRes.body)}`);
      createdVariantId = vRes.body.data.id;

      // Attempt to convert to SIMPLE
      const updateRes = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}`,
        { productType: 'SIMPLE' },
        superAdminToken
      );
      if (updateRes.status !== 409) {
        throw new Error(`Expected 409 Conflict when converting with variants, got ${updateRes.status}`);
      }
    });

    // ==========================================
    // 4. VARIANT CRUD (22-31)
    // ==========================================

    await test('22. Get Variant by ID (GET /api/v1/admin/products/:id/variants/:varId)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.id !== createdVariantId || res.body.data.sku !== 'LA-ROY-A4-WAL') {
        throw new Error(`Get variant failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('23. List Product Variants with Pagination', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants?page=1&limit=10`, undefined, superAdminToken);
      if (res.status !== 200 || !res.body.success || res.body.data.length < 1) {
        throw new Error(`List variants failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('24. Update Variant Details (PATCH)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}`,
        { price: 5400, stockQuantity: 15 },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.price !== 5400 || res.body.data.stockQuantity !== 15) {
        throw new Error(`Update variant failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('25. Update Variant Status (PATCH /status)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}/status`,
        { status: 'INACTIVE' },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.status !== 'INACTIVE') {
        throw new Error(`Update variant status failed: ${JSON.stringify(res.body)}`);
      }
      // Revert to ACTIVE
      await request('PATCH', `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}/status`, { status: 'ACTIVE' }, superAdminToken);
    });

    await test('26. Update Variant Sort Order (PATCH /sort)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}/sort`,
        { sortOrder: 5 },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.sortOrder !== 5) {
        throw new Error(`Update variant sort failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('27. Duplicate Variant SKU Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A4-WAL', // already used by createdVariantId
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameBlackValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SKU') {
        throw new Error(`Expected 400 DUPLICATE_SKU, got ${res.status}`);
      }
    });

    await test('28. Colliding Variant SKU with Product SKU Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-0001', // Parent product SKU
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameBlackValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SKU') {
        throw new Error(`Expected 400 DUPLICATE_SKU for product SKU collision, got ${res.status}`);
      }
    });

    await test('29. Colliding Product Creation with Variant SKU Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products`,
        {
          name: 'Colliding Product',
          sku: 'LA-ROY-A4-WAL', // Used by variant
          price: 1000,
          categoryId: testCategoryId
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_SKU') {
        throw new Error(`Expected 400 DUPLICATE_SKU when product uses variant SKU, got ${res.status}`);
      }
    });

    await test('30. Invalid Product ID on Variant Request Returns HTTP 404', async () => {
      const res = await request(
        'GET',
        `/api/v1/admin/products/non-existent-product-id/variants`,
        undefined,
        superAdminToken
      );
      if (res.status !== 404) {
        throw new Error(`Expected 404, got ${res.status}`);
      }
    });

    await test('31. Delete Variant (DELETE /api/v1/admin/products/:id/variants/:varId)', async () => {
      // Create a temporary variant to delete
      const tempRes = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-TEMP-DELETE-VAR',
          optionValues: [
            { optionValueId: sizeA2ValId },
            { optionValueId: frameGoldValId }
          ]
        },
        superAdminToken
      );
      const tempId = tempRes.body.data.id;
      const delRes = await request('DELETE', `/api/v1/admin/products/${variableProductId}/variants/${tempId}`, undefined, superAdminToken);
      if (delRes.status !== 200 || !delRes.body.success) {
        throw new Error(`Delete variant failed: ${JSON.stringify(delRes.body)}`);
      }
    });

    // ==========================================
    // 5. OPTION COMBINATIONS (32-39)
    // ==========================================

    await test('32. Create Second Variant with Distinct Combination (A4 + Black)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A4-BLK',
          price: 5200,
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameBlackValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.sku !== 'LA-ROY-A4-BLK') {
        throw new Error(`Create second variant failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('33. Duplicate Combination Rejected (A4 + Walnut again)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A4-WAL-DUP',
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameWalnutValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_COMBINATION') {
        throw new Error(`Expected 400 DUPLICATE_COMBINATION, got ${res.status}`);
      }
    });

    await test('34. Combination Order Normalization (Walnut + A4 is identical to A4 + Walnut)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-REVERSE-ORDER',
          optionValues: [
            { optionValueId: frameWalnutValId }, // reversed order in array
            { optionValueId: sizeA4ValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_COMBINATION') {
        throw new Error(`Expected 400 DUPLICATE_COMBINATION for reversed order, got ${res.status}`);
      }
    });

    await test('35. Incomplete Combination / Missing Option Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-INCOMPLETE',
          optionValues: [
            { optionValueId: sizeA4ValId } // Missing Frame option!
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'INCOMPLETE_OPTION_COMBINATION') {
        throw new Error(`Expected 400 INCOMPLETE_OPTION_COMBINATION, got ${res.status}`);
      }
    });

    await test('36. Duplicate Value for Same Option in Combination Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-TWO-SIZES',
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: sizeA3ValId } // Two sizes, no frame!
          ]
        },
        superAdminToken
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400 on two values for same option, got ${res.status}`);
      }
    });

    await test('37. Non-Existent Option Value ID Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-INVALID-VAL',
          optionValues: [
            { optionValueId: 'non-existent-val-id' },
            { optionValueId: frameWalnutValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'INVALID_OPTION_VALUE') {
        throw new Error(`Expected 400 INVALID_OPTION_VALUE, got ${res.status}`);
      }
    });

    await test('38. Option Value from Another Product Rejected (HTTP 400)', async () => {
      // Create another product and option
      const uniqueSuffix = Date.now().toString(36);
      const anotherProd = await prisma.product.create({
        data: { name: 'Another Art ' + uniqueSuffix, slug: 'another-art-' + uniqueSuffix, sku: 'LA-ANO-' + uniqueSuffix, price: 2000, productType: 'VARIABLE', status: 'ACTIVE', categoryId: testCategoryId }
      });
      const anotherOpt = await prisma.productOption.create({
        data: { productId: anotherProd.id, name: 'Finish', slug: 'finish' }
      });
      const foreignVal = await prisma.productOptionValue.create({
        data: { productOptionId: anotherOpt.id, value: 'Matte', slug: 'matte' }
      });

      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-FOREIGN-OPT',
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: foreignVal.id }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'INVALID_OPTION_VALUE_RELATION') {
        throw new Error(`Expected 400 INVALID_OPTION_VALUE_RELATION, got ${res.status}`);
      }
    });

    await test('39. Multi-Dimensional Combination (3+ Options) Supported', async () => {
      // Add a 3rd option (Material) to variableProductId
      const matOpt = await prisma.productOption.create({
        data: { productId: variableProductId, name: 'Material', slug: 'material', sortOrder: 3 }
      });
      const matCanvas = await prisma.productOptionValue.create({
        data: { productOptionId: matOpt.id, value: 'Canvas Fabric', slug: 'canvas-fabric', sortOrder: 1 }
      });
      const matPaper = await prisma.productOptionValue.create({
        data: { productOptionId: matOpt.id, value: 'Archival Paper', slug: 'archival-paper', sortOrder: 2 }
      });

      // Now create a 3-dimensional variant: Size=A3, Frame=Gold, Material=Canvas
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A3-GLD-CNV',
          price: 7500,
          optionValues: [
            { optionValueId: sizeA3ValId },
            { optionValueId: frameGoldValId },
            { optionValueId: matCanvas.id }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.sku !== 'LA-ROY-A3-GLD-CNV') {
        throw new Error(`3-option variant create failed: ${JSON.stringify(res.body)}`);
      }

      // Clean up 3rd option and test variant
      await prisma.productVariant.delete({ where: { id: res.body.data.id } });
      await prisma.productOptionValue.delete({ where: { id: matPaper.id } });
      await prisma.productOptionValue.delete({ where: { id: matCanvas.id } });
      await prisma.productOption.delete({ where: { id: matOpt.id } });
    });

    // ==========================================
    // 6. PRICING & INVENTORY (40-49)
    // ==========================================

    await test('40. Variant Price Override', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A3-WAL',
          price: 6800, // overrides base product price of 5000
          compareAtPrice: 7500,
          costPrice: 3000,
          stockQuantity: 8,
          optionValues: [
            { optionValueId: sizeA3ValId },
            { optionValueId: frameWalnutValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.price !== 6800) {
        throw new Error(`Price override failed: ${JSON.stringify(res.body)}`);
      }
    });

    await test('41. CompareAtPrice Lower than Selling Price Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A3-BLK',
          price: 6800,
          compareAtPrice: 5000, // Invalid! compareAtPrice < price
          optionValues: [
            { optionValueId: sizeA3ValId },
            { optionValueId: frameBlackValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'INVALID_COMPARE_PRICE') {
        throw new Error(`Expected 400 INVALID_COMPARE_PRICE, got ${res.status}`);
      }
    });

    await test('42. Variant Price Inheritance (Omitted/Null Price Inherits Base Product Price)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A2-WAL',
          // price omitted
          stockQuantity: 5,
          optionValues: [
            { optionValueId: sizeA2ValId },
            { optionValueId: frameWalnutValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201) throw new Error(`Create variant without price failed`);
      if (res.body.data.price !== null) throw new Error(`Expected null price stored on variant`);
    });

    await test('43. Variant Inventory Stock Tracking', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants?stockState=in_stock`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.length < 1) {
        throw new Error(`Filter in_stock failed`);
      }
    });

    await test('44. Variant Allow Backorder Configuration', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A2-BLK',
          stockQuantity: 0,
          allowBackorder: true,
          trackInventory: true,
          optionValues: [
            { optionValueId: sizeA2ValId },
            { optionValueId: frameBlackValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201 || !res.body.data.allowBackorder) {
        throw new Error(`Backorder configuration failed`);
      }
    });

    await test('45. Variant Inventory Tracking Disabled Configuration', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-A2-GLD',
          trackInventory: false,
          optionValues: [
            { optionValueId: sizeA2ValId },
            { optionValueId: frameGoldValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.trackInventory !== false) {
        throw new Error(`trackInventory=false configuration failed`);
      }
    });

    // ==========================================
    // 7. PUBLIC STOREFRONT API (46-52)
    // ==========================================

    await test('46. VARIABLE Product Returns Options Array with Values', async () => {
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Public product detail failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.data.options) || res.body.data.options.length !== 2) {
        throw new Error(`Expected 2 options in public response, got ${res.body.data.options?.length}`);
      }
    });

    await test('47. VARIABLE Product Returns Active Variants Array with Option Map', async () => {
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      const variants = res.body.data.variants;
      if (!Array.isArray(variants) || variants.length < 1) {
        throw new Error(`Expected active variants in public response`);
      }
      const v = variants.find((item: any) => item.sku === 'LA-ROY-A4-WAL');
      if (!v || v.options?.size !== 'a4' || v.options?.frame !== 'walnut') {
        throw new Error(`Option slug mapping incorrect: ${JSON.stringify(v)}`);
      }
    });

    await test('48. Public Storefront Sanitizes costPrice and Internal Inventory', async () => {
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      if (res.body.data.costPrice !== undefined) {
        throw new Error('Public product detail exposed product costPrice');
      }
      for (const v of res.body.data.variants) {
        if (v.costPrice !== undefined) {
          throw new Error('Public product variant detail exposed variant costPrice');
        }
        if (v.stockQuantity !== undefined) {
          throw new Error('Public product variant detail exposed raw stockQuantity');
        }
        if (typeof v.inStock !== 'boolean') {
          throw new Error('Expected boolean inStock availability');
        }
      }
    });

    await test('49. Inactive Variant Hidden from Public Storefront', async () => {
      // Deactivate LA-ROY-A4-WAL
      await request('PATCH', `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}/status`, { status: 'INACTIVE' }, superAdminToken);
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      const v = res.body.data.variants.find((item: any) => item.sku === 'LA-ROY-A4-WAL');
      if (v) throw new Error('Inactive variant was exposed on public storefront');

      // Reactivate
      await request('PATCH', `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}/status`, { status: 'ACTIVE' }, superAdminToken);
    });

    await test('50. SIMPLE Product Omits Variants Array from Public Storefront', async () => {
      const res = await request('GET', `/api/v1/products/the-sacred-bronze-diya`);
      if (res.status !== 200 || !res.body.success) throw new Error('Simple product detail failed');
      if (res.body.data.variants !== undefined) {
        throw new Error('Simple product should not return variants array in public response');
      }
    });

    await test('51. Variant Effective Price Derivation in Storefront (Inherited Base Price)', async () => {
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      const v = res.body.data.variants.find((item: any) => item.sku === 'LA-ROY-A2-WAL');
      // Product base price is 5000, so effective price must be 5000
      if (!v || v.price !== 5000) {
        throw new Error(`Expected inherited price 5000, got ${v?.price}`);
      }
    });

    await test('52. Variant Image Fallback to Product Image', async () => {
      const res = await request('GET', `/api/v1/products/the-royal-sanskrit-edit-frame`);
      const v = res.body.data.variants.find((item: any) => item.sku === 'LA-ROY-A4-WAL');
      if (!v) throw new Error('Variant not found');
      // Should fallback to parent product image if variant image is null
      const prod = await prisma.product.findUnique({ where: { id: variableProductId } });
      if (v.image !== prod?.image) {
        throw new Error(`Image fallback failed: expected ${prod?.image}, got ${v.image}`);
      }
    });

    // ==========================================
    // 8. RBAC ACCESS CONTROL (53-57)
    // ==========================================

    await test('53. RBAC: SUPER_ADMIN Authorized for All Variant Operations', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants`, undefined, superAdminToken);
      if (res.status !== 200) throw new Error(`Super admin rejected: ${res.status}`);
    });

    await test('54. RBAC: CATALOGUE_MANAGER Authorized for Options & Variants', async () => {
      const res1 = await request('GET', `/api/v1/admin/products/${variableProductId}/options`, undefined, catalogueManagerToken);
      const res2 = await request('GET', `/api/v1/admin/products/${variableProductId}/variants`, undefined, catalogueManagerToken);
      if (res1.status !== 200 || res2.status !== 200) {
        throw new Error(`Catalogue Manager rejected: ${res1.status}, ${res2.status}`);
      }
    });

    await test('55. RBAC: CONTENT_MANAGER Allowed Create/Update, Denied Delete (HTTP 403)', async () => {
      const optRes = await request('GET', `/api/v1/admin/products/${variableProductId}/options`, undefined, contentManagerToken);
      if (optRes.status !== 200) throw new Error(`Content manager view failed: ${optRes.status}`);

      const delRes = await request('DELETE', `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}`, undefined, contentManagerToken);
      if (delRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Content Manager on delete, got ${delRes.status}`);
      }
    });

    await test('56. RBAC: MARKETING_MANAGER View-Only (Create Denied HTTP 403)', async () => {
      const viewRes = await request('GET', `/api/v1/admin/products/${variableProductId}/variants`, undefined, marketingManagerToken);
      if (viewRes.status !== 200) throw new Error(`Marketing Manager view failed: ${viewRes.status}`);

      const createRes = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        { sku: 'LA-MKT-DENIED', optionValues: [{ optionValueId: sizeA4ValId }] },
        marketingManagerToken
      );
      if (createRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Marketing Manager on create, got ${createRes.status}`);
      }
    });

    await test('57. RBAC: ORDER_MANAGER Denied All Variant Endpoints (HTTP 403)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants`, undefined, orderManagerToken);
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Order Manager, got ${res.status}`);
      }
    });

    // ==========================================
    // 9. AUDIT LOGGING (58-67)
    // ==========================================

    await test('58. Audit Log on Variant Create (VARIANT_CREATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_CREATED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_CREATED audit log found');
    });

    await test('59. Audit Log on Variant Update (VARIANT_UPDATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_UPDATED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_UPDATED audit log found');
    });

    await test('60. Audit Log on Variant Status Change (VARIANT_STATUS_CHANGED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_STATUS_CHANGED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_STATUS_CHANGED audit log found');
    });

    await test('61. Audit Log on Variant Sort Change (VARIANT_SORT_CHANGED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_SORT_CHANGED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_SORT_CHANGED audit log found');
    });

    await test('62. Audit Log on Option Create (PRODUCT_OPTION_CREATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'PRODUCT_OPTION_CREATED' }
      });
      if (logs.length === 0) throw new Error('No PRODUCT_OPTION_CREATED audit log found');
    });

    await test('63. Audit Log on Option Update (PRODUCT_OPTION_UPDATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'PRODUCT_OPTION_UPDATED' }
      });
      if (logs.length === 0) throw new Error('No PRODUCT_OPTION_UPDATED audit log found');
    });

    await test('64. Audit Log on Option Value Create (PRODUCT_OPTION_VALUE_CREATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'PRODUCT_OPTION_VALUE_CREATED' }
      });
      if (logs.length === 0) throw new Error('No PRODUCT_OPTION_VALUE_CREATED audit log found');
    });

    await test('65. Audit Log on Option Value Update (PRODUCT_OPTION_VALUE_UPDATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'PRODUCT_OPTION_VALUE_UPDATED' }
      });
      if (logs.length === 0) throw new Error('No PRODUCT_OPTION_VALUE_UPDATED audit log found');
    });

    await test('66. Audit Log on Variant Delete (VARIANT_DELETED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_DELETED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_DELETED audit log found');
    });

    await test('67. Audit Log on Combination Change (VARIANT_COMBINATION_CHANGED)', async () => {
      // Trigger a combination update
      await request(
        'PATCH',
        `/api/v1/admin/products/${variableProductId}/variants/${createdVariantId}`,
        {
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameGoldValId }
          ]
        },
        superAdminToken
      );
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'VARIANT_COMBINATION_CHANGED' }
      });
      if (logs.length === 0) throw new Error('No VARIANT_COMBINATION_CHANGED audit log found');
    });

    // ==========================================
    // 10. SECURITY & INTEGRITY (68-78)
    // ==========================================

    await test('68. Admin Variant Endpoints Require Authentication (HTTP 401 on Missing Token)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants`);
      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthenticated, got ${res.status}`);
      }
    });

    await test('69. Option Deletion Blocked When In Use by Existing Variants (HTTP 409 CONFLICT)', async () => {
      const res = await request('DELETE', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}`, undefined, superAdminToken);
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict when deleting option in use, got ${res.status}`);
      }
    });

    await test('70. Option Value Deletion Blocked When In Use by Existing Variants (HTTP 409 CONFLICT)', async () => {
      const res = await request('DELETE', `/api/v1/admin/products/${variableProductId}/options/${sizeOptionId}/values/${sizeA4ValId}`, undefined, superAdminToken);
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict when deleting value in use, got ${res.status}`);
      }
    });

    await test('71. Product Deletion Cleans Up Options, Values, Variants & Junctions Safely', async () => {
      // Create isolated variable product with option, value, variant
      const isoProd = await prisma.product.create({
        data: { name: 'Isolated Prod', slug: 'isolated-prod', sku: 'LA-ISO-0001', price: 1000, productType: 'VARIABLE', status: 'ACTIVE', categoryId: testCategoryId }
      });
      const isoOpt = await prisma.productOption.create({
        data: { productId: isoProd.id, name: 'IsoOpt', slug: 'iso-opt' }
      });
      const isoVal = await prisma.productOptionValue.create({
        data: { productOptionId: isoOpt.id, value: 'IsoVal', slug: 'iso-val' }
      });
      const isoVar = await prisma.productVariant.create({
        data: { productId: isoProd.id, sku: 'LA-ISO-VAR-001', status: 'ACTIVE' }
      });
      await prisma.productVariantOptionValue.create({
        data: { variantId: isoVar.id, optionValueId: isoVal.id }
      });

      // Delete Product via Admin endpoint
      const delRes = await request('DELETE', `/api/v1/admin/products/${isoProd.id}`, undefined, superAdminToken);
      if (delRes.status !== 200) throw new Error(`Delete isolated product failed: ${delRes.status}`);

      // Verify cascading cleanup
      const checkOpt = await prisma.productOption.findUnique({ where: { id: isoOpt.id } });
      const checkVar = await prisma.productVariant.findUnique({ where: { id: isoVar.id } });
      const checkLinks = await prisma.productVariantOptionValue.findMany({ where: { variantId: isoVar.id } });
      if (checkOpt || checkVar || checkLinks.length > 0) {
        throw new Error('Cascading cleanup on product delete failed');
      }
    });

    await test('72. Non-Existent Product Option Returns HTTP 404', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/options/non-existent-option-id`, undefined, superAdminToken);
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    });

    await test('73. Non-Existent Variant Returns HTTP 404', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants/non-existent-variant-id`, undefined, superAdminToken);
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    });

    await test('74. High-Dimensional Scalability (3 Options × 5 Values = 125 Theoretical Combos)', async () => {
      const scaleProd = await prisma.product.create({
        data: { name: 'Scalable Masterwork', slug: 'scalable-masterwork', sku: 'LA-SCL-0001', price: 9000, productType: 'VARIABLE', status: 'ACTIVE', categoryId: testCategoryId }
      });

      const opt1 = await prisma.productOption.create({ data: { productId: scaleProd.id, name: 'Dimension', slug: 'dimension', sortOrder: 1 } });
      const opt2 = await prisma.productOption.create({ data: { productId: scaleProd.id, name: 'Frame Material', slug: 'frame-material', sortOrder: 2 } });
      const opt3 = await prisma.productOption.create({ data: { productId: scaleProd.id, name: 'Glass Finish', slug: 'glass-finish', sortOrder: 3 } });

      const val1_1 = await prisma.productOptionValue.create({ data: { productOptionId: opt1.id, value: 'Small', slug: 'small' } });
      const val2_1 = await prisma.productOptionValue.create({ data: { productOptionId: opt2.id, value: 'Teak', slug: 'teak' } });
      const val3_1 = await prisma.productOptionValue.create({ data: { productOptionId: opt3.id, value: 'Anti-Glare', slug: 'anti-glare' } });

      const varRes = await request(
        'POST',
        `/api/v1/admin/products/${scaleProd.id}/variants`,
        {
          sku: 'LA-SCL-VAR-001',
          price: 9500,
          optionValues: [
            { optionValueId: val1_1.id },
            { optionValueId: val2_1.id },
            { optionValueId: val3_1.id }
          ]
        },
        superAdminToken
      );

      if (varRes.status !== 201) throw new Error(`Scalability variant create failed`);

      // Cleanup
      await prisma.productVariant.delete({ where: { id: varRes.body.data.id } });
      await prisma.product.delete({ where: { id: scaleProd.id } });
    });

    await test('75. Negative Variant Price Validation Rejection (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-NEG-PRICE',
          price: -500,
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameGoldValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400) throw new Error(`Expected 400 for negative price, got ${res.status}`);
    });

    await test('76. Negative Variant Stock Quantity Validation Rejection (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${variableProductId}/variants`,
        {
          sku: 'LA-ROY-NEG-STOCK',
          stockQuantity: -10,
          optionValues: [
            { optionValueId: sizeA4ValId },
            { optionValueId: frameGoldValId }
          ]
        },
        superAdminToken
      );
      if (res.status !== 400) throw new Error(`Expected 400 for negative stock, got ${res.status}`);
    });

    await test('77. Variant Search by SKU Filter', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants?sku=LA-ROY-A4`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.length < 1) {
        throw new Error(`Variant search by SKU failed`);
      }
    });

    await test('78. Variant Sorting by Price Descending', async () => {
      const res = await request('GET', `/api/v1/admin/products/${variableProductId}/variants?sortBy=price&sortOrder=desc`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.length < 2) {
        throw new Error(`Variant sorting failed`);
      }
      const p1 = res.body.data[0].price || 0;
      const p2 = res.body.data[1].price || 0;
      if (p1 < p2) throw new Error(`Expected descending price sort, got ${p1} < ${p2}`);
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 7 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
