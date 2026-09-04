/**
 * Module 24: Cross-sell & Upsell — Routes
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { Router } from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { AdminRecommendationsController } from './admin-recommendations.controller.ts';
import { PublicRecommendationsController } from './public-recommendations.controller.ts';

// 1. Public Recommendation Router (e.g. /api/v1/products/:slug/recommendations)
export const publicRecommendationRoutes = Router();
publicRecommendationRoutes.get('/:slug/recommendations', PublicRecommendationsController.getRecommendations);

// 2. Direct Admin Recommendation Router (/api/v1/admin/product-recommendations)
export const adminRecommendationRoutes = Router();
adminRecommendationRoutes.use(requireAdminAuth);

adminRecommendationRoutes.get(
  '/',
  requirePermission('recommendation.view'),
  AdminRecommendationsController.list
);

adminRecommendationRoutes.post(
  '/',
  requirePermission('recommendation.create'),
  AdminRecommendationsController.create
);

adminRecommendationRoutes.get(
  '/:id',
  requirePermission('recommendation.view'),
  AdminRecommendationsController.getById
);

adminRecommendationRoutes.patch(
  '/:id',
  requirePermission('recommendation.update'),
  AdminRecommendationsController.update
);

adminRecommendationRoutes.delete(
  '/:id',
  requirePermission('recommendation.delete'),
  AdminRecommendationsController.delete
);

// 3. Nested Admin Product Recommendation Router (e.g. /api/v1/admin/products/:productId/recommendations)
export const adminProductRecommendationRoutes = Router();
adminProductRecommendationRoutes.use(requireAdminAuth);

adminProductRecommendationRoutes.get(
  '/:productId/recommendations',
  requirePermission('recommendation.view'),
  AdminRecommendationsController.listForProduct
);

adminProductRecommendationRoutes.post(
  '/:productId/recommendations',
  requirePermission('recommendation.create'),
  AdminRecommendationsController.createForProduct
);

adminProductRecommendationRoutes.patch(
  '/:productId/recommendations/reorder',
  requirePermission('recommendation.reorder'),
  AdminRecommendationsController.reorderForProduct
);

adminProductRecommendationRoutes.delete(
  '/:productId/recommendations/:recommendationId',
  requirePermission('recommendation.delete'),
  AdminRecommendationsController.deleteForProduct
);

adminProductRecommendationRoutes.get(
  '/:productId/recommendations/preview',
  requirePermission('recommendation.view'),
  AdminRecommendationsController.previewForProduct
);
