export type CartWarningCode =
  | 'PRODUCT_UNAVAILABLE'
  | 'VARIANT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'QUANTITY_ADJUSTED'
  | 'PRICE_CHANGED';

export interface CartWarning {
  code: CartWarningCode;
  itemId: string;
  productId: string;
  variantId?: string | null;
  message: string;
  oldPrice?: number;
  newPrice?: number;
  oldQuantity?: number;
  newQuantity?: number;
}

export type CartIdentityType = 'customer' | 'guest';

export interface CartIdentity {
  type: CartIdentityType;
  customerId?: string;
  guestToken?: string;
  guestTokenHash?: string;
}

export interface AddToCartInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface MergeCartInput {
  guestCartToken: string;
}

export interface CartProductPreview {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType: string;
  thumbnail: string | null;
  image: string | null;
  isOneOfAKind?: boolean;
}

export interface CartVariantPreview {
  id: string;
  sku: string;
  optionValues: Array<{
    optionName: string;
    optionSlug: string;
    value: string;
    valueSlug: string;
  }>;
}

export interface CartItemResponseDto {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lastSeenUnitPrice: number | null;
  lineTotal: number;
  isAvailable: boolean;
  product: CartProductPreview;
  variant: CartVariantPreview | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartTotalsDto {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
}

export interface CartResponseDto {
  id: string;
  customerId: string | null;
  isGuest: boolean;
  currency: string;
  items: CartItemResponseDto[];
  itemCount: number;
  subtotal: number;
  totals: CartTotalsDto;
  warnings: CartWarning[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartMergeSummary {
  merged: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
  removed: Array<{
    productId: string;
    variantId?: string | null;
    reason: string;
  }>;
  adjusted: Array<{
    productId: string;
    variantId?: string | null;
    requestedQuantity: number;
    adjustedQuantity: number;
    reason: string;
  }>;
}
