import { Router } from '../../utils/express.ts';
import { CategoryFiltersController } from './category-filters.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  addCategoryAttributeValidator,
  updateCategoryAttributeValidator
} from './category-filters.validator.ts';

// 1. Admin Category Filter Routes (/api/v1/admin/categories/:categoryId/attributes)
export const adminCategoryFiltersRoutes = Router();

adminCategoryFiltersRoutes.use(requireAdminAuth);

adminCategoryFiltersRoutes.get(
  '/:categoryId/attributes',
  requirePermission('category.view'),
  CategoryFiltersController.list
);

adminCategoryFiltersRoutes.post(
  '/:categoryId/attributes',
  requirePermission('category.update'),
  addCategoryAttributeValidator.middleware(),
  CategoryFiltersController.add
);

adminCategoryFiltersRoutes.patch(
  '/:categoryId/attributes/:attributeId',
  requirePermission('category.update'),
  updateCategoryAttributeValidator.middleware(),
  CategoryFiltersController.update
);

adminCategoryFiltersRoutes.delete(
  '/:categoryId/attributes/:attributeId',
  requirePermission('category.update'),
  CategoryFiltersController.remove
);

// 2. Public Storefront Category Filter Routes (/api/v1/categories/:slug/filters)
export const publicCategoryFiltersRoutes = Router();

publicCategoryFiltersRoutes.get('/:slug/filters', CategoryFiltersController.getPublicFilters);
