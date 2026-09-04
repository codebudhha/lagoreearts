import { ShippingRateService } from '../../shipping/shipping-rate.service.ts';

export interface ShippingRateContext {
  subtotal: number;
  items: Array<{ productId: string; quantity: number }>;
  shippingPostalCode?: string;
  country?: string;
  methodCode?: string;
  currency?: string;
}

export interface ShippingRateResult {
  shippingTotal: number;
  provider: string;
  serviceLevel: string;
  zoneCode?: string;
  methodCode?: string;
}

export interface ShippingRateProvider {
  getRates(context: ShippingRateContext): Promise<ShippingRateResult>;
}

export class DefaultShippingRateProvider implements ShippingRateProvider {
  async getRates(context: ShippingRateContext): Promise<ShippingRateResult> {
    try {
      const calc = await ShippingRateService.calculateShipping({
        postalCode: context.shippingPostalCode,
        orderValue: context.subtotal,
        methodCode: context.methodCode,
        currency: context.currency || 'INR'
      });

      return {
        shippingTotal: calc.shippingTotal,
        provider: calc.carrier || 'LAGOREE_WHITE_GLOVE',
        serviceLevel: calc.serviceLevel || 'COMPLIMENTARY_INSURED',
        zoneCode: calc.zoneCode,
        methodCode: calc.methodCode
      };
    } catch {
      return {
        shippingTotal: 0,
        provider: 'LAGOREE_WHITE_GLOVE',
        serviceLevel: 'COMPLIMENTARY_INSURED'
      };
    }
  }
}

