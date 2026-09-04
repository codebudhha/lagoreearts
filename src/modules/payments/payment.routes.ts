/**
 * Module 21: Payments — Routes Definition
 * Lagoree Arts Backend
 */

import { Router } from '../../utils/express.ts';
import { CustomerPaymentController } from './customer-payment.controller.ts';
import { WebhookPaymentController } from './webhook-payment.controller.ts';
import { AdminPaymentController } from './admin-payment.controller.ts';
import { optionalCustomerAuth, requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';

/**
 * Customer payment routes attached at:
 * /api/v1/customer/orders
 * Resulting paths:
 * POST /api/v1/customer/orders/:orderId/payment/initiate
 * POST /api/v1/customer/orders/:orderId/payment/verify
 * GET  /api/v1/customer/orders/:orderId/payment
 */
export const customerPaymentRouter = Router();
customerPaymentRouter.post('/:orderId/payment/initiate', optionalCustomerAuth, CustomerPaymentController.initiatePayment);
customerPaymentRouter.post('/:orderId/payment/verify', optionalCustomerAuth, CustomerPaymentController.verifyPayment);
customerPaymentRouter.get('/:orderId/payment', requireCustomerAuth, CustomerPaymentController.getPaymentStatus);

/**
 * Webhook routes attached at:
 * /api/v1/payments/webhooks
 */
export const webhookPaymentRouter = Router();
webhookPaymentRouter.post('/razorpay', WebhookPaymentController.handleRazorpayWebhook);
webhookPaymentRouter.post('/mock', WebhookPaymentController.handleMockWebhook);

/**
 * Admin payment management routes attached at:
 * /api/v1/admin/payments
 */
export const adminPaymentRouter = Router();
adminPaymentRouter.get('/', requireAdminAuth, requirePermission('payment.view'), AdminPaymentController.listPayments);
adminPaymentRouter.get('/:id', requireAdminAuth, requirePermission('payment.view'), AdminPaymentController.getPaymentById);
adminPaymentRouter.post(
  '/:id/reconcile',
  requireAdminAuth,
  requirePermission('payment.reconcile', 'payment.update'),
  AdminPaymentController.reconcilePayment
);
adminPaymentRouter.post(
  '/:id/refund',
  requireAdminAuth,
  requirePermission('payment.refund', 'payment.update'),
  AdminPaymentController.refundPayment
);
