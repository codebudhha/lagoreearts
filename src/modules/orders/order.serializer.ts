/**
 * Module 20: Orders — Response Serializer
 * Lagoree Arts Backend
 */

import type { OrderRecord, CustomerOrderView, AdminOrderView } from './order.types.ts';

export class OrderSerializer {
  /**
   * Transforms an internal order record into a customer-safe view.
   * Strips administrative notes, internal cost prices, and sensitive IDs.
   */
  public static toCustomerView(order: OrderRecord): CustomerOrderView {
    const shippingAddress = order.addresses?.find(a => a.type === 'SHIPPING') || null;
    const billingAddress = order.addresses?.find(a => a.type === 'BILLING') || null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      email: order.email,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      shippingTotal: Number(order.shippingTotal),
      taxTotal: Number(order.taxTotal),
      grandTotal: Number(order.grandTotal),
      placedAt: order.placedAt instanceof Date ? order.placedAt.toISOString() : String(order.placedAt),
      confirmedAt: order.confirmedAt ? (order.confirmedAt instanceof Date ? order.confirmedAt.toISOString() : String(order.confirmedAt)) : null,
      shippedAt: order.shippedAt ? (order.shippedAt instanceof Date ? order.shippedAt.toISOString() : String(order.shippedAt)) : null,
      deliveredAt: order.deliveredAt ? (order.deliveredAt instanceof Date ? order.deliveredAt.toISOString() : String(order.deliveredAt)) : null,
      cancelledAt: order.cancelledAt ? (order.cancelledAt instanceof Date ? order.cancelledAt.toISOString() : String(order.cancelledAt)) : null,
      cancellationReason: order.cancellationReason,
      items: (order.items || []).map(itm => ({
        id: itm.id,
        productId: itm.productId,
        variantId: itm.variantId,
        sku: itm.sku,
        productName: itm.productName,
        variantDescription: itm.variantDescription,
        quantity: itm.quantity,
        unitPrice: Number(itm.unitPrice),
        lineTotal: Number(itm.lineTotal),
        currency: itm.currency
      })),
      shippingAddress: shippingAddress ? { ...shippingAddress } : null,
      billingAddress: billingAddress ? { ...billingAddress } : null
    };
  }

  /**
   * Transforms an internal order record into a complete administrative view.
   */
  public static toAdminView(order: OrderRecord): AdminOrderView {
    const customerView = this.toCustomerView(order);

    return {
      ...customerView,
      customerId: order.customerId,
      checkoutSessionId: order.checkoutSessionId,
      notes: order.notes,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
      customer: order.customer ? {
        id: order.customer.id,
        email: order.customer.email,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        phone: order.customer.phone
      } : null
    };
  }
}
