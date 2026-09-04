/**
 * Module 22: Shipping & Delivery — Core Shipment Service
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import { ShipmentRepository } from './shipment.repository.ts';
import { ShipmentNumberService } from './shipment-number.service.ts';
import { ShippingPolicy } from './shipping.policy.ts';
import { ShippingValidator } from './shipping.validator.ts';
import { ShippingSerializer } from './shipping.serializer.ts';
import { OrderShippingSyncService } from './order-shipping-sync.service.ts';
import { MockShippingProvider } from './providers/mock-shipping.provider.ts';
import type { ShippingProvider } from './providers/shipping-provider.interface.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  ShipmentRecord,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateShipmentTrackingDto,
  CustomerShipmentView,
  AdminShipmentView,
  AdminShipmentListQuery
} from './shipping.types.ts';

export class ShipmentService {
  private static provider: ShippingProvider = new MockShippingProvider();

  public static setProvider(provider: ShippingProvider): void {
    this.provider = provider;
  }

  /**
   * Admin: Creates a shipment for an eligible Order with partial quantity support.
   */
  public static async createShipment(
    orderId: string,
    dto: CreateShipmentDto,
    adminUserId?: string
  ): Promise<AdminShipmentView> {
    if (!ShippingValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const validatedPayload = ShippingValidator.validateCreateShipmentPayload(dto);

    // 1. Fetch Order and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        addresses: true
      }
    });

    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // 2. Validate Order shippability (must be paid and not cancelled)
    ShippingPolicy.assertOrderShippable(order);

    const orderItemsMap = new Map<string, any>();
    for (const itm of order.items || []) {
      orderItemsMap.set(itm.id, itm);
    }

    // 3. Validate items and unshipped quantities
    const itemsToCreate: Array<{ orderItemId: string; quantity: number }> = [];

    for (const reqItem of validatedPayload.items) {
      const orderItem = orderItemsMap.get(reqItem.orderItemId);
      if (!orderItem) {
        const err: any = new Error(`Order item ${reqItem.orderItemId} does not belong to Order ${order.orderNumber}`);
        err.statusCode = 400;
        err.code = 'SHIPMENT_ITEM_INVALID';
        throw err;
      }

      const shippedQty = await ShipmentRepository.getShippedQuantityForOrderItem(reqItem.orderItemId);
      const remainingQty = orderItem.quantity - shippedQty;

      if (reqItem.quantity > remainingQty) {
        const err: any = new Error(
          `Requested quantity (${reqItem.quantity}) exceeds remaining unshipped quantity (${remainingQty}) for product '${orderItem.productName}'.`
        );
        err.statusCode = 400;
        err.code = 'SHIPMENT_QUANTITY_EXCEEDED';
        throw err;
      }

      itemsToCreate.push({
        orderItemId: reqItem.orderItemId,
        quantity: reqItem.quantity
      });
    }

    // 4. Generate unique human-readable shipment number
    const shipmentNumber = await ShipmentNumberService.generateShipmentNumber();

    // 5. Generate tracking number and URL via provider if not provided
    let carrier = validatedPayload.carrier || 'LAGOREE_WHITE_GLOVE';
    let serviceLevel = validatedPayload.serviceLevel || 'EXPRESS_SECURE';
    let trackingNumber = validatedPayload.trackingNumber;
    let trackingUrl = validatedPayload.trackingUrl;
    let estimatedDeliveryDate = validatedPayload.estimatedDeliveryDate;

    if (!trackingNumber) {
      const providerRes = await this.provider.createShipment({
        shipmentNumber,
        orderNumber: order.orderNumber,
        carrier,
        serviceLevel,
        shippingAddress: order.addresses?.find((a: any) => a.type === 'SHIPPING') || {
          fullName: 'Patron',
          addressLine1: 'Address',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          country: 'INDIA',
          phone: '+919876543210'
        },
        items: itemsToCreate.map(i => {
          const oi = orderItemsMap.get(i.orderItemId);
          return {
            sku: oi.sku,
            productName: oi.productName,
            quantity: i.quantity,
            unitPrice: oi.unitPrice
          };
        })
      });

      trackingNumber = providerRes.trackingNumber;
      trackingUrl = providerRes.trackingUrl;
      carrier = providerRes.carrier;
      serviceLevel = providerRes.serviceLevel;
      if (!estimatedDeliveryDate && providerRes.estimatedDeliveryDate) {
        estimatedDeliveryDate = providerRes.estimatedDeliveryDate;
      }
    }

    // 6. Create shipment
    const createdShipment = await ShipmentRepository.createShipment({
      orderId: order.id,
      shipmentNumber,
      carrier,
      serviceLevel,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      items: itemsToCreate,
      event: {
        status: 'PENDING',
        description: 'Shipment created and registered with carrier',
        source: 'ADMIN'
      }
    });

    // 7. Audit log
    AuditService.log({
      action: 'SHIPMENT_CREATED',
      module: 'SHIPPING',
      entityType: 'SHIPMENT',
      entityId: createdShipment.id,
      adminUserId,
      newValues: {
        shipmentNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber,
        carrier,
        itemCount: itemsToCreate.length
      }
    });

    // 8. Synchronize order status
    await OrderShippingSyncService.syncOrderStatus(order.id);

    return ShippingSerializer.toAdminShipmentView(createdShipment);
  }

  /**
   * Admin: Updates shipment status through strict lifecycle state machine.
   */
  public static async updateShipmentStatus(
    shipmentId: string,
    dto: UpdateShipmentStatusDto,
    adminUserId?: string
  ): Promise<AdminShipmentView> {
    if (!ShippingValidator.isValidUuid(shipmentId)) {
      const err: any = new Error('Invalid shipment ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found');
      err.statusCode = 404;
      err.code = 'SHIPMENT_NOT_FOUND';
      throw err;
    }

    // Validate transition
    ShippingPolicy.enforceTransition(shipment.status, dto.status);

    const updated = await ShipmentRepository.updateStatus(shipmentId, dto.status, {
      eventCode: dto.eventCode,
      description: dto.description || `Shipment status updated to ${dto.status}`,
      location: dto.location,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      source: dto.source || 'ADMIN'
    });

    AuditService.log({
      action: 'SHIPMENT_STATUS_CHANGED',
      module: 'SHIPPING',
      entityType: 'SHIPMENT',
      entityId: shipment.id,
      adminUserId,
      oldValues: { status: shipment.status },
      newValues: { status: dto.status, description: dto.description }
    });

    // Synchronize parent order status
    await OrderShippingSyncService.syncOrderStatus(shipment.orderId);

    return ShippingSerializer.toAdminShipmentView(updated!);
  }

  /**
   * Admin: Updates tracking number and URL.
   */
  public static async updateShipmentTracking(
    shipmentId: string,
    dto: UpdateShipmentTrackingDto,
    adminUserId?: string
  ): Promise<AdminShipmentView> {
    if (!ShippingValidator.isValidUuid(shipmentId)) {
      const err: any = new Error('Invalid shipment ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found');
      err.statusCode = 404;
      err.code = 'SHIPMENT_NOT_FOUND';
      throw err;
    }

    const trackingNumber = ShippingValidator.sanitizeText(dto.trackingNumber);
    if (!trackingNumber || trackingNumber.length < 3) {
      const err: any = new Error('A valid tracking number is required');
      err.statusCode = 400;
      err.code = 'TRACKING_NUMBER_INVALID';
      throw err;
    }

    if (dto.trackingUrl && !ShippingValidator.isValidTrackingUrl(dto.trackingUrl)) {
      const err: any = new Error('Invalid or unsafe tracking URL format');
      err.statusCode = 400;
      err.code = 'TRACKING_URL_INVALID';
      throw err;
    }

    const updated = await ShipmentRepository.updateTracking(shipmentId, {
      carrier: dto.carrier ? ShippingValidator.sanitizeText(dto.carrier) : shipment.carrier || undefined,
      serviceLevel: dto.serviceLevel ? ShippingValidator.sanitizeText(dto.serviceLevel) : shipment.serviceLevel || undefined,
      trackingNumber,
      trackingUrl: dto.trackingUrl ? dto.trackingUrl.trim() : shipment.trackingUrl || undefined,
      estimatedDeliveryDate: dto.estimatedDeliveryDate ? new Date(dto.estimatedDeliveryDate) : undefined
    });

    AuditService.log({
      action: 'SHIPMENT_TRACKING_UPDATED',
      module: 'SHIPPING',
      entityType: 'SHIPMENT',
      entityId: shipment.id,
      adminUserId,
      newValues: { trackingNumber, carrier: dto.carrier }
    });

    return ShippingSerializer.toAdminShipmentView(updated!);
  }

  /**
   * Admin / System: Cancels a shipment.
   */
  public static async cancelShipment(
    shipmentId: string,
    reason?: string,
    adminUserId?: string
  ): Promise<AdminShipmentView> {
    if (!ShippingValidator.isValidUuid(shipmentId)) {
      const err: any = new Error('Invalid shipment ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found');
      err.statusCode = 404;
      err.code = 'SHIPMENT_NOT_FOUND';
      throw err;
    }

    ShippingPolicy.enforceTransition(shipment.status, 'CANCELLED');

    const updated = await ShipmentRepository.updateStatus(shipmentId, 'CANCELLED', {
      eventCode: 'SHIPMENT_CANCELLED',
      description: reason ? ShippingValidator.sanitizeText(reason) : 'Shipment cancelled by administrator',
      source: 'ADMIN'
    });

    AuditService.log({
      action: 'SHIPMENT_CANCELLED',
      module: 'SHIPPING',
      entityType: 'SHIPMENT',
      entityId: shipment.id,
      adminUserId,
      newValues: { status: 'CANCELLED', reason }
    });

    await OrderShippingSyncService.syncOrderStatus(shipment.orderId);

    return ShippingSerializer.toAdminShipmentView(updated!);
  }

  /**
   * Customer: Retrieves all shipments associated with an Order with strict IDOR ownership check.
   */
  public static async getCustomerShipments(customerId: string, orderId: string): Promise<CustomerShipmentView[]> {
    if (!ShippingValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.customerId !== customerId) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    const shipments = await ShipmentRepository.findByOrderId(orderId);
    return shipments.map(s => {
      s.order = order;
      return ShippingSerializer.toCustomerShipmentView(s);
    });
  }

  /**
   * Customer: Retrieves single shipment with strict ownership check.
   */
  public static async getCustomerShipmentById(customerId: string, shipmentId: string): Promise<CustomerShipmentView> {
    if (!ShippingValidator.isValidUuid(shipmentId)) {
      const err: any = new Error('Invalid shipment ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment || !shipment.order || shipment.order.customerId !== customerId) {
      const err: any = new Error('Shipment not found');
      err.statusCode = 404;
      err.code = 'SHIPMENT_NOT_FOUND';
      throw err;
    }

    return ShippingSerializer.toCustomerShipmentView(shipment);
  }

  /**
   * Admin: Retrieves single shipment.
   */
  public static async getAdminShipmentById(shipmentId: string): Promise<AdminShipmentView> {
    if (!ShippingValidator.isValidUuid(shipmentId)) {
      const err: any = new Error('Invalid shipment ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found');
      err.statusCode = 404;
      err.code = 'SHIPMENT_NOT_FOUND';
      throw err;
    }

    return ShippingSerializer.toAdminShipmentView(shipment);
  }

  /**
   * Admin: Lists shipments with filtering and pagination.
   */
  public static async listAdminShipments(query: AdminShipmentListQuery): Promise<{
    shipments: AdminShipmentView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await ShipmentRepository.listAdminShipments(query);
    return {
      shipments: result.shipments.map(s => ShippingSerializer.toAdminShipmentView(s)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }
}
