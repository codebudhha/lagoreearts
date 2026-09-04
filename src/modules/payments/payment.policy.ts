/**
 * Module 21: Payments — Payment Policy & State Machine Rules
 * Lagoree Arts Backend
 */

import type { PaymentStatus } from './payment.types.ts';

export class PaymentPolicy {
  /**
   * Validates whether an order's status and payment status allow initiating payment.
   */
  public static validateOrderPayability(order: {
    status: string;
    paymentStatus: string;
    grandTotal: number | string;
  }): { payable: boolean; reason?: string; code?: string } {
    if (order.paymentStatus === 'PAID') {
      return {
        payable: false,
        reason: 'Order has already been paid',
        code: 'ORDER_ALREADY_PAID'
      };
    }

    if (order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED') {
      return {
        payable: false,
        reason: 'Order payment has been refunded',
        code: 'ORDER_ALREADY_REFUNDED'
      };
    }

    if (['CANCELLED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      return {
        payable: false,
        reason: `Cannot pay for an order in '${order.status}' status`,
        code: 'ORDER_NOT_PAYABLE'
      };
    }

    const total = Number(order.grandTotal);
    if (isNaN(total) || total <= 0) {
      return {
        payable: false,
        reason: 'Order grand total must be greater than zero',
        code: 'INVALID_ORDER_AMOUNT'
      };
    }

    return { payable: true };
  }

  /**
   * Validates whether a payment record transition from currentStatus to targetStatus is valid.
   */
  public static canTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    if (currentStatus === targetStatus) return true;

    switch (currentStatus) {
      case 'CREATED':
        return ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'].includes(targetStatus);
      case 'PENDING':
        return ['AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'].includes(targetStatus);
      case 'AUTHORIZED':
        return ['CAPTURED', 'FAILED', 'CANCELLED'].includes(targetStatus);
      case 'CAPTURED':
        return ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(targetStatus);
      case 'PARTIALLY_REFUNDED':
        return ['REFUNDED'].includes(targetStatus);
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return false; // Terminal states
      default:
        return false;
    }
  }

  /**
   * Enforces transition validation and throws HTTP 409 if invalid.
   */
  public static enforceTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      const err: any = new Error(`Cannot transition payment from '${currentStatus}' to '${targetStatus}'`);
      err.statusCode = 409;
      err.code = 'INVALID_PAYMENT_STATUS_TRANSITION';
      throw err;
    }
  }
}
