/**
 * Module 22: Shipping & Delivery — Business Policy & Lifecycle Rules
 * Lagoree Arts Backend
 */

import type { ShipmentStatus } from './shipping.types.ts';

export class ShippingPolicy {
  /**
   * Shipment Lifecycle State Machine
   */
  private static readonly ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    PENDING: ['READY', 'CANCELLED', 'FAILED'],
    READY: ['LABEL_CREATED', 'PICKED_UP', 'CANCELLED', 'FAILED'],
    LABEL_CREATED: ['PICKED_UP', 'CANCELLED', 'FAILED'],
    PICKED_UP: ['IN_TRANSIT', 'FAILED'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
    DELIVERED: ['RETURNED'],
    RETURNED: [],
    CANCELLED: [],
    FAILED: []
  };

  /**
   * Validates whether a state transition from currentStatus to targetStatus is legally permitted.
   */
  public static canTransition(current: ShipmentStatus, target: ShipmentStatus): boolean {
    if (current === target) return true;
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Asserts valid shipment state transition or throws a 409 conflict error.
   */
  public static enforceTransition(current: ShipmentStatus, target: ShipmentStatus): void {
    if (!this.canTransition(current, target)) {
      const err: any = new Error(
        `Invalid shipment status transition from '${current}' to '${target}'.`
      );
      err.statusCode = 409;
      err.code = 'INVALID_SHIPMENT_STATUS_TRANSITION';
      throw err;
    }
  }

  /**
   * Asserts an Order is eligible for shipment creation.
   * By default: Order must be PAID and not CANCELLED or FAILED.
   */
  public static assertOrderShippable(order: {
    status: string;
    paymentStatus: string;
    id: string;
  }): void {
    if (order.status === 'CANCELLED' || order.status === 'FAILED') {
      const err: any = new Error(`Order ${order.id} is in status '${order.status}' and cannot be shipped.`);
      err.statusCode = 409;
      err.code = 'ORDER_NOT_SHIPPABLE';
      throw err;
    }

    if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'AUTHORIZED') {
      const err: any = new Error(`Order ${order.id} has payment status '${order.paymentStatus}'. Payment is required before shipment.`);
      err.statusCode = 409;
      err.code = 'ORDER_NOT_PAID';
      throw err;
    }
  }
}
