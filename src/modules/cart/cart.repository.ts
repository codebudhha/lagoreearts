import { prisma } from '../../database/prisma.ts';

const CART_INCLUDE_ITEMS = {
  items: {
    include: {
      product: {
        include: {
          media: true,
          antiqueProfile: true,
          sanskritEditProfile: true
        }
      },
      variant: {
        include: {
          optionValues: true,
          media: true
        }
      }
    }
  }
};

export class CartRepository {
  static async findCartByCustomerId(customerId: string, includeItems: boolean = true) {
    return prisma.cart.findUnique({
      where: { customerId },
      include: includeItems ? CART_INCLUDE_ITEMS : undefined
    });
  }

  static async findCartByGuestTokenHash(guestTokenHash: string, includeItems: boolean = true) {
    return prisma.cart.findUnique({
      where: { guestTokenHash },
      include: includeItems ? CART_INCLUDE_ITEMS : undefined
    });
  }

  static async findCartById(cartId: string, includeItems: boolean = true) {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: includeItems ? CART_INCLUDE_ITEMS : undefined
    });
  }

  static async createCustomerCart(customerId: string, currency: string = 'INR') {
    return prisma.cart.create({
      data: {
        customerId,
        currency
      },
      include: CART_INCLUDE_ITEMS
    });
  }

  static async createGuestCart(guestTokenHash: string, expiresAt: Date, currency: string = 'INR') {
    return prisma.cart.create({
      data: {
        guestTokenHash,
        expiresAt,
        currency
      },
      include: CART_INCLUDE_ITEMS
    });
  }

  static async findCartItem(cartId: string, productId: string, variantId?: string | null) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId ?? null
      },
      include: {
        product: {
          include: {
            media: true,
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        },
        variant: {
          include: {
            optionValues: true,
            media: true
          }
        }
      }
    });
  }

  static async findCartItemById(cartItemId: string) {
    return prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: {
          include: {
            media: true,
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        },
        variant: {
          include: {
            optionValues: true,
            media: true
          }
        }
      }
    });
  }

  static async findCartItemsByCartId(cartId: string) {
    return prisma.cartItem.findMany({
      where: { cartId },
      include: {
        product: {
          include: {
            media: true,
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        },
        variant: {
          include: {
            optionValues: true,
            media: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async createCartItem(data: {
    cartId: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    lastSeenUnitPrice?: number | null;
  }) {
    return prisma.cartItem.create({
      data: {
        cartId: data.cartId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        quantity: data.quantity,
        lastSeenUnitPrice: data.lastSeenUnitPrice !== undefined ? data.lastSeenUnitPrice : null
      },
      include: {
        product: {
          include: {
            media: true,
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        },
        variant: {
          include: {
            optionValues: true,
            media: true
          }
        }
      }
    });
  }

  static async updateCartItem(
    cartItemId: string,
    data: {
      quantity?: number;
      lastSeenUnitPrice?: number | null;
    }
  ) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data,
      include: {
        product: {
          include: {
            media: true,
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        },
        variant: {
          include: {
            optionValues: true,
            media: true
          }
        }
      }
    });
  }

  static async deleteCartItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId }
    });
  }

  static async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { cartId }
    });
  }

  static async deleteCart(cartId: string) {
    return prisma.cart.delete({
      where: { id: cartId }
    });
  }

  static async touchCart(cartId: string) {
    return prisma.cart.update({
      where: { id: cartId },
      data: {}
    });
  }

  static async deleteExpiredGuestCarts(now: Date = new Date()) {
    return prisma.cart.deleteMany({
      where: {
        expiresAt: { lt: now },
        customerId: null
      }
    });
  }
}
