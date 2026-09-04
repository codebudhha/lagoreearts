/**
 * Module 22: Shipping & Delivery — Public Shipping Quote & Serviceability Controller
 * Lagoree Arts Backend
 */

import type { Request, Response } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ShippingRateService } from './shipping-rate.service.ts';
import { ShippingValidator } from './shipping.validator.ts';

export class ShippingQuoteController {
  /**
   * POST /api/v1/shipping/rates/quote
   * Public storefront & checkout quote endpoint to preview shipping costs.
   */
  public static async getQuote(req: Request, res: Response): Promise<Response> {
    try {
      const { postalCode, orderValue, weight, currency, methodCode } = req.body || {};

      if (!postalCode || !ShippingValidator.isValidPostalCode(postalCode)) {
        return ApiResponse.badRequest(res, 'Valid Indian 6-digit PIN code is required');
      }

      const quote = await ShippingRateService.getAvailableMethods({
        postalCode: String(postalCode),
        orderValue: orderValue !== undefined ? Number(orderValue) : 0,
        weight: weight !== undefined ? Number(weight) : undefined,
        currency: currency ? String(currency).toUpperCase().trim() : 'INR'
      });

      return ApiResponse.success(res, quote);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/shipping/serviceability/:postalCode
   * Quick serviceability verification for patrons on product & cart pages.
   */
  public static async checkServiceability(req: Request, res: Response): Promise<Response> {
    try {
      const { postalCode } = req.params;

      if (!postalCode || !ShippingValidator.isValidPostalCode(postalCode)) {
        return ApiResponse.badRequest(res, 'Invalid Indian 6-digit PIN code format');
      }

      const result = await ShippingRateService.checkServiceability(postalCode);
      return ApiResponse.success(res, result);
    } catch (err: any) {
      return ApiResponse.error(res, err.code || 'INTERNAL_ERROR', err.message, err.statusCode || 500);
    }
  }
}
