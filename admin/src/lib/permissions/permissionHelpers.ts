/**
 * Lagoree Arts Admin Role & Permission Authorization Helpers
 * Centralized, non-hardcoded permission checks based on backend matrix.
 */

import type { AdminUser } from '../../types/auth';

export function hasPermission(admin: AdminUser | null, permission?: string): boolean {
  if (!permission) return true;
  if (!admin) return false;

  // Super Admin receives universal access
  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  return admin.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(admin: AdminUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!admin) return false;

  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  return permissions.some((perm) => admin.permissions?.includes(perm));
}

export function hasAllPermissions(admin: AdminUser | null, permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!admin) return false;

  if (admin.role?.slug === 'SUPER_ADMIN' || admin.permissions?.includes('*')) {
    return true;
  }

  return permissions.every((perm) => admin.permissions?.includes(perm));
}
