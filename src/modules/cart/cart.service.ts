import { CartRepository } from './cart.repository.ts';
import { CartPolicyService } from './cart-policy.service.ts';
import { CartPricingService } from './cart-pricing.service.ts';
import { CartReconciliationService } from './cart-reconciliation.service.ts';
import { CartGuestService } from './cart-guest.service.ts';
import { prisma } from '../../database/prisma.ts';
import { ApiError } from '../../utils/error.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CartIdentity,
  AddToCartInput,
  UpdateCartItemInput,
  CartResponseDto,
  CartMergeSummary
} from './cart.types.ts';

export class CartService {
  /**
   * Resolve an existing cart or lazily create a new one based on customer/guest identity
   */
  static async getOrCreateCart(identity: CartIdentity, autoCreate: boolean = true) {
    if (identity.type === 'customer') {
      if (!identity.customerId) {
        throw new ApiError(401, 'CUSTOMER_AUTH_REQUIRED', 'Customer identity missing');
      }
      let cart = await CartRepository.findCartByCustomerId(identity.customerId, true);
      if (!cart && autoCreate) {
        cart = await CartRepository.createCustomerCart(identity.customerId);
        AuditService.log({
          action: 'CART_CREATED',
          module: 'CART',
          entityType: 'Cart',
          entityId: cart.id,
          newValues: { customerId: identity.customerId, type: 'customer' }
        });
      }
      return cart;
    } else {
      if (!identity.guestTokenHash) {
        throw new ApiError(400, 'INVALID_GUEST_CART_TOKEN', 'Guest cart token hash missing');
      }
      let cart = await CartRepository.findCartByGuestTokenHash(identity.guestTokenHash, true);
      if (!cart && autoCreate) {
        const expiresAt = CartPolicyService.getGuestCartExpirationDate();
        cart = await CartRepository.createGuestCart(identity.guestTokenHash, expiresAt);
        AuditService.log({
          action: 'CART_CREATED',
          module: 'CART',
          entityType: 'Cart',
          entityId: cart.id,
          newValues: { type: 'guest' }
        });
      }
      return cart;
    }
  }

  /**
   * Retrieve storefront cart DTO with reconciled catalogue data, warnings, and totals
   */
  static async getCart(identity: CartIdentity): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(identity, false);

    if (!cart) {
      return this.buildEmptyCartDto(identity);
    }

