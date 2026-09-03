import express from '../../utils/express.ts';
import { AdminCustomerController } from './admin-customer.controller.ts';
import { CustomerValidator } from './customer.validator.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';

export const adminCustomerRouter = express.Router();

// Require admin authentication for all administrative customer management endpoints
adminCustomerRouter.use(requireAdminAuth);

adminCustomerRouter.get(
  '/',
  requirePermission('customer.view'),
  AdminCustomerController.listCustomers
);

adminCustomerRouter.get(
  '/:id',
  requirePermission('customer.view'),
  AdminCustomerController.getCustomerById
);

adminCustomerRouter.patch(
  '/:id',
  requirePermission('customer.update'),
  CustomerValidator.validateAdminUpdateCustomer,
  AdminCustomerController.updateCustomer
);

adminCustomerRouter.patch(
  '/:id/status',
  requirePermission('customer.status.update', 'customer.update'),
  CustomerValidator.validateAdminUpdateStatus,
  AdminCustomerController.updateCustomerStatus
);

adminCustomerRouter.get(
  '/:id/addresses',
  requirePermission('customer.address.view', 'customer.view'),
  AdminCustomerController.getCustomerAddresses
);

adminCustomerRouter.get(
  '/:id/sessions',
  requirePermission('customer.session.view', 'customer.view'),
  AdminCustomerController.getCustomerSessions
);

adminCustomerRouter.post(
  '/:id/revoke-sessions',
  requirePermission('customer.session.revoke', 'customer.update'),
  AdminCustomerController.revokeCustomerSessions
);
