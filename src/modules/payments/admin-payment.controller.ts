/**
 * Module 21: Payments — Admin Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { PaymentService } from './payment.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminPaymentController {
  /**
   * GET /api/v1/admin/payments
   * Lists all payments with pagination, status, and date filters.
   */
  public static async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.listAdminPayments(req.query);

      ApiResponse.paginated(
        res,
        result.payments,
        result.page,
        result.limit,
        result.total,
        200,
        'Payments retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/payments/:id
   * Retrieves comprehensive payment record with attempt history.
   */
  public static async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await PaymentService.getAdminPayment(id);

      ApiResponse.success(res, payment, 200, 'Payment detail retrieved successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'PAYMENT_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, 'PAYMENT_NOT_FOUND');
        return;
      }
      if (err.statusCode === 400 || err.code === 'INVALID_ID_FORMAT') {
        ApiResponse.error(res, err.message, 400, 'INVALID_ID_FORMAT');
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/payments/:id/reconcile
   * Triggers manual gateway reconciliation.
   */
  public static async reconcilePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = (req as any).admin;
      const { id } = req.params;

      const reconciled = await PaymentService.reconcilePayment(id, admin?.id || 'system_admin');
      ApiResponse.success(res, reconciled, 200, 'Payment reconciled successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'PAYMENT_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, 'PAYMENT_NOT_FOUND');
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/payments/:id/refund
   * Initiates payment refund and updates order payment status.
   */
  public static async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = (req as any).admin;
      const { id } = req.params;
      const { amount, reason } = req.body || {};

      const refunded = await PaymentService.refundPayment(id, admin?.id || 'system_admin', amount, reason);
      ApiResponse.success(res, refunded, 200, 'Payment refunded successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'PAYMENT_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, 'PAYMENT_NOT_FOUND');
        return;
      }
      if (err.statusCode === 409 || err.code === 'INVALID_REFUND_STATUS') {
        ApiResponse.error(res, err.message, 409, 'INVALID_REFUND_STATUS');
        return;
      }
      if (err.statusCode === 400 || err.code === 'INVALID_REFUND_AMOUNT') {
        ApiResponse.error(res, err.message, 400, 'INVALID_REFUND_AMOUNT');
        return;
      }
      next(err);
    }
  }
}
