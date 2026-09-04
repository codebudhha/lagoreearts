import assert from 'node:assert';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../src/lib/permissions/permissionHelpers';
import { formatCurrency, formatRoleName } from '../src/utils/formatters';
import { NAVIGATION_CONFIG } from '../src/config/navigation';

console.log('--- RUNNING ADMIN PANEL PHASE 1 AUTOMATED TESTS ---');

// 1. Permission Helpers Tests
console.log('[Test 1] Testing Permission Matrix & RBAC Logic...');

const superAdmin = {
  id: 'admin-1',
  name: 'Super Admin',
  email: 'super@lagoree.com',
  role: { id: 'role-1', name: 'Super Administrator', slug: 'SUPER_ADMIN' },
  permissions: ['*'],
};

const catalogueManager = {
  id: 'admin-2',
  name: 'Catalogue Staff',
  email: 'catalogue@lagoree.com',
  role: { id: 'role-2', name: 'Catalogue Manager', slug: 'CATALOGUE_MANAGER' },
  permissions: ['products.read', 'products.create', 'categories.read', 'attributes.read'],
};

const orderManager = {
  id: 'admin-3',
  name: 'Order Fulfillment',
  email: 'orders@lagoree.com',
  role: { id: 'role-3', name: 'Order Manager', slug: 'ORDER_MANAGER' },
  permissions: ['orders.read', 'orders.update', 'shipping.read'],
};

// Test Super Admin bypass
assert.strictEqual(hasPermission(superAdmin, 'products.create'), true, 'Super admin should have products.create');
assert.strictEqual(hasPermission(superAdmin, 'anything.nonexistent'), true, 'Super admin should have universal access');
assert.strictEqual(hasAnyPermission(superAdmin, ['orders.read', 'nonexistent.perm']), true, 'Super admin has any permission');
assert.strictEqual(hasAllPermissions(superAdmin, ['orders.read', 'products.read']), true, 'Super admin has all permissions');

// Test Catalogue Manager permissions
assert.strictEqual(hasPermission(catalogueManager, 'products.read'), true, 'Catalogue manager has products.read');
assert.strictEqual(hasPermission(catalogueManager, 'products.create'), true, 'Catalogue manager has products.create');
assert.strictEqual(hasPermission(catalogueManager, 'orders.read'), false, 'Catalogue manager must NOT have orders.read');
assert.strictEqual(hasAnyPermission(catalogueManager, ['orders.read', 'products.read']), true, 'Catalogue manager has at least one matching permission');
assert.strictEqual(hasAllPermissions(catalogueManager, ['products.read', 'categories.read']), true, 'Catalogue manager has all required permissions');
assert.strictEqual(hasAllPermissions(catalogueManager, ['products.read', 'orders.read']), false, 'Catalogue manager fails when missing one permission');

// Test Null User
assert.strictEqual(hasPermission(null, 'products.read'), false, 'Null user has no permissions');
assert.strictEqual(hasAnyPermission(null, ['products.read']), false, 'Null user has no any permissions');
assert.strictEqual(hasAllPermissions(null, ['products.read']), false, 'Null user has no all permissions');

console.log('✓ RBAC Permission helpers verified successfully.');

// 2. Formatters Tests
console.log('[Test 2] Testing Formatting Utilities...');

const inrFormatted = formatCurrency(125000);
assert.ok(inrFormatted.includes('1,25,000') || inrFormatted.includes('125,000') || inrFormatted.includes('₹'), 'Currency formatting correctly formats INR');

assert.strictEqual(formatRoleName('SUPER_ADMIN'), 'Super Admin');
assert.strictEqual(formatRoleName('CATALOGUE_MANAGER'), 'Catalogue Manager');
assert.strictEqual(formatRoleName('CONTENT_MANAGER'), 'Content Manager');
assert.strictEqual(formatRoleName('ORDER_MANAGER'), 'Order Manager');
assert.strictEqual(formatRoleName('MARKETING_MANAGER'), 'Marketing Manager');

console.log('✓ Formatters verified successfully.');

// 3. Navigation Configuration Tests
console.log('[Test 3] Testing Navigation Configuration & Prohibited Entry Checks...');

assert.ok(NAVIGATION_CONFIG.length >= 5, 'Navigation should have at least 5 main sections');

// Ensure Wishlist and Coupons are NOT in navigation
let hasWishlist = false;
let hasCoupons = false;

NAVIGATION_CONFIG.forEach((section) => {
  section.items.forEach((item) => {
    if (item.label.toLowerCase().includes('wishlist') || item.href.includes('wishlist')) {
      hasWishlist = true;
    }
    if (item.label.toLowerCase().includes('coupon') || item.href.includes('coupon') || item.label.toLowerCase().includes('promotion')) {
      hasCoupons = true;
    }
  });
});

assert.strictEqual(hasWishlist, false, 'Wishlist must NOT be present in navigation (deferred)');
assert.strictEqual(hasCoupons, false, 'Coupons & Promotions must NOT be present in navigation (on hold)');

console.log('✓ Navigation configuration validated without deferred/on-hold modules.');

console.log('\n--- ALL ADMIN PHASE 1 TESTS PASSED SUCCESSFULLY (3/3) ---');
