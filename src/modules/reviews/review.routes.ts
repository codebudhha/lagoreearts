/**
 * Module 25: Reviews & Ratings — Express Routes
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { Router } from '../../utils/express.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { CustomerReviewsController } from './customer-reviews.controller.ts';
import { AdminReviewsController } from './admin-reviews.controller.ts';
import { PublicReviewsController } from './public-reviews.controller.ts';
import {
  createReviewValidator,
  updateReviewValidator,
  adminModerateReviewValidator,
  publicReviewQueryValidator
} from './review.validator.ts';

// 1. Customer Review Router (Base mount: /api/v1/customer)
export const customerReviewRouter = Router();

customerReviewRouter.post(
  '/products/:productId/reviews',
  requireCustomerAuth,
  createReviewValidator,
  CustomerReviewsController.createReview
);

customerReviewRouter.get(
  '/products/:productId/reviews/mine',
  requireCustomerAuth,
  CustomerReviewsController.getMyReviewForProduct
);

customerReviewRouter.patch(
  '/reviews/:reviewId',
  requireCustomerAuth,
  updateReviewValidator,
  CustomerReviewsController.updateMyReview
);

customerReviewRouter.delete(
  '/reviews/:reviewId',
  requireCustomerAuth,
  CustomerReviewsController.deleteMyReview
);

// 2. Admin Review Router (Base mount: /api/v1/admin/reviews)
export const adminReviewRouter = Router();

adminReviewRouter.get(
  '/',
  requireAdminAuth,
  requirePermission('review.view'),
  AdminReviewsController.listReviews
);

adminReviewRouter.get(
  '/:id',
  requireAdminAuth,
  requirePermission('review.view'),
  AdminReviewsController.getReviewById
);

adminReviewRouter.patch(
  '/:id/moderate',
  requireAdminAuth,
  requirePermission('review.moderate'),
  adminModerateReviewValidator,
  AdminReviewsController.moderateReview
);

adminReviewRouter.patch(
  '/:id',
  requireAdminAuth,
  requirePermission('review.update'),
  AdminReviewsController.updateReview
);

adminReviewRouter.delete(
  '/:id',
  requireAdminAuth,
  requirePermission('review.delete'),
  AdminReviewsController.deleteReview
);

// 3. Public Review Router (Base mount: /api/v1/products)
export const publicReviewRouter = Router();

publicReviewRouter.get(
  '/:slug/reviews',
  publicReviewQueryValidator,
  PublicReviewsController.getProductReviews
);
