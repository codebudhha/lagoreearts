import { createApp } from '../app.ts';
import { prisma } from '../database/prisma.ts';
import { runSeed } from '../prisma/seed.ts';
import { hashPassword } from '../security/password.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { CartGuestService } from '../modules/cart/cart-guest.service.ts';
import { CartPolicyService } from '../modules/cart/cart-policy.service.ts';
import { CartRepository } from '../modules/cart/cart.repository.ts';
import { CheckoutService } from '../modules/checkout/checkout.service.ts';
import { CheckoutPolicyService } from '../modules/checkout/checkout-policy.service.ts';
import { CheckoutPricingService } from '../modules/checkout/checkout-pricing.service.ts';
import { CheckoutRepository } from '../modules/checkout/checkout.repository.ts';
import http from 'node:http';

const TEST_PORT = 5019;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken: string;
let orderManagerToken: string;
let catalogueManagerToken: string;

let customer1: any;
let customer2: any;
let customer1Token: string;
let customer2Token: string;

let simpleProduct: any;
let variableProduct: any;
let variantRed: any;
let variantGold: any;
let antiqueProduct: any;

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, meta?: any) {
  if (condition) {
    console.log(`  ✔ ${testName}`);
    passed++;
  } else {
    console.error(`  ✖ ${testName}`);
    if (meta) console.error('    Details:', JSON.stringify(meta, null, 2));
    failed++;
  }
}

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {})
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
          let parsed: any = {};
          try {
            parsed = resData ? JSON.parse(resData) : {};
          } catch (e) {
            parsed = { raw: resData };
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

function resetCartsAndCheckouts() {
  prisma.checkoutAddress.deleteMany({});
  prisma.checkoutItem.deleteMany({});
  prisma.checkoutSession.deleteMany({});
  prisma.cartItem.deleteMany({});
  prisma.cart.deleteMany({});
}

async function runCheckoutTests() {
  console.log('\n======================================================');
  console.log(' MODULE 19: CHECKOUT SYSTEM TEST SUITE');
  console.log('======================================================\n');

  try {
    const app = createApp();
    server = app.listen(TEST_PORT);
    runSeed();

    // 1. Setup Admin Users
    const superAdminRole = prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    const orderManagerRole = prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
    const catalogueManagerRole = prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });

    let superAdmin = prisma.adminUser.findUnique({ where: { email: 'superadmin.checkout@lagoreearts.com' } });
    if (!superAdmin) {
      superAdmin = prisma.adminUser.create({
        data: {
          email: 'superadmin.checkout@lagoreearts.com',
          name: 'Super Admin Checkout',
          passwordHash: await hashPassword('AdminPass@2026'),
          roleId: superAdminRole.id,
          status: 'ACTIVE'
        }
      });
    }
    superAdminToken = generateAccessToken({ sub: superAdmin.id, email: superAdmin.email, role: 'SUPER_ADMIN', permissions: ['*'] });

    let orderManager = prisma.adminUser.findUnique({ where: { email: 'ordermanager.checkout@lagoreearts.com' } });
    if (!orderManager) {
      orderManager = prisma.adminUser.create({
        data: {
          email: 'ordermanager.checkout@lagoreearts.com',
          name: 'Order Manager Checkout',
          passwordHash: await hashPassword('AdminPass@2026'),
          roleId: orderManagerRole.id,
          status: 'ACTIVE'
        }
      });
    }
    orderManagerToken = generateAccessToken({ sub: orderManager.id, email: orderManager.email, role: 'ORDER_MANAGER', permissions: ['checkout.view', 'order.view'] });

    let catalogueManager = prisma.adminUser.findUnique({ where: { email: 'catmanager.checkout@lagoreearts.com' } });
    if (!catalogueManager) {
      catalogueManager = prisma.adminUser.create({
        data: {
          email: 'catmanager.checkout@lagoreearts.com',
          name: 'Cat Manager Checkout',
          passwordHash: await hashPassword('AdminPass@2026'),
          roleId: catalogueManagerRole.id,
          status: 'ACTIVE'
        }
      });
    }
    catalogueManagerToken = generateAccessToken({ sub: catalogueManager.id, email: catalogueManager.email, role: 'CATALOGUE_MANAGER', permissions: ['product.view'] });

    // 2. Setup Patron Customers
    customer1 = prisma.customer.findUnique({ where: { email: 'patron1.checkout@lagoreearts.com' } });
    if (!customer1) {
      customer1 = prisma.customer.create({
        data: {
          email: 'patron1.checkout@lagoreearts.com',
          normalizedEmail: 'patron1.checkout@lagoreearts.com',
          passwordHash: await hashPassword('CustomerPass@2026'),
          firstName: 'Vikram',
          lastName: 'Mehta',
          status: 'ACTIVE'
        }
      });
    }
    customer1Token = generateCustomerAccessToken({ sub: customer1.id, email: customer1.email });

    customer2 = prisma.customer.findUnique({ where: { email: 'patron2.checkout@lagoreearts.com' } });
    if (!customer2) {
      customer2 = prisma.customer.create({
        data: {
          email: 'patron2.checkout@lagoreearts.com',
          normalizedEmail: 'patron2.checkout@lagoreearts.com',
          passwordHash: await hashPassword('CustomerPass@2026'),
          firstName: 'Ananya',
          lastName: 'Roy',
          status: 'ACTIVE'
        }
      });
    }
    customer2Token = generateCustomerAccessToken({ sub: customer2.id, email: customer2.email });

    // Setup Customer 1 Saved Addresses
    prisma.customerAddress.deleteMany({ where: { customerId: customer1.id } });
    const cust1ShippingAddr = prisma.customerAddress.create({
      data: {
        customerId: customer1.id,
        type: 'HOME',
        firstName: 'Vikram',
        lastName: 'Mehta',
        addressLine1: 'Flat 402, Royal Palms',
        addressLine2: 'Juhu Tara Road',
        landmark: 'Near Sea Princess',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400049',
        country: 'INDIA',
        phone: '9876543210',
        isDefaultShipping: true,
        isDefaultBilling: false
      }
    });

    const cust1BillingAddr = prisma.customerAddress.create({
      data: {
        customerId: customer1.id,
        type: 'OFFICE',
        firstName: 'Vikram',
        lastName: 'Mehta',
        companyName: 'Mehta Enterprises',
        addressLine1: 'B-Wing, BKC Plaza',
        addressLine2: 'Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        country: 'INDIA',
        phone: '9876543210',
        isDefaultShipping: false,
        isDefaultBilling: true
      }
    });

    // 3. Setup Catalog Products
    let cat = prisma.category.findFirst({ where: { slug: 'fine-art-checkout' } });
    if (!cat) {
      cat = prisma.category.create({
        data: {
          name: 'Fine Art Checkout',
          slug: 'fine-art-checkout',
          status: 'ACTIVE'
        }
      });
    }

    simpleProduct = prisma.product.findUnique({ where: { slug: 'tanjore-gold-checkout' } });
    if (!simpleProduct) {
      simpleProduct = prisma.product.create({
        data: {
          name: 'Tanjore Gold Ganesha Masterwork',
          slug: 'tanjore-gold-checkout',
          sku: 'ART-TNJ-CHK',
          status: 'ACTIVE',
          productType: 'SIMPLE',
          price: 25000,
          currency: 'INR',
          stockQuantity: 15,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    variableProduct = prisma.product.findUnique({ where: { slug: 'rajasthani-miniature-checkout' } });
    if (!variableProduct) {
      variableProduct = prisma.product.create({
        data: {
          name: 'Royal Procession Miniature',
          slug: 'rajasthani-miniature-checkout',
          sku: 'ART-RAJ-CHK',
          status: 'ACTIVE',
          productType: 'VARIABLE',
          price: 15000,
          currency: 'INR',
          stockQuantity: 10,
          trackInventory: true,
          allowBackorder: false,
          categoryId: cat.id
        }
      });
    }

    variantRed = prisma.productVariant.findUnique({ where: { sku: 'ART-RAJ-CHK-RED' } });
    if (!variantRed) {
      variantRed = prisma.productVariant.create({
        data: {
          productId: variableProduct.id,
          sku: 'ART-RAJ-CHK-RED',
          status: 'ACTIVE',
          price: 18000,
          stockQuantity: 5,
          trackInventory: true,
          allowBackorder: false
        }
      });
    }

    variantGold = prisma.productVariant.findUnique({ where: { sku: 'ART-RAJ-CHK-GLD' } });
    if (!variantGold) {
      variantGold = prisma.productVariant.create({
        data: {
          productId: variableProduct.id,
          sku: 'ART-RAJ-CHK-GLD',
          status: 'ACTIVE',
          price: null,
          stockQuantity: 8,
          trackInventory: true,
          allowBackorder: false
        }
      });
    }

    antiqueProduct = prisma.product.findUnique({ where: { slug: 'chola-nataraja-bronze-checkout' } });
    if (!antiqueProduct) {
      antiqueProduct = prisma.product.create({
        data: {
          name: '12th Century Chola Nataraja Bronze',
          slug: 'chola-nataraja-bronze-checkout',
          sku: 'ANT-CHO-CHK',
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
          era: 'Chola Dynasty',
          period: '12th Century',
          origin: 'Thanjavur, Tamil Nadu',
          isOneOfAKind: true
        }
      });
    }

    let res: any;

    // ========================================================
    // CATEGORY A: CHECKOUT CREATION (CUSTOMER & GUEST)
    // ========================================================
    console.log('\n--- CATEGORY A: CHECKOUT CREATION (CUSTOMER & GUEST) ---');
    resetCartsAndCheckouts();

    // A1. Empty cart checkout rejected
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    assert(res.status === 409 && res.body.error.code === 'CHECKOUT_CART_EMPTY', 'A1. Empty customer cart rejected with 409 CHECKOUT_CART_EMPTY');

    // Guest empty cart
    const guestToken1 = CartGuestService.generateGuestToken();
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'guest@example.com',
        shippingAddress: {
          firstName: 'Guest',
          lastName: 'Shopper',
          addressLine1: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          phone: '9999988888'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestToken1 }
    );
    assert(res.status === 409 && res.body.error.code === 'CHECKOUT_CART_EMPTY', 'A1. Empty guest cart rejected with 409 CHECKOUT_CART_EMPTY');

    // Add item to Customer 1 Cart
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);

    // A3. Create Customer Checkout with default addresses
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    assert(
      res.status === 201 &&
        res.body.data.status === 'ACTIVE' &&
        res.body.data.customerId === customer1.id &&
        res.body.data.email === customer1.email &&
        res.body.data.items.length === 1 &&
        res.body.data.items[0].unitPrice === 25000 &&
        res.body.data.items[0].quantity === 2 &&
        res.body.data.totals.subtotal === 50000 &&
        res.body.data.totals.grandTotal === 50000,
      'A3. Authenticated customer checkout creates ACTIVE session with accurate totals (₹50,000)'
    );
    const checkout1Id = res.body.data.id;

    // Verify 30-minute expiration
    const expiryDiff = (new Date(res.body.data.expiresAt).getTime() - Date.now()) / (60 * 1000);
    assert(expiryDiff >= 28 && expiryDiff <= 31, 'A3. Checkout session initialized with 30-minute TTL');

    // A4. Guest Checkout Creation
    const guestTokenA = CartGuestService.generateGuestToken();
    await request('POST', '/api/v1/cart/items', { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 }, undefined, { 'x-guest-cart-token': guestTokenA });

    // A5. Guest without email rejected
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        shippingAddress: {
          firstName: 'Guest',
          lastName: 'Shopper',
          addressLine1: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          phone: '9999988888'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenA }
    );
    assert(res.status === 400 && res.body.error.code === 'GUEST_EMAIL_REQUIRED', 'A5. Guest checkout without email rejected with 400 GUEST_EMAIL_REQUIRED');

    // A6. Guest with invalid email rejected
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'invalid-email-format',
        shippingAddress: {
          firstName: 'Guest',
          lastName: 'Shopper',
          addressLine1: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          phone: '9999988888'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenA }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_EMAIL', 'A6. Guest checkout with invalid email rejected with 400 INVALID_EMAIL');

    // A7. Guest without shipping address rejected
    res = await request(
      'POST',
      '/api/v1/checkout',
      { email: 'guest.patron@example.com' },
      undefined,
      { 'x-guest-cart-token': guestTokenA }
    );
    assert(res.status === 400 && res.body.error.code === 'SHIPPING_ADDRESS_REQUIRED', 'A7. Guest checkout without shipping address rejected with 400 SHIPPING_ADDRESS_REQUIRED');

    // A4. Valid Guest Checkout
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'guest.patron@example.com',
        shippingAddress: {
          firstName: 'Ramesh',
          lastName: 'Gupta',
          addressLine1: 'Sector 15, Golf Course Road',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          phone: '9811122233'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenA }
    );
    assert(
      res.status === 201 &&
        res.body.data.status === 'ACTIVE' &&
        res.body.data.customerId === null &&
        res.body.data.email === 'guest.patron@example.com' &&
        res.body.data.shippingAddress.postalCode === '122002' &&
        res.body.data.totals.subtotal === 18000,
      'A4. Valid guest checkout session created with verified guest address snapshot and totals (₹18,000)'
    );

    // A12. Creating a new checkout cancels previous active checkout for same cart
    const priorCheckout = await CheckoutRepository.findCheckoutById(checkout1Id);
    assert(priorCheckout?.status === 'ACTIVE', 'A12. Initial customer checkout was ACTIVE');

    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const newCheckoutId = res.body.data.id;
    const oldCheckoutCheck = await CheckoutRepository.findCheckoutById(checkout1Id);
    assert(
      newCheckoutId !== checkout1Id && oldCheckoutCheck?.status === 'CANCELLED',
      'A12. New checkout creation automatically cancels prior ACTIVE checkout for same cart'
    );

    // ========================================================
    // CATEGORY B: IMMUTABLE ITEM & ADDRESS SNAPSHOTS
    // ========================================================
    console.log('\n--- CATEGORY B: IMMUTABLE ITEM & ADDRESS SNAPSHOTS ---');
    resetCartsAndCheckouts();

    // Create Customer Cart and Checkout
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const snapshotSessionId = res.body.data.id;

    // B1. Verify Snapshot details
    assert(
      res.body.data.items[0].productName === 'Tanjore Gold Ganesha Masterwork' &&
        res.body.data.items[0].sku === 'ART-TNJ-CHK' &&
        res.body.data.items[0].unitPrice === 25000 &&
        res.body.data.shippingAddress.addressLine1 === 'Flat 402, Royal Palms',
      'B1. CheckoutItem and CheckoutAddress snapshots correctly captured'
    );

    // B2. Mutate catalogue Product title and price
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { name: 'MUTATED PRODUCT NAME', price: 99999 }
    });

    // B3. Mutate source CustomerAddress
    prisma.customerAddress.update({
      where: { id: cust1ShippingAddr.id },
      data: { addressLine1: 'MUTATED CUSTOMER ADDRESS STREET' }
    });

    // Check Checkout session snapshot
    res = await request('GET', `/api/v1/checkout/${snapshotSessionId}`, undefined, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.items[0].productName === 'Tanjore Gold Ganesha Masterwork' &&
        res.body.data.items[0].unitPrice === 25000 &&
        res.body.data.shippingAddress.addressLine1 === 'Flat 402, Royal Palms',
      'B2-B6. Checkout session snapshot is strictly immutable against catalogue and customer address mutations'
    );

    // Restore Product & Address
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { name: 'Tanjore Gold Ganesha Masterwork', price: 25000 }
    });
    prisma.customerAddress.update({
      where: { id: cust1ShippingAddr.id },
      data: { addressLine1: 'Flat 402, Royal Palms' }
    });

    // ========================================================
    // CATEGORY C: PRICING ENGINE, DECIMAL PRECISION & TAMPERING
    // ========================================================
    console.log('\n--- CATEGORY C: PRICING ENGINE, DECIMAL PRECISION & TAMPERING ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token); // 2 * 25,000 = 50,000
    await request('POST', '/api/v1/cart/items', { productId: variableProduct.id, variantId: variantRed.id, quantity: 1 }, customer1Token); // 1 * 18,000 = 18,000

    // C4. Tampering attempt with client injected prices, discounts, subtotal, grandTotal
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        price: 1,
        subtotal: 10,
        discountTotal: 50000,
        shippingTotal: -100,
        taxTotal: 0,
        grandTotal: 1
      },
      customer1Token
    );

    assert(
      res.status === 201 &&
        res.body.data.totals.subtotal === 68000 &&
        res.body.data.totals.discountTotal === 0 &&
        res.body.data.totals.shippingTotal === 0 &&
        res.body.data.totals.taxTotal === 0 &&
        res.body.data.totals.grandTotal === 68000,
      'C1-C4. Client-injected price/subtotal/discount tampering is completely ignored (Server calculates ₹68,000)'
    );

    // ========================================================
    // CATEGORY D: CART RECONCILIATION & CATALOGUE GATING
    // ========================================================
    console.log('\n--- CATEGORY D: CART RECONCILIATION & CATALOGUE GATING ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);

    // D1. Deactivate product
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'INACTIVE' } });
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    assert(
      res.status === 409 && res.body.error.code === 'CHECKOUT_ITEMS_UNAVAILABLE',
      'D1. Cart containing inactive product rejected at checkout creation with 409 CHECKOUT_ITEMS_UNAVAILABLE'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'ACTIVE' } });

    // D3. Out of stock check
    prisma.product.update({ where: { id: simpleProduct.id }, data: { stockQuantity: 0 } });
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    assert(
      res.status === 409 && res.body.error.code === 'CHECKOUT_ITEMS_UNAVAILABLE',
      'D3. Cart containing out-of-stock item rejected at checkout creation'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { stockQuantity: 15 } });

    // ========================================================
    // CATEGORY E: ADDRESS MANAGEMENT & VALIDATION RULES
    // ========================================================
    console.log('\n--- CATEGORY E: ADDRESS MANAGEMENT & VALIDATION RULES ---');
    resetCartsAndCheckouts();

    const guestTokenE = CartGuestService.generateGuestToken();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, undefined, { 'x-guest-cart-token': guestTokenE });

    // E1. Indian PIN Code validation
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'pin.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '056001', // Invalid: starts with 0
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_POSTAL_CODE', 'E1. PIN starting with 0 rejected with 400 INVALID_POSTAL_CODE');

    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'pin.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '5600', // Invalid: 4 digits
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_POSTAL_CODE', 'E1. 4-digit PIN rejected with 400 INVALID_POSTAL_CODE');

    // E2. Phone validation
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'phone.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '123' // Invalid phone
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_PHONE_NUMBER', 'E2. Short invalid phone number rejected with 400 INVALID_PHONE_NUMBER');

    // E4. PATCH /api/v1/checkout/:id/addresses
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const checkoutCreateE = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const checkoutIdE = checkoutCreateE.body.data.id;

    res = await request(
      'PATCH',
      `/api/v1/checkout/${checkoutIdE}/addresses`,
      {
        shippingAddress: {
          firstName: 'Vikram',
          lastName: 'Mehta Updated',
          addressLine1: 'Penthouse 901, Horizon Towers',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          phone: '9876543210'
        }
      },
      customer1Token
    );
    assert(
      res.status === 200 &&
        res.body.data.shippingAddress.addressLine1 === 'Penthouse 901, Horizon Towers' &&
        res.body.data.shippingAddress.postalCode === '400050',
      'E4. PATCH addresses updates checkout shipping address snapshot'
    );

    // E6. Customer selecting Customer 2 address ID rejected
    const cust2Addr = prisma.customerAddress.create({
      data: {
        customerId: customer2.id,
        type: 'HOME',
        firstName: 'Ananya',
        lastName: 'Roy',
        addressLine1: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        postalCode: '700016',
        phone: '9830011223'
      }
    });

    res = await request(
      'PATCH',
      `/api/v1/checkout/${checkoutIdE}/addresses`,
      { shippingAddressId: cust2Addr.id },
      customer1Token
    );
    assert(res.status === 404 && res.body.error.code === 'ADDRESS_NOT_FOUND', 'E6. Customer selecting another customer address rejected with 404 (IDOR protected)');

    // ========================================================
    // CATEGORY F: RECALCULATION & CATALOGUE PRICE DRIFT
    // ========================================================
    console.log('\n--- CATEGORY F: RECALCULATION & CATALOGUE PRICE DRIFT ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);
    const chkF = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const checkoutIdF = chkF.body.data.id;
    assert(chkF.body.data.totals.subtotal === 50000, 'F. Initial checkout subtotal is ₹50,000 (2 × ₹25,000)');

    // Update catalogue price from 25,000 to 30,000
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { price: 30000 }
    });

    // F1 & F2. Recalculate
    res = await request('POST', `/api/v1/checkout/${checkoutIdF}/recalculate`, {}, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.totals.subtotal === 60000 &&
        res.body.data.items[0].unitPrice === 30000 &&
        res.body.data.warnings.length === 1 &&
        res.body.data.warnings[0].code === 'PRICE_CHANGED',
      'F1-F3. Recalculate updates snapshot prices to latest catalogue rate (₹60,000) and emits PRICE_CHANGED warning'
    );

    // Restore product price
    prisma.product.update({
      where: { id: simpleProduct.id },
      data: { price: 25000 }
    });

    // ========================================================
    // CATEGORY G: CHECKOUT VALIDATION ENDPOINT
    // ========================================================
    console.log('\n--- CATEGORY G: CHECKOUT VALIDATION ENDPOINT ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkG = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const checkoutIdG = chkG.body.data.id;

    // G1. Healthy validation
    res = await request('POST', `/api/v1/checkout/${checkoutIdG}/validate`, {}, customer1Token);
    assert(
      res.status === 200 && res.body.data.valid === true && res.body.data.blockingIssues.length === 0,
      'G1. POST /api/v1/checkout/:id/validate returns valid=true for healthy active checkout'
    );

    // G4. Product deactivated after checkout creation
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'INACTIVE' } });
    res = await request('POST', `/api/v1/checkout/${checkoutIdG}/validate`, {}, customer1Token);
    assert(
      res.status === 200 && res.body.data.valid === false && res.body.data.blockingIssues.length === 1,
      'G4. Validation detects deactivated product and flags blocking issue'
    );
    prisma.product.update({ where: { id: simpleProduct.id }, data: { status: 'ACTIVE' } });

    // ========================================================
    // CATEGORY H: CHECKOUT COMPLETION & STATE MACHINE
    // ========================================================
    console.log('\n--- CATEGORY H: CHECKOUT COMPLETION & STATE MACHINE ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkH = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const checkoutIdH = chkH.body.data.id;

    // H1. Complete active checkout
    res = await request('POST', `/api/v1/checkout/${checkoutIdH}/complete`, {}, customer1Token);
    assert(
      res.status === 200 &&
        res.body.data.status === 'COMPLETED' &&
        res.body.data.completedAt !== null,
      'H1. POST /api/v1/checkout/:id/complete transitions status to COMPLETED'
    );

    // H2. Complete on already completed checkout is idempotent
    res = await request('POST', `/api/v1/checkout/${checkoutIdH}/complete`, {}, customer1Token);
    assert(
      res.status === 200 && res.body.data.status === 'COMPLETED',
      'H2. Completing already completed checkout returns 200 OK idempotently'
    );

    // F4. Recalculate on COMPLETED checkout rejected
    res = await request('POST', `/api/v1/checkout/${checkoutIdH}/recalculate`, {}, customer1Token);
    assert(
      res.status === 400 && res.body.error.code === 'CHECKOUT_ALREADY_COMPLETED',
      'F4. Recalculating COMPLETED checkout rejected with 400 CHECKOUT_ALREADY_COMPLETED'
    );

    // H7. Cancel active checkout test
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkCancel = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const cancelId = chkCancel.body.data.id;

    res = await request('POST', `/api/v1/checkout/${cancelId}/cancel`, {}, customer1Token);
    assert(
      res.status === 200 && res.body.data.status === 'CANCELLED',
      'H7. POST /api/v1/checkout/:id/cancel marks session CANCELLED'
    );

    // H4. Complete on CANCELLED checkout rejected
    res = await request('POST', `/api/v1/checkout/${cancelId}/complete`, {}, customer1Token);
    assert(
      res.status === 400 && res.body.error.code === 'CHECKOUT_CANCELLED',
      'H4. Completing CANCELLED checkout rejected with 400 CHECKOUT_CANCELLED'
    );

    // ========================================================
    // CATEGORY I: EXPIRATION & STALE SESSION CLEANUP
    // ========================================================
    console.log('\n--- CATEGORY I: EXPIRATION & STALE SESSION CLEANUP ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkExp = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const expId = chkExp.body.data.id;

    // Manually backdate expiration to the past
    const pastDate = new Date(Date.now() - 1000 * 60 * 60);
    prisma.checkoutSession.update({
      where: { id: expId },
      data: { expiresAt: pastDate }
    });

    // I1. Accessing expired checkout returns status EXPIRED
    res = await request('GET', `/api/v1/checkout/${expId}`, undefined, customer1Token);
    assert(
      res.status === 200 && res.body.data.status === 'EXPIRED',
      'I1. Accessing past-expiry checkout auto-transitions status to EXPIRED'
    );

    // H3. Complete on EXPIRED checkout rejected
    res = await request('POST', `/api/v1/checkout/${expId}/complete`, {}, customer1Token);
    assert(
      res.status === 400 && res.body.error.code === 'CHECKOUT_EXPIRED',
      'H3. Completing EXPIRED checkout rejected with 400 CHECKOUT_EXPIRED'
    );

    // ========================================================
    // CATEGORY J: IDEMPOTENCY & REPLAY PROTECTION
    // ========================================================
    console.log('\n--- CATEGORY J: IDEMPOTENCY & REPLAY PROTECTION ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const idemKey = 'idem-checkout-test-key-12345';

    // J1. Duplicate create with same idempotency key
    const res1 = await request('POST', '/api/v1/checkout', { idempotencyKey: idemKey }, customer1Token);
    const res2 = await request('POST', '/api/v1/checkout', { idempotencyKey: idemKey }, customer1Token);

    assert(
      res1.status === 201 && res2.status === 201 && res1.body.data.id === res2.body.data.id,
      'J1. Replayed checkout creation with same idempotency key returns existing checkout session'
    );

    // ========================================================
    // CATEGORY K: SECURITY, ISOLATION & IDOR PROTECTION
    // ========================================================
    console.log('\n--- CATEGORY K: SECURITY, ISOLATION & IDOR PROTECTION ---');
    resetCartsAndCheckouts();

    // Customer 1 creates checkout
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkSec1 = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const chkSec1Id = chkSec1.body.data.id;

    // Customer 2 creates checkout
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer2Token);
    const chkSec2 = await request('POST', '/api/v1/checkout', {}, customer2Token);
    const chkSec2Id = chkSec2.body.data.id;

    // K1. Customer 1 cannot GET Customer 2 checkout
    res = await request('GET', `/api/v1/checkout/${chkSec2Id}`, undefined, customer1Token);
    assert(res.status === 404, 'K1. Customer 1 cannot GET Customer 2 checkout (404 IDOR protected)');

    // K2. Customer 1 cannot PATCH Customer 2 addresses
    res = await request('PATCH', `/api/v1/checkout/${chkSec2Id}/addresses`, { shippingAddressId: cust1ShippingAddr.id }, customer1Token);
    assert(res.status === 404, 'K2. Customer 1 cannot modify Customer 2 checkout addresses');

    // K3. Customer 1 cannot recalculate Customer 2 checkout
    res = await request('POST', `/api/v1/checkout/${chkSec2Id}/recalculate`, {}, customer1Token);
    assert(res.status === 404, 'K3. Customer 1 cannot recalculate Customer 2 checkout');

    // K5. Customer 1 cannot complete Customer 2 checkout
    res = await request('POST', `/api/v1/checkout/${chkSec2Id}/complete`, {}, customer1Token);
    assert(res.status === 404, 'K5. Customer 1 cannot complete Customer 2 checkout');

    // K6. Customer 1 cannot cancel Customer 2 checkout
    res = await request('POST', `/api/v1/checkout/${chkSec2Id}/cancel`, {}, customer1Token);
    assert(res.status === 404, 'K6. Customer 1 cannot cancel Customer 2 checkout');

    // K7. Guest A cannot access Guest B checkout
    const guestToken1K = CartGuestService.generateGuestToken();
    const guestToken2K = CartGuestService.generateGuestToken();
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, undefined, { 'x-guest-cart-token': guestToken1K });
    const guestChk1 = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'guest1k@example.com',
        shippingAddress: {
          firstName: 'Guest1',
          lastName: 'User',
          addressLine1: 'Main St',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestToken1K }
    );
    const guestChk1Id = guestChk1.body.data.id;

    res = await request('GET', `/api/v1/checkout/${guestChk1Id}`, undefined, undefined, { 'x-guest-cart-token': guestToken2K });
    assert(res.status === 404, 'K7. Guest 2 cannot access Guest 1 checkout (404 IDOR protected)');

    // K8. Admin token rejected on Customer Checkout endpoint
    res = await request('GET', `/api/v1/checkout/${chkSec1Id}`, undefined, superAdminToken);
    assert(res.status === 404 || res.status === 401, 'K8. Admin token cannot access Customer Checkout session (IDOR safe 404 / 401)');

    // K9. Customer token rejected on Admin Checkout endpoints
    res = await request('GET', `/api/v1/admin/checkout/${chkSec1Id}`, undefined, customer1Token);
    assert(res.status === 401, 'K9. Customer token rejected on Admin Checkout endpoints with 401');

    // ========================================================
    // CATEGORY L: MODULE 20 ORDER MODULE CONSUMER CONTRACT
    // ========================================================
    console.log('\n--- CATEGORY L: MODULE 20 ORDER MODULE CONSUMER CONTRACT ---');
    resetCartsAndCheckouts();

    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 2 }, customer1Token);
    const chkL = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const checkoutIdL = chkL.body.data.id;

    // L2. getCompletedCheckoutForOrder on active checkout throws 400
    const checkoutService = new CheckoutService();
    let contractError: any = null;
    try {
      await checkoutService.getCompletedCheckoutForOrder(checkoutIdL);
    } catch (e: any) {
      contractError = e;
    }
    assert(
      contractError && contractError.statusCode === 400 && contractError.code === 'CHECKOUT_NOT_COMPLETED',
      'L2. getCompletedCheckoutForOrder on non-completed checkout rejected with 400 CHECKOUT_NOT_COMPLETED'
    );

    // Complete the checkout
    await request('POST', `/api/v1/checkout/${checkoutIdL}/complete`, {}, customer1Token);

    // L1. Retrieve Order contract
    const orderContract = await checkoutService.getCompletedCheckoutForOrder(checkoutIdL);
    assert(
      orderContract &&
        orderContract.checkoutId === checkoutIdL &&
        orderContract.status === 'COMPLETED' &&
        orderContract.email === customer1.email &&
        orderContract.items.length === 1 &&
        orderContract.items[0].sku === 'ART-TNJ-CHK' &&
        orderContract.items[0].unitPrice === 25000 &&
        orderContract.items[0].quantity === 2 &&
        orderContract.subtotal === 50000 &&
        orderContract.grandTotal === 50000 &&
        orderContract.shippingAddress.postalCode === '400049' &&
        orderContract.billingAddress.postalCode === '400051',
      'L1-L3. getCompletedCheckoutForOrder returns complete immutable snapshot contract for Module 20'
    );

    // ========================================================
    // CATEGORY M: ADMIN CHECKOUT INSPECTION & RBAC
    // ========================================================
    console.log('\n--- CATEGORY M: ADMIN CHECKOUT INSPECTION & RBAC ---');

    // M1. Super Admin inspect checkout
    res = await request('GET', `/api/v1/admin/checkout/${checkoutIdL}`, undefined, superAdminToken);
    assert(
      res.status === 200 && res.body.data.id === checkoutIdL && res.body.data.customerId === customer1.id,
      'M1. Super Admin can inspect checkout session by ID with full item details'
    );

    // M2. Order Manager inspect checkout
    res = await request('GET', `/api/v1/admin/checkout/${checkoutIdL}`, undefined, orderManagerToken);
    assert(
      res.status === 200 && res.body.data.id === checkoutIdL,
      'M2. Order Manager with checkout.view permission can inspect checkout by ID'
    );

    // M3. Catalogue Manager without checkout.view rejected
    res = await request('GET', `/api/v1/admin/checkout/${checkoutIdL}`, undefined, catalogueManagerToken);
    assert(
      res.status === 403,
      'M3. Catalogue Manager without checkout.view rejected with 403 Forbidden'
    );

    // M4. Inspecting non-existent checkout
    res = await request('GET', '/api/v1/admin/checkout/00000000-0000-0000-0000-000000000000', undefined, superAdminToken);
    assert(
      res.status === 404 && res.body.error.code === 'CHECKOUT_NOT_FOUND',
      'M4. Inspecting non-existent checkout returns 404 CHECKOUT_NOT_FOUND'
    );

    // D6. One-of-a-kind antique item in cart
    resetCartsAndCheckouts();
    await request('POST', '/api/v1/cart/items', { productId: antiqueProduct.id, quantity: 1 }, customer1Token);
    res = await request('POST', '/api/v1/checkout', {}, customer1Token);
    assert(
      res.status === 201 && res.body.data.items[0].productName === '12th Century Chola Nataraja Bronze',
      'D6. Unique antique product checkout creation succeeds for quantity 1'
    );

    // E3. Invalid address field tests
    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'addr.test@example.com',
        shippingAddress: {
          firstName: '',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_ADDRESS_FIRST_NAME', 'E3. Empty first name rejected with 400 INVALID_ADDRESS_FIRST_NAME');

    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'addr.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: '',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_ADDRESS_LAST_NAME', 'E3. Empty last name rejected with 400 INVALID_ADDRESS_LAST_NAME');

    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'addr.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'A',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_ADDRESS_LINE1', 'E3. Short address line 1 rejected with 400 INVALID_ADDRESS_LINE1');

    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'addr.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: '',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_ADDRESS_CITY', 'E3. Missing city rejected with 400 INVALID_ADDRESS_CITY');

    res = await request(
      'POST',
      '/api/v1/checkout',
      {
        email: 'addr.test@example.com',
        shippingAddress: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: '',
          postalCode: '560001',
          phone: '9876543210'
        }
      },
      undefined,
      { 'x-guest-cart-token': guestTokenE }
    );
    assert(res.status === 400 && res.body.error.code === 'INVALID_ADDRESS_STATE', 'E3. Missing state rejected with 400 INVALID_ADDRESS_STATE');

    // I2. Stale sessions background expiration
    const expiredCount = await CheckoutRepository.expireStaleSessions(new Date(Date.now() + 40 * 60 * 1000));
    assert(expiredCount >= 1, 'I2. CheckoutRepository.expireStaleSessions successfully expires past sessions in bulk');

    // J2. Idempotency on completion
    await request('POST', '/api/v1/cart/items', { productId: simpleProduct.id, quantity: 1 }, customer1Token);
    const chkIdem = await request('POST', '/api/v1/checkout', {}, customer1Token);
    const chkIdemId = chkIdem.body.data.id;
    const comp1 = await request('POST', `/api/v1/checkout/${chkIdemId}/complete`, {}, customer1Token, { 'idempotency-key': 'comp-key-999' });
    const comp2 = await request('POST', `/api/v1/checkout/${chkIdemId}/complete`, {}, customer1Token, { 'idempotency-key': 'comp-key-999' });
    assert(
      comp1.status === 200 && comp2.status === 200 && comp1.body.data.status === 'COMPLETED',
      'J2. Idempotent complete request with Idempotency-Key returns consistent completion'
    );

    // ========================================================
    // CATEGORY N: AUDIT LOGGING VERIFICATION
    // ========================================================
    console.log('\n--- CATEGORY N: AUDIT LOGGING VERIFICATION ---');

    const logs = prisma.adminAuditLog.findMany({
      where: { module: 'CHECKOUT' }
    });
    assert(logs.length > 0, 'N1. Audit logs recorded for CHECKOUT module operations');
    const actions = logs.map((l: any) => l.action);
    assert(actions.includes('CHECKOUT_CREATED'), 'N2. CHECKOUT_CREATED action logged in audit system');
    assert(actions.includes('CHECKOUT_COMPLETED'), 'N3. CHECKOUT_COMPLETED action logged in audit system');
    assert(actions.includes('CHECKOUT_CANCELLED'), 'N4. CHECKOUT_CANCELLED action logged in audit system');
    assert(actions.includes('CHECKOUT_ADDRESS_CHANGED'), 'N5. CHECKOUT_ADDRESS_CHANGED action logged in audit system');
    assert(actions.includes('CHECKOUT_RECALCULATED'), 'N6. CHECKOUT_RECALCULATED action logged in audit system');
    assert(actions.includes('CHECKOUT_VALIDATED'), 'N7. CHECKOUT_VALIDATED action logged in audit system');

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

runCheckoutTests().catch(err => {
  console.error('Fatal Checkout Test Runner Error:', err);
  if (server) server.close();
  process.exit(1);
});
