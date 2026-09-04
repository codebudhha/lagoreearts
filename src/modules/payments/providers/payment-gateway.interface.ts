/**
 * Module 21: Payments — Gateway Provider Interface
 * Lagoree Arts Backend
 */

export interface GatewayOrderParams {
  orderId: string;
  orderNumber: string;
  amountInMinor: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  providerOrderId: string;
  amountInMinor: number;
  currency: string;
  clientSecret?: string;
  status: string;
  rawResponse?: any;
}

export interface GatewayVerificationParams {
  providerPaymentId: string;
  providerOrderId?: string;
  providerSignature?: string;
}

export interface GatewayVerificationResult {
  verified: boolean;
  status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  amountInMinor?: number;
  currency?: string;
  paymentMethod?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface WebhookVerificationParams {
  rawBody: Buffer | string;
  signature: string;
  secret: string;
}

export interface WebhookEventPayload {
  eventId: string;
  eventType: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  amountInMinor?: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  rawPayload: any;
}

export interface PaymentGatewayProvider {
  readonly providerName: string;

  /**
   * Creates an order/intent on the payment gateway.
   */
  createPaymentOrder(params: GatewayOrderParams): Promise<GatewayOrderResult>;

  /**
   * Verifies client-side returned payment payload or checks payment status at gateway.
   */
  verifyPayment(params: GatewayVerificationParams): Promise<GatewayVerificationResult>;

  /**
   * Cryptographically verifies incoming webhook signatures using HMAC SHA-256.
   */
  verifyWebhookSignature(params: WebhookVerificationParams): boolean;

  /**
   * Parses gateway-specific webhook payload into normalized structure.
   */
  parseWebhookEvent(body: any): WebhookEventPayload;
}
