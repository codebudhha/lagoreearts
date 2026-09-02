import { Router } from '../../utils/express.ts';
import { AdminAntiqueController, PublicAntiqueController } from './antiques.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { createAntiqueProfileValidator, updateAntiqueProfileValidator } from './antiques.validator.ts';

// 1. Admin Antique Profile Router (Mounted on /api/v1/admin/products)
export const adminAntiqueProfileRouter = Router();

adminAntiqueProfileRouter.post(
  '/:id/antique',
  requireAdminAuth,
  requirePermission('antique.create'),
  createAntiqueProfileValidator.validateMiddleware(),
  AdminAntiqueController.createProfile
);

adminAntiqueProfileRouter.get(
  '/:id/antique',
  requireAdminAuth,
  requirePermission('antique.view'),
  AdminAntiqueController.getProfile
);

adminAntiqueProfileRouter.patch(
  '/:id/antique',
  requireAdminAuth,
  requirePermission('antique.update'),
  updateAntiqueProfileValidator.validateMiddleware(),
  AdminAntiqueController.updateProfile
);

adminAntiqueProfileRouter.delete(
  '/:id/antique',
  requireAdminAuth,
  requirePermission('antique.delete'),
  AdminAntiqueController.deleteProfile
);

// 2. Admin Antiques Listing Router (Mounted on /api/v1/admin/antiques)
export const adminAntiquesRouter = Router();

adminAntiquesRouter.get(
  '/',
  requireAdminAuth,
  requirePermission('antique.view'),
  AdminAntiqueController.listAntiques
);

// 3. Public Antiques Listing Router (Mounted on /api/v1/antiques)
export const publicAntiquesRouter = Router();

publicAntiquesRouter.get(
  '/',
  PublicAntiqueController.listAntiques
);
