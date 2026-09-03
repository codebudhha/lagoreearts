import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { ApiError } from '../../utils/error.ts';
import { CheckoutService } from './checkout.service.ts';
import { CheckoutValidator } from './checkout.validator.ts';

const checkoutService = new CheckoutService();

export class AdminCheckoutController {
  /**
   * GET /api/v1/admin/checkout/:id
   * Admin read-only inspection of checkout session
   */
  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!CheckoutValidator.isValidUuid(id)) {
        throw new ApiError(400, 'INVALID_CHECKOUT_ID', 'Invalid checkout ID format');
      }

      const checkout = await checkoutService.adminGetCheckoutById(id);
      return ApiResponse.success(res, checkout, 'Admin checkout inspection retrieved');
    } catch (err) {
      next(err);
    }
  }
}
