import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { CollectionsService } from './collections.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class PublicCollectionsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CollectionsService.listPublicCollections(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const collection = await CollectionsService.getPublicCollectionBySlug(req.params.slug);
      return ApiResponse.success(res, collection);
    } catch (err) {
      next(err);
    }
  }
}
