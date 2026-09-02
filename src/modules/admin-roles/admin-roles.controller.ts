import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { AdminRolesService } from './admin-roles.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminRolesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminRolesService.listRoles();
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminRolesService.getRoleById(req.params.id);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminRolesService.createRole(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, result, 201, 'Role created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminRolesService.updateRole(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, result, 200, 'Role updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminRolesService.deleteRole(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async listPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminRolesService.listPermissions(req.query.module as string);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
