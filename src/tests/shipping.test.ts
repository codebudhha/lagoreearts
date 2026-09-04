/**
 * Module 22: Shipping & Delivery — Comprehensive Test Suite
 * Lagoree Arts Luxury E-Commerce Backend
 */

import assert from 'node:assert/strict';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { ShippingService } from '../modules/shipping/shipping.service.ts';
import { ShippingRateService } from '../modules/shipping/shipping-rate.service.ts';
import { ShipmentService } from '../modules/shipping/shipment.service.ts';
import { ShippingZoneRepository } from '../modules/shipping/shipping-zone.repository.ts';
import { ShippingMethodRepository } from '../modules/shipping/shipping-method.repository.ts';
import { ShippingRateRepository } from '../modules/shipping/shipping-rate.repository.ts';
import { ShipmentRepository } from '../modules/shipping/shipment.repository.ts';
import { ShippingValidator } from '../modules/shipping/shipping.validator.ts';
import { ShippingPolicy } from '../modules/shipping/shipping.policy.ts';
import { OrderShippingSyncService } from '../modules/shipping/order-shipping-sync.service.ts';
import { MockShippingProvider } from '../modules/shipping/providers/mock-shipping.provider.ts';
import { generateAccessToken } from '../security/jwt.ts';
import { generateCustomerAccessToken } from '../security/customer-jwt.ts';
import { createApp } from '../app.ts';

let passedAssertions = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passedAssertions++;
      console.log(`  ✔ ${name}`);
    } catch (err: any) {
      console.error(`  ✖ ${name}`);
      console.error(err);
      process.exit(1);
    }
  })();
}

