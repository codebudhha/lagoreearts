/**
 * Module 20: Orders — Domain Types and DTO Interfaces
 * Lagoree Arts Backend
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type OrderAddressType = 'SHIPPING' | 'BILLING';

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  productName: string;
  variantDescription: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  createdAt: Date;
  product?: any;
  variant?: any;
}

export interface OrderAddressSnapshot {
  id: string;
  orderId: string;
  type: OrderAddressType;
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
  createdAt: Date;
}

export interface OrderRecord {
  id: string;
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
  notes: string | null;
  placedAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemSnapshot[];
  addresses?: OrderAddressSnapshot[];
  customer?: any;
  checkoutSession?: any;
}

export interface CustomerOrderView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  email: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  placedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: Array<{
    id: string;
    productId: string | null;
    variantId: string | null;
    sku: string;
    productName: string;
    variantDescription: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    currency: string;
  }>;
  shippingAddress: OrderAddressSnapshot | null;
  billingAddress: OrderAddressSnapshot | null;
}

export interface AdminOrderView extends CustomerOrderView {
  customerId: string | null;
  checkoutSessionId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  } | null;
}

export interface GuestOrderLookupDto {
  orderNumber: string;
  email?: string;
  guestToken?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
  reason?: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface CancelOrderDto {
  reason?: string;
}

export interface AdminOrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
  email?: string;
  placedAfter?: string;
  placedBefore?: string;
  sortBy?: 'placedAt' | 'createdAt' | 'orderNumber' | 'grandTotal';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerOrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: 'placedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
