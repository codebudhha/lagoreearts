/**
 * Module 21: Payments — Repository Layer
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  PaymentAttemptRecord,
  PaymentFilterQuery,
  PaymentRecord,
  PaymentRefundRecord,
  PaymentStatus,
  PaymentWebhookEventRecord
} from './payment.types.ts';

export class PaymentRepository {
  private static mapPayment(row: any): PaymentRecord | null {
    if (!row) return null;
    return {
      id: row.id,
      orderId: row.orderId || row.order_id,
      provider: row.provider,
      providerOrderId: row.providerOrderId ?? row.provider_order_id ?? null,
      providerPaymentId: row.providerPaymentId ?? row.provider_payment_id ?? null,
      providerSignature: row.providerSignature ?? row.provider_signature ?? null,
      amount: row.amount,
      currency: row.currency || 'INR',
      status: row.status,
      idempotencyKey: row.idempotencyKey ?? row.idempotency_key ?? null,
      clientSecret: row.clientSecret ?? row.client_secret ?? null,
      paymentMethod: row.paymentMethod ?? row.method ?? null,
      capturedAt: row.capturedAt || row.paidAt || row.paid_at || null,
      failedAt: row.failedAt || row.failed_at || null,
      cancelledAt: row.cancelledAt || row.cancelled_at || null,
      failureReason: row.failureReason || row.failureMessage || row.failure_message || null,
      metadata: row.metadata || null,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
      attempts: row.attempts,
      refunds: row.refunds
    };
  }

  public static async findById(
    id: string,
    includeOptions: { attempts?: boolean; refunds?: boolean } = { attempts: true, refunds: true }
  ): Promise<PaymentRecord | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        attempts: includeOptions.attempts,
        refunds: includeOptions.refunds
      }
    });

    return this.mapPayment(payment);
  }

  public static async findByIdempotencyKey(key: string): Promise<PaymentRecord | null> {
    const payment = await prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: {
        attempts: true,
        refunds: true
      }
    });

    return this.mapPayment(payment);
  }

  public static async findByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const payments = await prisma.payment.findMany({
      where: { orderId },
      include: {
        attempts: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return payments.map(this.mapPayment) as PaymentRecord[];
  }

  public static async findLatestByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        attempts: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return this.mapPayment(payment);
  }

  public static async findByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null> {
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId },
      include: {
        attempts: true,
        refunds: true
      }
    });

    return this.mapPayment(payment);
  }

  public static async findByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null> {
    const payment = await prisma.payment.findUnique({
      where: { providerOrderId },
      include: {
        attempts: true,
        refunds: true
      }
    });

    return this.mapPayment(payment);
  }

  public static async create(data: {
    orderId: string;
    provider: string;
    providerOrderId?: string | null;
    amount: number | string;
    currency: string;
    status: PaymentStatus;
    idempotencyKey?: string | null;
    clientSecret?: string | null;
    metadata?: any;
  }): Promise<PaymentRecord> {
    const created = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        providerOrderId: data.providerOrderId ?? null,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        idempotencyKey: data.idempotencyKey ?? null,
        clientSecret: data.clientSecret ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      },
      include: {
        attempts: true,
        refunds: true
      }
    });

    return this.mapPayment(created) as PaymentRecord;
  }

  public static async update(
    id: string,
    data: {
      status?: PaymentStatus;
      providerPaymentId?: string | null;
      providerOrderId?: string | null;
      providerSignature?: string | null;
      paymentMethod?: string | null;
      capturedAt?: Date | string | null;
      failedAt?: Date | string | null;
      cancelledAt?: Date | string | null;
      failureReason?: string | null;
      metadata?: any;
    }
  ): Promise<PaymentRecord> {
    const updatePayload: any = {};
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.providerPaymentId !== undefined) updatePayload.providerPaymentId = data.providerPaymentId;
    if (data.providerOrderId !== undefined) updatePayload.providerOrderId = data.providerOrderId;
    if (data.paymentMethod !== undefined) updatePayload.method = data.paymentMethod;
    if (data.capturedAt !== undefined) updatePayload.paidAt = data.capturedAt;
    if (data.failedAt !== undefined) updatePayload.failedAt = data.failedAt;
    if (data.failureReason !== undefined) updatePayload.failureMessage = data.failureReason;
    if (data.metadata !== undefined) {
      updatePayload.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: updatePayload,
      include: {
        attempts: true,
        refunds: true
      }
    });

    return this.mapPayment(updated) as PaymentRecord;
  }

  public static async createAttempt(data: {
    paymentId: string;
    attemptNumber?: number;
    status: string;
    rawRequest?: any;
    rawResponse?: any;
    errorCode?: string | null;
    errorMessage?: string | null;
  }): Promise<PaymentAttemptRecord> {
    const created = await prisma.paymentAttempt.create({
      data: {
        paymentId: data.paymentId,
        status: data.status,
        failureCode: data.errorCode ?? null,
        failureMessage: data.errorMessage ?? null,
        rawResponseSanitized: data.rawResponse ? (typeof data.rawResponse === 'string' ? data.rawResponse : JSON.stringify(data.rawResponse)) : null
      }
    });

    return created as PaymentAttemptRecord;
  }

  public static async findWebhookEvent(provider: string, eventId: string): Promise<PaymentWebhookEventRecord | null> {
    const event = await prisma.paymentWebhookEvent.findFirst({
      where: {
        provider,
        eventId
      }
    });

    return event as PaymentWebhookEventRecord | null;
  }

  public static async createWebhookEvent(data: {
    provider: string;
    eventId: string;
    eventType: string;
    payload: any;
    processed: boolean;
    processedAt?: Date | string | null;
    error?: string | null;
  }): Promise<PaymentWebhookEventRecord> {
    const payloadStr = typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload);
    const created = await prisma.paymentWebhookEvent.create({
      data: {
        provider: data.provider,
        eventId: data.eventId,
        eventType: data.eventType,
        payloadHash: payloadStr,
        signatureVerified: true,
        processedAt: data.processedAt ?? null
      }
    });

    return created as PaymentWebhookEventRecord;
  }

  public static async updateWebhookEvent(
    id: string,
    data: {
      processed?: boolean;
      processedAt?: Date | string | null;
      error?: string | null;
    }
  ): Promise<PaymentWebhookEventRecord> {
    const updated = await prisma.paymentWebhookEvent.update({
      where: { id },
      data: {
        processedAt: data.processedAt ? new Date(data.processedAt) : data.processed ? new Date() : null
      }
    });

    return updated as PaymentWebhookEventRecord;
  }

  public static async createRefund(data: {
    paymentId: string;
    providerRefundId?: string | null;
    amount: number | string;
    currency: string;
    status: string;
    reason?: string | null;
  }): Promise<PaymentRefundRecord> {
    const refund = await prisma.paymentRefund.create({
      data: {
        paymentId: data.paymentId,
        providerRefundId: data.providerRefundId ?? null,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        reason: data.reason ?? null
      }
    });

    return refund as PaymentRefundRecord;
  }

  public static async findMany(filter: PaymentFilterQuery): Promise<{ payments: PaymentRecord[]; total: number }> {
    const where: any = {};

    if (filter.status) where.status = filter.status;
    if (filter.provider) where.provider = filter.provider;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filter.sortBy || 'createdAt']: filter.sortDir || 'desc' },
        include: {
          attempts: true,
          refunds: true
        }
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments: payments.map(this.mapPayment) as PaymentRecord[],
      total
    };
  }
}
