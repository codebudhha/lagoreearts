/**
 * Module 25: Reviews & Ratings — Admin Controller
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ReviewService } from './review.service.ts';

export class AdminReviewsController {
  /**
   * GET /api/v1/admin/reviews
   * List reviews with search, filtering, and pagination
   */
  static async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReviewService.listAdminReviews(req.query);
      return ApiResponse.paginated(
        res,
        result.items,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        200,
        'Reviews retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/reviews/:id
   * Get single review details by ID
   */
  static async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await ReviewService.getAdminReviewById(id);
      return ApiResponse.success(res, review, 200, 'Review details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/reviews/:id/moderate
   * Moderate review status (APPROVED, REJECTED, HIDDEN, PENDING)
   */
  static async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = (req as any).admin;
      const { id } = req.params;
      const { status, moderationNotes } = req.body;

      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const updated = await ReviewService.moderateReview(
        id,
        { status, moderationNotes },
        admin?.id || 'SYSTEM',
        meta
      );

      return ApiResponse.success(res, updated, 200, `Review status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/reviews/:id
   * Update review details or status
   */
  static async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = (req as any).admin;
      const { id } = req.params;
      const { status, rating, title, body } = req.body;

      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const updated = await ReviewService.updateAdminReview(
        id,
        { status, rating, title, body },
        admin?.id || 'SYSTEM',
        meta
      );

      return ApiResponse.success(res, updated, 200, 'Review updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/reviews/:id
   * Delete review by ID
   */
  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = (req as any).admin;
      const { id } = req.params;

      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      await ReviewService.deleteAdminReview(id, admin?.id || 'SYSTEM', meta);

      return ApiResponse.success(res, { deleted: true }, 200, 'Review deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
