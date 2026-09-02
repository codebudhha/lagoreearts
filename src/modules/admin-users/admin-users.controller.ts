import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { AdminUsersService } from './admin-users.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminUsersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminUsersService.listUsers(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminUsersService.getUserById(req.params.id);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminUsersService.createUser(req.body, req.admin!.id, meta);
      return ApiResponse.success(res, result, 201, 'Admin user created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminUsersService.updateUser(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, result, 200, 'Admin user updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminUsersService.updateStatus(req.params.id, req.body, req.admin!.id, meta);
      return ApiResponse.success(res, result, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminUsersService.deleteUser(req.params.id, req.admin!.id, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }
}
