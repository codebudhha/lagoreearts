import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { CollectionsService } from './collections.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminCollectionsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CollectionsService.listAdminCollections(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await CollectionsService.getCollectionById(req.params.id);
      return ApiResponse.success(res, collection);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const created = await CollectionsService.createCollection(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, created, 201, 'Collection created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await CollectionsService.updateCollection(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Collection updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSort(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await CollectionsService.updateSortOrder(req.params.id, req.body.sortOrder, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Collection sort order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await CollectionsService.deleteCollection(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }
}
