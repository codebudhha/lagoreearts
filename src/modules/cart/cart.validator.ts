import { ApiError } from '../../utils/error.ts';
import type { AddToCartInput, UpdateCartItemInput, MergeCartInput } from './cart.types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val: string | null | undefined): boolean {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

export class CartValidator {
  static parseAddToCart(body: any): AddToCartInput {
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Request body must be an object');
    }

    const { productId, variantId, quantity } = body;

    if (!productId || !isValidUuid(productId)) {
      throw new ApiError(400, 'INVALID_PRODUCT_ID', 'Product ID must be a valid UUID');
    }

    if (variantId !== undefined && variantId !== null && !isValidUuid(variantId)) {
      throw new ApiError(400, 'INVALID_VARIANT_ID', 'Variant ID must be a valid UUID');
    }

    const qty = quantity === undefined ? 1 : quantity;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new ApiError(400, 'INVALID_QUANTITY', 'Quantity must be an integer between 1 and 100');
    }

    return {
      productId: productId.trim(),
      variantId: variantId ? variantId.trim() : null,
      quantity: qty
    };
  }

  static parseUpdateCartItem(body: any): UpdateCartItemInput {
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Request body must be an object');
    }

    const { quantity } = body;

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new ApiError(400, 'INVALID_QUANTITY', 'Quantity must be an integer between 1 and 100');
    }

    return {
      quantity
    };
  }

  static parseMergeCart(body: any): MergeCartInput {
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Request body must be an object');
    }

    const { guestCartToken } = body;

    if (!guestCartToken || typeof guestCartToken !== 'string' || guestCartToken.trim().length === 0) {
      throw new ApiError(400, 'INVALID_GUEST_CART_TOKEN', 'Guest cart token cannot be empty');
    }

    return {
      guestCartToken: guestCartToken.trim()
    };
  }

  static parseIdParam(params: any): { id: string } {
    if (!params || !params.id || !isValidUuid(params.id)) {
      throw new ApiError(400, 'INVALID_ID_PARAM', 'ID parameter must be a valid UUID');
    }
    return { id: params.id.trim() };
  }
}
