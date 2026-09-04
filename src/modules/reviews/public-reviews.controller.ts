/**
 * Module 25: Reviews & Ratings — Public Storefront Controller
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ReviewService } from './review.service.ts';

export class PublicReviewsController {
  /**
   * GET /api/v1/products/:slug/reviews
   * Get approved & published reviews with aggregate summary for an active product
   */
  static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await ReviewService.getPublicReviews(slug, req.query);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Product reviews retrieved successfully',
        data: {
          summary: result.summary,
          items: result.items
        },
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }
}
