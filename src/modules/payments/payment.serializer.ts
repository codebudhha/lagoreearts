/**
 * Module 21: Payments — Serializer & View Mappings
 * Lagoree Arts Backend
 */

import { PaymentCurrencyHelper } from './payment-currency.ts';
import type { AdminPaymentView, CustomerPaymentView, PaymentRecord } from './payment.types.ts';
import { ENV } from '../../config/env.ts';

export class PaymentSerializer {
  /**
   * Serializes payment record for customer consumption.
   * Strips internal secrets, signatures, raw diagnostic payloads.
   */
  public static toCustomerView(payment: PaymentRecord): CustomerPaymentView {
    const amountNumber = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);
    const amountInMinor = PaymentCurrencyHelper.toMinorUnits(amountNumber, payment.currency);

    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      amount: amountNumber,
      amountInMinor,
      currency: payment.currency,
      status: payment.status,
      clientSecret: payment.clientSecret || undefined,
      keyId: payment.provider === 'RAZORPAY' ? (ENV.RAZORPAY_KEY_ID || 'rzp_test_mockkey') : undefined,
      capturedAt: payment.capturedAt ? new Date(payment.capturedAt).toISOString() : null,
      createdAt: new Date(payment.createdAt).toISOString(),
      updatedAt: new Date(payment.updatedAt).toISOString()
    };
  }

  /**
   * Serializes payment record for admin auditing and management.
   */
  public static toAdminView(payment: PaymentRecord): AdminPaymentView {
    const amountNumber = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);

    let parsedMetadata: any = null;
    if (payment.metadata) {
      try {
        parsedMetadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
      } catch {
        parsedMetadata = payment.metadata;
      }
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      providerPaymentId: payment.providerPaymentId,
      amount: amountNumber,
      currency: payment.currency,
      status: payment.status,
      idempotencyKey: payment.idempotencyKey,
      paymentMethod: payment.paymentMethod,
      capturedAt: payment.capturedAt ? new Date(payment.capturedAt).toISOString() : null,
      failedAt: payment.failedAt ? new Date(payment.failedAt).toISOString() : null,
      cancelledAt: payment.cancelledAt ? new Date(payment.cancelledAt).toISOString() : null,
      failureReason: payment.failureReason,
      metadata: parsedMetadata,
      createdAt: new Date(payment.createdAt).toISOString(),
      updatedAt: new Date(payment.updatedAt).toISOString(),
      attempts: payment.attempts?.map((att) => ({
        id: att.id,
        attemptNumber: att.attemptNumber,
        status: att.status,
        errorCode: att.errorCode,
        errorMessage: att.errorMessage,
        createdAt: new Date(att.createdAt).toISOString()
      })),
      refunds: payment.refunds?.map((ref) => ({
        id: ref.id,
        providerRefundId: ref.providerRefundId,
        amount: typeof ref.amount === 'string' ? parseFloat(ref.amount) : Number(ref.amount),
        currency: ref.currency,
        status: ref.status,
        reason: ref.reason,
        createdAt: new Date(ref.createdAt).toISOString()
      }))
    };
  }
}
