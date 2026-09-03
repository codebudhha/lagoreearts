import type { Request, Response } from '../../utils/express.ts';
import { CartService } from './cart.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { CartValidator } from './cart.validator.ts';

export class CartController {
  /**
   * GET /api/v1/cart
   */
  static async getCart(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const cart = await CartService.getCart(identity);
    return ApiResponse.success(res, cart, 200, 'Shopping cart retrieved');
  }

  /**
   * POST /api/v1/cart/items
   */
  static async addItem(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const validated = CartValidator.parseAddToCart(req.body);
    const cart = await CartService.addItem(identity, validated);
    return ApiResponse.success(res, cart, 200, 'Item added to shopping cart');
  }

  /**
   * PATCH /api/v1/cart/items/:id
   */
  static async updateItem(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const { id } = CartValidator.parseIdParam(req.params);
    const validated = CartValidator.parseUpdateCartItem(req.body);
    const cart = await CartService.updateItemQuantity(identity, id, validated);
    return ApiResponse.success(res, cart, 200, 'Cart item quantity updated');
  }

  /**
   * DELETE /api/v1/cart/items/:id
   */
  static async removeItem(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const { id } = CartValidator.parseIdParam(req.params);
    const cart = await CartService.removeItem(identity, id);
    return ApiResponse.success(res, cart, 200, 'Item removed from shopping cart');
  }

  /**
   * DELETE /api/v1/cart
   */
  static async clearCart(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const cart = await CartService.clearCart(identity);
    return ApiResponse.success(res, cart, 200, 'Shopping cart cleared');
  }

  /**
   * POST /api/v1/cart/recalculate
   */
  static async recalculate(req: Request, res: Response) {
    const identity = (req as any).cartIdentity;
    const cart = await CartService.recalculateCart(identity);
    return ApiResponse.success(res, cart, 200, 'Shopping cart recalculated');
  }

  /**
   * POST /api/v1/cart/merge
   */
  static async merge(req: Request, res: Response) {
    const customer = (req as any).customer;
    if (!customer || !customer.id) {
      return ApiResponse.unauthenticated(res, 'Authenticated customer identity required to merge cart');
    }

    const validated = CartValidator.parseMergeCart(req.body);
    const result = await CartService.mergeGuestCart(customer.id, validated.guestCartToken);
    return ApiResponse.success(res, result, 200, 'Guest cart merged successfully into patron account');
  }
}
