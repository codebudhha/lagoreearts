import type { Request, Response, NextFunction } from '../utils/express.ts';
import { verifyAccessToken } from '../security/jwt.ts';
import { prisma } from '../database/prisma.ts';
import { ApiResponse } from '../utils/apiResponse.ts';

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  status: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    slug: string;
    permissions: Array<{
      id: string;
      name: string;
      slug: string;
      module: string;
    }>;
  };
  permissions: string[]; // Flattened slugs
}

/**
 * Middleware to require valid Admin JWT authentication
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback to cookies if present
    if (!token && (req as any).cookies?.lagoree_admin_access_token) {
      token = (req as any).cookies.lagoree_admin_access_token;
    }

    if (!token) {
      return ApiResponse.unauthenticated(res, 'Authentication required');
    }

    // 3. Verify JWT signature and expiration
    const payload = verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return ApiResponse.unauthenticated(res, 'Invalid or expired access token');
    }

    // 4. Fetch admin user with role and permissions
    const adminUser = prisma.adminUser.findUnique({
      where: { id: payload.sub },
      include: { role: true }
    });

    if (!adminUser) {
      return ApiResponse.unauthenticated(res, 'Admin user not found');
    }

    // 5. Enforce status check (ACTIVE only)
    if (adminUser.status !== 'ACTIVE') {
      return ApiResponse.forbidden(res, `Account is ${adminUser.status.toLowerCase()}. Access denied.`);
    }

    // 6. Resolve permissions list
    const permissions = adminUser.role?.permissions?.map((p: any) => p.slug) || [];

    // 7. Attach to request
    req.admin = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      status: adminUser.status,
      roleId: adminUser.roleId,
      role: {
        id: adminUser.role.id,
        name: adminUser.role.name,
        slug: adminUser.role.slug,
        permissions: adminUser.role.permissions
      },
      permissions
    };

    next();
  } catch (err) {
    return ApiResponse.unauthenticated(res, 'Authentication verification failed');
  }
}
