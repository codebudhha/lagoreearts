import type { Request, Response, NextFunction } from '../utils/express.ts';
import { verifyCustomerAccessToken } from '../security/customer-jwt.ts';
import { prisma } from '../database/prisma.ts';
import { CartGuestService } from '../modules/cart/cart-guest.service.ts';
import type { CartIdentity } from '../modules/cart/cart.types.ts';
import { ApiResponse } from '../utils/apiResponse.ts';

export const GUEST_CART_COOKIE = 'lagoree_guest_cart_token';
export const GUEST_CART_HEADER = 'x-guest-cart-token';

/**
 * Middleware that seamlessly resolves either an authenticated customer identity
 * or a secure guest cart token.
 */
export async function resolveCartIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check for Customer JWT authentication
    let customerToken: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      customerToken = authHeader.substring(7).trim();
    } else if ((req as any).cookies?.lagoree_customer_access_token) {
      customerToken = (req as any).cookies.lagoree_customer_access_token;
    }

    if (customerToken) {
      const payload = verifyCustomerAccessToken(customerToken);
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
            status: customer.status
          };
          (req as any).cartIdentity = {
            type: 'customer',
            customerId: customer.id
          } as CartIdentity;
          return next();
        }
      }
    }

    // 2. Resolve Guest Cart Token
    let rawGuestToken: string | undefined = req.headers[GUEST_CART_HEADER] as string | undefined;
    if (!rawGuestToken && (req as any).cookies?.[GUEST_CART_COOKIE]) {
      rawGuestToken = (req as any).cookies[GUEST_CART_COOKIE];
    }

    if (rawGuestToken && typeof rawGuestToken === 'string') {
      const trimmed = rawGuestToken.trim();
      if (CartGuestService.isValidTokenFormat(trimmed)) {
        const guestTokenHash = CartGuestService.hashGuestToken(trimmed);
        (req as any).cartIdentity = {
          type: 'guest',
          guestToken: trimmed,
          guestTokenHash
        } as CartIdentity;
        res.setHeader(GUEST_CART_HEADER, trimmed);
        return next();
      } else {
        return ApiResponse.error(res, 400, 'INVALID_GUEST_CART_TOKEN', 'Malformed guest cart token');
      }
    }

    // 3. If no guest token provided, generate a new cryptographic guest token
    const newGuestToken = CartGuestService.generateGuestToken();
    const newGuestTokenHash = CartGuestService.hashGuestToken(newGuestToken);

    (req as any).cartIdentity = {
      type: 'guest',
      guestToken: newGuestToken,
      guestTokenHash: newGuestTokenHash
    } as CartIdentity;

    res.setHeader(GUEST_CART_HEADER, newGuestToken);
    return next();
  } catch (err: any) {
    return ApiResponse.error(res, 500, 'CART_IDENTITY_ERROR', err.message || 'Internal cart session error');
  }
}
