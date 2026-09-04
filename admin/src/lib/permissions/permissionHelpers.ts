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
  'media.read': ['media.view', 'media-folder.view', 'media-folder.read'],
  'media.view': ['media.read', 'media-folder.view', 'media-folder.read'],
  'media.create': ['media-folder.create'],
  'media.update': ['media-folder.update'],
  'media.delete': ['media-folder.delete'],
  'media-folder.view': ['media.read', 'media.view', 'media-folder.read'],
  'media-folder.create': ['media.create'],
  'media-folder.update': ['media.update'],
  'media-folder.delete': ['media.delete'],
  'cms.read': ['cms.view', 'homepage.view', 'homepage.read'],
  'cms.view': ['cms.read', 'homepage.view', 'homepage.read'],
  'homepage.read': ['homepage.view', 'cms.view', 'cms.read'],
  'homepage.view': ['homepage.read', 'cms.view', 'cms.read'],
  'homepage.create': ['cms.create'],
  'homepage.update': ['cms.update', 'cms.edit'],
  'homepage.publish': ['homepage.update', 'cms.update'],
  'homepage.delete': ['cms.delete'],
  'journal.read': ['journal.view', 'blog.read', 'blog.view'],
  'journal.view': ['journal.read', 'blog.read', 'blog.view'],
  'journal.create': ['blog.create'],
  'journal.update': ['blog.update', 'journal.edit'],
  'journal.publish': ['journal.update', 'blog.publish'],
  'journal.delete': ['blog.delete'],
  'lookbook.read': ['lookbook.view'],
  'lookbook.view': ['lookbook.read'],
  'navigation.read': ['navigation.view'],
  'navigation.view': ['navigation.read'],
  'shipping.read': ['shipping.view', 'shipment.view'],
  'shipping.view': ['shipping.read', 'shipment.view'],
  'seo.read': ['seo.view'],
  'seo.view': ['seo.read'],
  'artists.read': ['artist.view', 'artists.view'],
  'artists.view': ['artist.view', 'artists.read'],
  'artist.view': ['artists.read', 'artists.view'],
  'artists.create': ['artist.create'],
  'artist.create': ['artists.create'],
  'artists.update': ['artist.update'],
  'artist.update': ['artists.update'],
  'artists.delete': ['artist.delete'],
  'artist.delete': ['artists.delete'],
  'antiques.read': ['antique.view', 'antiques.view'],
  'antiques.view': ['antique.view', 'antiques.read'],
  'antique.view': ['antiques.read', 'antiques.view'],
  'antiques.create': ['antique.create'],
  'antique.create': ['antiques.create'],
  'antiques.update': ['antique.update'],
  'antique.update': ['antiques.update'],
  'antiques.delete': ['antique.delete'],
  'antique.delete': ['antiques.delete'],
  'sanskrit.read': ['sanskrit-edit.view', 'sanskrit.view', 'sanskrit-edit.read'],
  'sanskrit-edit.read': ['sanskrit-edit.view', 'sanskrit.read', 'sanskrit.view'],
  'sanskrit-edit.view': ['sanskrit-edit.read', 'sanskrit.read', 'sanskrit.view'],
  'sanskrit.view': ['sanskrit-edit.view', 'sanskrit.read', 'sanskrit-edit.read'],
  'sanskrit.create': ['sanskrit-edit.create'],
  'sanskrit-edit.create': ['sanskrit.create'],
  'sanskrit.update': ['sanskrit-edit.update'],
  'sanskrit-edit.update': ['sanskrit.update'],
  'sanskrit.delete': ['sanskrit-edit.delete'],
  'sanskrit-edit.delete': ['sanskrit.delete'],
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
