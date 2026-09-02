import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { AttributesService } from './attributes.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AttributesController {
  // --- Admin Attribute Endpoints ---

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AttributesService.listAdminAttributes(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const attribute = await AttributesService.getAttributeById(req.params.id);
      return ApiResponse.success(res, attribute);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const created = await AttributesService.createAttribute(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, created, 201, 'Attribute created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await AttributesService.updateAttribute(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Attribute updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AttributesService.deleteAttribute(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  // --- Admin Attribute Value Endpoints ---

  static async listValues(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AttributesService.listAttributeValues(req.params.attributeId, req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createValue(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const created = await AttributesService.createAttributeValue(req.params.attributeId, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, created, 201, 'Attribute value created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateValue(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await AttributesService.updateAttributeValue(req.params.attributeId, req.params.valueId, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, updated, 200, 'Attribute value updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteValue(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AttributesService.deleteAttributeValue(req.params.attributeId, req.params.valueId, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  // --- Public Storefront Endpoint ---

  static async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const attributes = await AttributesService.listPublicAttributes();
      return ApiResponse.success(res, attributes);
    } catch (err) {
      next(err);
    }
  }
}
