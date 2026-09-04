/**
 * Module 20: Orders — Core Service Layer
 * Lagoree Arts Backend
 */

import crypto from 'node:crypto';
import { CheckoutService } from '../checkout/checkout.service.ts';
import { OrderRepository } from './order.repository.ts';
import { OrderNumberService } from './order-number.service.ts';
import { OrderPolicyService } from './order-policy.service.ts';
import { OrderValidator } from './order.validator.ts';
import { OrderSerializer } from './order.serializer.ts';
import { DefaultPaymentStateProvider, type PaymentStateProvider } from './boundaries/payment.boundary.ts';
import { DefaultInventoryOrderProvider, type InventoryOrderProvider } from './boundaries/inventory.boundary.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  CustomerOrderView,
  AdminOrderView,
  AdminOrderListQuery,
  CustomerOrderListQuery,
  GuestOrderLookupDto
} from './order.types.ts';

export class OrderService {
  private static paymentProvider: PaymentStateProvider = new DefaultPaymentStateProvider();
  private static inventoryProvider: InventoryOrderProvider = new DefaultInventoryOrderProvider();

  public static setPaymentProvider(provider: PaymentStateProvider): void {
    this.paymentProvider = provider;
  }

  public static setInventoryProvider(provider: InventoryOrderProvider): void {
    this.inventoryProvider = provider;
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Primary workflow: Converts a COMPLETED checkout session into an immutable Order.
   * Enforces idempotency via UNIQUE checkoutSessionId check.
   */
  public static async createFromCompletedCheckout(
    checkoutId: string,
    options?: { guestToken?: string; notes?: string }
  ): Promise<OrderRecord> {
    if (!OrderValidator.isValidUuid(checkoutId)) {
      const err: any = new Error('Invalid checkout session ID format');
      err.statusCode = 400;
      err.code = 'INVALID_CHECKOUT_ID';
      throw err;
    }

    // 1. Check for existing order (Idempotency protection)
    const existingOrder = await OrderRepository.findByCheckoutSessionId(checkoutId);
    if (existingOrder) {
      return existingOrder;
    }

    // 2. Consume authoritative completed checkout contract from Module 19
    const checkoutContract = await CheckoutService.getCompletedCheckoutForOrder(checkoutId);

    // 3. Generate unique, collision-safe human-readable order number
    const orderNumber = await OrderNumberService.generateOrderNumber();

    // 4. Compute guest order token hash if guest checkout
    let guestOrderTokenHash: string | null = null;
    if (checkoutContract.guestTokenHash) {
      guestOrderTokenHash = checkoutContract.guestTokenHash;
    } else if (options?.guestToken) {
      guestOrderTokenHash = this.hashToken(options.guestToken);
    }

    // 5. Build immutable item snapshots
    const items = checkoutContract.items.map(itm => ({
      productId: itm.productId,
      variantId: itm.variantId,
      sku: itm.sku,
      productName: itm.productName,
      variantDescription: itm.variantDescription,
      quantity: itm.quantity,
      unitPrice: itm.unitPrice,
      lineTotal: itm.lineTotal,
      currency: itm.currency
    }));

    // 6. Build immutable address snapshots (SHIPPING and BILLING)
    const addresses: Array<{
      type: 'SHIPPING' | 'BILLING';
      fullName: string;
      firstName: string;
      lastName: string;
      companyName?: string | null;
      addressLine1: string;
      addressLine2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string;
    }> = [];

    if (checkoutContract.shippingAddress) {
      const s = checkoutContract.shippingAddress;
      addresses.push({
        type: 'SHIPPING',
        fullName: `${s.firstName} ${s.lastName}`.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        companyName: s.companyName,
        addressLine1: s.addressLine1,
        addressLine2: s.addressLine2,
        landmark: s.landmark,
        city: s.city,
        state: s.state,
        postalCode: s.postalCode,
        country: s.country,
        phone: s.phone
      });
    }

    if (checkoutContract.billingAddress) {
      const b = checkoutContract.billingAddress;
      addresses.push({
        type: 'BILLING',
        fullName: `${b.firstName} ${b.lastName}`.trim(),
        firstName: b.firstName,
        lastName: b.lastName,
        companyName: b.companyName,
        addressLine1: b.addressLine1,
        addressLine2: b.addressLine2,
        landmark: b.landmark,
        city: b.city,
        state: b.state,
        postalCode: b.postalCode,
        country: b.country,
        phone: b.phone
      });
    }

    // 7. Atomically persist Order record
    const createdOrder = await OrderRepository.createOrder({
      orderNumber,
      customerId: checkoutContract.customerId,
      checkoutSessionId: checkoutContract.checkoutId || (checkoutContract as any).id,
      guestOrderTokenHash,
      currency: checkoutContract.currency,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      email: checkoutContract.email,
      subtotal: checkoutContract.subtotal,
      discountTotal: checkoutContract.discountTotal,
      shippingTotal: checkoutContract.shippingTotal,
      taxTotal: checkoutContract.taxTotal,
      grandTotal: checkoutContract.grandTotal,
      notes: OrderPolicyService.sanitizeNotes(options?.notes),
      items,
      addresses
    });

    // 8. Create historical immutable OrderShippingSnapshot
    try {
      const shippingAddr = checkoutContract.shippingAddress;
      const postalCode = shippingAddr?.postalCode || '302001';
      const zone = await prisma.shippingZonePostalCode.findFirst({
        where: { postalCode, status: 'ACTIVE' },
        include: { zone: true }
      });

      const zoneName = zone?.zone?.name || 'Heritage Domestic Logistics Zone';
      const zoneCode = zone?.zone?.code || 'IN_DOMESTIC';

      await prisma.orderShippingSnapshot.create({
        data: {
          orderId: createdOrder.id,
          zoneCode,
          zoneName,
          methodCode: 'STANDARD',
          methodName: 'Standard Insured Art Delivery',
          carrier: 'LAGOREE_WHITE_GLOVE',
          serviceLevel: 'COMPLIMENTARY_INSURED',
          estimatedMinDays: 3,
          estimatedMaxDays: 7,
          shippingAmount: Number(createdOrder.shippingTotal || 0),
          currency: createdOrder.currency || 'INR',
          postalCode
        }
      });
    } catch {
      // Gracefully continue if snapshot creation already exists or fails non-critically
    }

    // 9. Inventory boundary reservation
    await this.inventoryProvider.reserveForOrder(createdOrder);

    // 10. Audit event
    AuditService.log({
      action: 'ORDER_CREATED',
      module: 'ORDERS',
      entityType: 'ORDER',
      entityId: createdOrder.id,
      newValues: {
        orderNumber: createdOrder.orderNumber,
        grandTotal: createdOrder.grandTotal,
        status: createdOrder.status,
        customerId: createdOrder.customerId
      }
    });

    return createdOrder;
  }

  /**
   * Retrieves paginated order history for an authenticated patron.
   */
  public static async getCustomerOrders(
    customerId: string,
    query: CustomerOrderListQuery
  ): Promise<{ orders: CustomerOrderView[]; total: number; page: number; limit: number; totalPages: number }> {
    const result = await OrderRepository.findCustomerOrders(customerId, query);
    return {
      orders: result.orders.map(o => OrderSerializer.toCustomerView(o)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  /**
   * Retrieves single order detail for an authenticated patron with strict IDOR ownership check.
   */
  public static async getCustomerOrderById(customerId: string, orderId: string): Promise<CustomerOrderView> {
    if (!OrderValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_ID';
      throw err;
    }

    const order = await OrderRepository.findById(orderId);
    if (!order || order.customerId !== customerId) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    return OrderSerializer.toCustomerView(order);
  }

  /**
   * Allows customer to cancel their order if still in PENDING state.
   */
  public static async customerCancelOrder(
    customerId: string,
    orderId: string,
    reason?: string
  ): Promise<CustomerOrderView> {
    if (!OrderValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_ID';
      throw err;
    }

    const order = await OrderRepository.findById(orderId);
    if (!order || order.customerId !== customerId) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    if (!OrderPolicyService.canCustomerCancel(order)) {
      const err: any = new Error(
        `Order ${order.orderNumber} cannot be cancelled because it is in '${order.status}' status.`
      );
      err.statusCode = 409;
      err.code = 'ORDER_CANNOT_BE_CANCELLED';
      throw err;
    }

    const sanitizedReason = OrderPolicyService.sanitizeReason(reason) || 'Cancelled by customer';
    const updated = await OrderRepository.updateOrderStatus(orderId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: sanitizedReason
    });

    await this.inventoryProvider.releaseForOrder(updated);

    AuditService.log({
      action: 'ORDER_CANCELLED',
      module: 'ORDERS',
      entityType: 'ORDER',
      entityId: order.id,
      oldValues: { status: order.status },
      newValues: { status: 'CANCELLED', reason: sanitizedReason, cancelledBy: 'CUSTOMER' }
    });

    return OrderSerializer.toCustomerView(updated);
  }

  /**
   * Secure guest order lookup requiring orderNumber and valid email or guest token.
   */
  public static async lookupGuestOrder(dto: GuestOrderLookupDto): Promise<CustomerOrderView> {
    if (!dto.orderNumber || typeof dto.orderNumber !== 'string') {
      const err: any = new Error('Order number is required');
      err.statusCode = 400;
      err.code = 'ORDER_NUMBER_REQUIRED';
      throw err;
    }

    const order = await OrderRepository.findByOrderNumber(dto.orderNumber.trim());
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // Guest lookup can only access guest orders (or verify against matching customer email without leaking identity)
    let authenticated = false;

    if (dto.email && typeof dto.email === 'string') {
      if (order.email.toLowerCase() === dto.email.trim().toLowerCase()) {
        authenticated = true;
      }
    }

    if (!authenticated && dto.guestToken && typeof dto.guestToken === 'string' && order.guestOrderTokenHash) {
      const incomingHash = this.hashToken(dto.guestToken);
      if (incomingHash === order.guestOrderTokenHash) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      const err: any = new Error('Order not found or verification credentials did not match');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    return OrderSerializer.toCustomerView(order);
  }

  /**
   * Admin: Retrieve order detail by ID.
   */
  public static async getAdminOrderById(orderId: string): Promise<AdminOrderView> {
    if (!OrderValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_ID';
      throw err;
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    return OrderSerializer.toAdminView(order);
  }

  /**
   * Admin: List orders with search, filters, pagination, and sorting.
   */
  public static async listAdminOrders(
    query: AdminOrderListQuery
  ): Promise<{ orders: AdminOrderView[]; total: number; page: number; limit: number; totalPages: number }> {
    const result = await OrderRepository.listAdminOrders(query);
    return {
      orders: result.orders.map(o => OrderSerializer.toAdminView(o)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  /**
   * Admin: Update order status via state machine.
   */
  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminUserId: string,
    notes?: string,
    reason?: string
  ): Promise<AdminOrderView> {
    if (!OrderValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_ID';
      throw err;
    }

    if (!OrderValidator.isValidOrderStatus(newStatus)) {
      const err: any = new Error(`Invalid order status '${newStatus}'`);
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_STATUS';
      throw err;
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    // Validate state transition
    OrderPolicyService.assertValidStatusTransition(order.status, newStatus);

    const now = new Date();
    const updateData: any = {
      status: newStatus,
      notes: notes ? OrderPolicyService.sanitizeNotes(notes) : order.notes
    };

    if (newStatus === 'CONFIRMED' && !order.confirmedAt) updateData.confirmedAt = now;
    if (newStatus === 'SHIPPED' && !order.shippedAt) updateData.shippedAt = now;
    if (newStatus === 'DELIVERED' && !order.deliveredAt) updateData.deliveredAt = now;
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = now;
      updateData.cancellationReason = OrderPolicyService.sanitizeReason(reason) || 'Cancelled by administrator';
    }

    const updated = await OrderRepository.updateOrderStatus(orderId, updateData);

    if (newStatus === 'CANCELLED') {
      await this.inventoryProvider.releaseForOrder(updated);
    } else if (newStatus === 'SHIPPED') {
      await this.inventoryProvider.confirmForOrder(updated);
    }

    AuditService.log({
      action: 'ORDER_STATUS_CHANGED',
      module: 'ORDERS',
      entityType: 'ORDER',
      entityId: order.id,
      adminUserId,
      oldValues: { status: order.status },
      newValues: { status: newStatus, notes: updateData.notes }
    });

    return OrderSerializer.toAdminView(updated);
  }

  /**
   * Admin: Update payment status.
   */
  public static async updatePaymentStatus(
    orderId: string,
    newPaymentStatus: PaymentStatus,
    adminUserId: string,
    notes?: string
  ): Promise<AdminOrderView> {
    if (!OrderValidator.isValidUuid(orderId)) {
      const err: any = new Error('Invalid order ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_ID';
      throw err;
    }

    if (!OrderValidator.isValidPaymentStatus(newPaymentStatus)) {
      const err: any = new Error(`Invalid payment status '${newPaymentStatus}'`);
      err.statusCode = 400;
      err.code = 'INVALID_PAYMENT_STATUS';
      throw err;
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err: any = new Error('Order not found');
      err.statusCode = 404;
      err.code = 'ORDER_NOT_FOUND';
      throw err;
    }

    if (!this.paymentProvider.canTransitionPaymentStatus(order.paymentStatus, newPaymentStatus)) {
      const err: any = new Error(
        `Cannot transition payment status from '${order.paymentStatus}' to '${newPaymentStatus}'`
      );
      err.statusCode = 409;
      err.code = 'INVALID_PAYMENT_STATUS_TRANSITION';
      throw err;
    }

    const sanitizedNotes = notes ? OrderPolicyService.sanitizeNotes(notes) : order.notes;
    const updated = await OrderRepository.updatePaymentStatus(orderId, newPaymentStatus, sanitizedNotes);

    AuditService.log({
      action: 'ORDER_PAYMENT_STATUS_CHANGED',
      module: 'ORDERS',
      entityType: 'ORDER',
      entityId: order.id,
      adminUserId,
      oldValues: { paymentStatus: order.paymentStatus },
      newValues: { paymentStatus: newPaymentStatus, notes: sanitizedNotes }
    });

    return OrderSerializer.toAdminView(updated);
  }

  /**
   * Admin: Cancel order.
   */
  public static async adminCancelOrder(
    orderId: string,
    reason: string | undefined,
    adminUserId: string
  ): Promise<AdminOrderView> {
    return this.updateOrderStatus(orderId, 'CANCELLED', adminUserId, undefined, reason);
  }
}
