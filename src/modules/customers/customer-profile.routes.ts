import express from '../../utils/express.ts';
import { CustomerController } from './customer.controller.ts';
import { CustomerValidator } from './customer.validator.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';

export const customerProfileRouter = express.Router();

// Require authenticated customer for all profile and address endpoints
customerProfileRouter.use(requireCustomerAuth);

// ------------------------------------------
// Customer Profile Routes
// ------------------------------------------
customerProfileRouter.get(
  '/profile',
  CustomerController.getProfile
);

customerProfileRouter.patch(
  '/profile',
  CustomerValidator.validateUpdateProfile,
  CustomerController.updateProfile
);

// ------------------------------------------
// Customer Address Book Routes
// ------------------------------------------
customerProfileRouter.get(
  '/addresses',
  CustomerController.listAddresses
);

customerProfileRouter.post(
  '/addresses',
  CustomerValidator.validateAddress,
  CustomerController.createAddress
);

customerProfileRouter.get(
  '/addresses/:id',
  CustomerController.getAddressById
);

customerProfileRouter.patch(
  '/addresses/:id',
  CustomerValidator.validateUpdateAddress,
  CustomerController.updateAddress
);

customerProfileRouter.delete(
  '/addresses/:id',
  CustomerController.deleteAddress
);

customerProfileRouter.post(
  '/addresses/:id/default-shipping',
  CustomerController.setDefaultShipping
);

customerProfileRouter.post(
  '/addresses/:id/default-billing',
  CustomerController.setDefaultBilling
);
