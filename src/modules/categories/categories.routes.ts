import { Router } from '../../utils/express.ts';
import { AdminCategoriesController } from './admin-categories.controller.ts';
import { PublicCategoriesController } from './public-categories.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { createCategoryValidator, updateCategoryValidator } from './categories.validator.ts';

// 1. Admin Category Routes (/api/v1/admin/categories)
export const adminCategoriesRoutes = Router();

adminCategoriesRoutes.use(requireAdminAuth);

adminCategoriesRoutes.get('/', requirePermission('category.view'), AdminCategoriesController.list);
adminCategoriesRoutes.get('/tree', requirePermission('category.view'), AdminCategoriesController.getTree);
adminCategoriesRoutes.get('/:id/children', requirePermission('category.view'), AdminCategoriesController.getChildren);
adminCategoriesRoutes.get('/:id/ancestors', requirePermission('category.view'), AdminCategoriesController.getAncestors);
adminCategoriesRoutes.get('/:id', requirePermission('category.view'), AdminCategoriesController.getById);

adminCategoriesRoutes.post(
  '/',
  requirePermission('category.create'),
  createCategoryValidator.middleware(),
  AdminCategoriesController.create
);

adminCategoriesRoutes.patch(
  '/:id',
  requirePermission('category.update'),
  updateCategoryValidator.middleware(),
  AdminCategoriesController.update
);

adminCategoriesRoutes.delete('/:id', requirePermission('category.delete'), AdminCategoriesController.delete);

// 2. Public Storefront Category Routes (/api/v1/categories)
export const publicCategoriesRoutes = Router();

publicCategoriesRoutes.get('/', PublicCategoriesController.list);
publicCategoriesRoutes.get('/tree', PublicCategoriesController.getTree);
publicCategoriesRoutes.get('/:slug/breadcrumb', PublicCategoriesController.getBreadcrumbs);
publicCategoriesRoutes.get('/:slug', PublicCategoriesController.getBySlug);
