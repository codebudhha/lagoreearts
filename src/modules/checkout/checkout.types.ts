export type CheckoutStatus = 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
export type CheckoutAddressType = 'SHIPPING' | 'BILLING';

export interface CheckoutAddressPayload {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
}

export interface CreateCheckoutDto {
  shippingAddressId?: string;
  billingAddressId?: string;
  email?: string;
  shippingAddress?: CheckoutAddressPayload;
  billingAddress?: CheckoutAddressPayload;
}

export interface UpdateCheckoutAddressesDto {
  shippingAddressId?: string;
  billingAddressId?: string;
  shippingAddress?: CheckoutAddressPayload;
  billingAddress?: CheckoutAddressPayload;
}

export interface CheckoutWarning {
  code: 'PRICE_CHANGED' | 'QUANTITY_ADJUSTED' | 'PRODUCT_UNAVAILABLE' | 'VARIANT_UNAVAILABLE' | 'INSUFFICIENT_STOCK';
  productId: string;
  variantId?: string | null;
  productName: string;
  message: string;
  details?: Record<string, any>;
}

export interface CheckoutTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
}

export interface CheckoutItemSnapshot {
  id: string;
  checkoutSessionId: string;
  productId: string;
  variantId: string | null;
  sku: string;
  productName: string;
  variantDescription: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  createdAt: Date | string;
}

export interface CheckoutAddressSnapshot {
  id: string;
  checkoutSessionId: string;
  type: CheckoutAddressType;
  firstName: string;
  lastName: string;
  companyName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  createdAt: Date | string;
}

export interface CheckoutSessionView {
  id: string;
  customerId: string | null;
  cartId: string;
  status: CheckoutStatus;
  currency: string;
  email: string;
  items: CheckoutItemSnapshot[];
  shippingAddress: CheckoutAddressSnapshot | null;
  billingAddress: CheckoutAddressSnapshot | null;
  totals: CheckoutTotals;
  warnings: CheckoutWarning[];
  expiresAt: Date | string;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CheckoutValidationResult {
  valid: boolean;
  warnings: CheckoutWarning[];
  blockingIssues: CheckoutWarning[];
}

export interface CompletedCheckoutContract {
  checkoutId: string;
  customerId: string | null;
  cartId: string;
  email: string;
  currency: string;
  status: CheckoutStatus;
  items: Array<{
    productId: string;
    variantId: string | null;
    sku: string;
    productName: string;
    variantDescription: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    currency: string;
  }>;
  shippingAddress: CheckoutAddressPayload;
  billingAddress: CheckoutAddressPayload;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  completedAt: Date;
}
