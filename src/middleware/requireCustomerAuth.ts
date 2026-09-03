import type { Request, Response, NextFunction } from '../utils/express.ts';
import { verifyCustomerAccessToken } from '../security/customer-jwt.ts';
import { prisma } from '../database/prisma.ts';
import { ApiResponse } from '../utils/apiResponse.ts';

export interface AuthenticatedCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: string;
  emailVerifiedAt?: Date | null;
}

/**
 * Middleware to require valid Customer JWT authentication
 */
export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback to cookies if present
    if (!token && (req as any).cookies?.lagoree_customer_access_token) {
      token = (req as any).cookies.lagoree_customer_access_token;
    }

    if (!token) {
      return ApiResponse.unauthenticated(res, 'Customer authentication required');
    }

    // 3. Verify JWT signature, expiration, and 'customer' claim
    const payload = verifyCustomerAccessToken(token);
    if (!payload || !payload.sub) {
      return ApiResponse.unauthenticated(res, 'Invalid or expired customer access token');
    }

    // 4. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: payload.sub }
    });

    if (!customer) {
      return ApiResponse.unauthenticated(res, 'Customer account not found');
    }

    // 5. Enforce status check (ACTIVE only)
    if (customer.status !== 'ACTIVE') {
      return ApiResponse.forbidden(res, `Account is ${customer.status.toLowerCase()}. Access denied.`);
    }

    // 6. Attach safe customer identity to request
    (req as any).customer = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      status: customer.status,
      emailVerifiedAt: customer.emailVerifiedAt
    };

    next();
  } catch (err) {
    return ApiResponse.unauthenticated(res, 'Customer authentication verification failed');
  }
}

/**
 * Optional customer authentication: loads customer if token present, proceeds if guest.
 */
export async function optionalCustomerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token && (req as any).cookies?.lagoree_customer_access_token) {
      token = (req as any).cookies.lagoree_customer_access_token;
    }

    if (token) {
      const payload = verifyCustomerAccessToken(token);
      if (payload && payload.sub) {
        const customer = await prisma.customer.findUnique({
          where: { id: payload.sub }
        });
        if (customer && customer.status === 'ACTIVE') {
          (req as any).customer = {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            status: customer.status,
            emailVerifiedAt: customer.emailVerifiedAt
          };
        }
      }
    }
  } catch {
    // Guest fallback
  }
  next();
}
