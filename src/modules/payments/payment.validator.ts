/**
 * Module 21: Payments — Input Validation & Sanitization
 * Lagoree Arts Backend
 */

import type { PaymentFilterQuery, PaymentProvider, PaymentStatus } from './payment.types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_STATUSES: PaymentStatus[] = [
  'CREATED',
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
];

const VALID_PROVIDERS: PaymentProvider[] = ['MOCK', 'RAZORPAY'];

export class PaymentValidator {
  public static isValidUuid(id: unknown): boolean {
    return typeof id === 'string' && UUID_REGEX.test(id.trim());
  }

  public static validateUuid(id: unknown, fieldName: string = 'ID'): string {
    if (!this.isValidUuid(id)) {
      const err: any = new Error(`Invalid ${fieldName} format`);
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }
    return (id as string).trim();
  }

  public static validateInitiatePayload(body: any): {
    provider?: PaymentProvider;
    idempotencyKey?: string;
  } {
    if (!body || typeof body !== 'object') {
      return {};
    }

    let provider: PaymentProvider | undefined;
    if (body.provider !== undefined && body.provider !== null) {
      const p = String(body.provider).toUpperCase();
      if (!VALID_PROVIDERS.includes(p as PaymentProvider)) {
        const err: any = new Error(`Unsupported payment provider '${body.provider}'`);
        err.statusCode = 400;
        err.code = 'UNSUPPORTED_PROVIDER';
        throw err;
      }
      provider = p as PaymentProvider;
    }

    let idempotencyKey: string | undefined;
    if (body.idempotencyKey !== undefined && body.idempotencyKey !== null) {
      if (typeof body.idempotencyKey !== 'string' || !body.idempotencyKey.trim()) {
        const err: any = new Error('Invalid idempotencyKey');
        err.statusCode = 400;
        err.code = 'INVALID_IDEMPOTENCY_KEY';
        throw err;
      }
      idempotencyKey = body.idempotencyKey.trim();
    }

    return { provider, idempotencyKey };
  }

  public static validateVerifyPayload(body: any): {
    providerPaymentId: string;
    providerOrderId?: string;
    providerSignature?: string;
  } {
    if (!body || typeof body !== 'object') {
      const err: any = new Error('Request body is required for payment verification');
      err.statusCode = 400;
      err.code = 'INVALID_VERIFICATION_PAYLOAD';
      throw err;
    }

    const { providerPaymentId, razorpay_payment_id, providerOrderId, razorpay_order_id, providerSignature, razorpay_signature } = body;

    const paymentId = providerPaymentId || razorpay_payment_id;
    if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
      const err: any = new Error('providerPaymentId (or razorpay_payment_id) is required');
      err.statusCode = 400;
      err.code = 'MISSING_PAYMENT_ID';
      throw err;
    }

    const orderId = providerOrderId || razorpay_order_id;
    const signature = providerSignature || razorpay_signature;

    return {
      providerPaymentId: String(paymentId).trim(),
      providerOrderId: orderId ? String(orderId).trim() : undefined,
      providerSignature: signature ? String(signature).trim() : undefined
    };
  }

  public static parseAdminListQuery(query: any): PaymentFilterQuery {
    const page = Math.max(1, parseInt(query?.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit as string, 10) || 20));

    let status: PaymentStatus | undefined;
    if (query?.status) {
      const st = String(query.status).toUpperCase();
      if (VALID_STATUSES.includes(st as PaymentStatus)) {
        status = st as PaymentStatus;
      }
    }

    let provider: string | undefined;
    if (query?.provider) {
      provider = String(query.provider).toUpperCase().trim();
    }

    let orderId: string | undefined;
    if (query?.orderId) {
      orderId = String(query.orderId).trim();
    }

    let startDate: string | undefined;
    if (query?.startDate) {
      const parsed = new Date(query.startDate);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed.toISOString();
      }
    }

    let endDate: string | undefined;
    if (query?.endDate) {
      const parsed = new Date(query.endDate);
      if (!isNaN(parsed.getTime())) {
        endDate = parsed.toISOString();
      }
    }

    let sortBy: 'createdAt' | 'amount' | 'status' = 'createdAt';
    if (['createdAt', 'amount', 'status'].includes(query?.sortBy)) {
      sortBy = query.sortBy;
    }

    let sortDir: 'asc' | 'desc' = 'desc';
    if (query?.sortDir?.toLowerCase() === 'asc') {
      sortDir = 'asc';
    }

    return {
      page,
      limit,
      status,
      provider,
      orderId,
      startDate,
      endDate,
      sortBy,
      sortDir
    };
  }
}
