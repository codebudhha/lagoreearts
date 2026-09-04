/**
 * Module 20: Orders — Customer Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { OrderService } from './order.service.ts';
import { OrderValidator } from './order.validator.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class CustomerOrderController {
  /**
   * GET /api/v1/customer/orders
   * Retrieves order history for the authenticated customer.
   */
  public static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      if (!customer?.id) {
        ApiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const query = OrderValidator.parseCustomerListQuery(req.query);
      const result = await OrderService.getCustomerOrders(customer.id, query);

      ApiResponse.paginated(
        res,
        result.orders,
        result.page,
        result.limit,
        result.total,
        200,
        'Customer orders retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/customer/orders/:id
   * Retrieves detail of an order owned by the authenticated customer.
   */
  public static async getMyOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      if (!customer?.id) {
        ApiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { id } = req.params;
      const order = await OrderService.getCustomerOrderById(customer.id, id);

      ApiResponse.success(res, order, 200, 'Order detail retrieved successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'INVALID_ORDER_ID' || err.statusCode === 400) {
        ApiResponse.error(res, err.message, 400, 'INVALID_ORDER_ID');
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/customer/orders/:id/cancel
   * Allows customer to cancel their order if in PENDING state.
   */
  public static async cancelMyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      if (!customer?.id) {
        ApiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { id } = req.params;
      const { reason } = req.body || {};

      const cancelled = await OrderService.customerCancelOrder(customer.id, id, reason);
      ApiResponse.success(res, cancelled, 200, 'Order cancelled successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'ORDER_CANNOT_BE_CANCELLED' || err.statusCode === 409) {
        ApiResponse.error(res, err.message, 409, 'ORDER_CANNOT_BE_CANCELLED');
        return;
      }
      if (err.code === 'INVALID_ORDER_ID' || err.statusCode === 400) {
        ApiResponse.error(res, err.message, 400, 'INVALID_ORDER_ID');
        return;
      }
      next(err);
    }
  }
}
