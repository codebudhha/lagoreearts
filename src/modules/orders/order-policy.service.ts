/**
 * Module 20: Orders — Order Policy & State Machine Service
 * Lagoree Arts Backend
 */

import type { OrderRecord, OrderStatus, PaymentStatus } from './order.types.ts';

export class OrderPolicyService {
  /**
   * Legal status transitions mapping:
   * PENDING -> CONFIRMED, CANCELLED, FAILED
   * CONFIRMED -> PROCESSING, CANCELLED
   * PROCESSING -> SHIPPED, CANCELLED
   * SHIPPED -> DELIVERED
   * Terminal states (DELIVERED, CANCELLED, FAILED) have no outgoing transitions.
   */
  private static readonly LEGAL_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED', 'FAILED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    FAILED: []
  };

  /**
   * Validates whether a requested order status transition is permissible.
   * Returns true if allowed, false otherwise.
   */
  public static isValidStatusTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const allowed = this.LEGAL_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Asserts status transition or throws an error with HTTP status code metadata.
   */
  public static assertValidStatusTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void {
    if (!this.isValidStatusTransition(currentStatus, targetStatus)) {
      const err: any = new Error(
        `Cannot transition order status from '${currentStatus}' to '${targetStatus}'. Transition is not permitted.`
      );
      err.statusCode = 409;
      err.code = 'INVALID_ORDER_STATUS_TRANSITION';
      throw err;
    }
  }

  /**
   * Determines if a customer is allowed to self-cancel an order.
   * Only orders in PENDING status are eligible for customer cancellation.
   */
  public static canCustomerCancel(order: OrderRecord): boolean {
    return order.status === 'PENDING';
  }

  /**
   * Sanitizes order cancellation reason string.
   */
  public static sanitizeReason(reason?: string): string | null {
    if (!reason || typeof reason !== 'string') return null;
    const trimmed = reason.trim();
    if (!trimmed) return null;
    return trimmed.substring(0, 500);
  }

  /**
   * Sanitizes administrative operational notes.
   */
  public static sanitizeNotes(notes?: string): string | null {
    if (!notes || typeof notes !== 'string') return null;
    const trimmed = notes.trim();
    if (!trimmed) return null;
    return trimmed.substring(0, 1000);
  }
}
