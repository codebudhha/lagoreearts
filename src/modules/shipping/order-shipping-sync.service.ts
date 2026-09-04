/**
 * Module 22: Shipping & Delivery — Order ↔ Shipment Synchronization Service
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import { ShipmentRepository } from './shipment.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';

export class OrderShippingSyncService {
  /**
   * Synchronizes the parent Order status based on the coverage and lifecycle of its shipments.
   */
  public static async syncOrderStatus(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return;

    // Critical: Never overwrite CANCELLED or FAILED orders through shipment sync
    if (order.status === 'CANCELLED' || order.status === 'FAILED') {
      return;
    }

    const shipments = await ShipmentRepository.findByOrderId(orderId);
    if (shipments.length === 0) return;

    const nonCancelledShipments = shipments.filter(s => s.status !== 'CANCELLED');
    if (nonCancelledShipments.length === 0) return;

    const hasInTransitOrPickedUp = nonCancelledShipments.some(s =>
      ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s.status)
    );

    // Check if 100% of order items are delivered across shipments
    const orderItems = order.items || [];
    let allItemsDelivered = orderItems.length > 0;

    for (const item of orderItems) {
      // Calculate quantity delivered for this orderItem across all DELIVERED shipments
      let deliveredQty = 0;
      for (const s of nonCancelledShipments) {
        if (s.status === 'DELIVERED') {
          const matchingShipmentItems = (s.items || []).filter(si => si.orderItemId === item.id);
          for (const mi of matchingShipmentItems) {
            deliveredQty += mi.quantity;
          }
        }
      }
      if (deliveredQty < item.quantity) {
        allItemsDelivered = false;
        break;
      }
    }

    const now = new Date();

    if (allItemsDelivered && order.status !== 'DELIVERED') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: order.deliveredAt || now
        }
      });

      AuditService.log({
        action: 'ORDER_STATUS_CHANGED',
        module: 'ORDERS',
        entityType: 'ORDER',
        entityId: order.id,
        oldValues: { status: order.status },
        newValues: { status: 'DELIVERED', reason: 'All shipments successfully delivered' }
      });
    } else if (hasInTransitOrPickedUp && order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          shippedAt: order.shippedAt || now
        }
      });

      AuditService.log({
        action: 'ORDER_STATUS_CHANGED',
        module: 'ORDERS',
        entityType: 'ORDER',
        entityId: order.id,
        oldValues: { status: order.status },
        newValues: { status: 'SHIPPED', reason: 'Shipment in transit' }
      });
    }
  }
}
