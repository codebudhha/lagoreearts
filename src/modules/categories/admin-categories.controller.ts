import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { CategoriesService } from './categories.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminCategoriesController {
  /**
   * GET /api/v1/admin/categories
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoriesService.listAdminCategories(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories/tree
   */
  static async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await CategoriesService.getCategoryTree(false); // include inactive for admin
      return ApiResponse.success(res, tree);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.getCategoryById(req.params.id);
      return ApiResponse.success(res, category);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories/:id/children
   */
  static async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.getCategoryById(req.params.id);
      const children = (category as any).children || [];
      return ApiResponse.success(res, children);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/categories/:id/ancestors
   */
  static async getAncestors(req: Request, res: Response, next: NextFunction) {
    try {
      const ancestors = await CategoriesService.getAncestors(req.params.id);
      return ApiResponse.success(res, ancestors);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/categories
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const created = await CategoriesService.createCategory(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, created, 201, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/categories/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await CategoriesService.updateCategory(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/categories/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await CategoriesService.deleteCategory(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }
}
