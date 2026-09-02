import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { MediaService } from './media.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminEntityMediaController {
  /* ========================================================================
   * PRODUCT MEDIA
   * ======================================================================== */

  static async listProductMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await MediaService.listProductMedia(req.params.productId || req.params.id);
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async attachProductMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const attached = await MediaService.attachProductMedia(
        req.params.productId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, attached, 201, 'Media attached to product successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachProductMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await MediaService.detachProductMedia(
        req.params.productId || req.params.id,
        req.params.mediaId,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, result, 200, 'Media detached from product successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderProductMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const items = await MediaService.reorderProductMedia(
        req.params.productId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, items, 200, 'Product media reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
   * VARIANT MEDIA
   * ======================================================================== */

  static async listVariantMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await MediaService.listVariantMedia(req.params.variantId || req.params.id);
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async attachVariantMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const attached = await MediaService.attachVariantMedia(
        req.params.variantId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, attached, 201, 'Media attached to variant successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachVariantMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await MediaService.detachVariantMedia(
        req.params.variantId || req.params.id,
        req.params.mediaId,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, result, 200, 'Media detached from variant successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderVariantMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const items = await MediaService.reorderVariantMedia(
        req.params.variantId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, items, 200, 'Variant media reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
   * CATEGORY MEDIA
   * ======================================================================== */

  static async listCategoryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await MediaService.listCategoryMedia(req.params.categoryId || req.params.id);
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async attachCategoryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const attached = await MediaService.attachCategoryMedia(
        req.params.categoryId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, attached, 201, 'Media attached to category successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachCategoryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await MediaService.detachCategoryMedia(
        req.params.categoryId || req.params.id,
        req.params.mediaId,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, result, 200, 'Media detached from category successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderCategoryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const items = await MediaService.reorderCategoryMedia(
        req.params.categoryId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, items, 200, 'Category media reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
   * COLLECTION MEDIA
   * ======================================================================== */

  static async listCollectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await MediaService.listCollectionMedia(req.params.collectionId || req.params.id);
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  static async attachCollectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const attached = await MediaService.attachCollectionMedia(
        req.params.collectionId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, attached, 201, 'Media attached to collection successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachCollectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await MediaService.detachCollectionMedia(
        req.params.collectionId || req.params.id,
        req.params.mediaId,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, result, 200, 'Media detached from collection successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderCollectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const items = await MediaService.reorderCollectionMedia(
        req.params.collectionId || req.params.id,
        req.body,
        req.admin?.id,
        meta
      );
      return ApiResponse.success(res, items, 200, 'Collection media reordered successfully');
    } catch (err) {
      next(err);
    }
  }
}
