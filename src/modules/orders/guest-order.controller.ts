/**
 * Module 20: Orders — Guest Order Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { OrderService } from './order.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class GuestOrderController {
  /**
   * POST /api/v1/orders/guest-lookup
   * Secure guest lookup by order number and verification email or guest token.
   */
  public static async lookupOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber, email } = req.body || {};
      const guestToken = req.headers['x-guest-cart-token'] as string || req.body?.guestToken;

      if (!orderNumber) {
        ApiResponse.error(res, 'Order number is required', 400, 'ORDER_NUMBER_REQUIRED');
        return;
      }

      const order = await OrderService.lookupGuestOrder({
        orderNumber,
        email,
        guestToken
      });

      ApiResponse.success(res, order, 200, 'Order details retrieved successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message || 'Order not found', 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'ORDER_NUMBER_REQUIRED' || err.statusCode === 400) {
        ApiResponse.error(res, err.message, 400, 'ORDER_NUMBER_REQUIRED');
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/orders/create
   * Creates an order from a COMPLETED checkout session.
   */
  public static async createOrderFromCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { checkoutId, notes } = req.body || {};
      const guestToken = req.headers['x-guest-cart-token'] as string || req.body?.guestToken;

      if (!checkoutId) {
        ApiResponse.error(res, 'Checkout ID is required', 400, 'CHECKOUT_ID_REQUIRED');
        return;
      }

      const order = await OrderService.createFromCompletedCheckout(checkoutId, { guestToken, notes });
      ApiResponse.created(res, order, 'Order created successfully');
    } catch (err: any) {
      if (err.code === 'INVALID_CHECKOUT_ID') {
        ApiResponse.error(res, err.message, 400, 'INVALID_CHECKOUT_ID');
        return;
      }
      if (err.code === 'CHECKOUT_NOT_FOUND' || err.statusCode === 404 || err.status === 404) {
        ApiResponse.error(res, err.message, 404, 'CHECKOUT_NOT_FOUND');
        return;
      }
      if (err.code === 'CHECKOUT_NOT_COMPLETED' || err.statusCode === 400 || err.status === 400) {
        ApiResponse.error(res, err.message, 400, 'CHECKOUT_NOT_COMPLETED');
        return;
      }
      next(err);
    }
  }
}
