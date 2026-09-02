import { Router } from '../../utils/express.ts';
import { AdminAuthController } from './admin-auth.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { loginRateLimiter } from '../../middleware/rateLimiter.ts';
import {
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator
} from './admin-auth.validator.ts';

const router = Router();

// Public Authentication Endpoints
router.post('/login', loginRateLimiter, loginValidator.middleware(), AdminAuthController.login);
router.post('/refresh', AdminAuthController.refresh);
router.post('/logout', AdminAuthController.logout);
router.post('/forgot-password', forgotPasswordValidator.middleware(), AdminAuthController.forgotPassword);
router.post('/reset-password', resetPasswordValidator.middleware(), AdminAuthController.resetPassword);

// Authenticated Admin Endpoints
router.get('/me', requireAdminAuth, AdminAuthController.getMe);
router.post('/logout-all', requireAdminAuth, AdminAuthController.logoutAll);
router.post('/change-password', requireAdminAuth, changePasswordValidator.middleware(), AdminAuthController.changePassword);
router.patch('/profile', requireAdminAuth, updateProfileValidator.middleware(), AdminAuthController.updateProfile);

export const adminAuthRoutes = router;
