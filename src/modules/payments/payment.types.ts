/**
 * Module 21: Payments — Domain Types & Interfaces
 * Lagoree Arts Backend
 */

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentProvider = 'MOCK' | 'RAZORPAY';

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string; // 'MOCK' | 'RAZORPAY'
  providerOrderId: string | null;
  providerPaymentId: string | null;
  providerSignature: string | null;
  amount: number | string; // Commercial order grandTotal (authoritative)
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string | null;
  clientSecret: string | null;
  paymentMethod: string | null;
  capturedAt: Date | string | null;
  failedAt: Date | string | null;
  cancelledAt: Date | string | null;
  failureReason: string | null;
  metadata: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  attempts?: PaymentAttemptRecord[];
  refunds?: PaymentRefundRecord[];
}

export interface PaymentAttemptRecord {
  id: string;
  paymentId: string;
  attemptNumber: number;
  status: string;
  rawRequest: string | null;
  rawResponse: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date | string;
}

export interface PaymentWebhookEventRecord {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  payload: string;
  processed: boolean;
  processedAt: Date | string | null;
  error: string | null;
  createdAt: Date | string;
}

export interface PaymentRefundRecord {
  id: string;
  paymentId: string;
  providerRefundId: string | null;
  amount: number | string;
  currency: string;
  status: string;
  reason: string | null;
  createdAt: Date | string;
}

export interface InitiatePaymentDTO {
  provider?: PaymentProvider;
  idempotencyKey?: string;
}

export interface VerifyPaymentDTO {
  providerPaymentId: string;
  providerOrderId?: string;
  providerSignature?: string;
}

export interface CustomerPaymentView {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  amount: number;
  amountInMinor: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string | null;
  keyId?: string;
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentView {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string | null;
  paymentMethod: string | null;
  capturedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  attempts?: Array<{
    id: string;
    attemptNumber: number;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  refunds?: Array<{
    id: string;
    providerRefundId: string | null;
    amount: number;
    currency: string;
    status: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export interface PaymentFilterQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  provider?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortDir?: 'asc' | 'desc';
}
