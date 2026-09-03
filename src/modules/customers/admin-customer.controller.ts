import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { CustomerService } from './customer.service.ts';

export class AdminCustomerController {
  static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CustomerService.listAdminCustomers(req.query);
      return ApiResponse.success(res, result, 200, 'Customers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getAdminCustomerById(req.params.id);
      return ApiResponse.success(res, customer, 200, 'Customer retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).adminUser?.id || (req as any).admin?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await CustomerService.updateAdminCustomer(
        req.params.id,
        req.body,
        adminUserId,
        { ipAddress, userAgent }
      );
      return ApiResponse.success(res, updated, 200, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).adminUser?.id || (req as any).admin?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await CustomerService.updateCustomerStatus(
        req.params.id,
        req.body.status,
        adminUserId,
        { ipAddress, userAgent }
      );
      return ApiResponse.success(res, updated, 200, 'Customer status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const addresses = await CustomerService.getCustomerAddressesByAdmin(req.params.id);
      return ApiResponse.success(res, addresses, 200, 'Customer addresses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await CustomerService.getCustomerSessionsByAdmin(req.params.id);
      return ApiResponse.success(res, sessions, 200, 'Customer sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async revokeCustomerSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).adminUser?.id || (req as any).admin?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await CustomerService.revokeCustomerSessionsByAdmin(
        req.params.id,
        adminUserId,
        { ipAddress, userAgent }
      );
      return ApiResponse.success(res, result, 200, 'Customer sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }
}
