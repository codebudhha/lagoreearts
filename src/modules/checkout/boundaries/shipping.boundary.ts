export interface ShippingRateContext {
  subtotal: number;
  items: Array<{ productId: string; quantity: number }>;
  shippingPostalCode?: string;
  country?: string;
}

export interface ShippingRateResult {
  shippingTotal: number;
  provider: string;
  serviceLevel: string;
}

export interface ShippingRateProvider {
  getRates(context: ShippingRateContext): Promise<ShippingRateResult>;
}

export class DefaultShippingRateProvider implements ShippingRateProvider {
  async getRates(_context: ShippingRateContext): Promise<ShippingRateResult> {
    return {
      shippingTotal: 0,
      provider: 'LAGOREE_WHITE_GLOVE',
      serviceLevel: 'COMPLIMENTARY_INSURED'
    };
  }
}
