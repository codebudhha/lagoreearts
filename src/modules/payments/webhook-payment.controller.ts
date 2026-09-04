/**
 * Module 21: Payments — Webhook Controller
 * Lagoree Arts Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { PaymentService } from './payment.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class WebhookPaymentController {
  /**
   * POST /api/v1/payments/webhooks/razorpay
   */
  public static async handleRazorpayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

      const result = await PaymentService.handleWebhook('RAZORPAY', rawBody, signature, req.body);
      ApiResponse.success(res, result, 200, 'Razorpay webhook processed');
    } catch (err: any) {
      if (err.statusCode === 401 || err.code === 'INVALID_WEBHOOK_SIGNATURE') {
        ApiResponse.error(res, err.message, 401, 'INVALID_WEBHOOK_SIGNATURE');
        return;
      }
      if (err.statusCode === 400 || err.code === 'AMOUNT_MISMATCH') {
        ApiResponse.error(res, err.message, 400, err.code);
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/v1/payments/webhooks/mock
   */
  public static async handleMockWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature =
        (req.headers['x-mock-signature'] as string) ||
        (req.headers['x-webhook-signature'] as string) ||
        'mock_valid_signature';

      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

      const result = await PaymentService.handleWebhook('MOCK', rawBody, signature, req.body);
      ApiResponse.success(res, result, 200, 'Mock webhook processed');
    } catch (err: any) {
      if (err.statusCode === 401 || err.code === 'INVALID_WEBHOOK_SIGNATURE') {
        ApiResponse.error(res, err.message, 401, 'INVALID_WEBHOOK_SIGNATURE');
        return;
      }
      if (err.statusCode === 400 || err.code === 'AMOUNT_MISMATCH') {
        ApiResponse.error(res, err.message, 400, err.code);
        return;
      }
      next(err);
    }
  }
}
