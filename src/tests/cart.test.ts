import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { hashPassword } from '../security/password.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { CartGuestService } from '../modules/cart/cart-guest.service.ts';
import { CartPolicyService } from '../modules/cart/cart-policy.service.ts';
import { CartRepository } from '../modules/cart/cart.repository.ts';
import http from 'node:http';

const TEST_PORT = 5018;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let orderManagerToken: string;
let catalogueManagerToken: string;

let customer1: any;
let customer1Token: string;
let customer2: any;
let customer2Token: string;

let simpleProduct: any;
let variableProduct: any;
let variantRed: any;
let variantBlue: any;
let antiqueProduct: any;
let outOfStockProduct: any;
let backorderProduct: any;

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

async function runCartTests() {
  console.log('\n======================================================');
  console.log(' MODULE 18: CART & SHOPPING CART MANAGEMENT TEST SUITE');
  console.log('======================================================\n');

  // 1. Initialize server and seed
  const app = createApp();
  server = app.listen(TEST_PORT);

  try {
    await runSeed();

    // 2. Setup Admin Users & JWT Tokens
    const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });

    const superAdminUser = prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
    superAdminToken = generateAccessToken({ sub: superAdminUser!.id, roleId: superAdminRole!.id });

    let orderUser = prisma.adminUser.findUnique({ where: { email: 'order.cart@lagoreearts.com' } });
    if (!orderUser) {
      orderUser = prisma.adminUser.create({
        data: {
          name: 'Order Cart Manager',
          email: 'order.cart@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: orderManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: orderUser.id, roleId: orderManagerRole!.id });

    let catUser = prisma.adminUser.findUnique({ where: { email: 'cat.cart@lagoreearts.com' } });
    if (!catUser) {
      catUser = prisma.adminUser.create({
        data: {
          name: 'Catalogue Cart Manager',
          email: 'cat.cart@lagoreearts.com',
          passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
          roleId: catalogueManagerRole!.id,
          status: 'ACTIVE'
        }
      });
    }
    catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catalogueManagerRole!.id });

    // 3. Setup Test Customers
    const passwordHash = await hashPassword('LagoreeArtPass@2026');

    customer1 = prisma.customer.findUnique({ where: { email: 'customer.cart1@lagoreearts.com' } });
    if (!customer1) {
      customer1 = prisma.customer.create({
        data: {
          email: 'customer.cart1@lagoreearts.com',
          normalizedEmail: 'customer.cart1@lagoreearts.com',
          passwordHash,
          firstName: 'Ananya',
          lastName: 'Roy',
          phone: '+91 98765 11111',
          status: 'ACTIVE',
          emailVerifiedAt: new Date()
        }
      });
    }
    customer1Token = generateCustomerAccessToken({ sub: customer1.id, email: customer1.email });

    customer2 = prisma.customer.findUnique({ where: { email: 'customer.cart2@lagoreearts.com' } });
    if (!customer2) {
      customer2 = prisma.customer.create({
        data: {
          email: 'customer.cart2@lagoreearts.com',
          normalizedEmail: 'customer.cart2@lagoreearts.com',
          passwordHash,
          firstName: 'Dev',
          lastName: 'Patel',
          phone: '+91 98765 22222',
          status: 'ACTIVE',
          emailVerifiedAt: new Date()
        }
      });
    }
    customer2Token = generateCustomerAccessToken({ sub: customer2.id, email: customer2.email });

    // 4. Setup Test Products & Variants
    const cat = prisma.category.findFirst({ where: { status: 'ACTIVE' } }) || prisma.category.create({
      data: { name: 'Paintings', slug: 'paintings', status: 'ACTIVE' }
    });

    simpleProduct = prisma.product.findUnique({ where: { slug: 'tanjore-gold-leaf-krishna' } });
    if (!simpleProduct) {
      simpleProduct = prisma.product.create({
        data: {
          name: 'Tanjore Gold Leaf Krishna',
          slug: 'tanjore-gold-leaf-krishna',
          sku: 'ART-TNJ-001',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 25000,
          currency: 'INR',
          stockQuantity: 10,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    variableProduct = prisma.product.findUnique({ where: { slug: 'banaras-silk-heritage-frame' } });
    if (!variableProduct) {
      variableProduct = prisma.product.create({
        data: {
          name: 'Banaras Silk Heritage Frame',
          slug: 'banaras-silk-heritage-frame',
          sku: 'FRM-BNS-001',
          status: 'ACTIVE',
          productType: 'VARIABLE',
          price: 15000,
          currency: 'INR',
          stockQuantity: 20,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    variantRed = prisma.productVariant.findUnique({ where: { sku: 'FRM-BNS-001-RED' } });
    if (!variantRed) {
      variantRed = prisma.productVariant.create({
        data: {
          productId: variableProduct.id,
          sku: 'FRM-BNS-001-RED',
          price: 18000,
          stockQuantity: 5,
          trackInventory: true,
          allowBackorder: false,
          status: 'ACTIVE'
        }
      });
    }

    variantBlue = prisma.productVariant.findUnique({ where: { sku: 'FRM-BNS-001-BLU' } });
    if (!variantBlue) {
      variantBlue = prisma.productVariant.create({
        data: {
          productId: variableProduct.id,
          sku: 'FRM-BNS-001-BLU',
          price: null, // Inherits parent price (15000)
          stockQuantity: 8,
          trackInventory: true,
          allowBackorder: false,
          status: 'ACTIVE'
        }
      });
    }

    antiqueProduct = prisma.product.findUnique({ where: { slug: '18th-century-chola-bronze-nataraja' } });
    if (!antiqueProduct) {
      antiqueProduct = prisma.product.create({
        data: {
          name: '18th Century Chola Bronze Nataraja',
          slug: '18th-century-chola-bronze-nataraja',
          sku: 'ANT-CHL-001',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 450000,
          currency: 'INR',
          stockQuantity: 1,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
      prisma.antiqueProfile.create({
        data: {
          productId: antiqueProduct.id,
          isOneOfAKind: true,
          era: '18th Century',
          condition: 'EXCELLENT'
        }
      });
    }

    outOfStockProduct = prisma.product.findUnique({ where: { slug: 'mithila-tree-of-life' } });
    if (!outOfStockProduct) {
      outOfStockProduct = prisma.product.create({
        data: {
          name: 'Mithila Tree of Life',
          slug: 'mithila-tree-of-life',
          sku: 'ART-MTH-001',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 8500,
          currency: 'INR',
          stockQuantity: 0,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    backorderProduct = prisma.product.findUnique({ where: { slug: 'pichwai-lotus-shrinathji' } });
    if (!backorderProduct) {
      backorderProduct = prisma.product.create({
        data: {
          name: 'Pichwai Lotus Shrinathji',
          slug: 'pichwai-lotus-shrinathji',
          sku: 'ART-PCW-001',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 32000,
          currency: 'INR',
          stockQuantity: 2,
          trackInventory: true,
          allowBackorder: true,
          categoryId: cat.id
        }
      });
    }

    const resetCarts = () => {
      prisma.cartItem.deleteMany({});
      prisma.cart.deleteMany({});
    };

    // ========================================================
    // CATEGORY A: CART CREATION & IDENTITY RESOLUTION
    // ========================================================
    console.log('\n--- CATEGORY A: CART CREATION & IDENTITY RESOLUTION ---');
    resetCarts();

    // A1
    let res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 && res.body.data.itemCount === 0 && res.body.data.subtotal === 0 && res.body.data.currency === 'INR',
      'A1. GET /api/v1/cart returns empty cart structure when no cart exists'
    );

    // A2
    res = await request('GET', '/api/v1/cart');
    const guestTokenA2 = res.headers['x-guest-cart-token'];
    assert(
      res.status === 200 && Boolean(guestTokenA2) && CartGuestService.isValidTokenFormat(guestTokenA2) && res.body.data.isGuest === true,
      'A2. Guest shopper gets auto-generated guest cart token in response header'
    );

    // A3
    resetCarts();
    let preCheck = await CartRepository.findCartByCustomerId(customer1.id);
    assert(preCheck === null, 'A3. Customer cart does not exist prior to first item addition');

    res = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    assert(
      res.status === 200 && res.body.data.customerId === customer1.id && res.body.data.itemCount === 1,
      'A3. Customer cart is lazily created upon first item addition'
    );

    let postCheck = await CartRepository.findCartByCustomerId(customer1.id);
    assert(postCheck !== null && postCheck.customerId === customer1.id, 'A3. Cart record verified in database for customer');

    // A4
    const guestTokenA4 = CartGuestService.generateGuestToken();
    res = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, undefined, {
      'x-guest-cart-token': guestTokenA4
    });
    assert(res.status === 200 && res.body.data.isGuest === true, 'A4. Guest cart created with supplied guest token');

    const tokenHashA4 = CartGuestService.hashGuestToken(guestTokenA4);
    const cartInDbA4 = await CartRepository.findCartByGuestTokenHash(tokenHashA4);
    assert(
      cartInDbA4 !== null && cartInDbA4.guestTokenHash === tokenHashA4 && cartInDbA4.guestTokenHash !== guestTokenA4,
      'A4. Guest cart stores only SHA-256 token hash in database, never raw token'
    );

    // ========================================================
    // CATEGORY B: ADD ITEM TO CART & VALIDATIONS
    // ========================================================
    console.log('\n--- CATEGORY B: ADD ITEM TO CART & VALIDATIONS ---');
    resetCarts();

    // B1
    res = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.itemCount === 2 &&
        res.body.data.subtotal === 50000 &&
        res.body.data.items[0].unitPrice === 25000 &&
        res.body.data.items[0].lineTotal === 50000 &&
        res.body.data.items[0].product.name === 'Tanjore Gold Leaf Krishna',
      'B1. Add simple product resolves authoritative price and calculates line total'
    );

    // B2
    res = await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 },
      customer1Token
    );
    const redItem = res.body.data.items.find((i: any) => i.variantId === variantRed.id);
    assert(
      res.status === 200 && redItem && redItem.unitPrice === 18000 && redItem.lineTotal === 18000 && redItem.variant.sku === 'FRM-BNS-001-RED',
      'B2. Add variable product with explicit variant price'
    );

    // B3
    res = await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantBlue.id, quantity: 1 },
      customer1Token
    );
    const blueItem = res.body.data.items.find((i: any) => i.variantId === variantBlue.id);
    assert(
      res.status === 200 && blueItem && blueItem.unitPrice === 15000 && blueItem.lineTotal === 15000,
      'B3. Add variable product variant inheriting parent price'
    );

    // B4
    res = await request('POST', '/api/v1/cart/items', { productId: variableProduct.id, quantity: 1 }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'VARIANT_REQUIRED', 'B4. Variable product without variant rejected with 400 VARIANT_REQUIRED');

    // B5
    res = await request(
      'POST',
      '/api/v1/cart/items',
      { productId: simpleProduct.id, variantId: variantRed.id, quantity: 1 },
      customer1Token
    );
    assert(
      res.status === 400 && res.body.error.code === 'PRODUCT_VARIANT_MISMATCH',
      'B5. Simple product with variantId rejected with 400 PRODUCT_VARIANT_MISMATCH'
    );

    // B6
    res = await request(
      'POST',
      '/api/v1/cart/items',
      { productId: antiqueProduct.id, variantId: variantRed.id, quantity: 1 },
      customer1Token
    );
    assert(
      res.status === 400 && res.body.error.code === 'PRODUCT_VARIANT_MISMATCH',
      'B6. Variant belonging to different product rejected with 400 PRODUCT_VARIANT_MISMATCH'
    );

    // B7
    resetCarts();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);
    res = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 3 }, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.items.length === 1 &&
        res.body.data.items[0].quantity === 5 &&
        res.body.data.itemCount === 5 &&
        res.body.data.subtotal === 125000,
      'B7. Adding duplicate item combines quantities seamlessly on the existing line'
    );

    // B8
    let r0 = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 0 }, customer1Token);
    let rNeg = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: -2 }, customer1Token);
    let rDec = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2.5 }, customer1Token);
    let rMax = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 150 }, customer1Token);
    assert(
      r0.status === 400 && rNeg.status === 400 && rDec.status === 400 && rMax.status === 400,
      'B8. Zero, negative, decimal, and excessive (>100) quantities strictly rejected with 400'
    );

    // B9
    res = await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantRed.id, quantity: 6 },
      customer1Token
    );
    assert(
      res.status === 409 && res.body.error.code === 'INSUFFICIENT_STOCK',
      'B9. Requesting more than available stock rejected with 409 INSUFFICIENT_STOCK'
    );

    // B10
    res = await request('POST', '/api/v1/cart/items', { productId: outOfStockProduct.id, quantity: 1 }, customer1Token);
    assert(
      res.status === 409 && res.body.error.code === 'INSUFFICIENT_STOCK',
      'B10. Out of stock item rejected with 409 INSUFFICIENT_STOCK'
    );

    // B11
    res = await request('POST', '/api/v1/cart/items', { productId: backorderProduct.id, quantity: 5 }, customer1Token);
    assert(
      res.status === 200 && res.body.data.items[0].quantity === 5,
      'B11. Backorder allowed item permits quantity exceeding current stock'
    );

    // B12
    res = await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 2 }, customer1Token);
    assert(
      res.status === 400 && res.body.error.code === 'ANTIQUE_QUANTITY_EXCEEDED',
      'B12. One-of-a-kind antique restricts quantity to maximum 1 unit'
    );

    // B13
    resetCarts();
    await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 1 }, customer1Token);
    res = await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 1 }, customer1Token);
    assert(
      res.status === 400 && res.body.error.code === 'ANTIQUE_QUANTITY_EXCEEDED',
      'B13. Duplicate addition to antique item blocked if resulting quantity exceeds 1'
    );

    // ========================================================
    // CATEGORY C: UPDATE, REMOVE & CLEAR
    // ========================================================
    console.log('\n--- CATEGORY C: UPDATE, REMOVE & CLEAR ---');
    resetCarts();

    const addResC1 = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);
    const itemC1Id = addResC1.body.data.items[0].id;

    // C1
    res = await request('PATCH', `/api/v1/cart/items/${itemC1Id}`, { quantity: 4 }, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.itemCount === 4 &&
        res.body.data.subtotal === 100000 &&
        res.body.data.items[0].quantity === 4 &&
        res.body.data.items[0].lineTotal === 100000,
      'C1. Update item quantity recalculates line total and cart subtotal'
    );

    // C2
    res = await request('PATCH', `/api/v1/cart/items/${itemC1Id}`, { quantity: 0 }, customer1Token);
    assert(res.status === 400, 'C2. Update item quantity with 0 rejected with 400');

    // C3
    await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 },
      customer1Token
    );
    res = await request('DELETE', `/api/v1/cart/items/${itemC1Id}`, undefined, customer1Token);
    assert(
      res.status === 200 && res.body.data.items.length === 1 && res.body.data.itemCount === 1 && res.body.data.subtotal === 18000,
      'C3. Remove item deletes line and updates totals'
    );

    // C4
    res = await request('DELETE', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 && res.body.data.items.length === 0 && res.body.data.itemCount === 0 && res.body.data.subtotal === 0,
      'C4. Clear cart empties all items and resets totals'
    );

    // C5
    res = await request('DELETE', '/api/v1/cart', undefined, customer1Token);
    assert(res.status === 200 && res.body.data.items.length === 0, 'C5. Clear cart on already empty cart is idempotent');

    // ========================================================
    // CATEGORY D: STALENESS & RECONCILIATION
    // ========================================================
    console.log('\n--- CATEGORY D: STALENESS & RECONCILIATION ---');
    resetCarts();

    // D1
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'INACTIVE' } });

    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.items[0].isAvailable === false &&
        res.body.data.warnings.length === 1 &&
        res.body.data.warnings[0].code === 'PRODUCT_UNAVAILABLE' &&
        res.body.data.subtotal === 0,
      'D1. Inactive product detected as PRODUCT_UNAVAILABLE with warning, subtotal excludes unavailable item'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'ACTIVE' } });

    // D2
    resetCarts();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    prisma.product.update({ where: { id: simpleProduct.id }, data: { price: 30000 } });

    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.warnings.length === 1 &&
        res.body.data.warnings[0].code === 'PRICE_CHANGED' &&
        res.body.data.warnings[0].oldPrice === 25000 &&
        res.body.data.warnings[0].newPrice === 30000 &&
        res.body.data.subtotal === 30000,
      'D2. Price change detected with PRICE_CHANGED warning and updated new price'
    );

    const recalcRes = await request('POST', '/api/v1/cart/recalculate', undefined, customer1Token);
    assert(recalcRes.status === 200, 'D2. Recalculate endpoint acknowledges latest catalogue prices');

    const getAgain = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      getAgain.body.data.warnings.filter((w: any) => w.code === 'PRICE_CHANGED').length === 0,
      'D2. Price change warning cleared after recalculate'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { price: 25000 } });

    // D3
    resetCarts();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 4 }, customer1Token);
    prisma.product.update({ where: { id: simpleProduct.id }, data: { stockQuantity: 2 } });

    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.warnings.length === 1 &&
        res.body.data.warnings[0].code === 'QUANTITY_ADJUSTED' &&
        res.body.data.warnings[0].newQuantity === 2 &&
        res.body.data.subtotal === 50000,
      'D3. Stock drop below cart quantity emits QUANTITY_ADJUSTED warning with adjusted subtotal'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { stockQuantity: 10 } });

    // ========================================================
    // CATEGORY E: GUEST CART & MERGE WORKFLOWS
    // ========================================================
    console.log('\n--- CATEGORY E: GUEST CART & MERGE WORKFLOWS ---');
    resetCarts();

    // E1
    const guestTokenE1 = CartGuestService.generateGuestToken();
    res = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, undefined, {
      'x-guest-cart-token': guestTokenE1
    });
    assert(
      res.status === 200 && res.body.data.isGuest === true && res.body.data.itemCount === 2,
      'E1. Guest cart works with token header and resolves items'
    );

    // E2
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 3 }, customer1Token);
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: guestTokenE1 }, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.cart.items.length === 1 &&
        res.body.data.cart.itemCount === 5 &&
        res.body.data.cart.subtotal === 125000 &&
        res.body.data.summary.merged.length === 1,
      'E2. Merge guest cart into customer cart combines identical items'
    );

    const guestHashE2 = CartGuestService.hashGuestToken(guestTokenE1);
    const guestCheckE2 = await CartRepository.findCartByGuestTokenHash(guestHashE2);
    assert(guestCheckE2 === null, 'E2. Guest cart destroyed upon successful merge');

    // E3
    const guestTokenE3 = CartGuestService.generateGuestToken();
    await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 },
      undefined,
      { 'x-guest-cart-token': guestTokenE3 }
    );
    resetCarts();
    await request(
      'POST',
      '/api/v1/cart/items',
      { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 },
      undefined,
      { 'x-guest-cart-token': guestTokenE3 }
    );
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: guestTokenE3 }, customer1Token);
    assert(
      res.status === 200 && res.body.data.cart.items.length === 2 && res.body.data.cart.itemCount === 2 && res.body.data.cart.subtotal === 43000,
      'E3. Merge guest cart with distinct items adds all items and calculates combined total'
    );

    // E4
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: guestTokenE3 });
    assert(res.status === 401, 'E4. Merge unauthenticated request rejected with 401');

    // E5
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: 'invalid-token-format' }, customer1Token);
    assert(res.status === 400 && res.body.error.code === 'INVALID_GUEST_CART_TOKEN', 'E5. Merge with invalid token format rejected with 400');

    // ========================================================
    // CATEGORY F: SECURITY, IDOR & ISOLATION
    // ========================================================
    console.log('\n--- CATEGORY F: SECURITY, IDOR & ISOLATION ---');
    resetCarts();

    // Customer 2 adds item
    const c2AddRes = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer2Token);
    const c2ItemId = c2AddRes.body.data.items[0].id;

    // F1
    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 && res.body.data.itemCount === 0 && res.body.data.customerId !== customer2.id,
      'F1. Customer A cannot view or access Customer B cart'
    );

    // F2
    res = await request('PATCH', `/api/v1/cart/items/${c2ItemId}`, { quantity: 5 }, customer1Token);
    assert(
      res.status === 404 && res.body.error.code === 'CART_ITEM_NOT_FOUND',
      'F2. Customer A cannot modify Customer B cart item (IDOR Protected)'
    );

    // F3
    res = await request('DELETE', `/api/v1/cart/items/${c2ItemId}`, undefined, customer1Token);
    assert(
      res.status === 404 && res.body.error.code === 'CART_ITEM_NOT_FOUND',
      'F3. Customer A cannot delete Customer B cart item'
    );

    // F4
    const guestTokenFA = CartGuestService.generateGuestToken();
    const guestTokenFB = CartGuestService.generateGuestToken();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, undefined, {
      'x-guest-cart-token': guestTokenFA
    });
    res = await request('GET', '/api/v1/cart', undefined, undefined, { 'x-guest-cart-token': guestTokenFB });
    assert(res.status === 200 && res.body.data.itemCount === 0, 'F4. Guest A cannot access Guest B cart');

    // F5
    res = await request(
      'POST',
      '/api/v1/cart/items',
      {
        productId: simpleProduct.id,
        quantity: 1,
        price: 1,
        subtotal: 1,
        unitPrice: 1
      },
      customer1Token
    );
    assert(
      res.status === 200 && res.body.data.items[0].unitPrice === 25000 && res.body.data.subtotal === 25000,
      'F5. Client price and subtotal tampering are completely ignored'
    );

    // F6
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: guestTokenFA }, superAdminToken);
    assert(res.status === 401, 'F6. Admin token rejected on Customer Cart merge endpoint with 401');

    // F7
    res = await request('GET', '/api/v1/admin/carts/00000000-0000-0000-0000-000000000000', undefined, customer1Token);
    assert(res.status === 401, 'F7. Customer token rejected on Admin Cart endpoints with 401');

    // ========================================================
    // CATEGORY G: ADMIN CART INSPECTION & RBAC
    // ========================================================
    console.log('\n--- CATEGORY G: ADMIN CART INSPECTION & RBAC ---');
    resetCarts();

    const addAdminCheck = await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const cartIdG = addAdminCheck.body.data.id;

    // G1
    res = await request('GET', `/api/v1/admin/carts/${cartIdG}`, undefined, superAdminToken);
    assert(
      res.status === 200 && res.body.data.id === cartIdG && res.body.data.customerId === customer1.id && res.body.data.items.length === 1,
      'G1. Super Admin can inspect cart by ID with full item details'
    );

    // G2
    res = await request('GET', `/api/v1/admin/carts/${cartIdG}`, undefined, orderManagerToken);
    assert(
      res.status === 200 && res.body.data.id === cartIdG,
      'G2. Order Manager with cart.view permission can inspect cart by ID'
    );

    // G3
    res = await request('GET', `/api/v1/admin/carts/${cartIdG}`, undefined, catalogueManagerToken);
    assert(res.status === 403, 'G3. Catalogue Manager without cart.view rejected with 403 Forbidden');

    // G4
    res = await request('GET', '/api/v1/admin/carts/00000000-0000-0000-0000-000000000000', undefined, superAdminToken);
    assert(res.status === 404 && res.body.error.code === 'CART_NOT_FOUND', 'G4. Inspecting non-existent cart returns 404 CART_NOT_FOUND');

    // ========================================================
    // CATEGORY H: AUDIT LOGGING VERIFICATION
    // ========================================================
    console.log('\n--- CATEGORY H: AUDIT LOGGING VERIFICATION ---');

    const logs = prisma.adminAuditLog.findMany({
      where: { module: 'CART' }
    });
    assert(logs.length > 0, 'H1. Audit logs recorded for CART module operations');

    // ========================================================
    // CATEGORY I: MULTI-ITEM OPERATIONS & SUMMARY TOTALS
    // ========================================================
    console.log('\n--- CATEGORY I: MULTI-ITEM OPERATIONS & SUMMARY TOTALS ---');
    resetCarts();

    // I1. Add 3 distinct items
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token); // 2 * 25,000 = 50,000
    await request('POST', '/api/v1/cart/items', { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 }, customer1Token); // 1 * 18,000 = 18,000
    await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 1 }, customer1Token); // 1 * 450,000 = 450,000

    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.items.length === 3 &&
        res.body.data.itemCount === 4 &&
        res.body.data.subtotal === 518000 &&
        res.body.data.totals.grandTotal === 518000,
      'I1. Multi-item cart calculates accurate aggregate itemCount (4) and subtotal (₹5,18,000)'
    );

    // I2. Exclude unavailable item from subtotal while preserving available item totals
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'INACTIVE' } });
    res = await request('GET', '/api/v1/cart', undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.items.length === 3 &&
        res.body.data.itemCount === 2 && // Only 1 (Red variant) + 1 (Antique) are available
        res.body.data.subtotal === 468000,
      'I2. Multi-item subtotal automatically excludes inactive product line'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'ACTIVE' } });

    // ========================================================
    // CATEGORY J: ADVANCED MERGE WITH ADJUSTMENTS & REMOVALS
    // ========================================================
    console.log('\n--- CATEGORY J: ADVANCED MERGE WITH ADJUSTMENTS & REMOVALS ---');
    resetCarts();

    // Setup guest cart with:
    // 1. Inactive product (should be removed)
    // 2. Antique product (should be adjusted to 1 if combined)
    const guestTokenJ = CartGuestService.generateGuestToken();
    const guestTokenHashJ = CartGuestService.hashGuestToken(guestTokenJ);

    // Inactive product
    let inactiveProd = prisma.product.findUnique({ where: { slug: 'archived-painting-j' } });
    if (!inactiveProd) {
      inactiveProd = prisma.product.create({
        data: {
          name: 'Archived Painting',
          slug: 'archived-painting-j',
          sku: 'ART-ARC-001',
          status: 'INACTIVE',
          productType: 'SIMPLE',
          price: 5000,
          currency: 'INR',
          stockQuantity: 10,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    // Create guest cart directly in DB with inactive item and antique item
    const guestCartJ = await CartRepository.createGuestCart(guestTokenHashJ, CartPolicyService.getGuestCartExpirationDate());
    await CartRepository.createCartItem({
      cartId: guestCartJ.id,
      productId: inactiveProd.id,
      quantity: 1,
      lastSeenUnitPrice: 5000
    });
    await CartRepository.createCartItem({
      cartId: guestCartJ.id,
      productId: antiqueProduct.id,
      quantity: 1,
      lastSeenUnitPrice: 450000
    });

    // Customer already has 1 antique product in their cart
    await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 1 }, customer1Token);

    // Merge guest cart
    res = await request('POST', '/api/v1/cart/merge', { guestCartToken: guestTokenJ }, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.summary.removed.length === 1 &&
        res.body.data.summary.adjusted.length === 1 &&
        res.body.data.cart.items.length === 1 &&
        res.body.data.cart.items[0].quantity === 1,
      'J1. Merge correctly removes inactive items and caps antique quantity to 1 with detailed summary'
    );

    // ========================================================
    // CATEGORY K: DATABASE CASCADE INTEGRITY
    // ========================================================
    console.log('\n--- CATEGORY K: DATABASE CASCADE INTEGRITY ---');
    resetCarts();

    // Create temporary customer
    prisma.customer.deleteMany({ where: { email: 'temp.cust.cart@lagoreearts.com' } });
    const tempCust = prisma.customer.create({
      data: {
        email: 'temp.cust.cart@lagoreearts.com',
        normalizedEmail: 'temp.cust.cart@lagoreearts.com',
        passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
        firstName: 'Temp',
        lastName: 'User',
        status: 'ACTIVE'
      }
    });
    const tempToken = generateCustomerAccessToken({ sub: tempCust.id, email: tempCust.email });

    // Add item to temp customer cart
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, tempToken);
    const tempCart = await CartRepository.findCartByCustomerId(tempCust.id);
    assert(tempCart !== null, 'K1. Temporary customer cart created in DB');

    // Delete customer
    prisma.customer.delete({ where: { id: tempCust.id } });

    // Verify cart and items were cascade deleted
    const cartAfterDelete = await CartRepository.findCartById(tempCart!.id);
    const itemsAfterDelete = await CartRepository.findCartItemsByCartId(tempCart!.id);
    assert(
      cartAfterDelete === null && itemsAfterDelete.length === 0,
      'K1. Deleting customer cascades to delete cart and cart items'
    );

    // ========================================================
    // CATEGORY L: EXPIRED GUEST CARTS CLEANUP
    // ========================================================
    console.log('\n--- CATEGORY L: EXPIRED GUEST CARTS CLEANUP ---');
    resetCarts();

    // Create past expired guest cart
    const expiredGuestTokenHash = CartGuestService.hashGuestToken(CartGuestService.generateGuestToken());
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredCart = await CartRepository.createGuestCart(expiredGuestTokenHash, pastDate);

    // Create active guest cart
    const activeGuestTokenHash = CartGuestService.hashGuestToken(CartGuestService.generateGuestToken());
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const activeCart = await CartRepository.createGuestCart(activeGuestTokenHash, futureDate);

    // Run cleanup
    await CartRepository.deleteExpiredGuestCarts(new Date());

    const checkExpired = await CartRepository.findCartById(expiredCart.id);
    const checkActive = await CartRepository.findCartById(activeCart.id);
    assert(
      checkExpired === null && checkActive !== null,
      'L1. deleteExpiredGuestCarts cleans up expired guest carts while preserving active guest carts'
    );

    // ========================================================
    // FINAL TEST SUMMARY
    // ========================================================
    console.log('\n======================================================');
    console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (server) {
      server.close();
    }
  }
}

runCartTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  if (server) server.close();
  process.exit(1);
});
