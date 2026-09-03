import express, { Router } from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { AdminArtistController, PublicArtistController } from './artists.controller.ts';
import {
  createArtistValidator,
  updateArtistValidator,
  reorderArtistsValidator,
  attachProductArtistValidator,
  updateProductArtistValidator,
  reorderProductArtistsValidator,
  attachArtistMediaValidator,
  reorderArtistMediaValidator
} from './artists.validator.ts';

// 1. Admin Artists Router (/api/v1/admin/artists)
export const adminArtistsRouter = Router();

adminArtistsRouter.use(requireAdminAuth);

adminArtistsRouter.post(
  '/',
  requirePermission('artist.create'),
  createArtistValidator,
  AdminArtistController.createArtist
);

adminArtistsRouter.get(
  '/',
  requirePermission('artist.view'),
  AdminArtistController.listArtists
);

adminArtistsRouter.put(
  '/order',
  requirePermission('artist.update'),
  reorderArtistsValidator,
  AdminArtistController.reorderArtists
);

adminArtistsRouter.post(
  '/migrate',
  requirePermission('artist.create'),
  AdminArtistController.runMigration
);

adminArtistsRouter.get(
  '/:id',
  requirePermission('artist.view'),
  AdminArtistController.getArtist
);

adminArtistsRouter.patch(
  '/:id',
  requirePermission('artist.update'),
  updateArtistValidator,
  AdminArtistController.updateArtist
);

adminArtistsRouter.delete(
  '/:id',
  requirePermission('artist.delete'),
  AdminArtistController.deleteArtist
);

adminArtistsRouter.patch(
  '/:id/status',
  requirePermission('artist.update'),
  AdminArtistController.updateStatus
);

adminArtistsRouter.patch(
  '/:id/featured',
  requirePermission('artist.update'),
  AdminArtistController.updateFeatured
);

// Artist Media Routes
adminArtistsRouter.get(
  '/:id/media',
  requirePermission('artist.view'),
  AdminArtistController.listMedia
);

adminArtistsRouter.post(
  '/:id/media',
  requirePermission('artist.update'),
  attachArtistMediaValidator,
  AdminArtistController.attachMedia
);

adminArtistsRouter.put(
  '/:id/media/order',
  requirePermission('artist.update'),
  reorderArtistMediaValidator,
  AdminArtistController.reorderMedia
);

adminArtistsRouter.patch(
  '/:id/media/:mediaId/primary',
  requirePermission('artist.update'),
  AdminArtistController.setPrimaryMedia
);

adminArtistsRouter.delete(
  '/:id/media/:mediaId',
  requirePermission('artist.update'),
  AdminArtistController.detachMedia
);

// 2. Admin Product Artists Router (Mounted on /api/v1/admin/products)
export const adminProductArtistsRouter = Router();

adminProductArtistsRouter.use(requireAdminAuth);

adminProductArtistsRouter.get(
  '/:productId/artists',
  requirePermission('artist.view'),
  AdminArtistController.listProductArtists
);

adminProductArtistsRouter.post(
  '/:productId/artists',
  requirePermission('artist.update'),
  attachProductArtistValidator,
  AdminArtistController.attachProductArtist
);

adminProductArtistsRouter.put(
  '/:productId/artists/order',
  requirePermission('artist.update'),
  reorderProductArtistsValidator,
  AdminArtistController.reorderProductArtists
);

adminProductArtistsRouter.patch(
  '/:productId/artists/:artistId',
  requirePermission('artist.update'),
  updateProductArtistValidator,
  AdminArtistController.updateProductArtist
);

adminProductArtistsRouter.delete(
  '/:productId/artists/:artistId',
  requirePermission('artist.update'),
  AdminArtistController.detachProductArtist
);

// 3. Public Artists Router (/api/v1/artists)
export const publicArtistsRouter = Router();

publicArtistsRouter.get('/', PublicArtistController.listArtists);
publicArtistsRouter.get('/:slug', PublicArtistController.getArtistBySlug);
