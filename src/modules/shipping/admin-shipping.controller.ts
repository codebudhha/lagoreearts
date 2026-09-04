/**
 * Module 22: Shipping & Delivery — Admin Controller
 * Lagoree Arts Backend
 */

import type { Request, Response } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ShippingService } from './shipping.service.ts';
import { ShipmentService } from './shipment.service.ts';
import { ShippingZoneRepository } from './shipping-zone.repository.ts';

export class AdminShippingController {
  // ==========================================
  // ZONES
  // ==========================================

  public static async listZones(req: Request, res: Response): Promise<Response> {
    try {
      const query = {
        status: req.query.status ? String(req.query.status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined
      };
      const zones = await ShippingService.listZones(query);
      return ApiResponse.success(res, zones);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async getZoneById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const zone = await ShippingService.getZoneById(id);
      return ApiResponse.success(res, zone);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async createZone(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const created = await ShippingService.createZone(req.body, adminUser?.id);
      return ApiResponse.created(res, created, 'Shipping zone created successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async updateZone(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const updated = await ShippingService.updateZone(id, req.body, adminUser?.id);
      return ApiResponse.success(res, updated, 200, 'Shipping zone updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async deleteZone(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const result = await ShippingService.deleteZone(id, adminUser?.id);
      return ApiResponse.success(res, result, 200, 'Shipping zone deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async addPostalCodesToZone(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const result = await ShippingService.addPostalCodesToZone(id, req.body, adminUser?.id);
      return ApiResponse.success(res, result, 200, 'Postal codes added to zone');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async removePostalCodeFromZone(req: Request, res: Response): Promise<Response> {
    try {
      const { id, postalCode } = req.params;
      const removed = await ShippingZoneRepository.removePostalCode(id, postalCode);
      if (!removed) {
        return ApiResponse.notFound(res, 'Postal code mapping not found in this zone');
      }
      return ApiResponse.success(res, { success: true }, 200, 'Postal code removed from zone');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  // ==========================================
  // METHODS
  // ==========================================

  public static async listMethods(req: Request, res: Response): Promise<Response> {
    try {
      const query = {
        status: req.query.status ? String(req.query.status) : undefined
      };
      const methods = await ShippingService.listMethods(query);
      return ApiResponse.success(res, methods);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async getMethodById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const method = await ShippingService.getMethodById(id);
      return ApiResponse.success(res, method);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async createMethod(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const created = await ShippingService.createMethod(req.body, adminUser?.id);
      return ApiResponse.created(res, created, 'Shipping method created successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async updateMethod(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const updated = await ShippingService.updateMethod(id, req.body, adminUser?.id);
      return ApiResponse.success(res, updated, 200, 'Shipping method updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async deleteMethod(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const result = await ShippingService.deleteMethod(id, adminUser?.id);
      return ApiResponse.success(res, result, 200, 'Shipping method deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  // ==========================================
  // RATES
  // ==========================================

  public static async listRates(req: Request, res: Response): Promise<Response> {
    try {
      const query = {
        shippingZoneId: req.query.shippingZoneId ? String(req.query.shippingZoneId) : undefined,
        shippingMethodId: req.query.shippingMethodId ? String(req.query.shippingMethodId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        currency: req.query.currency ? String(req.query.currency) : undefined
      };
      const rates = await ShippingService.listRates(query);
      return ApiResponse.success(res, rates);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async getRateById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const rate = await ShippingService.getRateById(id);
      return ApiResponse.success(res, rate);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async createRate(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const created = await ShippingService.createRate(req.body, adminUser?.id);
      return ApiResponse.created(res, created, 'Shipping rate created successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async updateRate(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const updated = await ShippingService.updateRate(id, req.body, adminUser?.id);
      return ApiResponse.success(res, updated, 200, 'Shipping rate updated successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async deleteRate(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const result = await ShippingService.deleteRate(id, adminUser?.id);
      return ApiResponse.success(res, result, 200, 'Shipping rate deleted successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  // ==========================================
  // SHIPMENTS
  // ==========================================

  public static async listShipments(req: Request, res: Response): Promise<Response> {
    try {
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        orderId: req.query.orderId ? String(req.query.orderId) : undefined,
        orderNumber: req.query.orderNumber ? String(req.query.orderNumber) : undefined,
        shipmentNumber: req.query.shipmentNumber ? String(req.query.shipmentNumber) : undefined,
        trackingNumber: req.query.trackingNumber ? String(req.query.trackingNumber) : undefined,
        carrier: req.query.carrier ? String(req.query.carrier) : undefined,
        status: req.query.status as any,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };
      const result = await ShipmentService.listAdminShipments(query);
      return ApiResponse.paginated(res, result.shipments, result.page, result.limit, result.total);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async getShipmentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const shipment = await ShipmentService.getAdminShipmentById(id);
      return ApiResponse.success(res, shipment);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async createShipment(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { orderId } = req.params;
      const created = await ShipmentService.createShipment(orderId, req.body, adminUser?.id);
      return ApiResponse.created(res, created, 'Shipment created successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async updateShipmentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const updated = await ShipmentService.updateShipmentStatus(id, req.body, adminUser?.id);
      return ApiResponse.success(res, updated, 200, 'Shipment status updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async updateShipmentTracking(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const updated = await ShipmentService.updateShipmentTracking(id, req.body, adminUser?.id);
      return ApiResponse.success(res, updated, 200, 'Shipment tracking updated');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  public static async cancelShipment(req: Request, res: Response): Promise<Response> {
    try {
      const adminUser = (req as any).adminUser;
      const { id } = req.params;
      const reason = req.body?.reason;
      const cancelled = await ShipmentService.cancelShipment(id, reason, adminUser?.id);
      return ApiResponse.success(res, cancelled, 200, 'Shipment cancelled successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }
}
