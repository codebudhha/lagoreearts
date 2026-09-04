/**
 * Module 22: Shipping & Delivery — Shipping Rate Engine
 * Lagoree Arts Backend
 */

import { ShippingZoneRepository } from './shipping-zone.repository.ts';
import { ShippingMethodRepository } from './shipping-method.repository.ts';
import { ShippingRateRepository } from './shipping-rate.repository.ts';
import { ShippingValidator } from './shipping.validator.ts';
import type {
  ShippingQuoteResponse,
  ShippingMethodQuote,
  ShippingRateRecord,
  ShippingZoneRecord
} from './shipping.types.ts';

export class ShippingRateService {
  /**
   * Resolves the effective geographical shipping zone for a given Indian postal code.
   */
  public static async resolveZone(postalCode: string): Promise<ShippingZoneRecord | null> {
    if (!ShippingValidator.isValidPostalCode(postalCode)) {
      return null;
    }

    const mapping = await ShippingZoneRepository.findPostalCodeMapping(postalCode);
    if (!mapping) return null;

    const zone = await ShippingZoneRepository.findById(mapping.zoneId);
    if (!zone || zone.status !== 'ACTIVE') return null;

    return zone;
  }

  /**
   * Checks whether a postal code is serviceable.
   */
  public static async checkServiceability(postalCode: string): Promise<{
    serviceable: boolean;
    postalCode: string;
    zone?: { id: string; name: string; code: string };
    city?: string | null;
    state?: string | null;
  }> {
    if (!ShippingValidator.isValidPostalCode(postalCode)) {
      const err: any = new Error('Invalid Indian 6-digit PIN code format');
      err.statusCode = 400;
      err.code = 'INVALID_POSTAL_CODE';
      throw err;
    }

    const mapping = await ShippingZoneRepository.findPostalCodeMapping(postalCode);
    if (!mapping) {
      return {
        serviceable: false,
        postalCode: postalCode.trim()
      };
    }

    const zone = await ShippingZoneRepository.findById(mapping.zoneId);
    if (!zone || zone.status !== 'ACTIVE') {
      return {
        serviceable: false,
        postalCode: postalCode.trim()
      };
    }

    return {
      serviceable: true,
      postalCode: postalCode.trim(),
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code
      },
      city: mapping.city,
      state: mapping.state
    };
  }

  /**
   * Determines matching shipping rate for a specific method given zone, order value, weight.
   */
  private static findBestRateForMethod(
    rates: ShippingRateRecord[],
    methodId: string,
    orderValue: number,
    weight?: number
  ): ShippingRateRecord | null {
    const candidateRates = rates.filter(r => {
      if (r.shippingMethodId !== methodId) return false;
      if (r.status !== 'ACTIVE') return false;

      // Check order value brackets
      if (r.minOrderValue !== null && orderValue < r.minOrderValue) return false;
      if (r.maxOrderValue !== null && orderValue > r.maxOrderValue) return false;

      // Check weight brackets if weight is supplied
      if (weight !== undefined && weight !== null) {
        if (r.minWeight !== null && weight < r.minWeight) return false;
        if (r.maxWeight !== null && weight > r.maxWeight) return false;
      }

      return true;
    });

    if (candidateRates.length === 0) return null;

    // Sort by priority DESC, amount ASC
    candidateRates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.amount - b.amount;
    });

    return candidateRates[0];
  }

  /**
   * Calculates quotes for all available methods in the customer's serviceable zone.
   */
  public static async getAvailableMethods(params: {
    postalCode: string;
    orderValue?: number;
    weight?: number;
    currency?: string;
  }): Promise<ShippingQuoteResponse> {
    const postalCode = ShippingValidator.normalizePostalCode(params.postalCode);
    if (!ShippingValidator.isValidPostalCode(postalCode)) {
      const err: any = new Error('Invalid postal code format');
      err.statusCode = 400;
      err.code = 'INVALID_POSTAL_CODE';
      throw err;
    }

    const zone = await this.resolveZone(postalCode);
    if (!zone) {
      return {
        serviceable: false,
        zone: null,
        postalCode,
        methods: []
      };
    }

    const currency = params.currency ? params.currency.toUpperCase().trim() : 'INR';
    const orderValue = Number(params.orderValue || 0);

    const activeMethods = await ShippingMethodRepository.listMethods({ status: 'ACTIVE' });
    const allRates = await ShippingRateRepository.findApplicableRates({
      shippingZoneId: zone.id,
      currency
    });

    const methodQuotes: ShippingMethodQuote[] = [];

    for (const m of activeMethods) {
      const rate = this.findBestRateForMethod(allRates, m.id, orderValue, params.weight);
      if (rate) {
        methodQuotes.push({
          methodId: m.id,
          methodCode: m.code,
          methodName: m.name,
          carrier: m.carrier,
          serviceLevel: m.serviceLevel,
          estimatedMinDays: m.estimatedMinDays,
          estimatedMaxDays: m.estimatedMaxDays,
          amount: Number(rate.amount),
          currency: rate.currency,
          isFree: Number(rate.amount) === 0
        });
      }
    }

    return {
      serviceable: methodQuotes.length > 0,
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code
      },
      postalCode,
      methods: methodQuotes
    };
  }

  /**
   * Calculates authoritative shipping charge for a specific order / postal code / method.
   */
  public static async calculateShipping(params: {
    postalCode?: string;
    orderValue: number;
    weight?: number;
    methodCode?: string;
    currency?: string;
  }): Promise<{
    shippingTotal: number;
    currency: string;
    zoneCode: string;
    zoneName: string;
    methodCode: string;
    methodName: string;
    carrier: string | null;
    serviceLevel: string | null;
    estimatedMinDays: number | null;
    estimatedMaxDays: number | null;
  }> {
    const postalCode = params.postalCode ? ShippingValidator.normalizePostalCode(params.postalCode) : '';
    if (!postalCode || !ShippingValidator.isValidPostalCode(postalCode)) {
      // Default / fallback complimentary insured white glove if no postal code yet configured
      return {
        shippingTotal: 0,
        currency: params.currency || 'INR',
        zoneCode: 'DEFAULT',
        zoneName: 'Lagoree Art Standard Heritage Service',
        methodCode: 'STANDARD',
        methodName: 'Standard Insured Art Delivery',
        carrier: 'LAGOREE_WHITE_GLOVE',
        serviceLevel: 'COMPLIMENTARY_INSURED',
        estimatedMinDays: 3,
        estimatedMaxDays: 7
      };
    }

    const quotes = await this.getAvailableMethods({
      postalCode,
      orderValue: params.orderValue,
      weight: params.weight,
      currency: params.currency
    });

    if (!quotes.serviceable || quotes.methods.length === 0) {
      const err: any = new Error(`Postal code ${postalCode} is unserviceable for delivery.`);
      err.statusCode = 422;
      err.code = 'SHIPPING_UNSERVICEABLE';
      throw err;
    }

    let selectedQuote: ShippingMethodQuote | undefined;
    if (params.methodCode) {
      const reqCode = params.methodCode.toUpperCase().trim();
      selectedQuote = quotes.methods.find(m => m.methodCode === reqCode);
      if (!selectedQuote) {
        const err: any = new Error(`Requested shipping method '${params.methodCode}' is not available for this postal code and order.`);
        err.statusCode = 422;
        err.code = 'SHIPPING_METHOD_UNAVAILABLE';
        throw err;
      }
    } else {
      // Default to cheapest available method (e.g. free or standard)
      selectedQuote = quotes.methods.sort((a, b) => a.amount - b.amount)[0];
    }

    return {
      shippingTotal: selectedQuote.amount,
      currency: selectedQuote.currency,
      zoneCode: quotes.zone!.code,
      zoneName: quotes.zone!.name,
      methodCode: selectedQuote.methodCode,
      methodName: selectedQuote.methodName,
      carrier: selectedQuote.carrier,
      serviceLevel: selectedQuote.serviceLevel,
      estimatedMinDays: selectedQuote.estimatedMinDays,
      estimatedMaxDays: selectedQuote.estimatedMaxDays
    };
  }
}
