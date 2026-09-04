/**
 * Lagoree Arts Admin Role & Permission Authorization Helpers
 * Centralized, non-hardcoded permission checks based on backend matrix.
 */

import type { AdminUser } from '../../types/auth';

const PERMISSION_SYNONYMS: Record<string, string[]> = {
  'products.read': ['product.view', 'products.view'],
  'product.view': ['products.read', 'products.view'],
  'products.create': ['product.create'],
  'product.create': ['products.create'],
  'categories.read': ['category.view', 'categories.view'],
  'category.view': ['categories.read', 'categories.view'],
  'collections.read': ['collection.view', 'collections.view'],
  'collection.view': ['collections.read', 'collections.view'],
  'attributes.read': ['attribute.view', 'attributes.view'],
  'attribute.view': ['attributes.read', 'attributes.view'],
  'orders.read': ['order.view', 'orders.view'],
  'order.view': ['orders.read', 'orders.view'],
  'orders.update': ['order.update'],
  'order.update': ['orders.update'],
  'customers.read': ['customer.view', 'customers.view'],
  'customer.view': ['customers.read', 'customers.view'],
  'reviews.read': ['review.view', 'reviews.view'],
  'review.view': ['reviews.read', 'reviews.view'],
  'media.read': ['media.view'],
  'media.view': ['media.read'],
  'cms.read': ['cms.view', 'homepage.view'],
  'cms.view': ['cms.read', 'homepage.view'],
  'journal.read': ['journal.view'],
  'journal.view': ['journal.read'],
  'lookbook.read': ['lookbook.view'],
  'lookbook.view': ['lookbook.read'],
  'navigation.read': ['navigation.view'],
  'navigation.view': ['navigation.read'],
  'shipping.read': ['shipping.view', 'shipment.view'],
  'shipping.view': ['shipping.read', 'shipment.view'],
  'seo.read': ['seo.view'],
  'seo.view': ['seo.read'],
  'users.read': ['admin.view'],
  'admin.view': ['users.read'],
  'roles.read': ['settings.view'],
  'settings.read': ['settings.view'],
  'audit.read': ['audit.view'],
  'audit.view': ['audit.read'],
};

export function hasPermission(admin: AdminUser | null, permission?: string): boolean {
  if (!permission) return true;
  if (!admin) return false;

  // Super Admin receives universal access
  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  if (admin.permissions?.includes(permission)) {
    return true;
  }

  // Check aliases/synonyms
  const synonyms = PERMISSION_SYNONYMS[permission];
  if (synonyms && synonyms.some((syn) => admin.permissions?.includes(syn))) {
    return true;
  }

  return false;
}

export function hasAnyPermission(admin: AdminUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!admin) return false;

  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  return permissions.some((perm) => hasPermission(admin, perm));
}

export function hasAllPermissions(admin: AdminUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!admin) return false;

  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  return permissions.every((perm) => hasPermission(admin, perm));
}
