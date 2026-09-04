/**
 * Module 20: Orders — Admin Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { OrderService } from './order.service.ts';
import { OrderValidator } from './order.validator.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminOrderController {
  /**
   * GET /api/v1/admin/orders
   * Lists orders with filters, search, pagination, and sorting.
   */
  public static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = OrderValidator.parseAdminListQuery(req.query);
      const result = await OrderService.listAdminOrders(query);

      ApiResponse.paginated(
        res,
        result.orders,
        result.page,
        result.limit,
        result.total,
        200,
        'Admin orders retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/orders/:id
   * Retrieves single order by ID with full administrative inspection details.
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderService.getAdminOrderById(id);

      ApiResponse.success(res, order, 200, 'Admin order retrieved successfully');
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
   * PATCH /api/v1/admin/orders/:id/status
   * Updates order lifecycle status according to the state machine.
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, reason } = req.body || {};
      const admin = (req as any).admin;

      if (!status) {
        ApiResponse.error(res, 'Status is required', 400, 'STATUS_REQUIRED');
        return;
      }

      const updated = await OrderService.updateOrderStatus(id, status, admin?.id, notes, reason);
      ApiResponse.success(res, updated, 200, 'Order status updated successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'INVALID_ORDER_STATUS_TRANSITION' || err.statusCode === 409) {
        ApiResponse.error(res, err.message, 409, 'INVALID_ORDER_STATUS_TRANSITION');
        return;
      }
      if (err.code === 'INVALID_ORDER_STATUS' || err.code === 'INVALID_ORDER_ID' || err.statusCode === 400) {
        ApiResponse.error(res, err.message, 400, err.code || 'BAD_REQUEST');
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/orders/:id/payment-status
   * Updates payment status.
   */
  public static async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus, notes } = req.body || {};
      const admin = (req as any).admin;

      if (!paymentStatus) {
        ApiResponse.error(res, 'Payment status is required', 400, 'PAYMENT_STATUS_REQUIRED');
        return;
      }

      const updated = await OrderService.updatePaymentStatus(id, paymentStatus, admin?.id, notes);
      ApiResponse.success(res, updated, 200, 'Order payment status updated successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'INVALID_PAYMENT_STATUS_TRANSITION' || err.statusCode === 409) {
        ApiResponse.error(res, err.message, 409, 'INVALID_PAYMENT_STATUS_TRANSITION');
        return;
      }
      if (err.code === 'INVALID_PAYMENT_STATUS' || err.code === 'INVALID_ORDER_ID' || err.statusCode === 400) {
        ApiResponse.error(res, err.message, 400, err.code || 'BAD_REQUEST');
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/orders/:id/cancel
   * Cancels an order with administrative reason.
   */
  public static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const admin = (req as any).admin;

      const updated = await OrderService.adminCancelOrder(id, reason, admin?.id);
      ApiResponse.success(res, updated, 200, 'Order cancelled successfully');
    } catch (err: any) {
      if (err.code === 'ORDER_NOT_FOUND' || err.statusCode === 404) {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.code === 'INVALID_ORDER_STATUS_TRANSITION' || err.statusCode === 409) {
        ApiResponse.error(res, err.message, 409, 'INVALID_ORDER_STATUS_TRANSITION');
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
