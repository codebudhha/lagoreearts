/**
 * Module 20: Orders — Repository Layer
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  AdminOrderListQuery,
  CustomerOrderListQuery
} from './order.types.ts';

export class OrderRepository {
  /**
   * Standard include configuration to hydrate items, addresses, and customer data.
   */
  private static readonly STANDARD_INCLUDE = {
    items: true,
    addresses: true,
    customer: true,
    checkoutSession: true
  };

  /**
   * Persists an order atomically along with its frozen items and address snapshots.
   */
  public static async createOrder(orderData: {
    orderNumber: string;
    customerId: string | null;
    checkoutSessionId: string;
    guestOrderTokenHash: string | null;
    currency: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    email: string;
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    taxTotal: number;
    grandTotal: number;
    notes?: string | null;
    items: Array<{
      productId: string | null;
      variantId: string | null;
      sku: string;
      productName: string;
      variantDescription?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      currency: string;
    }>;
    addresses: Array<{
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
    }>;
  }): Promise<OrderRecord> {
    return prisma.$transaction(async (tx: any) => {
      const created = tx.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          checkoutSessionId: orderData.checkoutSessionId,
          guestOrderTokenHash: orderData.guestOrderTokenHash,
          currency: orderData.currency,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          email: orderData.email,
          subtotal: orderData.subtotal,
          discountTotal: orderData.discountTotal,
          shippingTotal: orderData.shippingTotal,
          taxTotal: orderData.taxTotal,
          grandTotal: orderData.grandTotal,
          notes: orderData.notes,
          items: {
            create: orderData.items
          },
          addresses: {
            create: orderData.addresses
          }
        },
        include: this.STANDARD_INCLUDE
      });

      return created;
    });
  }

  /**
   * Finds an order by its primary UUID.
   */
  public static async findById(id: string): Promise<OrderRecord | null> {
    return prisma.order.findUnique({
      where: { id },
      include: this.STANDARD_INCLUDE
    });
  }

  /**
   * Finds an order by human-readable order number.
   */
  public static async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: this.STANDARD_INCLUDE
    });
  }

  /**
   * Finds an order by its associated checkout session ID.
   */
  public static async findByCheckoutSessionId(checkoutSessionId: string): Promise<OrderRecord | null> {
    return prisma.order.findUnique({
      where: { checkoutSessionId },
      include: this.STANDARD_INCLUDE
    });
  }

  /**
   * Checks if an order has already been created for a given checkout session.
   */
  public static async existsForCheckout(checkoutSessionId: string): Promise<boolean> {
    const count = prisma.order.count({
      where: { checkoutSessionId }
    });
    return count > 0;
  }

  /**
   * Retrieves paginated orders belonging to a specific customer.
   */
  public static async findCustomerOrders(
    customerId: string,
    query: CustomerOrderListQuery
  ): Promise<{ orders: OrderRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = { customerId };
    if (query.status) {
      where.status = query.status;
    }

    const total = prisma.order.count({ where });
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (query.sortBy === 'createdAt') {
      orderBy.createdAt = query.sortOrder || 'desc';
    } else {
      orderBy.placedAt = query.sortOrder || 'desc';
    }

    const orders = prisma.order.findMany({
      where,
      include: this.STANDARD_INCLUDE,
      orderBy,
      take: limit,
      skip
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return { orders, total, page, limit, totalPages };
  }

  /**
   * Retrieves paginated orders for administrative inspection with filtering and search.
   */
  public static async listAdminOrders(
    query: AdminOrderListQuery
  ): Promise<{ orders: OrderRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.orderNumber) where.orderNumber = { contains: query.orderNumber };
    if (query.email) where.email = { contains: query.email };
    if (query.placedAfter || query.placedBefore) {
      where.placedAt = {};
      if (query.placedAfter) where.placedAt.gte = new Date(query.placedAfter);
      if (query.placedBefore) where.placedAt.lte = new Date(query.placedBefore);
    }

    const total = prisma.order.count({ where });
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (query.sortBy === 'createdAt') {
      orderBy.createdAt = query.sortOrder || 'desc';
    } else if (query.sortBy === 'orderNumber') {
      orderBy.orderNumber = query.sortOrder || 'desc';
    } else if (query.sortBy === 'grandTotal') {
      orderBy.grandTotal = query.sortOrder || 'desc';
    } else {
      orderBy.placedAt = query.sortOrder || 'desc';
    }

    const orders = prisma.order.findMany({
      where,
      include: this.STANDARD_INCLUDE,
      orderBy,
      take: limit,
      skip
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return { orders, total, page, limit, totalPages };
  }

  /**
   * Updates an order's status and records corresponding timestamp transitions.
   */
  public static async updateOrderStatus(
    orderId: string,
    updateData: {
      status: OrderStatus;
      notes?: string | null;
      confirmedAt?: Date | null;
      shippedAt?: Date | null;
      deliveredAt?: Date | null;
      cancelledAt?: Date | null;
      cancellationReason?: string | null;
    }
  ): Promise<OrderRecord> {
    return prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: this.STANDARD_INCLUDE
    });
  }

  /**
   * Updates an order's payment status.
   */
  public static async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    notes?: string | null
  ): Promise<OrderRecord> {
    const data: any = { paymentStatus };
    if (notes !== undefined) data.notes = notes;

    return prisma.order.update({
      where: { id: orderId },
      data,
      include: this.STANDARD_INCLUDE
    });
  }
}
