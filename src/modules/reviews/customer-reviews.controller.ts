/**
 * Module 25: Reviews & Ratings — Customer Controller
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ReviewService } from './review.service.ts';

export class CustomerReviewsController {
  /**
   * POST /api/v1/customer/products/:productId/reviews
   * Submit a product review for a qualifying purchased product
   */
  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Customer authentication required');
      }

      const { productId } = req.params;
      const { rating, title, body, variantId } = req.body;

      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const review = await ReviewService.createCustomerReview(
        customer.id,
        productId,
        { rating, title, body, variantId },
        meta
      );

      return ApiResponse.success(res, review, 201, 'Review submitted successfully and is pending moderation');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/customer/products/:productId/reviews/mine
   * Get authenticated customer's own review for a specific product
   */
  static async getMyReviewForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Customer authentication required');
      }

      const { productId } = req.params;
      const review = await ReviewService.getCustomerReviewForProduct(customer.id, productId);

      return ApiResponse.success(res, review, 200, 'Customer review retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/customer/reviews/:reviewId
   * Update authenticated customer's own review
   */
  static async updateMyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Customer authentication required');
      }

      const { reviewId } = req.params;
      const { rating, title, body } = req.body;

      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const updated = await ReviewService.updateCustomerReview(
        customer.id,
        reviewId,
        { rating, title, body },
        meta
      );

      return ApiResponse.success(res, updated, 200, 'Review updated successfully and resubmitted for moderation');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/customer/reviews/:reviewId
   * Delete authenticated customer's own review
   */
  static async deleteMyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Customer authentication required');
      }

      const { reviewId } = req.params;
      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      await ReviewService.deleteCustomerReview(customer.id, reviewId, meta);

      return ApiResponse.success(res, { deleted: true }, 200, 'Review deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
