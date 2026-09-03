import { CartPricingService } from './cart-pricing.service.ts';
import type { CartWarning, CartItemResponseDto } from './cart.types.ts';

export interface ReconciledCartItemResult {
  rawItem: any;
  dto: CartItemResponseDto;
  isAvailable: boolean;
  warnings: CartWarning[];
  adjustedQuantity?: number;
}

export class CartReconciliationService {
  /**
   * Reconcile cart item lines with live catalogue data, emitting warnings for price changes,
   * inactive status, missing variants, or inventory shortfalls.
   */
  static reconcileItem(cartItem: any): ReconciledCartItemResult {
    const warnings: CartWarning[] = [];
    const product = cartItem.product;
    const variant = cartItem.variant;

    // 1. Product exists and is active check
    if (!product || product.status !== 'ACTIVE') {
      const warning: CartWarning = {
        code: 'PRODUCT_UNAVAILABLE',
        itemId: cartItem.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        message: `Product "${product?.name || 'Item'}" is currently unavailable.`
      };
      return {
        rawItem: cartItem,
        isAvailable: false,
        warnings: [warning],
        dto: this.buildUnavailableDto(cartItem, [warning])
      };
    }

    // 2. Variable product variant check
    if (product.productType === 'VARIABLE') {
      if (!cartItem.variantId || !variant || variant.status !== 'ACTIVE') {
        const warning: CartWarning = {
          code: 'VARIANT_UNAVAILABLE',
          itemId: cartItem.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          message: `The selected variant for "${product.name}" is no longer available.`
        };
        return {
          rawItem: cartItem,
          isAvailable: false,
          warnings: [warning],
          dto: this.buildUnavailableDto(cartItem, [warning])
        };
      }
    }

    // 3. Stock availability check
    let availableStock = Infinity;
    let trackInventory = false;
    let allowBackorder = false;

    if (variant) {
      trackInventory = variant.trackInventory;
      allowBackorder = variant.allowBackorder;
      availableStock = variant.stockQuantity;
    } else {
      trackInventory = product.trackInventory;
      allowBackorder = product.allowBackorder;
      availableStock = product.stockQuantity;
    }

    let isAvailable = true;
    let effectiveQuantity = cartItem.quantity;

    if (trackInventory && !allowBackorder) {
      if (availableStock <= 0) {
        isAvailable = false;
        warnings.push({
          code: 'INSUFFICIENT_STOCK',
          itemId: cartItem.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          message: `"${product.name}" is currently out of stock.`,
          oldQuantity: cartItem.quantity,
          newQuantity: 0
        });
      } else if (availableStock < cartItem.quantity) {
        warnings.push({
          code: 'QUANTITY_ADJUSTED',
          itemId: cartItem.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          message: `Only ${availableStock} units of "${product.name}" are currently available in stock.`,
          oldQuantity: cartItem.quantity,
          newQuantity: availableStock
        });
        effectiveQuantity = availableStock;
      }
    }

    // 4. One-of-a-kind antique quantity check
    const isOneOfAKind = Boolean(product.antiqueProfile?.isOneOfAKind);
    if (isOneOfAKind && cartItem.quantity > 1) {
      warnings.push({
        code: 'QUANTITY_ADJUSTED',
        itemId: cartItem.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        message: `"${product.name}" is a unique antique piece. Quantity limited to 1.`,
        oldQuantity: cartItem.quantity,
        newQuantity: 1
      });
      effectiveQuantity = 1;
    }

    // 5. Price resolution and price change detection
    const currentUnitPrice = CartPricingService.resolveUnitPrice(product, variant);
    const lastSeenPrice = cartItem.lastSeenUnitPrice !== null && cartItem.lastSeenUnitPrice !== undefined
      ? Number(cartItem.lastSeenUnitPrice)
      : null;

    if (lastSeenPrice !== null && lastSeenPrice !== currentUnitPrice) {
      warnings.push({
        code: 'PRICE_CHANGED',
        itemId: cartItem.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        message: `Price for "${product.name}" has changed from ₹${lastSeenPrice.toLocaleString('en-IN')} to ₹${currentUnitPrice.toLocaleString('en-IN')}.`,
        oldPrice: lastSeenPrice,
        newPrice: currentUnitPrice
      });
    }

    // 6. Build Rich Item DTO
    const lineTotal = CartPricingService.calculateLineTotal(currentUnitPrice, effectiveQuantity);

    const dto: CartItemResponseDto = {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      variantId: cartItem.variantId || null,
      quantity: effectiveQuantity,
      unitPrice: currentUnitPrice,
      lastSeenUnitPrice: lastSeenPrice,
      lineTotal,
      isAvailable,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        productType: product.productType,
        thumbnail: product.thumbnail || product.image || null,
        image: product.image || null,
        isOneOfAKind
      },
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            optionValues: (variant.optionValues || []).map((ov: any) => ({
              optionName: ov.optionValue?.option?.name || '',
              optionSlug: ov.optionValue?.option?.slug || '',
              value: ov.optionValue?.value || '',
              valueSlug: ov.optionValue?.slug || ''
            }))
          }
        : null,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt
    };

    return {
      rawItem: cartItem,
      dto,
      isAvailable,
      warnings,
      adjustedQuantity: effectiveQuantity !== cartItem.quantity ? effectiveQuantity : undefined
    };
  }

  private static buildUnavailableDto(cartItem: any, warnings: CartWarning[]): CartItemResponseDto {
    const product = cartItem.product;
    const variant = cartItem.variant;
    const unitPrice = product ? Number(product.price) : (cartItem.lastSeenUnitPrice ? Number(cartItem.lastSeenUnitPrice) : 0);

    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      variantId: cartItem.variantId || null,
      quantity: cartItem.quantity,
      unitPrice,
      lastSeenUnitPrice: cartItem.lastSeenUnitPrice ? Number(cartItem.lastSeenUnitPrice) : null,
      lineTotal: 0,
      isAvailable: false,
      product: {
        id: cartItem.productId,
        name: product?.name || 'Unavailable Item',
        slug: product?.slug || '',
        sku: product?.sku || '',
        productType: product?.productType || 'SIMPLE',
        thumbnail: product?.thumbnail || product?.image || null,
        image: product?.image || null,
        isOneOfAKind: false
      },
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            optionValues: []
          }
        : null,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt
    };
  }
}
