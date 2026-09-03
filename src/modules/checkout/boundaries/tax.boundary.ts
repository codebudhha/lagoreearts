export interface TaxCalculationContext {
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  country?: string;
  state?: string;
  postalCode?: string;
}

export interface TaxCalculationResult {
  taxTotal: number;
  taxRate: number;
  isInclusive: boolean;
  jurisdiction: string;
}

export interface TaxCalculator {
  calculate(context: TaxCalculationContext): Promise<TaxCalculationResult>;
}

export class DefaultTaxCalculator implements TaxCalculator {
  async calculate(_context: TaxCalculationContext): Promise<TaxCalculationResult> {
    // In Lagoree Arts, current prices are inclusive of GST / tax unless an external tax engine is configured.
    return {
      taxTotal: 0,
      taxRate: 0,
      isInclusive: true,
      jurisdiction: 'IN_GST'
    };
  }
}
