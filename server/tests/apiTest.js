/**
 * Comprehensive API Smoke & Integration Test for Lagoree Arts
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Lagoree Arts E-Commerce API Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error('  Error:', err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('Server Health Check (GET /api/health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error('Status not online');
  });

  // 2. Product Catalog
  let sampleProductSlug = '';
  let sampleProductId = null;
  await test('List Products with Categories & Ratings (GET /api/products)', async () => {
    const res = await fetch(`${BASE_URL}/products?limit=5`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) throw new Error('No products returned');
    sampleProductSlug = data.data[0].slug;
    sampleProductId = data.data[0].id;
  });

  // 3. Single Product PDP
  await test('Get Product Detail by Slug with Frames (GET /api/products/:slug)', async () => {
    const res = await fetch(`${BASE_URL}/products/${sampleProductSlug}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.product) throw new Error('Product not returned');
    if (!data.framingOptions || data.framingOptions.length === 0) throw new Error('Framing options missing');
  });

  // 4. Categories & Artists
  await test('Get Categories and Master Artists', async () => {
    const catRes = await fetch(`${BASE_URL}/products/categories`);
    const catData = await catRes.json();
    if (!catData.success || catData.categories.length === 0) throw new Error('Categories empty');

    const artRes = await fetch(`${BASE_URL}/products/artists`);
    const artData = await artRes.json();
    if (!artData.success || artData.artists.length === 0) throw new Error('Artists empty');
  });

  // 5. User Registration
  const testEmail = `test.collector.${Date.now()}@lagoreearts.com`;
  let authToken = '';
  await test('User Registration (POST /api/auth/register)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maharaja Jai Singh',
        email: testEmail,
        password: 'Password@123',
        phone: '+91 99887 76655'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Token not issued');
    authToken = data.token;
  });

  // 6. User Login
  await test('User Login (POST /api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Login failed');
  });

  // 7. Cart Operations
  await test('Add Item with Framing Option to Cart (POST /api/cart/add)', async () => {
    const res = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        productId: sampleProductId,
        framingId: 2, // Raw Heritage Teakwood
        size: '36" x 48" inches',
        quantity: 1
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.cart || data.cart.itemCount === 0) throw new Error('Cart not updated');
  });

  // 8. Coupon Validation
  await test('Apply Coupon Code (POST /api/cart/coupon)', async () => {
    const res = await fetch(`${BASE_URL}/cart/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'HERITAGE10',
        subtotal: 100000
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.coupon) throw new Error('Coupon rejected');
  });

  // 9. Checkout & Create Order
  let generatedOrderNumber = '';
  await test('Checkout & Order Placement (POST /api/checkout/create-order)', async () => {
    const res = await fetch(`${BASE_URL}/checkout/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        customerName: 'Maharaja Jai Singh',
        customerEmail: testEmail,
        customerPhone: '+91 99887 76655',
        shippingAddress: {
          fullName: 'Maharaja Jai Singh',
          phone: '+91 99887 76655',
          street: '1, City Palace Complex',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302002',
          country: 'India'
        },
        paymentMethod: 'upi',
        couponCode: 'HERITAGE10'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.order) throw new Error('Order creation failed');
    generatedOrderNumber = data.order.orderNumber;
  });

  // 10. Order Tracking
  await test('Lookup Order Details & Timeline (GET /api/orders/:orderNumber)', async () => {
    const res = await fetch(`${BASE_URL}/orders/${generatedOrderNumber}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.order) throw new Error('Order lookup failed');
    if (!data.order.timeline || data.order.timeline.length === 0) throw new Error('Timeline missing');
  });

  // 11. Customer Account Profile & History
  await test('Customer Profile & Orders (GET /api/auth/me & /api/orders/my-orders)', async () => {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const meData = await meRes.json();
    if (!meData.success || !meData.user) throw new Error('Profile fetch failed');

    const ordersRes = await fetch(`${BASE_URL}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const ordersData = await ordersRes.json();
    if (!ordersData.success || ordersData.orders.length === 0) throw new Error('Order history empty');
  });

  // 12. Wishlist Toggle
  await test('Wishlist Operations (POST /api/wishlist/toggle & GET /api/wishlist)', async () => {
    const toggleRes = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ productId: sampleProductId })
    });
    const toggleData = await toggleRes.json();
    if (!toggleData.success) throw new Error('Wishlist toggle failed');

    const listRes = await fetch(`${BASE_URL}/wishlist`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    if (!listData.success || listData.wishlist.length === 0) throw new Error('Wishlist fetch failed');
  });

  // 13. Admin Login & Metrics
  await test('Admin Authentication & Metrics (GET /api/admin/metrics)', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lagoreearts.com',
        password: 'Admin@123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) throw new Error('Admin login failed');

    const metricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    if (!metricsRes.ok) throw new Error(`Admin status ${metricsRes.status}`);
    const metricsData = await metricsRes.json();
    if (!metricsData.success || !metricsData.metrics) throw new Error('Metrics missing');
  });

  console.log('\n------------------------------------------------');
  console.log(`🎉 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
