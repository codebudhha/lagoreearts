import type { Request, Response, NextFunction } from '../utils/express.ts';
import { ApiResponse } from '../utils/apiResponse.ts';

/**
 * Middleware factory to enforce database-driven permission checks
 * @param requiredPermission e.g. "product.create", "order.view", "admin.view"
 */
export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = req.admin;

    if (!admin) {
      return ApiResponse.unauthenticated(res, 'Authentication required');
    }

    // Super Admin has all permissions or check explicit permission slug
    const isSuperAdmin = admin.role.slug === 'SUPER_ADMIN' || admin.role.slug === 'super_admin';
    const hasPermission = isSuperAdmin || admin.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action');
    }

    next();
  };
}
