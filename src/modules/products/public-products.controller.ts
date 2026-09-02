import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ProductsService } from './products.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class PublicProductsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.listPublicProducts(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.getPublicProductBySlug(req.params.slug);
      return ApiResponse.success(res, product);
    } catch (err) {
      next(err);
    }
  }
}