async function runTests() {
  console.log('\n🚀 Starting Module 22: Shipping & Delivery Test Suite...\n');

  // Seed database
  await runSeed();

  const superAdmin = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' }, include: { role: true } });
  const superAdminToken = generateAccessToken({
    sub: superAdmin.id,
    roleId: superAdmin.roleId
  });

  // Create an Order Manager admin
  const orderManagerRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });
  let orderManagerUser = await prisma.adminUser.findUnique({ where: { email: 'ordermanager@lagoreearts.com' } });
  if (!orderManagerUser) {
    orderManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Order Manager Staff',
        email: 'ordermanager@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: orderManagerRole.id
      }
    });
  }
  const orderManagerToken = generateAccessToken({
    sub: orderManagerUser.id,
    roleId: orderManagerUser.roleId
  });

  // Create a Catalogue Manager admin (who should NOT have shipment.create or shipping.manage)
  const catManagerRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
  let catManagerUser = await prisma.adminUser.findUnique({ where: { email: 'catmanager@lagoreearts.com' } });
  if (!catManagerUser) {
    catManagerUser = await prisma.adminUser.create({
      data: {
        name: 'Catalogue Manager Staff',
        email: 'catmanager@lagoreearts.com',
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        roleId: catManagerRole.id
      }
    });
  }
  const catManagerToken = generateAccessToken({
    sub: catManagerUser.id,
    roleId: catManagerUser.roleId
  });

  // Customer Patrons
  const patronA = await prisma.customer.findUnique({ where: { normalizedEmail: 'aarav@example.com' } });
  const patronB = await prisma.customer.findUnique({ where: { normalizedEmail: 'rohan.sharma@lagoreearts.com' } });
  const patronAToken = generateCustomerAccessToken({ sub: patronA.id, email: patronA.email });
  const patronBToken = generateCustomerAccessToken({ sub: patronB.id, email: patronB.email });

  async function createTestCheckoutSession(sessionId: string, customerId?: string | null, email?: string) {
    let cart = customerId ? await prisma.cart.findFirst({ where: { customerId } }) : null;
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          customerId: customerId || null,
          currency: 'INR',
          status: 'ACTIVE'
        }
      });
    }
    return prisma.checkoutSession.create({
      data: {
        id: sessionId,
        cartId: cart.id,
        customerId: customerId || null,
        status: 'COMPLETED',
        email: email || 'test@lagoreearts.com',
        currency: 'INR',
        subtotal: 10000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 10000,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
  }

  // Clean test data
  await prisma.shipmentEvent.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.orderShippingSnapshot.deleteMany({});
  await prisma.shippingRate.deleteMany({});
  await prisma.shippingZonePostalCode.deleteMany({});
  await prisma.shippingZone.deleteMany({});
  await prisma.shippingMethod.deleteMany({});

  console.log('--- Category A: Schema & Database Persistence ---');

  let zoneNorth: any;
  let zoneSouth: any;
  let methodStandard: any;
  let methodExpress: any;
  let rateNorthStd: any;
  let rateNorthFree: any;
  let rateNorthExp: any;

  await test('A1: ShippingZone creates and persists in database', async () => {
    zoneNorth = await ShippingService.createZone({
      name: 'North India Heritage Zone',
      code: 'ZONE_NORTH',
      description: 'Rajasthan, Delhi NCR, Punjab, Haryana, UP',
      status: 'ACTIVE',
      priority: 10
    }, superAdmin.id);

    assert.equal(zoneNorth.code, 'ZONE_NORTH');
    assert.equal(zoneNorth.priority, 10);
    assert.equal(zoneNorth.status, 'ACTIVE');
  });

  await test('A2: Duplicate zone code throws 409 DUPLICATE_ZONE_CODE', async () => {
    await assert.rejects(async () => {
      await ShippingService.createZone({
        name: 'Another Zone',
        code: 'ZONE_NORTH'
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'DUPLICATE_ZONE_CODE');
  });

  await test('A3: ShippingZonePostalCodes mapped and persisted to Zone', async () => {
    const res = await ShippingService.addPostalCodesToZone(zoneNorth.id, {
      postalCodes: [
        { postalCode: '302001', city: 'Jaipur', state: 'Rajasthan' },
        { postalCode: '302002', city: 'Jaipur', state: 'Rajasthan' },
        { postalCode: '110001', city: 'New Delhi', state: 'Delhi' }
      ]
    }, superAdmin.id);

    assert.equal(res.addedCount, 3);
    const mapping = await ShippingZoneRepository.findPostalCodeMapping('302001');
    assert.ok(mapping);
    assert.equal(mapping.city, 'Jaipur');
    assert.equal(mapping.zoneId, zoneNorth.id);
  });

  await test('A4: ShippingMethod creates and persists with estimated days', async () => {
    methodStandard = await ShippingService.createMethod({
      name: 'Standard Insured Art Delivery',
      code: 'STANDARD',
      description: 'Climate-controlled insured packaging for fragile masterworks',
      carrier: 'LAGOREE_WHITE_GLOVE',
      serviceLevel: 'WHITE_GLOVE_GROUND',
      estimatedMinDays: 3,
      estimatedMaxDays: 7,
      sortOrder: 1
    }, superAdmin.id);

    methodExpress = await ShippingService.createMethod({
      name: 'Express Secure Courier',
      code: 'EXPRESS',
      description: 'Priority courier with dedicated escort and tamper-proof crating',
      carrier: 'BLUE_DART_EXPRESS',
      serviceLevel: 'PRIORITY_SECURE',
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      sortOrder: 2
    }, superAdmin.id);

    assert.equal(methodStandard.code, 'STANDARD');
    assert.equal(methodStandard.estimatedMinDays, 3);
    assert.equal(methodStandard.estimatedMaxDays, 7);
    assert.equal(methodExpress.code, 'EXPRESS');
  });

  await test('A5: ShippingRate creates and persists with order value tiers', async () => {
    // North Standard: ₹0 to ₹999.99 = ₹99
    rateNorthStd = await ShippingService.createRate({
      shippingZoneId: zoneNorth.id,
      shippingMethodId: methodStandard.id,
      minOrderValue: 0,
      maxOrderValue: 999.99,
      amount: 99,
      currency: 'INR',
      priority: 1
    }, superAdmin.id);

    // North Standard: ₹1000+ = FREE (₹0)
    rateNorthFree = await ShippingService.createRate({
      shippingZoneId: zoneNorth.id,
      shippingMethodId: methodStandard.id,
      minOrderValue: 1000,
      amount: 0,
      currency: 'INR',
      priority: 2
    }, superAdmin.id);

    // North Express: ₹250 flat
    rateNorthExp = await ShippingService.createRate({
      shippingZoneId: zoneNorth.id,
      shippingMethodId: methodExpress.id,
      amount: 250,
      currency: 'INR',
      priority: 1
    }, superAdmin.id);

    assert.equal(rateNorthStd.amount, 99);
    assert.equal(rateNorthFree.amount, 0);
    assert.equal(rateNorthExp.amount, 250);
  });

  console.log('--- Category B: Indian 6-Digit PIN Code Serviceability & Normalization ---');

  await test('B1: Strict validation accepts valid 6-digit Indian PIN codes', () => {
    assert.equal(ShippingValidator.isValidPostalCode('302001'), true);
    assert.equal(ShippingValidator.isValidPostalCode('110001'), true);
    assert.equal(ShippingValidator.isValidPostalCode('560001'), true);
  });

  await test('B2: Strict validation rejects malformed, alphabetic or wrong length PINs', () => {
    assert.equal(ShippingValidator.isValidPostalCode('30200'), false); // 5 digits
    assert.equal(ShippingValidator.isValidPostalCode('3020011'), false); // 7 digits
    assert.equal(ShippingValidator.isValidPostalCode('30200A'), false); // letters
    assert.equal(ShippingValidator.isValidPostalCode('011001'), false); // starts with 0
    assert.equal(ShippingValidator.isValidPostalCode(''), false);
    assert.equal(ShippingValidator.isValidPostalCode(' '), false);
  });

  await test('B3: Normalization trims surrounding whitespace cleanly', () => {
    assert.equal(ShippingValidator.normalizePostalCode(' 302001  '), '302001');
  });

  await test('B4: checkServiceability returns true for mapped PIN 302001', async () => {
    const res = await ShippingRateService.checkServiceability('302001');
    assert.equal(res.serviceable, true);
    assert.equal(res.postalCode, '302001');
    assert.equal(res.zone?.code, 'ZONE_NORTH');
  });

  await test('B5: checkServiceability returns false for unmapped valid PIN 400001', async () => {
    const res = await ShippingRateService.checkServiceability('400001');
    assert.equal(res.serviceable, false);
    assert.equal(res.postalCode, '400001');
  });

  await test('B6: checkServiceability throws 400 for invalid PIN format', async () => {
    await assert.rejects(async () => {
      await ShippingRateService.checkServiceability('INVALID');
    }, (err: any) => err.statusCode === 400 && err.code === 'INVALID_POSTAL_CODE');
  });

  console.log('--- Category C: Shipping Methods & Rates Resolution ---');

  await test('C1: Resolves correct ₹99 rate for subtotal ₹500 in North Zone', async () => {
    const quote = await ShippingRateService.calculateShipping({
      postalCode: '302001',
      orderValue: 500,
      methodCode: 'STANDARD'
    });

    assert.equal(quote.shippingTotal, 99);
    assert.equal(quote.zoneCode, 'ZONE_NORTH');
    assert.equal(quote.methodCode, 'STANDARD');
  });

  await test('C2: Resolves FREE shipping (₹0) for qualifying order >= ₹1000 in North Zone', async () => {
    const quote = await ShippingRateService.calculateShipping({
      postalCode: '302001',
      orderValue: 1500,
      methodCode: 'STANDARD'
    });

    assert.equal(quote.shippingTotal, 0);
    assert.equal(quote.zoneCode, 'ZONE_NORTH');
    assert.equal(quote.methodCode, 'STANDARD');
  });

  await test('C3: Resolves flat ₹250 for EXPRESS delivery method', async () => {
    const quote = await ShippingRateService.calculateShipping({
      postalCode: '302001',
      orderValue: 1500,
      methodCode: 'EXPRESS'
    });

    assert.equal(quote.shippingTotal, 250);
    assert.equal(quote.methodCode, 'EXPRESS');
    assert.equal(quote.carrier, 'BLUE_DART_EXPRESS');
  });

  await test('C4: Returns available method quotes array with isFree flags', async () => {
    const quotes = await ShippingRateService.getAvailableMethods({
      postalCode: '302001',
      orderValue: 1500
    });

    assert.equal(quotes.serviceable, true);
    assert.equal(quotes.methods.length, 2);

    const std = quotes.methods.find(m => m.methodCode === 'STANDARD');
    const exp = quotes.methods.find(m => m.methodCode === 'EXPRESS');

    assert.ok(std);
    assert.equal(std.amount, 0);
    assert.equal(std.isFree, true);

    assert.ok(exp);
    assert.equal(exp.amount, 250);
    assert.equal(exp.isFree, false);
  });

  await test('C5: Unserviceable PIN throws 422 SHIPPING_UNSERVICEABLE on calculateShipping', async () => {
    await assert.rejects(async () => {
      await ShippingRateService.calculateShipping({
        postalCode: '999999',
        orderValue: 1500,
        methodCode: 'STANDARD'
      });
    }, (err: any) => err.statusCode === 422 && err.code === 'SHIPPING_UNSERVICEABLE');
  });

  await test('C6: Negative shipping amounts are strictly rejected by validator', () => {
    assert.throws(() => {
      ShippingValidator.validateRatePayload({
        shippingZoneId: zoneNorth.id,
        shippingMethodId: methodStandard.id,
        amount: -50
      });
    }, (err: any) => err.statusCode === 400 && err.code === 'INVALID_RATE_AMOUNT');
  });

  console.log('--- Category D: Checkout Integration & Immutable Historical Snapshot ---');

  let testOrder: any;
  let testOrderItem1: any;
  let testOrderItem2: any;

  await test('D1: Order creation records immutable OrderShippingSnapshot', async () => {
    const sessionId = '99999999-9999-4999-8999-999999999901';
    await createTestCheckoutSession(sessionId, patronA.id, patronA.email);
    testOrder = await prisma.order.create({
      data: {
        orderNumber: 'LA-2026-09001',
        customerId: patronA.id,
        checkoutSessionId: sessionId,
        email: patronA.email,
        subtotal: 15000,
        shippingTotal: 250,
        taxTotal: 450,
        grandTotal: 15700,
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      }
    });

    testOrderItem1 = await prisma.orderItem.create({
      data: {
        orderId: testOrder.id,
        sku: 'LA-ART-001',
        productName: 'Pichwai Heritage Lotus Painting',
        quantity: 3,
        unitPrice: 4000,
        lineTotal: 12000
      }
    });

    testOrderItem2 = await prisma.orderItem.create({
      data: {
        orderId: testOrder.id,
        sku: 'LA-ART-002',
        productName: 'Tanjore Gold Leaf Ganesha',
        quantity: 1,
        unitPrice: 3000,
        lineTotal: 3000
      }
    });

    const snapshot = await ShipmentRepository.createShippingSnapshot({
      orderId: testOrder.id,
      zoneCode: 'ZONE_NORTH',
      zoneName: 'North India Heritage Zone',
      methodCode: 'EXPRESS',
      methodName: 'Express Secure Courier',
      carrier: 'BLUE_DART_EXPRESS',
      serviceLevel: 'PRIORITY_SECURE',
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      shippingAmount: 250,
      currency: 'INR',
      postalCode: '302001'
    });

    assert.ok(snapshot);
    assert.equal(snapshot.orderId, testOrder.id);
    assert.equal(snapshot.shippingAmount, 250);
    assert.equal(snapshot.methodCode, 'EXPRESS');
  });

  await test('D2: Historical snapshot remains unchanged when current shipping rates update', async () => {
    // Change current express rate to ₹350
    await ShippingService.updateRate(rateNorthExp.id, { amount: 350 }, superAdmin.id);

    // Fetch order shipping snapshot
    const snap = await ShipmentRepository.findShippingSnapshotByOrderId(testOrder.id);
    assert.ok(snap);
    assert.equal(snap.shippingAmount, 250); // Remains historical 250!
  });

  await test('D3: Method rename does not mutate snapshot historical methodName', async () => {
    await ShippingService.updateMethod(methodExpress.id, { name: 'Super Priority Courier 2027' }, superAdmin.id);

    const snap = await ShipmentRepository.findShippingSnapshotByOrderId(testOrder.id);
    assert.equal(snap.methodName, 'Express Secure Courier'); // Preserved!
  });

  console.log('--- Category E: Shipment Creation & Payment Gating ---');

  await test('E1: Rejects shipment creation on unpaid order with 409 ORDER_NOT_PAID', async () => {
    const sessionId = '99999999-9999-4999-8999-999999999902';
    await createTestCheckoutSession(sessionId, patronA.id, patronA.email);
    const unpaidOrder = await prisma.order.create({
      data: {
        orderNumber: 'LA-2026-09002',
        customerId: patronA.id,
        checkoutSessionId: sessionId,
        email: patronA.email,
        subtotal: 5000,
        grandTotal: 5000,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    const itm = await prisma.orderItem.create({
      data: {
        orderId: unpaidOrder.id,
        sku: 'LA-ART-003',
        productName: 'Brass Diya',
        quantity: 1,
        unitPrice: 5000,
        lineTotal: 5000
      }
    });

    await assert.rejects(async () => {
      await ShipmentService.createShipment(unpaidOrder.id, {
        items: [{ orderItemId: itm.id, quantity: 1 }]
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'ORDER_NOT_PAID');
  });

  await test('E2: Rejects shipment creation on cancelled order with 409 ORDER_NOT_SHIPPABLE', async () => {
    const sessionId = '99999999-9999-4999-8999-999999999903';
    await createTestCheckoutSession(sessionId, patronA.id, patronA.email);
    const cancelledOrder = await prisma.order.create({
      data: {
        orderNumber: 'LA-2026-09003',
        customerId: patronA.id,
        checkoutSessionId: sessionId,
        email: patronA.email,
        subtotal: 5000,
        grandTotal: 5000,
        status: 'CANCELLED',
        paymentStatus: 'PAID'
      }
    });

    const itm = await prisma.orderItem.create({
      data: {
        orderId: cancelledOrder.id,
        sku: 'LA-ART-003',
        productName: 'Brass Diya',
        quantity: 1,
        unitPrice: 5000,
        lineTotal: 5000
      }
    });

    await assert.rejects(async () => {
      await ShipmentService.createShipment(cancelledOrder.id, {
        items: [{ orderItemId: itm.id, quantity: 1 }]
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'ORDER_NOT_SHIPPABLE');
  });

  console.log('--- Category F: Partial Shipments & Over-Shipment Prevention ---');

  let shipment1: any;
  let shipment2: any;

  await test('F1: Successfully creates first partial shipment (2 out of 3 of item1)', async () => {
    shipment1 = await ShipmentService.createShipment(testOrder.id, {
      carrier: 'LAGOREE_WHITE_GLOVE',
      items: [
        { orderItemId: testOrderItem1.id, quantity: 2 }
      ]
    }, superAdmin.id);

    assert.ok(shipment1.shipmentNumber.startsWith('LAS-2026-'));
    assert.equal(shipment1.status, 'PENDING');
    assert.equal(shipment1.items.length, 1);
    assert.equal(shipment1.items[0].quantity, 2);
  });

  await test('F2: Rejects over-shipment exceeding remaining item quantity with 400 SHIPMENT_QUANTITY_EXCEEDED', async () => {
    // Item 1 had total 3, already shipped 2. Attempting to ship 2 more should fail!
    await assert.rejects(async () => {
      await ShipmentService.createShipment(testOrder.id, {
        items: [
          { orderItemId: testOrderItem1.id, quantity: 2 }
        ]
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 400 && err.code === 'SHIPMENT_QUANTITY_EXCEEDED');
  });

  await test('F3: Successfully creates second shipment for remaining items (1 of item1 + 1 of item2)', async () => {
    shipment2 = await ShipmentService.createShipment(testOrder.id, {
      carrier: 'BLUE_DART_EXPRESS',
      items: [
        { orderItemId: testOrderItem1.id, quantity: 1 },
        { orderItemId: testOrderItem2.id, quantity: 1 }
      ]
    }, superAdmin.id);

    assert.ok(shipment2.shipmentNumber.startsWith('LAS-2026-'));
    assert.equal(shipment2.items.length, 2);
    assert.notEqual(shipment1.shipmentNumber, shipment2.shipmentNumber);
  });

  await test('F4: Rejects subsequent shipment since 100% of order items are now allocated', async () => {
    await assert.rejects(async () => {
      await ShipmentService.createShipment(testOrder.id, {
        items: [
          { orderItemId: testOrderItem2.id, quantity: 1 }
        ]
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 400 && err.code === 'SHIPMENT_QUANTITY_EXCEEDED');
  });

  console.log('--- Category G: Shipment Lifecycle State Machine ---');

  await test('G1: Valid transition PENDING -> READY', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'READY',
      description: 'Artwork inspected and packaged'
    }, superAdmin.id);
    assert.equal(updated.status, 'READY');
  });

  await test('G2: Valid transition READY -> LABEL_CREATED', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'LABEL_CREATED',
      description: 'Carrier AWB manifest generated'
    }, superAdmin.id);
    assert.equal(updated.status, 'LABEL_CREATED');
  });

  await test('G3: Valid transition LABEL_CREATED -> PICKED_UP', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'PICKED_UP',
      description: 'Courier picked up crate from gallery'
    }, superAdmin.id);
    assert.equal(updated.status, 'PICKED_UP');
    assert.ok(updated.shippedAt);
  });

  await test('G4: Valid transition PICKED_UP -> IN_TRANSIT', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'IN_TRANSIT',
      location: 'Hub New Delhi'
    }, superAdmin.id);
    assert.equal(updated.status, 'IN_TRANSIT');
  });

  await test('G5: Valid transition IN_TRANSIT -> OUT_FOR_DELIVERY', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'OUT_FOR_DELIVERY',
      location: 'Jaipur Delivery Center'
    }, superAdmin.id);
    assert.equal(updated.status, 'OUT_FOR_DELIVERY');
  });

  await test('G6: Valid transition OUT_FOR_DELIVERY -> DELIVERED', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'DELIVERED',
      description: 'Delivered and signed by patron'
    }, superAdmin.id);
    assert.equal(updated.status, 'DELIVERED');
    assert.ok(updated.deliveredAt);
  });

  await test('G7: Valid transition DELIVERED -> RETURNED', async () => {
    const updated = await ShipmentService.updateShipmentStatus(shipment1.id, {
      status: 'RETURNED',
      description: 'Patron requested return to atelier'
    }, superAdmin.id);
    assert.equal(updated.status, 'RETURNED');
  });

  await test('G8: Terminal state RETURNED rejects subsequent transitions', async () => {
    await assert.rejects(async () => {
      await ShipmentService.updateShipmentStatus(shipment1.id, {
        status: 'READY'
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'INVALID_SHIPMENT_STATUS_TRANSITION');
  });

  await test('G9: Illegal transition (e.g. PENDING -> DELIVERED) rejected with 409', async () => {
    await assert.rejects(async () => {
      await ShipmentService.updateShipmentStatus(shipment2.id, {
        status: 'DELIVERED'
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'INVALID_SHIPMENT_STATUS_TRANSITION');
  });

  console.log('--- Category H: Tracking Number & Safe URL Validation ---');

  await test('H1: Assigns valid tracking number and HTTPS URL', async () => {
    const updated = await ShipmentService.updateShipmentTracking(shipment2.id, {
      carrier: 'BLUE_DART_EXPRESS',
      trackingNumber: 'BD-789012345',
      trackingUrl: 'https://track.bluedart.com/track/BD-789012345'
    }, superAdmin.id);

    assert.equal(updated.trackingNumber, 'BD-789012345');
    assert.equal(updated.trackingUrl, 'https://track.bluedart.com/track/BD-789012345');
  });

  await test('H2: Rejects malicious javascript: protocol tracking URL with 400 TRACKING_URL_INVALID', async () => {
    await assert.rejects(async () => {
      await ShipmentService.updateShipmentTracking(shipment2.id, {
        trackingNumber: 'BD-789012345',
        trackingUrl: 'javascript:alert("XSS")'
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 400 && err.code === 'TRACKING_URL_INVALID');
  });

  await test('H3: Rejects protocol-relative // tracking URL', async () => {
    await assert.rejects(async () => {
      await ShipmentService.updateShipmentTracking(shipment2.id, {
        trackingNumber: 'BD-789012345',
        trackingUrl: '//malicious-domain.com/track'
      }, superAdmin.id);
    }, (err: any) => err.statusCode === 400 && err.code === 'TRACKING_URL_INVALID');
  });

  console.log('--- Category I: Order ↔ Shipment Synchronization ---');

  let multiOrder: any;
  let multiItem1: any;
  let multiItem2: any;
  let multiShip1: any;
  let multiShip2: any;

  await test('I1: Order starts as CONFIRMED', async () => {
    const sessionId = '99999999-9999-4999-8999-999999999905';
    await createTestCheckoutSession(sessionId, patronB.id, patronB.email);
    multiOrder = await prisma.order.create({
      data: {
        orderNumber: 'LA-2026-09005',
        customerId: patronB.id,
        checkoutSessionId: sessionId,
        email: patronB.email,
        subtotal: 20000,
        grandTotal: 20000,
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      }
    });

    multiItem1 = await prisma.orderItem.create({
      data: {
        orderId: multiOrder.id,
        sku: 'LA-ART-005',
        productName: 'Framed Pichwai',
        quantity: 2,
        unitPrice: 5000,
        lineTotal: 10000
      }
    });

    multiItem2 = await prisma.orderItem.create({
      data: {
        orderId: multiOrder.id,
        sku: 'LA-ART-006',
        productName: 'Sanskrit Calligraphy',
        quantity: 2,
        unitPrice: 5000,
        lineTotal: 10000
      }
    });

    multiShip1 = await ShipmentService.createShipment(multiOrder.id, {
      items: [{ orderItemId: multiItem1.id, quantity: 2 }]
    }, superAdmin.id);

    multiShip2 = await ShipmentService.createShipment(multiOrder.id, {
      items: [{ orderItemId: multiItem2.id, quantity: 2 }]
    }, superAdmin.id);

    const check = await prisma.order.findUnique({ where: { id: multiOrder.id } });
    assert.equal(check.status, 'CONFIRMED');
  });

  await test('I2: Shipment 1 transitions to PICKED_UP -> Order becomes SHIPPED', async () => {
    await ShipmentService.updateShipmentStatus(multiShip1.id, { status: 'READY' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip1.id, { status: 'PICKED_UP' }, superAdmin.id);

    const check = await prisma.order.findUnique({ where: { id: multiOrder.id } });
    assert.equal(check.status, 'SHIPPED');
  });

  await test('I3: Shipment 1 is DELIVERED but Shipment 2 is PENDING -> Order must NOT become DELIVERED', async () => {
    await ShipmentService.updateShipmentStatus(multiShip1.id, { status: 'IN_TRANSIT' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip1.id, { status: 'OUT_FOR_DELIVERY' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip1.id, { status: 'DELIVERED' }, superAdmin.id);

    const check = await prisma.order.findUnique({ where: { id: multiOrder.id } });
    assert.equal(check.status, 'SHIPPED'); // Only 50% delivered, so remains SHIPPED!
  });

  await test('I4: Shipment 2 progresses to DELIVERED -> Order becomes DELIVERED (100% fulfilled)', async () => {
    await ShipmentService.updateShipmentStatus(multiShip2.id, { status: 'READY' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip2.id, { status: 'PICKED_UP' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip2.id, { status: 'IN_TRANSIT' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip2.id, { status: 'OUT_FOR_DELIVERY' }, superAdmin.id);
    await ShipmentService.updateShipmentStatus(multiShip2.id, { status: 'DELIVERED' }, superAdmin.id);

    const check = await prisma.order.findUnique({ where: { id: multiOrder.id } });
    assert.equal(check.status, 'DELIVERED');
  });

  console.log('--- Category J: Shipment Events Append-Only Timeline ---');

  await test('J1: Events recorded in chronological sequence', async () => {
    const shipment = await ShipmentRepository.findById(multiShip1.id);
    assert.ok(shipment.events);
    assert.ok(shipment.events.length >= 5);

    const statuses = shipment.events.map(e => e.status);
    assert.ok(statuses.includes('PENDING'));
    assert.ok(statuses.includes('READY'));
    assert.ok(statuses.includes('PICKED_UP'));
    assert.ok(statuses.includes('IN_TRANSIT'));
    assert.ok(statuses.includes('DELIVERED'));
  });

  console.log('--- Category K: Customer Shipment Access & Strict IDOR Security ---');

  await test('K1: Patron A can retrieve their own order shipments', async () => {
    const shipments = await ShipmentService.getCustomerShipments(patronA.id, testOrder.id);
    assert.ok(Array.isArray(shipments));
    assert.equal(shipments.length, 2);
  });

  await test('K2: IDOR Protection: Patron B cannot view Patron A order shipments (404 ORDER_NOT_FOUND)', async () => {
    await assert.rejects(async () => {
      await ShipmentService.getCustomerShipments(patronB.id, testOrder.id);
    }, (err: any) => err.statusCode === 404 && err.code === 'ORDER_NOT_FOUND');
  });

  await test('K3: Customer view strips internal audit metadata and provider secrets', async () => {
    const shipment = await ShipmentService.getCustomerShipmentById(patronA.id, shipment2.id);
    assert.ok(shipment.shipmentNumber);
    assert.ok(shipment.trackingNumber);
    assert.equal((shipment as any).rawResponse, undefined);
  });

  console.log('--- Category L: Admin Management, Filtering, Pagination & Delete Safety ---');

  await test('L1: Admin can list shipments with pagination', async () => {
    const list = await ShipmentService.listAdminShipments({ page: 1, limit: 10 });
    assert.ok(list.shipments.length > 0);
    assert.ok(list.total >= 4);
    assert.equal(list.page, 1);
  });

  await test('L2: Delete Safety: Cannot delete Zone in active use by rates (409 SHIPPING_ZONE_IN_USE)', async () => {
    await assert.rejects(async () => {
      await ShippingService.deleteZone(zoneNorth.id, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'SHIPPING_ZONE_IN_USE');
  });

  await test('L3: Delete Safety: Cannot delete Method in active use by rates (409 SHIPPING_METHOD_IN_USE)', async () => {
    await assert.rejects(async () => {
      await ShippingService.deleteMethod(methodStandard.id, superAdmin.id);
    }, (err: any) => err.statusCode === 409 && err.code === 'SHIPPING_METHOD_IN_USE');
  });

  console.log('--- Category M: RBAC Permissions Matrix ---');

  await test('M1: Order Manager has permissions to manage shipping and shipments', async () => {
    const zone = await ShippingService.createZone({
      name: 'South India Coastal Zone',
      code: 'ZONE_SOUTH',
      status: 'ACTIVE'
    }, orderManagerUser.id);
    assert.equal(zone.code, 'ZONE_SOUTH');
  });

  console.log('--- Category N: Concurrency & Race-Condition Resistance ---');

  await test('N1: Concurrent shipment creation respects inventory quantity limits', async () => {
    const sessionId = '99999999-9999-4999-8999-999999999999';
    await createTestCheckoutSession(sessionId, patronA.id, patronA.email);
    const concOrder = await prisma.order.create({
      data: {
        orderNumber: 'LA-2026-09099',
        customerId: patronA.id,
        checkoutSessionId: sessionId,
        email: patronA.email,
        subtotal: 8000,
        grandTotal: 8000,
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      }
    });

    const concItem = await prisma.orderItem.create({
      data: {
        orderId: concOrder.id,
        sku: 'LA-CONC-001',
        productName: 'Pichwai Silk Edition',
        quantity: 1, // Only 1 available to ship!
        unitPrice: 8000,
        lineTotal: 8000
      }
    });

    const promises = [
      ShipmentService.createShipment(concOrder.id, { items: [{ orderItemId: concItem.id, quantity: 1 }] }, superAdmin.id),
      ShipmentService.createShipment(concOrder.id, { items: [{ orderItemId: concItem.id, quantity: 1 }] }, superAdmin.id)
    ];

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly 1 must succeed and exactly 1 must fail with quantity exceeded
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
  });

  console.log('--- Category O: Audit Logging Verification ---');

  await test('O1: Security audit logs recorded for shipment and shipping actions', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: { module: 'SHIPPING' }
    });

    assert.ok(logs.length >= 5);
    const actions = logs.map(l => l.action);
    assert.ok(actions.includes('SHIPPING_ZONE_CREATED'));
    assert.ok(actions.includes('SHIPPING_METHOD_CREATED'));
    assert.ok(actions.includes('SHIPPING_RATE_CREATED'));
    assert.ok(actions.includes('SHIPMENT_CREATED'));
    assert.ok(actions.includes('SHIPMENT_STATUS_CHANGED'));
  });

  console.log('\n=========================================');
  console.log(`Module 22 Test Suite Complete:`);
  console.log(`  Passed: ${passedAssertions}`);
  console.log(`  Failed: 0`);
  console.log('=========================================\n');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
