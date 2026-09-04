/**
 * Module 21: Payments — Core Orchestration Service
 * Lagoree Arts Backend
 */

import { ENV } from '../../config/env.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { OrderRepository } from '../orders/order.repository.ts';
import { PaymentRepository } from './payment.repository.ts';
import { PaymentCurrencyHelper } from './payment-currency.ts';
import { PaymentPolicy } from './payment.policy.ts';
import { PaymentSerializer } from './payment.serializer.ts';
import { PaymentValidator } from './payment.validator.ts';
import type {
  AdminPaymentView,
  CustomerPaymentView,
  InitiatePaymentDTO,
  PaymentFilterQuery,
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
  VerifyPaymentDTO
} from './payment.types.ts';
import type { PaymentGatewayProvider } from './providers/payment-gateway.interface.ts';
import { MockPaymentGatewayProvider } from './providers/mock-payment.provider.ts';
import { RazorpayPaymentGatewayProvider } from './providers/razorpay-payment.provider.ts';

export class PaymentService {
  private static providers: Map<string, PaymentGatewayProvider> = new Map([
    ['MOCK', new MockPaymentGatewayProvider()],
    ['RAZORPAY', new RazorpayPaymentGatewayProvider()]
  ]);

  /**
   * Registers or overrides a gateway provider instance.
   */
  public static setGatewayProvider(name: string, provider: PaymentGatewayProvider): void {
    this.providers.set(name.toUpperCase(), provider);
  }

