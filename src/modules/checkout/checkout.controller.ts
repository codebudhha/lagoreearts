import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ApiError } from '../../utils/error.ts';
import { CheckoutService } from './checkout.service.ts';
import { CheckoutValidator } from './checkout.validator.ts';

const checkoutService = new CheckoutService();

export class CheckoutController {
  /**
   * POST /api/v1/checkout
   * Create new checkout session
   */
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const isGuest = identity.type !== 'customer' && !identity.customerId;
      const dto = CheckoutValidator.parseCreateCheckout(req.body, isGuest);
      const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.body?.idempotencyKey as string) || null;

      const checkout = await checkoutService.createCheckout(identity, dto, idempotencyKey);
      return ApiResponse.created(res, checkout, 'Checkout session created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/checkout/:id
   * Get checkout session by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const checkout = await checkoutService.getCheckout(identity, id);
      return ApiResponse.success(res, checkout, 'Checkout session retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/checkout/:id/addresses
   * Update shipping and/or billing addresses on checkout session
   */
  public static async updateAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const isGuest = identity.type !== 'customer' && !identity.customerId;
      const dto = CheckoutValidator.parseUpdateAddresses(req.body, isGuest);
      const checkout = await checkoutService.updateAddresses(identity, id, dto);
      return ApiResponse.success(res, checkout, 'Checkout addresses updated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/checkout/:id/recalculate
   * Recalculate totals and acknowledge catalogue changes
   */
  public static async recalculate(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const checkout = await checkoutService.recalculateCheckout(identity, id);
      return ApiResponse.success(res, checkout, 'Checkout session recalculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/checkout/:id/validate
   * Validate checkout readiness
   */
  public static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const validation = await checkoutService.validateCheckout(identity, id);
      return ApiResponse.success(res, validation, 'Checkout validation completed');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/checkout/:id/complete
   * Mark checkout completed and ready for order creation
   */
  public static async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.body?.idempotencyKey as string) || null;
      const checkout = await checkoutService.completeCheckout(identity, id, idempotencyKey);
      return ApiResponse.success(res, checkout, 'Checkout session marked as completed');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/checkout/:id/cancel
   * Cancel active checkout session
   */
  public static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = (req as any).cartIdentity;
      if (!identity) {
        throw new ApiError(400, 'CART_IDENTITY_REQUIRED', 'Unable to resolve shopper session identity');
      }

      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const checkout = await checkoutService.cancelCheckout(identity, id);
      return ApiResponse.success(res, checkout, 'Checkout session cancelled');
    } catch (err) {
      next(err);
    }
  }
}
