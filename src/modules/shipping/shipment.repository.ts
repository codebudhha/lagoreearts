/**
 * Module 22: Shipping & Delivery — Shipment Repository
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  ShipmentRecord,
  ShipmentStatus,
  ShipmentEventSource,
  AdminShipmentListQuery,
  OrderShippingSnapshotRecord
} from './shipping.types.ts';

export class ShipmentRepository {
  public static async findById(id: string): Promise<ShipmentRecord | null> {
    return prisma.shipment.findUnique({
      where: { id },
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      }
    });
  }

  public static async findByShipmentNumber(shipmentNumber: string): Promise<ShipmentRecord | null> {
    return prisma.shipment.findUnique({
      where: { shipmentNumber },
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      }
    });
  }

  public static async findByOrderId(orderId: string): Promise<ShipmentRecord[]> {
    return prisma.shipment.findMany({
      where: { orderId },
      include: {
        items: { include: { orderItem: true } },
        events: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async listAdminShipments(query: AdminShipmentListQuery): Promise<{
    shipments: ShipmentRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.orderId) where.orderId = query.orderId;
    if (query.status) where.status = query.status;
    if (query.carrier) where.carrier = query.carrier;
    if (query.trackingNumber) where.trackingNumber = query.trackingNumber;
    if (query.shipmentNumber) where.shipmentNumber = { contains: query.shipmentNumber };

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });

    const total = await prisma.shipment.count({ where });
    const totalPages = Math.ceil(total / limit);

    return {
      shipments,
      total,
      page,
      limit,
      totalPages
    };
  }

  public static async createShipment(params: {
    orderId: string;
    shipmentNumber: string;
    carrier?: string;
    serviceLevel?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDeliveryDate?: Date;
    items: Array<{ orderItemId: string; quantity: number }>;
    event?: {
      status: string;
      description?: string;
      source?: ShipmentEventSource;
    };
  }): Promise<ShipmentRecord> {
    const shipment = await prisma.shipment.create({
      data: {
        orderId: params.orderId,
        shipmentNumber: params.shipmentNumber,
        carrier: params.carrier || null,
        serviceLevel: params.serviceLevel || null,
        trackingNumber: params.trackingNumber || null,
        trackingUrl: params.trackingUrl || null,
        status: 'PENDING',
        estimatedDeliveryDate: params.estimatedDeliveryDate || null,
        items: {
          create: params.items.map(i => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity
          }))
        },
        events: params.event ? {
          create: [{
            status: params.event.status,
            description: params.event.description || 'Shipment created',
            source: params.event.source || 'ADMIN',
            occurredAt: new Date()
          }]
        } : undefined
      },
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      }
    });

    return shipment;
  }

  public static async updateStatus(
    id: string,
    status: ShipmentStatus,
    eventData?: {
      eventCode?: string;
      description?: string;
      location?: string;
      occurredAt?: Date;
      source?: ShipmentEventSource;
    }
  ): Promise<ShipmentRecord | null> {
    const now = new Date();
    const updateData: any = { status };

    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      updateData.shippedAt = now;
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = now;
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      }
    });

    if (eventData || status) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: id,
          status,
          eventCode: eventData?.eventCode || null,
          description: eventData?.description || `Status updated to ${status}`,
          location: eventData?.location || null,
          occurredAt: eventData?.occurredAt || now,
          source: eventData?.source || 'ADMIN'
        }
      });
    }

    return this.findById(id);
  }

  public static async updateTracking(
    id: string,
    data: {
      carrier?: string;
      serviceLevel?: string;
      trackingNumber: string;
      trackingUrl?: string;
      estimatedDeliveryDate?: Date;
    }
  ): Promise<ShipmentRecord | null> {
    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        carrier: data.carrier,
        serviceLevel: data.serviceLevel,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        estimatedDeliveryDate: data.estimatedDeliveryDate
      },
      include: {
        items: { include: { orderItem: true } },
        events: true,
        order: true
      }
    });

    await prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: updated?.status || 'PENDING',
        eventCode: 'TRACKING_ASSIGNED',
        description: `Tracking number assigned: ${data.trackingNumber}`,
        occurredAt: new Date(),
        source: 'ADMIN'
      }
    });

    return this.findById(id);
  }

  public static async getShippedQuantityForOrderItem(orderItemId: string): Promise<number> {
    // Sum quantities from all shipments for this orderItem that are NOT cancelled
    const shipmentItems = await prisma.shipmentItem.findMany({
      where: { orderItemId }
    });

    let shippedTotal = 0;
    for (const si of shipmentItems) {
      const parentShipment = await prisma.shipment.findUnique({
        where: { id: si.shipmentId }
      });
      if (parentShipment && parentShipment.status !== 'CANCELLED') {
        shippedTotal += si.quantity;
      }
    }

    return shippedTotal;
  }

  // Snapshot persistence
  public static async createShippingSnapshot(data: {
    orderId: string;
    zoneCode: string;
    zoneName: string;
    methodCode: string;
    methodName: string;
    carrier?: string | null;
    serviceLevel?: string | null;
    estimatedMinDays?: number | null;
    estimatedMaxDays?: number | null;
    shippingAmount: number;
    currency?: string;
    postalCode: string;
  }): Promise<OrderShippingSnapshotRecord> {
    return prisma.orderShippingSnapshot.create({
      data: {
        orderId: data.orderId,
        zoneCode: data.zoneCode,
        zoneName: data.zoneName,
        methodCode: data.methodCode,
        methodName: data.methodName,
        carrier: data.carrier || null,
        serviceLevel: data.serviceLevel || null,
        estimatedMinDays: data.estimatedMinDays,
        estimatedMaxDays: data.estimatedMaxDays,
        shippingAmount: data.shippingAmount,
        currency: data.currency || 'INR',
        postalCode: data.postalCode
      }
    });
  }

  public static async findShippingSnapshotByOrderId(orderId: string): Promise<OrderShippingSnapshotRecord | null> {
    return prisma.orderShippingSnapshot.findUnique({
      where: { orderId }
    });
  }
}
