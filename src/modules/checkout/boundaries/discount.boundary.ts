export interface DiscountCalculationContext {
  subtotal: number;
  customerId?: string | null;
  couponCode?: string | null;
}

export interface DiscountCalculationResult {
  discountTotal: number;
  appliedCode?: string | null;
  ruleName?: string | null;
}

export interface DiscountCalculator {
  calculate(context: DiscountCalculationContext): Promise<DiscountCalculationResult>;
}

export class DefaultDiscountCalculator implements DiscountCalculator {
  async calculate(_context: DiscountCalculationContext): Promise<DiscountCalculationResult> {
    return {
      discountTotal: 0,
      appliedCode: null,
      ruleName: null
    };
  }
}
