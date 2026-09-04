/**
 * Module 22: Shipping & Delivery — Customer Controller
 * Lagoree Arts Backend
 */

import type { Request, Response } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ShipmentService } from './shipment.service.ts';
import { ShipmentRepository } from './shipment.repository.ts';
import { prisma } from '../../database/prisma.ts';

export class CustomerShippingController {
  /**
   * GET /api/v1/customer/orders/:orderId/shipping
   * Returns historical shipping snapshot and tracking summary for an order.
   */
  public static async getOrderShipping(req: Request, res: Response): Promise<Response> {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Patron authentication required');
      }

      const { orderId } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order || order.customerId !== customer.id) {
        return ApiResponse.notFound(res, 'Order not found');
      }

      const snapshot = await ShipmentRepository.findShippingSnapshotByOrderId(orderId);
      const shipments = await ShipmentService.getCustomerShipments(customer.id, orderId);

      return ApiResponse.success(res, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        snapshot: snapshot ? {
          zoneName: snapshot.zoneName,
          methodName: snapshot.methodName,
          carrier: snapshot.carrier,
          serviceLevel: snapshot.serviceLevel,
          shippingAmount: snapshot.shippingAmount,
          currency: snapshot.currency,
          postalCode: snapshot.postalCode,
          estimatedMinDays: snapshot.estimatedMinDays,
          estimatedMaxDays: snapshot.estimatedMaxDays
        } : null,
        shipments
      });
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/customer/orders/:orderId/shipments
   * Lists all shipments for an order.
   */
  public static async getOrderShipments(req: Request, res: Response): Promise<Response> {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Patron authentication required');
      }

      const { orderId } = req.params;
      const shipments = await ShipmentService.getCustomerShipments(customer.id, orderId);

      return ApiResponse.success(res, shipments);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/customer/shipments/:shipmentId
   * Retrieves single shipment details and tracking events.
   */
  public static async getShipmentById(req: Request, res: Response): Promise<Response> {
    try {
      const customer = (req as any).customer;
      if (!customer || !customer.id) {
        return ApiResponse.unauthenticated(res, 'Patron authentication required');
      }

      const { shipmentId } = req.params;
      const shipment = await ShipmentService.getCustomerShipmentById(customer.id, shipmentId);

      return ApiResponse.success(res, shipment);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }
}
