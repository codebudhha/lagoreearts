import { Router } from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createProductValidator,
  updateProductValidator,
  assignCollectionsValidator,
  assignAttributesValidator
} from './products.validator.ts';
import { AdminProductsController } from './admin-products.controller.ts';
import { PublicProductsController } from './public-products.controller.ts';

export const adminProductsRoutes = Router();

adminProductsRoutes.use(requireAdminAuth);

// 1. List & Detail
adminProductsRoutes.get(
  '/',
  requirePermission('product.view'),
  AdminProductsController.list
);

adminProductsRoutes.get(
  '/:id',
  requirePermission('product.view'),
  AdminProductsController.getById
);

// 2. Create Product
adminProductsRoutes.post(
  '/',
  requirePermission('product.create'),
  createProductValidator.middleware(),
  AdminProductsController.create
);

// 3. Update Product
adminProductsRoutes.patch(
  '/:id',
  requirePermission('product.update'),
  updateProductValidator.middleware(),
  AdminProductsController.update
);

// 4. Delete Product
adminProductsRoutes.delete(
  '/:id',
  requirePermission('product.delete'),
  AdminProductsController.delete
);

// 5. Quick Toggles
adminProductsRoutes.patch(
  '/:id/status',
  requirePermission('product.update'),
  AdminProductsController.updateStatus
);

adminProductsRoutes.patch(
  '/:id/featured',
  requirePermission('product.update'),
  AdminProductsController.updateFeatured
);

adminProductsRoutes.patch(
  '/:id/sort',
  requirePermission('product.update'),
  AdminProductsController.updateSort
);

// 6. Collection Association Endpoints
adminProductsRoutes.get(
  '/:id/collections',
  requirePermission('product.view'),
  AdminProductsController.getCollections
);

adminProductsRoutes.post(
  '/:id/collections',
  requirePermission('product.update'),
  AdminProductsController.addCollection
);

adminProductsRoutes.put(
  '/:id/collections',
  requirePermission('product.update'),
  assignCollectionsValidator.middleware(),
  AdminProductsController.setCollections
);

adminProductsRoutes.patch(
  '/:id/collections',
  requirePermission('product.update'),
  assignCollectionsValidator.middleware(),
  AdminProductsController.setCollections
);

adminProductsRoutes.delete(
  '/:id/collections/:collectionId',
  requirePermission('product.update'),
  AdminProductsController.removeCollection
);

// 7. Attribute Endpoints
adminProductsRoutes.get(
  '/:id/attributes',
  requirePermission('product.view'),
  AdminProductsController.getAttributes
);

adminProductsRoutes.put(
  '/:id/attributes',
  requirePermission('product.update'),
  assignAttributesValidator.middleware(),
  AdminProductsController.setAttributes
);

// ==========================================
// Public Storefront Routes
// ==========================================
export const publicProductsRoutes = Router();

publicProductsRoutes.get('/', PublicProductsController.list);
publicProductsRoutes.get('/:slug', PublicProductsController.getBySlug);