  /**
   * Resolves a gateway provider by name, defaulting to env or MOCK.
   */
  public static getGatewayProvider(name?: string): PaymentGatewayProvider {
    const key = (name || ENV.PAYMENT_PROVIDER || 'MOCK').toUpperCase();
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`Payment provider '${key}' is not configured`);
    }
    return provider;
  }

  /**
   * Customer: Initiates a payment session for an order.
   * Derives authoritative amount strictly from Order.grandTotal.
   */
  public static async initiatePayment(
    orderId: string,
    customerId: string | null = null,
    dto?: InitiatePaymentDTO
  ): Promise<CustomerPaymentView> {
    const validOrderId = PaymentValidator.validateUuid(orderId, 'Order ID');
    const validatedDto = PaymentValidator.validateInitiatePayload(dto);

    // 1. Fetch Order and verify ownership
    const order = await OrderRepository.findById(validOrderId);
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // IDOR protection: if authenticated customer, must match order customerId
    if (customerId && order.customerId && order.customerId !== customerId) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // 2. Validate Order payability
    const payability = PaymentPolicy.validateOrderPayability(order);
    if (!payability.payable) {
      const err: any = new Error(payability.reason || 'Order is not payable');
      err.statusCode = 409;
      err.code = payability.code || 'ORDER_NOT_PAYABLE';
      throw err;
    }

    // 3. Idempotency Key check
    if (validatedDto.idempotencyKey) {
      const existingByIdempotency = await PaymentRepository.findByIdempotencyKey(validatedDto.idempotencyKey);
      if (existingByIdempotency) {
        if (existingByIdempotency.orderId !== order.id) {
          const err: any = new Error('Idempotency key already used for a different order');
          err.statusCode = 409;
          err.code = 'IDEMPOTENCY_CONFLICT';
          throw err;
        }
        return PaymentSerializer.toCustomerView(existingByIdempotency);
      }
    }

    // 4. Resolve Gateway and convert exact minor currency units (paise)
    const providerName: PaymentProvider = validatedDto.provider || (ENV.PAYMENT_PROVIDER as PaymentProvider) || 'MOCK';
    const gateway = this.getGatewayProvider(providerName);
    const amountInMinor = PaymentCurrencyHelper.toMinorUnits(order.grandTotal, order.currency);

    // 5. Create Order / Intent on Gateway
    const gatewayOrder = await gateway.createPaymentOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountInMinor,
      currency: order.currency,
      receipt: `rcpt_${order.orderNumber}`
    });

    // 6. Persist Payment Record in DB
    const payment = await PaymentRepository.create({
      orderId: order.id,
      provider: gateway.providerName,
      providerOrderId: gatewayOrder.providerOrderId,
      amount: order.grandTotal,
      currency: order.currency,
      status: 'CREATED',
      idempotencyKey: validatedDto.idempotencyKey || null,
      clientSecret: gatewayOrder.clientSecret || null,
      metadata: {
        rawResponse: gatewayOrder.rawResponse
      }
    });

    // 7. Record Payment Attempt #1
    await PaymentRepository.createAttempt({
      paymentId: payment.id,
      attemptNumber: 1,
      status: 'INITIATED',
      rawRequest: {
        orderId: order.id,
        amountInMinor,
        currency: order.currency
      },
      rawResponse: gatewayOrder.rawResponse
    });

    return PaymentSerializer.toCustomerView(payment);
  }

  /**
   * Customer: Client-side verification after checkout completion.
   */
  public static async verifyPayment(
    orderId: string,
    customerId: string | null = null,
    dto: VerifyPaymentDTO
  ): Promise<CustomerPaymentView> {
    const validOrderId = PaymentValidator.validateUuid(orderId, 'Order ID');
    const validatedDto = PaymentValidator.validateVerifyPayload(dto);

    // 1. Fetch Order and verify ownership
    const order = await OrderRepository.findById(validOrderId);
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    if (customerId && order.customerId && order.customerId !== customerId) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // 2. Fetch Payment record
    let payment: PaymentRecord | null = null;
    if (validatedDto.providerOrderId) {
      payment = await PaymentRepository.findByProviderOrderId(validatedDto.providerOrderId);
    }
    if (!payment) {
      payment = await PaymentRepository.findLatestByOrderId(order.id);
    }

    if (!payment) {
      const err: any = new Error('No payment initiation found for this order');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    // Idempotent: If already captured, return existing view
    if (payment.status === 'CAPTURED') {
      return PaymentSerializer.toCustomerView(payment);
    }

    // 3. Verify via gateway
    const gateway = this.getGatewayProvider(payment.provider);
    const verification = await gateway.verifyPayment({
      providerPaymentId: validatedDto.providerPaymentId,
      providerOrderId: payment.providerOrderId || validatedDto.providerOrderId,
      providerSignature: validatedDto.providerSignature
    });

    const nextAttemptNumber = (payment.attempts?.length || 0) + 1;

    if (verification.verified && verification.status === 'CAPTURED') {
      PaymentPolicy.enforceTransition(payment.status, 'CAPTURED');

      const updatedPayment = await PaymentRepository.update(payment.id, {
        status: 'CAPTURED',
        providerPaymentId: validatedDto.providerPaymentId,
        providerSignature: validatedDto.providerSignature || null,
        paymentMethod: verification.paymentMethod || 'online',
        capturedAt: new Date()
      });

      await PaymentRepository.createAttempt({
        paymentId: payment.id,
        attemptNumber: nextAttemptNumber,
        status: 'CAPTURED',
        rawRequest: validatedDto,
        rawResponse: verification.rawResponse
      });

      // Synchronize Order paymentStatus to PAID
      await OrderRepository.updatePaymentStatus(order.id, 'PAID', 'Payment verified and captured');

      AuditService.log({
        action: 'PAYMENT_CAPTURED',
        module: 'PAYMENTS',
        entityType: 'PAYMENT',
        entityId: payment.id,
        newValues: {
          orderId: order.id,
          providerPaymentId: validatedDto.providerPaymentId,
          amount: payment.amount,
          status: 'CAPTURED'
        }
      });

      return PaymentSerializer.toCustomerView(updatedPayment);
    } else {
      // Payment verification failed
      PaymentPolicy.enforceTransition(payment.status, 'FAILED');

      const updatedPayment = await PaymentRepository.update(payment.id, {
        status: 'FAILED',
        providerPaymentId: validatedDto.providerPaymentId,
        failureReason: verification.errorMessage || 'Verification failed',
        failedAt: new Date()
      });

      await PaymentRepository.createAttempt({
        paymentId: payment.id,
        attemptNumber: nextAttemptNumber,
        status: 'FAILED',
        rawRequest: validatedDto,
        errorCode: verification.errorCode || 'VERIFICATION_FAILED',
        errorMessage: verification.errorMessage || 'Verification failed',
        rawResponse: verification.rawResponse
      });

      const err: any = new Error(verification.errorMessage || 'Payment verification failed');
      err.statusCode = 400;
      err.code = verification.errorCode || 'PAYMENT_VERIFICATION_FAILED';
      err.payment = PaymentSerializer.toCustomerView(updatedPayment);
      throw err;
    }
  }

  /**
   * Webhook: Handles asynchronous payment notifications from gateways.
   * Cryptographically verifies signature on raw body, ensures strict idempotency.
   */
  public static async handleWebhook(
    providerName: string,
    rawBody: Buffer | string,
    signature: string,
    body: any
  ): Promise<{ status: string; eventId: string; processed: boolean }> {
    const gateway = this.getGatewayProvider(providerName);
    const secret =
      providerName.toUpperCase() === 'RAZORPAY'
        ? ENV.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret'
        : 'mock_webhook_secret';

    // 1. Cryptographic HMAC Signature Verification
    const isValidSignature = gateway.verifyWebhookSignature({
      rawBody,
      signature,
      secret
    });

    if (!isValidSignature) {
      const err: any = new Error('Cryptographic signature verification failed');
      err.statusCode = 401;
      err.code = 'INVALID_WEBHOOK_SIGNATURE';
      throw err;
    }

    // 2. Parse Event Payload
    const parsedEvent = gateway.parseWebhookEvent(body);

    // 3. Deduplication check in payment_webhook_events
    const existingEvent = await PaymentRepository.findWebhookEvent(gateway.providerName, parsedEvent.eventId);
    if (existingEvent && (existingEvent.processed || existingEvent.processedAt)) {
      return {
        status: 'ignored',
        eventId: parsedEvent.eventId,
        processed: true
      };
    }

    // Record initial webhook event if not already recorded
    let webhookRecord = existingEvent;
    if (!webhookRecord) {
      try {
        webhookRecord = await PaymentRepository.createWebhookEvent({
          provider: gateway.providerName,
          eventId: parsedEvent.eventId,
          eventType: parsedEvent.eventType,
          payload: body,
          processed: false
        });
      } catch {
        // Concurrently created by another request
        webhookRecord = await PaymentRepository.findWebhookEvent(gateway.providerName, parsedEvent.eventId);
        if (webhookRecord && (webhookRecord.processed || webhookRecord.processedAt)) {
          return {
            status: 'ignored',
            eventId: parsedEvent.eventId,
            processed: true
          };
        }
      }
    }

    try {
      // 4. Process event actions
      if (['payment.captured', 'order.paid', 'captured'].includes(parsedEvent.eventType.toLowerCase())) {
        let payment: PaymentRecord | null = null;
        if (parsedEvent.providerPaymentId) {
          payment = await PaymentRepository.findByProviderPaymentId(parsedEvent.providerPaymentId);
        }
        if (!payment && parsedEvent.providerOrderId) {
          payment = await PaymentRepository.findByProviderOrderId(parsedEvent.providerOrderId);
        }

        if (payment && payment.status !== 'CAPTURED') {
          // Verify amount match if present in webhook
          if (parsedEvent.amountInMinor !== undefined) {
            const expectedMinor = PaymentCurrencyHelper.toMinorUnits(payment.amount, payment.currency);
            if (Number(parsedEvent.amountInMinor) !== expectedMinor) {
              const mismatchErr = `Amount mismatch in webhook: expected ${expectedMinor} paise, got ${parsedEvent.amountInMinor} paise`;
              await PaymentRepository.updateWebhookEvent(webhookRecord.id, {
                processed: true,
                processedAt: new Date(),
                error: mismatchErr
              });
              const err: any = new Error(mismatchErr);
              err.statusCode = 400;
              err.code = 'AMOUNT_MISMATCH';
              throw err;
            }
          }

          // Update Payment status to CAPTURED
          PaymentPolicy.enforceTransition(payment.status, 'CAPTURED');
          await PaymentRepository.update(payment.id, {
            status: 'CAPTURED',
            providerPaymentId: parsedEvent.providerPaymentId || payment.providerPaymentId,
            paymentMethod: parsedEvent.paymentMethod || payment.paymentMethod || 'online',
            capturedAt: new Date()
          });

          // Sync Order payment status to PAID
          await OrderRepository.updatePaymentStatus(payment.orderId, 'PAID', 'Captured via webhook');

          AuditService.log({
            action: 'PAYMENT_WEBHOOK_CAPTURED',
            module: 'PAYMENTS',
            entityType: 'PAYMENT',
            entityId: payment.id,
            newValues: {
              eventId: parsedEvent.eventId,
              provider: gateway.providerName,
              status: 'CAPTURED'
            }
          });
        }
      } else if (['payment.failed', 'failed'].includes(parsedEvent.eventType.toLowerCase())) {
        let payment: PaymentRecord | null = null;
        if (parsedEvent.providerPaymentId) {
          payment = await PaymentRepository.findByProviderPaymentId(parsedEvent.providerPaymentId);
        }
        if (!payment && parsedEvent.providerOrderId) {
          payment = await PaymentRepository.findByProviderOrderId(parsedEvent.providerOrderId);
        }

        if (payment && payment.status !== 'FAILED') {
          PaymentPolicy.enforceTransition(payment.status, 'FAILED');
          await PaymentRepository.update(payment.id, {
            status: 'FAILED',
            failureReason: 'Failed via gateway webhook',
            failedAt: new Date()
          });
        }
      }

      // Mark webhook event as processed
      if (webhookRecord?.id) {
        await PaymentRepository.updateWebhookEvent(webhookRecord.id, {
          processed: true,
          processedAt: new Date(),
          error: null
        });
      }

      return {
        status: 'processed',
        eventId: parsedEvent.eventId,
        processed: true
      };
    } catch (processError: any) {
      if (webhookRecord?.id) {
        await PaymentRepository.updateWebhookEvent(webhookRecord.id, {
          processed: false,
          error: processError.message || 'Error processing webhook event'
        });
      }
      throw processError;
    }
  }

  /**
   * Customer: Retrieves latest payment status for their order.
   */
  public static async getCustomerPayment(orderId: string, customerId: string): Promise<CustomerPaymentView> {
    const validOrderId = PaymentValidator.validateUuid(orderId, 'Order ID');
    const order = await OrderRepository.findById(validOrderId);

    if (!order || (order.customerId && order.customerId !== customerId)) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    const payment = await PaymentRepository.findLatestByOrderId(order.id);
    if (!payment) {
      const err: any = new Error('No payment records found for this order');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    return PaymentSerializer.toCustomerView(payment);
  }

  /**
   * Admin: Retrieves full payment detail by ID.
   */
  public static async getAdminPayment(paymentId: string): Promise<AdminPaymentView> {
    const validId = PaymentValidator.validateUuid(paymentId, 'Payment ID');
    const payment = await PaymentRepository.findById(validId);

    if (!payment) {
      const err: any = new Error('Payment not found');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    return PaymentSerializer.toAdminView(payment);
  }

  /**
   * Admin: Lists paginated payments with dynamic filtering.
   */
  public static async listAdminPayments(
    query: PaymentFilterQuery
  ): Promise<{ payments: AdminPaymentView[]; page: number; limit: number; total: number }> {
    const filter = PaymentValidator.parseAdminListQuery(query);
    const { payments, total } = await PaymentRepository.findMany(filter);

    return {
      payments: payments.map(PaymentSerializer.toAdminView),
      page: filter.page || 1,
      limit: filter.limit || 20,
      total
    };
  }

  /**
   * Admin: Manual payment reconciliation.
   */
  public static async reconcilePayment(paymentId: string, adminUserId: string): Promise<AdminPaymentView> {
    const validId = PaymentValidator.validateUuid(paymentId, 'Payment ID');
    const payment = await PaymentRepository.findById(validId);

    if (!payment) {
      const err: any = new Error('Payment not found');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    AuditService.log({
      action: 'PAYMENT_RECONCILED',
      module: 'PAYMENTS',
      entityType: 'PAYMENT',
      entityId: payment.id,
      adminUserId,
      newValues: {
        reconciledAt: new Date().toISOString(),
        currentStatus: payment.status
      }
    });

    return PaymentSerializer.toAdminView(payment);
  }

  /**
   * Admin: Refund boundary (records refund metadata and updates status).
   */
  public static async refundPayment(
    paymentId: string,
    adminUserId: string,
    amount?: number,
    reason?: string
  ): Promise<AdminPaymentView> {
    const validId = PaymentValidator.validateUuid(paymentId, 'Payment ID');
    const payment = await PaymentRepository.findById(validId);

    if (!payment) {
      const err: any = new Error('Payment not found');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    if (payment.status !== 'CAPTURED' && payment.status !== 'PARTIALLY_REFUNDED') {
      const err: any = new Error(`Cannot refund payment in '${payment.status}' status`);
      err.statusCode = 409;
      err.code = 'INVALID_REFUND_STATUS';
      throw err;
    }

    const totalAmount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);
    const refundAmount = amount !== undefined && amount > 0 ? amount : totalAmount;

    const previousRefunds = payment.refunds || [];
    const previousRefundTotal = previousRefunds.reduce(
      (sum, r) => sum + (typeof r.amount === 'string' ? parseFloat(String(r.amount)) : Number(r.amount)),
      0
    );
    const totalRefunded = previousRefundTotal + refundAmount;

    if (totalRefunded > totalAmount) {
      const err: any = new Error(
        `Refund amount exceeds remaining balance. Max refundable: ${totalAmount - previousRefundTotal}`
      );
      err.statusCode = 400;
      err.code = 'INVALID_REFUND_AMOUNT';
      throw err;
    }

    const isFullRefund = totalRefunded >= totalAmount;
    const targetStatus: PaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    PaymentPolicy.enforceTransition(payment.status, targetStatus);

    await PaymentRepository.createRefund({
      paymentId: payment.id,
      providerRefundId: `rfnd_${Date.now()}`,
      amount: refundAmount,
      currency: payment.currency,
      status: 'PROCESSED',
      reason: reason || 'Admin requested refund'
    });

    const updatedPayment = await PaymentRepository.update(payment.id, {
      status: targetStatus
    });

    // Update order payment status
    await OrderRepository.updatePaymentStatus(
      payment.orderId,
      targetStatus === 'REFUNDED' ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      `Refund of ${refundAmount} ${payment.currency} processed`
    );

    AuditService.log({
      action: 'PAYMENT_REFUNDED',
      module: 'PAYMENTS',
      entityType: 'PAYMENT',
      entityId: payment.id,
      adminUserId,
      oldValues: { status: payment.status },
      newValues: {
        status: targetStatus,
        refundAmount,
        reason
      }
    });

    const refreshed = await PaymentRepository.findById(payment.id);
    return PaymentSerializer.toAdminView(refreshed || updatedPayment);
  }
}
