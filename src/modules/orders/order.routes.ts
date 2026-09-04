/**
 * Module 20: Orders — Customer & Storefront Routes
 * Lagoree Arts Backend
 */

import { Router } from '../../utils/express.ts';
import { CustomerOrderController } from './customer-order.controller.ts';
import { GuestOrderController } from './guest-order.controller.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';

// Public / Guest / General Order Router
export const orderRouter = Router();

// Order creation from completed checkout
orderRouter.post('/create', GuestOrderController.createOrderFromCheckout);

// Guest order secure lookup
orderRouter.post('/guest-lookup', GuestOrderController.lookupOrder);

// Customer-Facing Order Router (Mounted on /api/v1/customer/orders)
export const customerOrderRouter = Router();

customerOrderRouter.use(requireCustomerAuth);

customerOrderRouter.get('/', CustomerOrderController.getMyOrders);
customerOrderRouter.get('/:id', CustomerOrderController.getMyOrderById);
customerOrderRouter.post('/:id/cancel', CustomerOrderController.cancelMyOrder);
