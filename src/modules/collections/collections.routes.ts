import { Router } from '../../utils/express.ts';
import { AdminCollectionsController } from './admin-collections.controller.ts';
import { PublicCollectionsController } from './public-collections.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createCollectionValidator,
  updateCollectionValidator,
  updateSortOrderValidator
} from './collections.validator.ts';

// 1. Admin Collections Routes (/api/v1/admin/collections)
export const adminCollectionsRoutes = Router();

adminCollectionsRoutes.use(requireAdminAuth);

adminCollectionsRoutes.get('/', requirePermission('collection.view'), AdminCollectionsController.list);
adminCollectionsRoutes.get('/:id', requirePermission('collection.view'), AdminCollectionsController.getById);

adminCollectionsRoutes.post(
  '/',
  requirePermission('collection.create'),
  createCollectionValidator.middleware(),
  AdminCollectionsController.create
);

adminCollectionsRoutes.patch(
  '/:id',
  requirePermission('collection.update'),
  updateCollectionValidator.middleware(),
  AdminCollectionsController.update
);

adminCollectionsRoutes.patch(
  '/:id/sort',
  requirePermission('collection.update'),
  updateSortOrderValidator.middleware(),
  AdminCollectionsController.updateSort
);

adminCollectionsRoutes.delete('/:id', requirePermission('collection.delete'), AdminCollectionsController.delete);

// 2. Public Storefront Collections Routes (/api/v1/collections)
export const publicCollectionsRoutes = Router();

publicCollectionsRoutes.get('/', PublicCollectionsController.list);
publicCollectionsRoutes.get('/:slug', PublicCollectionsController.getBySlug);
