import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { CategoryFiltersService } from './category-filters.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class CategoryFiltersController {
  // --- Admin Endpoints ---

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await CategoryFiltersService.listAdminCategoryAttributes(req.params.categoryId);
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async add(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const binding = await CategoryFiltersService.addCategoryAttribute(
        req.params.categoryId,
        req.body,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, binding, 201, 'Attribute mapped to category filter successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await CategoryFiltersService.updateCategoryAttribute(
        req.params.categoryId,
        req.params.attributeId,
        req.body,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, updated, 200, 'Category filter configuration updated');
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await CategoryFiltersService.removeCategoryAttribute(
        req.params.categoryId,
        req.params.attributeId,
        req.admin!.id,
        meta
      );
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  // --- Public Storefront Endpoint ---

  static async getPublicFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CategoryFiltersService.getPublicCategoryFilters(req.params.slug);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}
