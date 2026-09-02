import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { AntiquesService } from './antiques.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminAntiqueController {
  static async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AntiquesService.createProfile(productId, req.body, req.admin?.id, meta);
      return ApiResponse.success(res, result, 201, 'Antique profile created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const result = await AntiquesService.getProfile(productId);
      return ApiResponse.success(res, result, 200, 'Antique profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AntiquesService.updateProfile(productId, req.body, req.admin?.id, meta);
      return ApiResponse.success(res, result, 200, 'Antique profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AntiquesService.deleteProfile(productId, req.admin?.id, meta);
      return ApiResponse.success(res, result, 200, 'Antique profile deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listAntiques(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AntiquesService.listAdminAntiques(req.query as any);
      return ApiResponse.success(res, result, 200, 'Antiques list retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

export class PublicAntiqueController {
  static async listAntiques(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AntiquesService.listPublicAntiques(req.query as any);
      return ApiResponse.success(res, result.items, 200, 'Antiques catalog retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
