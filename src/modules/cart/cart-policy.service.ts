import { ApiError } from '../../utils/error.ts';

export class CartPolicyService {
  public static readonly MIN_QUANTITY = 1;
  public static readonly MAX_QUANTITY_PER_LINE = 100;
  public static readonly MAX_ANTIQUE_QUANTITY = 1;
  public static readonly GUEST_CART_TTL_DAYS = 30;

  /**
   * Validate that the requested quantity conforms to general limits and antique restrictions
   */
  static validateQuantity(quantity: number, isOneOfAKind: boolean = false): void {
    if (!Number.isInteger(quantity) || quantity < this.MIN_QUANTITY) {
      throw new ApiError(400, 'INVALID_QUANTITY', `Quantity must be an integer of at least ${this.MIN_QUANTITY}`);
    }

    if (isOneOfAKind && quantity > this.MAX_ANTIQUE_QUANTITY) {
      throw new ApiError(
        400,
        'ANTIQUE_QUANTITY_EXCEEDED',
        `This antique masterwork is unique and one-of-a-kind. Maximum purchasable quantity is ${this.MAX_ANTIQUE_QUANTITY}.`
      );
    }

    if (quantity > this.MAX_QUANTITY_PER_LINE) {
      throw new ApiError(
        400,
        'MAX_QUANTITY_EXCEEDED',
        `Maximum purchasable quantity per item line is ${this.MAX_QUANTITY_PER_LINE}.`
      );
    }
  }

  /**
   * Calculate expiration date for new guest carts
   */
  static getGuestCartExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.GUEST_CART_TTL_DAYS);
    return expiresAt;
  }
}
