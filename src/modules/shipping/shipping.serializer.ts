/**
 * Module 22: Shipping & Delivery — Serializers
 * Lagoree Arts Backend
 */

import type {
  ShipmentRecord,
  CustomerShipmentView,
  AdminShipmentView,
  ShippingZoneRecord,
  ShippingMethodRecord,
  ShippingRateRecord
} from './shipping.types.ts';

export class ShippingSerializer {
  public static toCustomerShipmentView(shipment: any): CustomerShipmentView {
    return {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      orderId: shipment.orderId,
      orderNumber: shipment.order?.orderNumber,
      carrier: shipment.carrier || null,
      serviceLevel: shipment.serviceLevel || null,
      trackingNumber: shipment.trackingNumber || null,
      trackingUrl: shipment.trackingUrl || null,
      status: shipment.status,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate
        ? (shipment.estimatedDeliveryDate instanceof Date ? shipment.estimatedDeliveryDate.toISOString() : new Date(shipment.estimatedDeliveryDate).toISOString())
        : null,
      shippedAt: shipment.shippedAt
        ? (shipment.shippedAt instanceof Date ? shipment.shippedAt.toISOString() : new Date(shipment.shippedAt).toISOString())
        : null,
      deliveredAt: shipment.deliveredAt
        ? (shipment.deliveredAt instanceof Date ? shipment.deliveredAt.toISOString() : new Date(shipment.deliveredAt).toISOString())
        : null,
      createdAt: shipment.createdAt instanceof Date ? shipment.createdAt.toISOString() : new Date(shipment.createdAt).toISOString(),
      items: (shipment.items || []).map((itm: any) => ({
        id: itm.id,
        orderItemId: itm.orderItemId,
        sku: itm.orderItem?.sku,
        productName: itm.orderItem?.productName,
        variantDescription: itm.orderItem?.variantDescription || null,
        quantity: Number(itm.quantity)
      })),
      events: (shipment.events || []).map((evt: any) => ({
        id: evt.id,
        status: evt.status,
        eventCode: evt.eventCode || null,
        description: evt.description || null,
        location: evt.location || null,
        occurredAt: evt.occurredAt instanceof Date ? evt.occurredAt.toISOString() : new Date(evt.occurredAt).toISOString(),
        source: evt.source
      }))
    };
  }

  public static toAdminShipmentView(shipment: any): AdminShipmentView {
    const customerView = this.toCustomerShipmentView(shipment);
    return {
      ...customerView,
      updatedAt: shipment.updatedAt instanceof Date ? shipment.updatedAt.toISOString() : new Date(shipment.updatedAt).toISOString(),
      order: shipment.order ? {
        id: shipment.order.id,
        orderNumber: shipment.order.orderNumber,
        status: shipment.order.status,
        paymentStatus: shipment.order.paymentStatus,
        email: shipment.order.email,
        customerId: shipment.order.customerId
      } : undefined
    };
  }

  public static toZoneView(zone: ShippingZoneRecord): any {
    return {
      id: zone.id,
      name: zone.name,
      code: zone.code,
      description: zone.description,
      status: zone.status,
      priority: zone.priority,
      createdAt: zone.createdAt instanceof Date ? zone.createdAt.toISOString() : new Date(zone.createdAt).toISOString(),
      updatedAt: zone.updatedAt instanceof Date ? zone.updatedAt.toISOString() : new Date(zone.updatedAt).toISOString(),
      postalCodesCount: zone.postalCodes ? zone.postalCodes.length : undefined,
      postalCodes: zone.postalCodes ? zone.postalCodes.map(p => ({
        id: p.id,
        postalCode: p.postalCode,
        city: p.city,
        state: p.state,
        status: p.status
      })) : undefined
    };
  }

  public static toMethodView(method: ShippingMethodRecord): any {
    return {
      id: method.id,
      name: method.name,
      code: method.code,
      description: method.description,
      carrier: method.carrier,
      serviceLevel: method.serviceLevel,
      status: method.status,
      estimatedMinDays: method.estimatedMinDays,
      estimatedMaxDays: method.estimatedMaxDays,
      sortOrder: method.sortOrder,
      createdAt: method.createdAt instanceof Date ? method.createdAt.toISOString() : new Date(method.createdAt).toISOString(),
      updatedAt: method.updatedAt instanceof Date ? method.updatedAt.toISOString() : new Date(method.updatedAt).toISOString()
    };
  }

  public static toRateView(rate: ShippingRateRecord): any {
    return {
      id: rate.id,
      shippingZoneId: rate.shippingZoneId,
      shippingMethodId: rate.shippingMethodId,
      minOrderValue: rate.minOrderValue,
      maxOrderValue: rate.maxOrderValue,
      minWeight: rate.minWeight,
      maxWeight: rate.maxWeight,
      amount: rate.amount,
      currency: rate.currency,
      status: rate.status,
      priority: rate.priority,
      zone: rate.zone ? {
        id: rate.zone.id,
        name: rate.zone.name,
        code: rate.zone.code
      } : undefined,
      method: rate.method ? {
        id: rate.method.id,
        name: rate.method.name,
        code: rate.method.code
      } : undefined,
      createdAt: rate.createdAt instanceof Date ? rate.createdAt.toISOString() : new Date(rate.createdAt).toISOString(),
      updatedAt: rate.updatedAt instanceof Date ? rate.updatedAt.toISOString() : new Date(rate.updatedAt).toISOString()
    };
  }
}
