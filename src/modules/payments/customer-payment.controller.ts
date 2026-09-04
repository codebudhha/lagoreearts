/**
 * Module 21: Payments — Customer Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { PaymentService } from './payment.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class CustomerPaymentController {
  /**
   * POST /api/v1/customer/orders/:orderId/payment/initiate
   * Initiates payment order/intent with the gateway.
   */
  public static async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      const { orderId } = req.params;

      const result = await PaymentService.initiatePayment(orderId, customer?.id || null, req.body);
      ApiResponse.created(res, result, 'Payment session initiated successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'ORDER_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, 'ORDER_NOT_FOUND');
        return;
      }
      if (err.statusCode === 409 || err.code === 'ORDER_ALREADY_PAID' || err.code === 'ORDER_NOT_PAYABLE') {
        ApiResponse.error(res, err.message, 409, err.code);
        return;
      }
      if (err.statusCode === 400 || err.code === 'INVALID_ID_FORMAT' || err.code === 'UNSUPPORTED_PROVIDER') {
        ApiResponse.error(res, err.message, 400, err.code);
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/customer/orders/:orderId/payment/verify
   * Verifies payment completion from client-side checkout callback.
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      const { orderId } = req.params;

      const result = await PaymentService.verifyPayment(orderId, customer?.id || null, req.body);
      ApiResponse.success(res, result, 200, 'Payment verified successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'ORDER_NOT_FOUND' || err.code === 'PAYMENT_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, err.code);
        return;
      }
      if (err.statusCode === 400 || err.code === 'PAYMENT_VERIFICATION_FAILED' || err.code === 'MISSING_PAYMENT_ID') {
        ApiResponse.error(res, err.message, 400, err.code, { payment: err.payment });
        return;
      }
      if (err.statusCode === 409) {
        ApiResponse.error(res, err.message, 409, err.code || 'INVALID_TRANSITION');
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/customer/orders/:orderId/payment
   * Retrieves latest payment status for an order.
   */
  public static async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = (req as any).customer;
      if (!customer?.id) {
        ApiResponse.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { orderId } = req.params;
      const result = await PaymentService.getCustomerPayment(orderId, customer.id);

      ApiResponse.success(res, result, 200, 'Payment status retrieved successfully');
    } catch (err: any) {
      if (err.statusCode === 404 || err.code === 'ORDER_NOT_FOUND' || err.code === 'PAYMENT_NOT_FOUND') {
        ApiResponse.error(res, err.message, 404, err.code);
        return;
      }
      next(err);
    }
  }
}
