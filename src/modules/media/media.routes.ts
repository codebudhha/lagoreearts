import { Router } from '../../utils/express.ts';
import { AdminMediaController } from './admin-media.controller.ts';
import { AdminEntityMediaController } from './admin-entity-media.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createFolderValidator,
  updateFolderValidator,
  updateMediaValidator,
  attachEntityMediaValidator,
  reorderEntityMediaValidator
} from './media.validator.ts';

/* ========================================================================
 * ADMIN MEDIA FOLDERS ROUTER
 * ======================================================================== */
export const adminMediaFoldersRouter = new Router();

adminMediaFoldersRouter.post(
  '/',
  requireAdminAuth,
  requirePermission('media-folder.create'),
  createFolderValidator.validateMiddleware(),
  AdminMediaController.createFolder
);

adminMediaFoldersRouter.get(
  '/',
  requireAdminAuth,
  requirePermission('media-folder.view'),
  AdminMediaController.listFolders
);

adminMediaFoldersRouter.get(
  '/:id',
  requireAdminAuth,
  requirePermission('media-folder.view'),
  AdminMediaController.getFolder
);

adminMediaFoldersRouter.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('media-folder.update'),
  updateFolderValidator.validateMiddleware(),
  AdminMediaController.updateFolder
);

adminMediaFoldersRouter.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('media-folder.delete'),
  AdminMediaController.deleteFolder
);

/* ========================================================================
 * ADMIN MEDIA ASSETS ROUTER
 * ======================================================================== */
export const adminMediaRouter = new Router();

// Folder sub-routes under /api/v1/admin/media/folders
adminMediaRouter.use('/folders', adminMediaFoldersRouter);

// Orphans list
adminMediaRouter.get(
  '/orphans',
  requireAdminAuth,
  requirePermission('media.view'),
  AdminMediaController.listOrphans
);

// Asset CRUD
adminMediaRouter.post(
  '/',
  requireAdminAuth,
  requirePermission('media.create'),
  AdminMediaController.upload
);

adminMediaRouter.get(
  '/',
  requireAdminAuth,
  requirePermission('media.view'),
  AdminMediaController.listMedia
);

adminMediaRouter.get(
  '/:id',
  requireAdminAuth,
  requirePermission('media.view'),
  AdminMediaController.getMedia
);

adminMediaRouter.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('media.update'),
  updateMediaValidator.validateMiddleware(),
  AdminMediaController.updateMedia
);

adminMediaRouter.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('media.delete'),
  AdminMediaController.deleteMedia
);

/* ========================================================================
 * ENTITY MEDIA ATTACHMENT ROUTERS
 * ======================================================================== */

export const adminProductMediaRouter = new Router();

adminProductMediaRouter.get(
  '/:id/media',
  requireAdminAuth,
  requirePermission('product.view'),
  AdminEntityMediaController.listProductMedia
);

adminProductMediaRouter.post(
  '/:id/media',
  requireAdminAuth,
  requirePermission('product.update'),
  attachEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.attachProductMedia
);

adminProductMediaRouter.delete(
  '/:id/media/:mediaId',
  requireAdminAuth,
  requirePermission('product.update'),
  AdminEntityMediaController.detachProductMedia
);

adminProductMediaRouter.put(
  '/:id/media/order',
  requireAdminAuth,
  requirePermission('product.update'),
  reorderEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.reorderProductMedia
);

export const adminVariantMediaRouter = new Router();

adminVariantMediaRouter.get(
  '/:productId/variants/:variantId/media',
  requireAdminAuth,
  requirePermission('variant.view'),
  AdminEntityMediaController.listVariantMedia
);

adminVariantMediaRouter.post(
  '/:productId/variants/:variantId/media',
  requireAdminAuth,
  requirePermission('variant.update'),
  attachEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.attachVariantMedia
);

adminVariantMediaRouter.delete(
  '/:productId/variants/:variantId/media/:mediaId',
  requireAdminAuth,
  requirePermission('variant.update'),
  AdminEntityMediaController.detachVariantMedia
);

adminVariantMediaRouter.put(
  '/:productId/variants/:variantId/media/order',
  requireAdminAuth,
  requirePermission('variant.update'),
  reorderEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.reorderVariantMedia
);

export const adminCategoryMediaRouter = new Router();

adminCategoryMediaRouter.get(
  '/:id/media',
  requireAdminAuth,
  requirePermission('category.view'),
  AdminEntityMediaController.listCategoryMedia
);

adminCategoryMediaRouter.post(
  '/:id/media',
  requireAdminAuth,
  requirePermission('category.update'),
  attachEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.attachCategoryMedia
);

adminCategoryMediaRouter.delete(
  '/:id/media/:mediaId',
  requireAdminAuth,
  requirePermission('category.update'),
  AdminEntityMediaController.detachCategoryMedia
);

adminCategoryMediaRouter.put(
  '/:id/media/order',
  requireAdminAuth,
  requirePermission('category.update'),
  reorderEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.reorderCategoryMedia
);

export const adminCollectionMediaRouter = new Router();

adminCollectionMediaRouter.get(
  '/:id/media',
  requireAdminAuth,
  requirePermission('collection.view'),
  AdminEntityMediaController.listCollectionMedia
);

adminCollectionMediaRouter.post(
  '/:id/media',
  requireAdminAuth,
  requirePermission('collection.update'),
  attachEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.attachCollectionMedia
);

adminCollectionMediaRouter.delete(
  '/:id/media/:mediaId',
  requireAdminAuth,
  requirePermission('collection.update'),
  AdminEntityMediaController.detachCollectionMedia
);

adminCollectionMediaRouter.put(
  '/:id/media/order',
  requireAdminAuth,
  requirePermission('collection.update'),
  reorderEntityMediaValidator.validateMiddleware(),
  AdminEntityMediaController.reorderCollectionMedia
);
