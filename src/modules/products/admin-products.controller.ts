import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ProductsService } from './products.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminProductsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.listAdminProducts(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.getProductById(req.params.id);
      return ApiResponse.success(res, product);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const created = await ProductsService.createProduct(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, created, 201, 'Product created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await ProductsService.updateProduct(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await ProductsService.deleteProduct(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await ProductsService.updateStatus(req.params.id, req.body.status, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Product status updated');
    } catch (err) {
      next(err);
    }
  }

  static async updateFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await ProductsService.updateFeatured(req.params.id, req.body.isFeatured, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Product featured status updated');
    } catch (err) {
      next(err);
    }
  }

  static async updateSort(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await ProductsService.updateSortOrder(req.params.id, req.body.sortOrder, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Product sort order updated');
    } catch (err) {
      next(err);
    }
  }

  // --- Collection sub-endpoints ---

  static async getCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const collections = await ProductsService.getProductCollections(req.params.id);
      return ApiResponse.success(res, collections);
    } catch (err) {
      next(err);
    }
  }

  static async setCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const collections = await ProductsService.setProductCollections(req.params.id, req.body.collectionIds, req.admin!.id, meta);
      return ApiResponse.success(res, collections, 200, 'Product collections updated');
    } catch (err) {
      next(err);
    }
  }

  static async addCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const collections = await ProductsService.addProductCollection(req.params.id, req.body.collectionId, req.admin!.id, meta);
      return ApiResponse.success(res, collections, 201, 'Collection assigned to product');
    } catch (err) {
      next(err);
    }
  }

  static async removeCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await ProductsService.removeProductCollection(req.params.id, req.params.collectionId, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  // --- Attribute sub-endpoints ---

  static async getAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const attributes = await ProductsService.getProductAttributes(req.params.id);
      return ApiResponse.success(res, attributes);
    } catch (err) {
      next(err);
    }
  }

  static async setAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const attributes = await ProductsService.setProductAttributes(req.params.id, req.body.attributes, req.admin!.id, meta);
      return ApiResponse.success(res, attributes, 200, 'Product attributes updated');
    } catch (err) {
      next(err);
    }
  }
}
