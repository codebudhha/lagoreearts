import type { CartTotalsDto } from './cart.types.ts';

export class CartPricingService {
  /**
   * Resolve unit price from product and optional variant.
   * If variant exists and has a non-null price, use variant price.
   * Otherwise, inherit parent product price.
   */
  static resolveUnitPrice(product: { price: any }, variant?: { price?: any } | null): number {
    if (variant && variant.price !== null && variant.price !== undefined) {
      return Number(variant.price);
    }
    return Number(product.price);
  }

  /**
   * Calculate line total for a given unit price and quantity.
   */
  static calculateLineTotal(unitPrice: number, quantity: number): number {
    const raw = unitPrice * quantity;
    return Math.round(raw * 100) / 100;
  }

  /**
   * Calculate comprehensive cart totals from item lines.
   */
  static calculateCartTotals(
    items: Array<{ unitPrice: number; quantity: number }>,
    currency: string = 'INR'
  ): CartTotalsDto {
    let itemCount = 0;
    let subtotal = 0;

    for (const item of items) {
      itemCount += item.quantity;
      subtotal += item.unitPrice * item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    return {
      itemCount,
      subtotal,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      grandTotal: subtotal,
      currency
    };
  }
}
