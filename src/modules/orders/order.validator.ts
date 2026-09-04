/**
 * Module 20: Orders — Input Validator
 * Lagoree Arts Backend
 */

import type { OrderStatus, PaymentStatus, AdminOrderListQuery, CustomerOrderListQuery } from './order.types.ts';

export class OrderValidator {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  private static readonly VALID_ORDER_STATUSES: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'FAILED'
  ];
  private static readonly VALID_PAYMENT_STATUSES: PaymentStatus[] = [
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
  ];

  public static isValidUuid(id: string): boolean {
    return typeof id === 'string' && this.UUID_REGEX.test(id.trim());
  }

  public static isValidOrderStatus(status: any): status is OrderStatus {
    return typeof status === 'string' && this.VALID_ORDER_STATUSES.includes(status as OrderStatus);
  }

  public static isValidPaymentStatus(status: any): status is PaymentStatus {
    return typeof status === 'string' && this.VALID_PAYMENT_STATUSES.includes(status as PaymentStatus);
  }

  public static parseAdminListQuery(query: any): AdminOrderListQuery {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));

    const result: AdminOrderListQuery = { page, limit };

    if (query.status && this.isValidOrderStatus(query.status)) {
      result.status = query.status;
    }

    if (query.paymentStatus && this.isValidPaymentStatus(query.paymentStatus)) {
      result.paymentStatus = query.paymentStatus;
    }

    if (query.customerId && typeof query.customerId === 'string') {
      result.customerId = query.customerId.trim();
    }

    if (query.orderNumber && typeof query.orderNumber === 'string') {
      result.orderNumber = query.orderNumber.trim();
    }

    if (query.email && typeof query.email === 'string') {
      result.email = query.email.trim();
    }

    if (query.placedAfter && !isNaN(Date.parse(query.placedAfter))) {
      result.placedAfter = new Date(query.placedAfter).toISOString();
    }

    if (query.placedBefore && !isNaN(Date.parse(query.placedBefore))) {
      result.placedBefore = new Date(query.placedBefore).toISOString();
    }

    const allowedSortBy = ['placedAt', 'createdAt', 'orderNumber', 'grandTotal'];
    if (query.sortBy && allowedSortBy.includes(query.sortBy)) {
      result.sortBy = query.sortBy as any;
    } else {
      result.sortBy = 'placedAt';
    }

    const sortOrder = String(query.sortOrder || 'desc').toLowerCase();
    result.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return result;
  }

  public static parseCustomerListQuery(query: any): CustomerOrderListQuery {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(query.limit || '10'), 10) || 10));

    const result: CustomerOrderListQuery = { page, limit };

    if (query.status && this.isValidOrderStatus(query.status)) {
      result.status = query.status;
    }

    const allowedSortBy = ['placedAt', 'createdAt'];
    if (query.sortBy && allowedSortBy.includes(query.sortBy)) {
      result.sortBy = query.sortBy as any;
    } else {
      result.sortBy = 'placedAt';
    }

    const sortOrder = String(query.sortOrder || 'desc').toLowerCase();
    result.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return result;
  }
}
