import express from '../../utils/express.ts';
import { CustomerAuthController } from './customer-auth.controller.ts';
import { CustomerValidator } from './customer.validator.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';

export const customerAuthRouter = express.Router();

customerAuthRouter.post(
  '/register',
  CustomerValidator.validateRegister,
  CustomerAuthController.register
);

customerAuthRouter.post(
  '/login',
  CustomerValidator.validateLogin,
  CustomerAuthController.login
);

customerAuthRouter.post(
  '/logout',
  CustomerAuthController.logout
);

customerAuthRouter.post(
  '/logout-all',
  requireCustomerAuth,
  CustomerAuthController.logoutAll
);

customerAuthRouter.post(
  '/refresh',
  CustomerAuthController.refresh
);

customerAuthRouter.get(
  '/me',
  requireCustomerAuth,
  CustomerAuthController.me
);

customerAuthRouter.post(
  '/change-password',
  requireCustomerAuth,
  CustomerValidator.validateChangePassword,
  CustomerAuthController.changePassword
);

customerAuthRouter.post(
  '/forgot-password',
  CustomerValidator.validateForgotPassword,
  CustomerAuthController.forgotPassword
);

customerAuthRouter.post(
  '/reset-password',
  CustomerValidator.validateResetPassword,
  CustomerAuthController.resetPassword
);

customerAuthRouter.post(
  '/verify-email',
  CustomerValidator.validateVerifyEmail,
  CustomerAuthController.verifyEmail
);

customerAuthRouter.post(
  '/resend-verification',
  CustomerValidator.validateResendVerification,
  CustomerAuthController.resendVerification
);