    return this.buildCartResponseDto(cart);
  }

  /**
   * Add a product or variant item to the cart
   */
  static async addItem(identity: CartIdentity, input: AddToCartInput): Promise<CartResponseDto> {
    const { productId, variantId, quantity } = input;

    // 1. Fetch Product with necessary details
    const product = prisma.product.findUnique({
      where: { id: productId },
      include: {
        antiqueProfile: true,
        variants: true
      }
    });

    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'The requested artwork or product does not exist');
    }

    if (product.status !== 'ACTIVE') {
      throw new ApiError(409, 'PRODUCT_UNAVAILABLE', 'This product is currently not available for acquisition');
    }

    // 2. Validate Product Type & Variant selection
    let variant: any = null;
    if (product.productType === 'VARIABLE') {
      if (!variantId) {
        throw new ApiError(400, 'VARIANT_REQUIRED', 'Please select a specific variant option for this masterwork');
      }
      variant = prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { optionValues: true }
      });
      if (!variant) {
        throw new ApiError(404, 'VARIANT_NOT_FOUND', 'The requested variant option was not found');
      }
      if (variant.productId !== product.id) {
        throw new ApiError(400, 'PRODUCT_VARIANT_MISMATCH', 'The selected variant does not belong to this product');
      }
      if (variant.status !== 'ACTIVE') {
        throw new ApiError(409, 'VARIANT_UNAVAILABLE', 'The selected variant is currently unavailable');
      }
    } else {
      if (variantId) {
        throw new ApiError(400, 'PRODUCT_VARIANT_MISMATCH', 'Simple products cannot be assigned a variant ID');
      }
    }

    // 3. Antique one-of-a-kind check & policy limits
    const isOneOfAKind = Boolean(product.antiqueProfile?.isOneOfAKind);
    CartPolicyService.validateQuantity(quantity, isOneOfAKind);

    // 4. Stock validation
    const trackInventory = variant ? variant.trackInventory : product.trackInventory;
    const allowBackorder = variant ? variant.allowBackorder : product.allowBackorder;
    const stockQuantity = variant ? variant.stockQuantity : product.stockQuantity;

    if (trackInventory && !allowBackorder && stockQuantity < quantity) {
      throw new ApiError(
        409,
        'INSUFFICIENT_STOCK',
        stockQuantity <= 0
          ? 'This item is currently out of stock'
          : `Only ${stockQuantity} units available in inventory`
      );
    }

    // 5. Ensure Cart exists
    const cart = await this.getOrCreateCart(identity, true);

    // 6. Check for duplicate existing CartItem
    const existingItem = await CartRepository.findCartItem(cart.id, productId, variantId ?? null);
    const unitPrice = CartPricingService.resolveUnitPrice(product, variant);

    if (existingItem) {
      const combinedQuantity = existingItem.quantity + quantity;
      CartPolicyService.validateQuantity(combinedQuantity, isOneOfAKind);

      if (trackInventory && !allowBackorder && stockQuantity < combinedQuantity) {
        throw new ApiError(
          409,
          'INSUFFICIENT_STOCK',
          `Cannot add ${quantity} more. Current cart has ${existingItem.quantity}, while available stock is ${stockQuantity}.`
        );
      }

      await CartRepository.updateCartItem(existingItem.id, {
        quantity: combinedQuantity,
        lastSeenUnitPrice: unitPrice
      });
    } else {
      await CartRepository.createCartItem({
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        lastSeenUnitPrice: unitPrice
      });
    }

    await CartRepository.touchCart(cart.id);

    AuditService.log({
      action: 'CART_ITEM_ADDED',
      module: 'CART',
      entityType: 'CartItem',
      entityId: cart.id,
      newValues: { productId, variantId: variantId ?? null, quantity, unitPrice }
    });

    return this.getCart(identity);
  }

  /**
   * Update item quantity in cart
   */
  static async updateItemQuantity(
    identity: CartIdentity,
    cartItemId: string,
    input: UpdateCartItemInput
  ): Promise<CartResponseDto> {
    const { quantity } = input;
    const cart = await this.getOrCreateCart(identity, false);
    if (!cart) {
      throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found in your shopping cart');
    }

    const item = await CartRepository.findCartItemById(cartItemId);
    if (!item || item.cartId !== cart.id) {
      throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found in your shopping cart');
    }

    const product = item.product;
    const variant = item.variant;

    if (!product || product.status !== 'ACTIVE') {
      throw new ApiError(409, 'PRODUCT_UNAVAILABLE', 'This item is no longer available');
    }

    if (product.productType === 'VARIABLE' && (!variant || variant.status !== 'ACTIVE')) {
      throw new ApiError(409, 'VARIANT_UNAVAILABLE', 'This variant option is no longer available');
    }

    const isOneOfAKind = Boolean(product.antiqueProfile?.isOneOfAKind);
    CartPolicyService.validateQuantity(quantity, isOneOfAKind);

    const trackInventory = variant ? variant.trackInventory : product.trackInventory;
    const allowBackorder = variant ? variant.allowBackorder : product.allowBackorder;
    const stockQuantity = variant ? variant.stockQuantity : product.stockQuantity;

    if (trackInventory && !allowBackorder && stockQuantity < quantity) {
      throw new ApiError(
        409,
        'INSUFFICIENT_STOCK',
        `Requested quantity (${quantity}) exceeds available stock (${stockQuantity})`
      );
    }

    const unitPrice = CartPricingService.resolveUnitPrice(product, variant);

    await CartRepository.updateCartItem(cartItemId, {
      quantity,
      lastSeenUnitPrice: unitPrice
    });

    await CartRepository.touchCart(cart.id);

    AuditService.log({
      action: 'CART_ITEM_UPDATED',
      module: 'CART',
      entityType: 'CartItem',
      entityId: cartItemId,
      oldValues: { quantity: item.quantity },
      newValues: { quantity, unitPrice }
    });

    return this.getCart(identity);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(identity: CartIdentity, cartItemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(identity, false);
    if (!cart) {
      throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found in your shopping cart');
    }

    const item = await CartRepository.findCartItemById(cartItemId);
    if (!item || item.cartId !== cart.id) {
      throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found in your shopping cart');
    }

    await CartRepository.deleteCartItem(cartItemId);
    await CartRepository.touchCart(cart.id);

    AuditService.log({
      action: 'CART_ITEM_REMOVED',
      module: 'CART',
      entityType: 'CartItem',
      entityId: cartItemId,
      oldValues: { productId: item.productId, variantId: item.variantId, quantity: item.quantity }
    });

    return this.getCart(identity);
  }

  /**
   * Clear all items in cart
   */
  static async clearCart(identity: CartIdentity): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(identity, false);
    if (cart) {
      await CartRepository.clearCart(cart.id);
      await CartRepository.touchCart(cart.id);

      AuditService.log({
        action: 'CART_CLEARED',
        module: 'CART',
        entityType: 'Cart',
        entityId: cart.id
      });
    }

    return this.getCart(identity);
  }

  /**
   * Recalculate cart items against current catalogue prices and stock
   */
  static async recalculateCart(identity: CartIdentity): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(identity, false);
    if (!cart) {
      return this.buildEmptyCartDto(identity);
    }

    const items = await CartRepository.findCartItemsByCartId(cart.id);
    for (const item of items) {
      if (item.product && item.product.status === 'ACTIVE') {
        const unitPrice = CartPricingService.resolveUnitPrice(item.product, item.variant);
        await CartRepository.updateCartItem(item.id, {
          lastSeenUnitPrice: unitPrice
        });
      }
    }

    await CartRepository.touchCart(cart.id);

    AuditService.log({
      action: 'CART_RECALCULATED',
      module: 'CART',
      entityType: 'Cart',
      entityId: cart.id
    });

    return this.getCart(identity);
  }

  /**
   * Merge a guest cart into an authenticated customer's cart safely and transactionally
   */
  static async mergeGuestCart(
    customerId: string,
    guestCartToken: string
  ): Promise<{ cart: CartResponseDto; summary: CartMergeSummary }> {
    if (!CartGuestService.isValidTokenFormat(guestCartToken)) {
      throw new ApiError(400, 'INVALID_GUEST_CART_TOKEN', 'Guest cart token format is invalid');
    }

    const guestTokenHash = CartGuestService.hashGuestToken(guestCartToken);
    const guestCart = await CartRepository.findCartByGuestTokenHash(guestTokenHash, true);

    const summary: CartMergeSummary = {
      merged: [],
      removed: [],
      adjusted: []
    };

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      // Guest cart was empty or nonexistent; return current customer cart
      if (guestCart) {
        await CartRepository.deleteCart(guestCart.id);
      }
      const customerCart = await this.getCart({ type: 'customer', customerId });
      return { cart: customerCart, summary };
    }

    const customerCart = await this.getOrCreateCart({ type: 'customer', customerId }, true);

    for (const guestItem of guestCart.items) {
      const product = guestItem.product;
      const variant = guestItem.variant;

      // 1. Availability check
      if (!product || product.status !== 'ACTIVE') {
        summary.removed.push({
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          reason: `Product "${product?.name || 'Item'}" is no longer active or available.`
        });
        continue;
      }

      if (product.productType === 'VARIABLE' && (!variant || variant.status !== 'ACTIVE')) {
        summary.removed.push({
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          reason: `Variant option for "${product.name}" is no longer active or available.`
        });
        continue;
      }

      const isOneOfAKind = Boolean(product.antiqueProfile?.isOneOfAKind);
      const maxAllowedPerLine = isOneOfAKind ? CartPolicyService.MAX_ANTIQUE_QUANTITY : CartPolicyService.MAX_QUANTITY_PER_LINE;
      const trackInventory = variant ? variant.trackInventory : product.trackInventory;
      const allowBackorder = variant ? variant.allowBackorder : product.allowBackorder;
      const stockQuantity = variant ? variant.stockQuantity : product.stockQuantity;

      const unitPrice = CartPricingService.resolveUnitPrice(product, variant);

      // 2. Check if customer already has this item
      const existingCustomerItem = await CartRepository.findCartItem(
        customerCart.id,
        guestItem.productId,
        guestItem.variantId ?? null
      );

      if (existingCustomerItem) {
        const rawCombined = existingCustomerItem.quantity + guestItem.quantity;
        let finalQty = rawCombined;

        if (finalQty > maxAllowedPerLine) {
          finalQty = maxAllowedPerLine;
        }

        if (trackInventory && !allowBackorder && finalQty > stockQuantity) {
          finalQty = Math.max(existingCustomerItem.quantity, stockQuantity);
        }

        if (finalQty !== rawCombined) {
          summary.adjusted.push({
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            requestedQuantity: rawCombined,
            adjustedQuantity: finalQty,
            reason: isOneOfAKind
              ? 'One-of-a-kind antique masterwork limited to 1 unit.'
              : `Quantity adjusted to fit inventory limits (${stockQuantity} available).`
          });
        }

        await CartRepository.updateCartItem(existingCustomerItem.id, {
          quantity: finalQty,
          lastSeenUnitPrice: unitPrice
        });

        summary.merged.push({
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: finalQty,
          unitPrice
        });
      } else {
        let finalQty = guestItem.quantity;
        if (finalQty > maxAllowedPerLine) {
          finalQty = maxAllowedPerLine;
        }

        if (trackInventory && !allowBackorder && finalQty > stockQuantity) {
          finalQty = stockQuantity;
        }

        if (finalQty <= 0) {
          summary.removed.push({
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            reason: `"${product.name}" is currently out of stock.`
          });
          continue;
        }

        if (finalQty !== guestItem.quantity) {
          summary.adjusted.push({
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            requestedQuantity: guestItem.quantity,
            adjustedQuantity: finalQty,
            reason: `Quantity adjusted to available stock (${stockQuantity}).`
          });
        }

        await CartRepository.createCartItem({
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId ?? null,
          quantity: finalQty,
          lastSeenUnitPrice: unitPrice
        });

        summary.merged.push({
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: finalQty,
          unitPrice
        });
      }
    }

    // Invalidate and delete guest cart
    await CartRepository.deleteCart(guestCart.id);
    await CartRepository.touchCart(customerCart.id);

    AuditService.log({
      action: 'CART_MERGED',
      module: 'CART',
      entityType: 'Cart',
      entityId: customerCart.id,
      newValues: {
        mergedCount: summary.merged.length,
        removedCount: summary.removed.length,
        adjustedCount: summary.adjusted.length
      }
    });

    const updatedCart = await this.getCart({ type: 'customer', customerId });
    return { cart: updatedCart, summary };
  }

  /**
   * Helper for Module 19 Checkout integration
   */
  static async getCartForCheckout(customerId: string): Promise<CartResponseDto> {
    const cartDto = await this.getCart({ type: 'customer', customerId });
    if (cartDto.items.length === 0) {
      throw new ApiError(400, 'EMPTY_CART', 'Shopping cart is empty');
    }
    const unavailableItems = cartDto.items.filter(i => !i.isAvailable);
    if (unavailableItems.length > 0) {
      throw new ApiError(
        409,
        'UNAVAILABLE_CART_ITEMS',
        'One or more artworks in your cart are no longer available for acquisition'
      );
    }
    return cartDto;
  }

  /**
   * Helper to build structured response DTO from cart record
   */
  private static buildCartResponseDto(cart: any): CartResponseDto {
    const rawItems = cart.items || [];
    const itemDtos: any[] = [];
    const allWarnings: any[] = [];

    for (const rawItem of rawItems) {
      const rec = CartReconciliationService.reconcileItem(rawItem);
      itemDtos.push(rec.dto);
      if (rec.warnings.length > 0) {
        allWarnings.push(...rec.warnings);
      }
    }

    const availableItems = itemDtos.filter(i => i.isAvailable);
    const totals = CartPricingService.calculateCartTotals(availableItems, cart.currency);

    return {
      id: cart.id,
      customerId: cart.customerId || null,
      isGuest: !cart.customerId,
      currency: cart.currency,
      items: itemDtos,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      totals,
      warnings: allWarnings,
      expiresAt: cart.expiresAt || null,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };
  }

  /**
   * Build empty cart placeholder DTO
   */
  private static buildEmptyCartDto(identity: CartIdentity): CartResponseDto {
    const isGuest = identity.type === 'guest';
    const totals = CartPricingService.calculateCartTotals([], 'INR');

    return {
      id: 'empty',
      customerId: identity.customerId || null,
      isGuest,
      currency: 'INR',
      items: [],
      itemCount: 0,
      subtotal: 0,
      totals,
      warnings: [],
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
