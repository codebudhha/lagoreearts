/**
 * Module 24: Cross-sell & Upsell — Public Controller
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { RecommendationService } from './recommendation.service.ts';
import { RecommendationValidator } from './recommendation.validator.ts';

export class PublicRecommendationsController {
  /**
   * GET /api/v1/products/:slug/recommendations
   */
  static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== 'string' || !slug.trim()) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_SLUG',
          message: 'Product slug or ID must be provided'
        };
      }

      const query = RecommendationValidator.validatePublicQuery(req.query);
      const result = await RecommendationService.getPublicRecommendations(slug.trim(), query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
