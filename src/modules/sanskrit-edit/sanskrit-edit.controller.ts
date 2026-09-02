import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { SanskritEditService } from './sanskrit-edit.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminSanskritEditController {
  static async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const profile = await SanskritEditService.createProfile(productId, req.body, adminUserId, meta);
      return ApiResponse.success(res, profile, 201, 'Sanskrit Edit profile created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const profile = await SanskritEditService.getProfile(productId);
      return ApiResponse.success(res, profile, 200, 'Sanskrit Edit profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await SanskritEditService.updateProfile(productId, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Sanskrit Edit profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      await SanskritEditService.deleteProfile(productId, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Sanskrit Edit profile deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        search,
        theme,
        source,
        isFeatured,
        isPublished,
        categoryId,
        collectionId,
        status,
        sortBy,
        sortOrder
      } = req.query as any;

      const result = await SanskritEditService.listAdminProfiles({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        theme,
        source,
        isFeatured: isFeatured !== undefined ? isFeatured === 'true' || isFeatured === true : undefined,
        isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : undefined,
        categoryId,
        collectionId,
        status,
        sortBy,
        sortOrder
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorderProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      await SanskritEditService.reorderProfiles(req.body, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Sanskrit Edit display order updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export class PublicSanskritEditController {
  static async listProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        search,
        theme,
        source,
        featured,
        categoryId,
        collectionId,
        sortBy,
        sortOrder
      } = req.query as any;

      const result = await SanskritEditService.listPublicProfiles({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        theme,
        source,
        featured: featured !== undefined ? featured === 'true' || featured === true : undefined,
        categoryId,
        collectionId,
        sortBy,
        sortOrder
      });

      return ApiResponse.success(res, result.items, 200, 'Public Sanskrit Edit catalogue retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
