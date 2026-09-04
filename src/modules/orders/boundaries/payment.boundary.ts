/**
 * Module 20: Orders — Payment Boundary Interface
 * Lagoree Arts Backend
 * 
 * Provides clean decoupling for Module 21 (Payments).
 * Module 20 contains no payment gateway logic.
 */

import type { OrderRecord, PaymentStatus } from '../order.types.ts';

export interface PaymentStateProvider {
  /**
   * Initializes payment record/intent state for a newly created order.
   */
  initializePaymentForOrder(order: OrderRecord): Promise<{
    paymentStatus: PaymentStatus;
    paymentIntentId?: string;
  }>;

  /**
   * Verifies whether a payment status transition is permitted.
   */
  canTransitionPaymentStatus(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean;
}

/**
 * Default Payment State Adapter for Module 20.
 * Sets initial state to PENDING and validates legal state transitions.
 */
export class DefaultPaymentStateProvider implements PaymentStateProvider {
  public async initializePaymentForOrder(order: OrderRecord): Promise<{
    paymentStatus: PaymentStatus;
    paymentIntentId?: string;
  }> {
    return {
      paymentStatus: 'PENDING'
    };
  }

  public canTransitionPaymentStatus(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    if (currentStatus === targetStatus) return true;

    switch (currentStatus) {
      case 'PENDING':
        return ['AUTHORIZED', 'PAID', 'FAILED'].includes(targetStatus);
      case 'AUTHORIZED':
        return ['PAID', 'FAILED'].includes(targetStatus);
      case 'PAID':
        return ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(targetStatus);
      case 'PARTIALLY_REFUNDED':
        return ['REFUNDED'].includes(targetStatus);
      case 'FAILED':
      case 'REFUNDED':
        return false; // Terminal payment states
      default:
        return false;
    }
  }
}
