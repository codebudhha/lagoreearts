import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { CustomerService } from './customer.service.ts';
import { CustomerAddressService } from './customer-address.service.ts';

export class CustomerController {
  // ==========================================
  // Profile Handlers
  // ==========================================

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const profile = await CustomerService.getProfile(customerId);
      return ApiResponse.success(res, profile, 200, 'Customer profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await CustomerService.updateProfile(customerId, req.body, { ipAddress, userAgent });

      const responsePayload: any = {
        customer: result.customer
      };

      if (process.env.NODE_ENV !== 'production' && result.verificationToken) {
        responsePayload.verificationToken = result.verificationToken;
      }

      return ApiResponse.success(res, responsePayload, 200, 'Customer profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Address Book Handlers
  // ==========================================

  static async listAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const addresses = await CustomerAddressService.listAddresses(customerId);
      return ApiResponse.success(res, addresses, 200, 'Customer addresses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAddressById(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const address = await CustomerAddressService.getAddressById(customerId, req.params.id);
      return ApiResponse.success(res, address, 200, 'Customer address retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const created = await CustomerAddressService.createAddress(customerId, req.body, { ipAddress, userAgent });
      return ApiResponse.success(res, created, 201, 'Address added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await CustomerAddressService.updateAddress(customerId, req.params.id, req.body, { ipAddress, userAgent });
      return ApiResponse.success(res, updated, 200, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const deleted = await CustomerAddressService.deleteAddress(customerId, req.params.id, { ipAddress, userAgent });
      return ApiResponse.success(res, deleted, 200, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultShipping(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await CustomerAddressService.setDefaultShipping(customerId, req.params.id, { ipAddress, userAgent });
      return ApiResponse.success(res, updated, 200, 'Default shipping address updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultBilling(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await CustomerAddressService.setDefaultBilling(customerId, req.params.id, { ipAddress, userAgent });
      return ApiResponse.success(res, updated, 200, 'Default billing address updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
