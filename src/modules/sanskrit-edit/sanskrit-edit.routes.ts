import { Router } from '../../utils/express.ts';
import { AdminSanskritEditController, PublicSanskritEditController } from './sanskrit-edit.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createSanskritEditProfileValidator,
  updateSanskritEditProfileValidator,
  reorderSanskritEditValidator
} from './sanskrit-edit.validator.ts';

// 1. Admin Sanskrit Edit Profile Router (Mounted on /api/v1/admin/products)
export const adminSanskritEditProfileRouter = Router();

adminSanskritEditProfileRouter.post(
  '/:id/sanskrit-edit',
  requireAdminAuth,
  requirePermission('sanskrit-edit.create'),
  createSanskritEditProfileValidator,
  AdminSanskritEditController.createProfile
);

adminSanskritEditProfileRouter.get(
  '/:id/sanskrit-edit',
  requireAdminAuth,
  requirePermission('sanskrit-edit.view'),
  AdminSanskritEditController.getProfile
);

adminSanskritEditProfileRouter.patch(
  '/:id/sanskrit-edit',
  requireAdminAuth,
  requirePermission('sanskrit-edit.update'),
  updateSanskritEditProfileValidator,
  AdminSanskritEditController.updateProfile
);

adminSanskritEditProfileRouter.delete(
  '/:id/sanskrit-edit',
  requireAdminAuth,
  requirePermission('sanskrit-edit.delete'),
  AdminSanskritEditController.deleteProfile
);

// 2. Admin Sanskrit Edit Listing Router (Mounted on /api/v1/admin/sanskrit-edit)
export const adminSanskritEditRouter = Router();

adminSanskritEditRouter.get(
  '/',
  requireAdminAuth,
  requirePermission('sanskrit-edit.view'),
  AdminSanskritEditController.listProfiles
);

adminSanskritEditRouter.put(
  '/order',
  requireAdminAuth,
  requirePermission('sanskrit-edit.update'),
  reorderSanskritEditValidator,
  AdminSanskritEditController.reorderProfiles
);

// 3. Public Sanskrit Edit Listing Router (Mounted on /api/v1/sanskrit-edit)
export const publicSanskritEditRouter = Router();

publicSanskritEditRouter.get(
  '/',
  PublicSanskritEditController.listProfiles
);
