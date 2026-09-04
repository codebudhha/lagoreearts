/**
 * Module 20: Orders — Admin Routes
 * Lagoree Arts Backend
 */

import { Router } from '../../utils/express.ts';
import { AdminOrderController } from './admin-order.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';

export const adminOrderRouter = Router();

// Enforce admin authentication across all admin order routes
adminOrderRouter.use(requireAdminAuth);

// Order listing & inspection
adminOrderRouter.get('/', requirePermission('order.view'), AdminOrderController.listOrders);
adminOrderRouter.get('/:id', requirePermission('order.view'), AdminOrderController.getOrderById);

// Order status & payment state transitions
adminOrderRouter.patch('/:id/status', requirePermission('order.manage-status', 'order.update'), AdminOrderController.updateStatus);
adminOrderRouter.patch('/:id/payment-status', requirePermission('order.manage-status', 'order.update'), AdminOrderController.updatePaymentStatus);

// Order cancellation
adminOrderRouter.post('/:id/cancel', requirePermission('order.cancel'), AdminOrderController.cancelOrder);
