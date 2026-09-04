/**
 * Module 24: Cross-sell & Upsell — Admin Controller
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { RecommendationService } from './recommendation.service.ts';
import { RecommendationValidator } from './recommendation.validator.ts';

export class AdminRecommendationsController {
  /**
   * GET /api/v1/admin/product-recommendations
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = RecommendationValidator.validateAdminFilter(req.query);
      const result = await RecommendationService.listAdminRecommendations(filter);
      return ApiResponse.paginated(res, result.items, result.page, result.limit, result.total);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/product-recommendations/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = RecommendationValidator.validateUuid(req.params.id, 'id');
      const result = await RecommendationService.getAdminRecommendationById(id);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/product-recommendations
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = RecommendationValidator.validateCreate(req.body);
      const sourceProductId = req.body.sourceProductId
        ? RecommendationValidator.validateUuid(req.body.sourceProductId, 'sourceProductId')
        : undefined;

      if (!sourceProductId) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'MISSING_SOURCE_PRODUCT_ID',
          message: 'sourceProductId is required when creating a recommendation'
        };
      }

      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      const result = await RecommendationService.createRecommendation(
        sourceProductId,
        validated,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/product-recommendations/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = RecommendationValidator.validateUuid(req.params.id, 'id');
      const validated = RecommendationValidator.validateUpdate(req.body);
      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      const result = await RecommendationService.updateRecommendation(
        id,
        validated,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/product-recommendations/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = RecommendationValidator.validateUuid(req.params.id, 'id');
      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      await RecommendationService.deleteRecommendation(id, req.admin!.id, meta);
      return ApiResponse.success(res, { success: true, message: 'Recommendation deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/products/:productId/recommendations
   */
  static async listForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sourceProductId = RecommendationValidator.validateUuid(req.params.productId, 'productId');
      const filter = RecommendationValidator.validateAdminFilter({
        ...req.query,
        sourceProductId
      });
      const result = await RecommendationService.listAdminRecommendations(filter);
      return ApiResponse.paginated(res, result.items, result.page, result.limit, result.total);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/products/:productId/recommendations
   */
  static async createForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sourceProductId = RecommendationValidator.validateUuid(req.params.productId, 'productId');
      const validated = RecommendationValidator.validateCreate(req.body);
      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      const result = await RecommendationService.createRecommendation(
        sourceProductId,
        validated,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/products/:productId/recommendations/reorder
   */
  static async reorderForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sourceProductId = RecommendationValidator.validateUuid(req.params.productId, 'productId');
      const items = RecommendationValidator.validateReorder(req.body);
      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      const result = await RecommendationService.reorderRecommendations(
        sourceProductId,
        items,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/products/:productId/recommendations/:recommendationId
   */
  static async deleteForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = RecommendationValidator.validateUuid(req.params.recommendationId, 'recommendationId');
      const meta = { ip: req.ip, userAgent: req.headers?.['user-agent'] };
      await RecommendationService.deleteRecommendation(id, req.admin!.id, meta);
      return ApiResponse.success(res, { success: true, message: 'Recommendation deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/products/:productId/recommendations/preview
   */
  static async previewForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = RecommendationValidator.validateUuid(req.params.productId, 'productId');
      const result = await RecommendationService.getAdminPreview(productId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
