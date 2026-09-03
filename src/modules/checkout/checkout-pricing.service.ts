import type { CheckoutTotals } from './checkout.types.ts';
import { DefaultShippingRateProvider, type ShippingRateProvider } from './boundaries/shipping.boundary.ts';
import { DefaultTaxCalculator, type TaxCalculator } from './boundaries/tax.boundary.ts';
import { DefaultDiscountCalculator, type DiscountCalculator } from './boundaries/discount.boundary.ts';

export class CheckoutPricingService {
  private shippingProvider: ShippingRateProvider;
  private taxCalculator: TaxCalculator;
  private discountCalculator: DiscountCalculator;

  constructor(
    shippingProvider?: ShippingRateProvider,
    taxCalculator?: TaxCalculator,
    discountCalculator?: DiscountCalculator
  ) {
    this.shippingProvider = shippingProvider || new DefaultShippingRateProvider();
    this.taxCalculator = taxCalculator || new DefaultTaxCalculator();
    this.discountCalculator = discountCalculator || new DefaultDiscountCalculator();
  }

  /**
   * Round to 2 decimal places (paise/cents precision)
   */
  public static roundCurrency(value: number): number {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate line total for a given unit price and quantity
   */
  public static calculateLineTotal(unitPrice: number, quantity: number): number {
    return this.roundCurrency(Number(unitPrice) * Number(quantity));
  }

  /**
   * Calculate subtotal from line items
   */
  public static calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
    const raw = items.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.quantity)), 0);
    return this.roundCurrency(raw);
  }

  /**
   * Calculate full commercial totals for checkout
   */
  public async computeCheckoutTotals(params: {
    items: Array<{ productId: string; unitPrice: number; quantity: number }>;
    currency?: string;
    customerId?: string | null;
    couponCode?: string | null;
    shippingPostalCode?: string;
    country?: string;
    state?: string;
  }): Promise<CheckoutTotals> {
    const currency = params.currency || 'INR';
    const subtotal = CheckoutPricingService.calculateSubtotal(params.items);

    // 1. Calculate discount from boundary
    const discountRes = await this.discountCalculator.calculate({
      subtotal,
      customerId: params.customerId,
      couponCode: params.couponCode
    });
    const discountTotal = CheckoutPricingService.roundCurrency(discountRes.discountTotal || 0);

    // 2. Calculate shipping from boundary
    const shippingRes = await this.shippingProvider.getRates({
      subtotal,
      items: params.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      shippingPostalCode: params.shippingPostalCode,
      country: params.country
    });
    const shippingTotal = CheckoutPricingService.roundCurrency(shippingRes.shippingTotal || 0);

    // 3. Calculate tax from boundary
    const taxRes = await this.taxCalculator.calculate({
      subtotal,
      shippingTotal,
      discountTotal,
      country: params.country,
      state: params.state,
      postalCode: params.shippingPostalCode
    });
    const taxTotal = CheckoutPricingService.roundCurrency(taxRes.taxTotal || 0);

    // 4. Calculate grand total
    const grandTotal = CheckoutPricingService.roundCurrency(
      Math.max(0, subtotal - discountTotal + shippingTotal + taxTotal)
    );

    return {
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      grandTotal,
      currency
    };
  }
}
