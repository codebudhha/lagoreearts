import type { Request, Response } from '../../utils/express.ts';
import { CartRepository } from './cart.repository.ts';
import { CartReconciliationService } from './cart-reconciliation.service.ts';
import { CartPricingService } from './cart-pricing.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { CartValidator } from './cart.validator.ts';
import { ApiError } from '../../utils/error.ts';

export class AdminCartController {
  /**
   * GET /api/v1/admin/carts/:id
   * Read-only admin cart inspection with RBAC
   */
  static async getCartById(req: Request, res: Response) {
    const { id } = CartValidator.parseIdParam(req.params);

    const cart = await CartRepository.findCartById(id, true);
    if (!cart) {
      throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
    }

    const itemDtos: any[] = [];
    const warnings: any[] = [];

    for (const rawItem of cart.items || []) {
      const rec = CartReconciliationService.reconcileItem(rawItem);
      itemDtos.push(rec.dto);
      if (rec.warnings.length > 0) {
        warnings.push(...rec.warnings);
      }
    }

    const availableItems = itemDtos.filter(i => i.isAvailable);
    const totals = CartPricingService.calculateCartTotals(availableItems, cart.currency);

    const adminCartDto = {
      id: cart.id,
      customerId: cart.customerId || null,
      isGuest: !cart.customerId,
      currency: cart.currency,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      totals,
      items: itemDtos,
      warnings,
      expiresAt: cart.expiresAt || null,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };

    return ApiResponse.success(res, adminCartDto, 200, 'Cart retrieved for admin inspection');
  }
}
