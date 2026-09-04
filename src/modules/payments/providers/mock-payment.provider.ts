/**
 * Module 21: Payments — Mock Gateway Provider
 * Lagoree Arts Backend
 * 
 * Provides deterministic gateway emulation for automated tests and offline development.
 */

import crypto from 'node:crypto';
import type {
  GatewayOrderParams,
  GatewayOrderResult,
  GatewayVerificationParams,
  GatewayVerificationResult,
  PaymentGatewayProvider,
  WebhookEventPayload,
  WebhookVerificationParams
} from './payment-gateway.interface.ts';

export class MockPaymentGatewayProvider implements PaymentGatewayProvider {
  public readonly providerName = 'MOCK';

  public async createPaymentOrder(params: GatewayOrderParams): Promise<GatewayOrderResult> {
    const providerOrderId = `order_mock_${params.orderNumber}_${Date.now()}`;
    return {
      providerOrderId,
      amountInMinor: params.amountInMinor,
      currency: params.currency,
      clientSecret: `mock_secret_${providerOrderId}`,
      status: 'created',
      rawResponse: {
        id: providerOrderId,
        entity: 'order',
        amount: params.amountInMinor,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created'
      }
    };
  }

  public async verifyPayment(params: GatewayVerificationParams): Promise<GatewayVerificationResult> {
    const paymentId = params.providerPaymentId;

    if (paymentId.startsWith('pay_fail_')) {
      return {
        verified: false,
        status: 'FAILED',
        errorCode: 'PAYMENT_FAILED_AT_GATEWAY',
        errorMessage: 'The mock payment was explicitly instructed to fail'
      };
    }

    if (paymentId.startsWith('pay_auth_')) {
      return {
        verified: true,
        status: 'AUTHORIZED',
        amountInMinor: 10000,
        currency: 'INR',
        paymentMethod: 'card'
      };
    }

    // Default success capture
    return {
      verified: true,
      status: 'CAPTURED',
      paymentMethod: 'upi',
      rawResponse: {
        id: paymentId,
        status: 'captured',
        method: 'upi'
      }
    };
  }

  public verifyWebhookSignature(params: WebhookVerificationParams): boolean {
    const { rawBody, signature, secret } = params;
    if (!signature || !secret) return false;

    // Direct match bypass for simple mock tests if signature is 'mock_valid_signature'
    if (signature === 'mock_valid_signature') return true;

    try {
      const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyBuffer)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
    } catch {
      return false;
    }
  }

  public parseWebhookEvent(body: any): WebhookEventPayload {
    const eventId = body?.event_id || body?.id || `evt_mock_${Date.now()}`;
    const eventType = body?.event || body?.event_type || 'payment.captured';
    const payload = body?.payload?.payment?.entity || body?.payload || body;

    return {
      eventId,
      eventType,
      providerPaymentId: payload?.id || payload?.payment_id,
      providerOrderId: payload?.order_id,
      amountInMinor: payload?.amount,
      currency: payload?.currency || 'INR',
      status: payload?.status,
      paymentMethod: payload?.method,
      rawPayload: body
    };
  }
}
