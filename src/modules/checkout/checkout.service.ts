import { prisma } from '../../database/prisma.ts';
import { ApiError } from '../../utils/error.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { CartSessionIdentity } from '../cart/cart.types.ts';
import type {
  CheckoutStatus,
  CheckoutWarning,
  CheckoutSessionView,
  CheckoutValidationResult,
  CompletedCheckoutContract,
  CreateCheckoutDto,
  UpdateCheckoutAddressesDto,
  CheckoutAddressPayload
} from './checkout.types.ts';
import { CheckoutPolicyService } from './checkout-policy.service.ts';
import { CheckoutPricingService } from './checkout-pricing.service.ts';
import { CheckoutRepository } from './checkout.repository.ts';
import { CartRepository } from '../cart/cart.repository.ts';
import { CartReconciliationService } from '../cart/cart-reconciliation.service.ts';

export class CheckoutService {
  private pricingService: CheckoutPricingService;

  constructor(pricingService?: CheckoutPricingService) {
    this.pricingService = pricingService || new CheckoutPricingService();
  }

  /**
   * Format database checkout session into public API view
   */
  private formatSessionView(session: any, warnings: CheckoutWarning[] = []): CheckoutSessionView {
    const shippingAddr = session.addresses?.find((a: any) => a.type === 'SHIPPING') || null;
    const billingAddr = session.addresses?.find((a: any) => a.type === 'BILLING') || null;

    return {
      id: session.id,
      customerId: session.customerId || null,
      cartId: session.cartId,
      status: session.status as CheckoutStatus,
      currency: session.currency,
      email: session.email,
      items: (session.items || []).map((item: any) => ({
        id: item.id,
        checkoutSessionId: item.checkoutSessionId,
        productId: item.productId,
        variantId: item.variantId || null,
        sku: item.sku,
        productName: item.productName,
        variantDescription: item.variantDescription || null,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        currency: item.currency,
        createdAt: item.createdAt
      })),
      shippingAddress: shippingAddr ? {
        id: shippingAddr.id,
        checkoutSessionId: shippingAddr.checkoutSessionId,
        type: 'SHIPPING',
        firstName: shippingAddr.firstName,
        lastName: shippingAddr.lastName,
        companyName: shippingAddr.companyName || null,
        addressLine1: shippingAddr.addressLine1,
        addressLine2: shippingAddr.addressLine2 || null,
        landmark: shippingAddr.landmark || null,
        city: shippingAddr.city,
        state: shippingAddr.state,
        postalCode: shippingAddr.postalCode,
        country: shippingAddr.country,
        phone: shippingAddr.phone,
        createdAt: shippingAddr.createdAt
      } : null,
      billingAddress: billingAddr ? {
        id: billingAddr.id,
        checkoutSessionId: billingAddr.checkoutSessionId,
        type: 'BILLING',
        firstName: billingAddr.firstName,
        lastName: billingAddr.lastName,
        companyName: billingAddr.companyName || null,
        addressLine1: billingAddr.addressLine1,
        addressLine2: billingAddr.addressLine2 || null,
        landmark: billingAddr.landmark || null,
        city: billingAddr.city,
        state: billingAddr.state,
        postalCode: billingAddr.postalCode,
        country: billingAddr.country,
        phone: billingAddr.phone,
        createdAt: billingAddr.createdAt
      } : null,
      totals: {
        subtotal: Number(session.subtotal),
        discountTotal: Number(session.discountTotal),
        shippingTotal: Number(session.shippingTotal),
        taxTotal: Number(session.taxTotal),
        grandTotal: Number(session.grandTotal),
        currency: session.currency
      },
      warnings,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }

  /**
   * Verify session ownership for authenticated patron or guest
   */
  private verifySessionOwnership(session: any, identity: any): void {
    const isCustomer = identity.type === 'customer' || !!identity.customerId;
    if (isCustomer) {
      if (session.customerId !== identity.customerId) {
        throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
      }
    } else {
      if (!session.guestTokenHash || session.guestTokenHash !== identity.guestTokenHash) {
        throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
      }
    }
  }

  /**
   * CREATE CHECKOUT SESSION
   */
  public async createCheckout(
    identity: any,
    dto: CreateCheckoutDto,
    idempotencyKey?: string | null
  ): Promise<CheckoutSessionView> {
    const isCustomer = identity.type === 'customer' || !!identity.customerId;
    const customerId = isCustomer ? identity.customerId : null;
    const guestTokenHash = !isCustomer ? identity.guestTokenHash : null;

    // 1. Check idempotency
    if (idempotencyKey) {
      const existing = await CheckoutRepository.findCheckoutByIdempotencyKey(idempotencyKey);
      if (existing) {
        this.verifySessionOwnership(existing, identity);
        return this.formatSessionView(existing);
      }
    }

    // 2. Load Cart
    let cart: any = null;
    if (isCustomer && customerId) {
      cart = await CartRepository.findCartByCustomerId(customerId);
    } else if (guestTokenHash) {
      cart = await CartRepository.findCartByGuestTokenHash(guestTokenHash);
    }

    if (!cart) {
      throw new ApiError(409, 'CHECKOUT_CART_EMPTY', 'Cannot initiate checkout with an empty shopping cart');
    }

    const cartItems = await CartRepository.findCartItemsByCartId(cart.id);
    if (!cartItems || cartItems.length === 0) {
      throw new ApiError(409, 'CHECKOUT_CART_EMPTY', 'Cannot initiate checkout with an empty shopping cart');
    }

    // 3. Reconcile Cart Items against live catalogue
    const reconciliationResults = cartItems.map(item => CartReconciliationService.reconcileItem(item));
    const allWarnings = reconciliationResults.flatMap(r => r.warnings);

    // If any items are completely unavailable or out of stock, reject checkout creation
    const blockingWarnings = allWarnings.filter(w =>
      w.code === 'PRODUCT_UNAVAILABLE' ||
      w.code === 'VARIANT_UNAVAILABLE' ||
      w.code === 'INSUFFICIENT_STOCK'
    );

    if (blockingWarnings.length > 0) {
      throw new ApiError(409, 'CHECKOUT_ITEMS_UNAVAILABLE', 'Some items in your cart are no longer available for purchase', {
        warnings: blockingWarnings
      });
    }

    // 4. Resolve Email
    let email = '';
    let customer: any = null;
    if (isCustomer && customerId) {
      customer = prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new ApiError(401, 'CUSTOMER_NOT_FOUND', 'Customer account not found');
      }
      email = dto.email ? CheckoutPolicyService.validateEmail(dto.email) : customer.email;
    } else {
      if (!dto.email) {
        throw new ApiError(400, 'GUEST_EMAIL_REQUIRED', 'A contact email is required for guest checkout');
      }
      email = CheckoutPolicyService.validateEmail(dto.email);
    }

    // 5. Resolve Addresses
    const addressesToCreate: Array<CheckoutAddressPayload & { type: 'SHIPPING' | 'BILLING' }> = [];
    let shippingAddressId: string | null = null;
    let billingAddressId: string | null = null;

    if (isCustomer && customerId) {
      // Patron checkout
      if (dto.shippingAddressId) {
        const addr = prisma.customerAddress.findUnique({ where: { id: dto.shippingAddressId } });
        if (!addr || addr.customerId !== customerId) {
          throw new ApiError(404, 'ADDRESS_NOT_FOUND', 'Selected shipping address not found in your account');
        }
        shippingAddressId = addr.id;
        addressesToCreate.push({
          type: 'SHIPPING',
          firstName: addr.firstName,
          lastName: addr.lastName,
          companyName: addr.companyName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone
        });
      } else if (dto.shippingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.shippingAddress, 'SHIPPING');
        addressesToCreate.push({ type: 'SHIPPING', ...validated });
      } else {
        // Find default shipping address
        const defShipping = prisma.customerAddress.findFirst({
          where: { customerId, isDefaultShipping: true }
        });
        if (defShipping) {
          shippingAddressId = defShipping.id;
          addressesToCreate.push({
            type: 'SHIPPING',
            firstName: defShipping.firstName,
            lastName: defShipping.lastName,
            companyName: defShipping.companyName,
            addressLine1: defShipping.addressLine1,
            addressLine2: defShipping.addressLine2,
            landmark: defShipping.landmark,
            city: defShipping.city,
            state: defShipping.state,
            postalCode: defShipping.postalCode,
            country: defShipping.country,
            phone: defShipping.phone
          });
        }
      }

      if (dto.billingAddressId) {
        const addr = prisma.customerAddress.findUnique({ where: { id: dto.billingAddressId } });
        if (!addr || addr.customerId !== customerId) {
          throw new ApiError(404, 'ADDRESS_NOT_FOUND', 'Selected billing address not found in your account');
        }
        billingAddressId = addr.id;
        addressesToCreate.push({
          type: 'BILLING',
          firstName: addr.firstName,
          lastName: addr.lastName,
          companyName: addr.companyName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone
        });
      } else if (dto.billingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.billingAddress, 'BILLING');
        addressesToCreate.push({ type: 'BILLING', ...validated });
      } else {
        // Look up customer's default billing address
        const defBilling = prisma.customerAddress.findFirst({
          where: { customerId, isDefaultBilling: true }
        });
        if (defBilling) {
          billingAddressId = defBilling.id;
          addressesToCreate.push({
            type: 'BILLING',
            firstName: defBilling.firstName,
            lastName: defBilling.lastName,
            companyName: defBilling.companyName,
            addressLine1: defBilling.addressLine1,
            addressLine2: defBilling.addressLine2,
            landmark: defBilling.landmark,
            city: defBilling.city,
            state: defBilling.state,
            postalCode: defBilling.postalCode,
            country: defBilling.country,
            phone: defBilling.phone
          });
        } else {
          // If shipping address was resolved, mirror it for billing
          const ship = addressesToCreate.find(a => a.type === 'SHIPPING');
          if (ship) {
            addressesToCreate.push({ ...ship, type: 'BILLING' });
          }
        }
      }
    } else {
      // Guest checkout requires shipping address in payload
      if (!dto.shippingAddress) {
        throw new ApiError(400, 'SHIPPING_ADDRESS_REQUIRED', 'A valid shipping address is required for guest checkout');
      }
      const validatedShipping = CheckoutPolicyService.validateAddress(dto.shippingAddress, 'SHIPPING');
      addressesToCreate.push({ type: 'SHIPPING', ...validatedShipping });

      if (dto.billingAddress) {
        const validatedBilling = CheckoutPolicyService.validateAddress(dto.billingAddress, 'BILLING');
        addressesToCreate.push({ type: 'BILLING', ...validatedBilling });
      } else {
        addressesToCreate.push({ type: 'BILLING', ...validatedShipping });
      }
    }

    // 6. Build Checkout Item Snapshots
    const itemsToSnapshot = reconciliationResults.map(rec => ({
      productId: rec.dto.productId,
      variantId: rec.dto.variantId || null,
      sku: rec.dto.variant?.sku || rec.dto.product.sku,
      productName: rec.dto.product.name,
      variantDescription: rec.dto.variant
        ? `Edition: ${rec.dto.variant.sku}`
        : (rec.dto.product.productType === 'SIMPLE' ? 'Standard Edition' : null),
      quantity: rec.dto.quantity,
      unitPrice: rec.dto.unitPrice,
      lineTotal: CheckoutPricingService.calculateLineTotal(rec.dto.unitPrice, rec.dto.quantity),
      currency: 'INR'
    }));

    // 7. Compute Totals
    const shippingAddr = addressesToCreate.find(a => a.type === 'SHIPPING');
    const totals = await this.pricingService.computeCheckoutTotals({
      items: itemsToSnapshot,
      currency: 'INR',
      customerId,
      shippingPostalCode: shippingAddr?.postalCode,
      country: shippingAddr?.country,
      state: shippingAddr?.state
    });

    // 8. Cancel any existing ACTIVE checkout session for this cart
    const existingActive = await CheckoutRepository.findActiveCheckoutByCartId(cart.id);
    if (existingActive) {
      await CheckoutRepository.updateCheckoutSession(existingActive.id, { status: 'CANCELLED' });
    }

    // 9. Create Checkout Session
    const session = await CheckoutRepository.createCheckoutSession({
      customerId: customerId || null,
      cartId: cart.id,
      guestTokenHash: guestTokenHash || null,
      status: 'ACTIVE',
      currency: totals.currency,
      email,
      billingAddressId,
      shippingAddressId,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      idempotencyKey: idempotencyKey || null,
      expiresAt: CheckoutPolicyService.getCheckoutExpirationDate(),
      items: itemsToSnapshot,
      addresses: addressesToCreate
    });

    // 10. Audit Log
    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_CREATED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: {
        customerId: session.customerId,
        itemCount: session.items.length,
        grandTotal: session.grandTotal
      }
    });

    return this.formatSessionView(session, allWarnings as CheckoutWarning[]);
  }

  /**
   * GET CHECKOUT SESSION BY ID
   */
  public async getCheckout(identity: any, checkoutId: string): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    // Check expiration
    if (session.status === 'ACTIVE' && CheckoutPolicyService.isExpired(session.expiresAt)) {
      await CheckoutRepository.updateCheckoutSession(session.id, { status: 'EXPIRED' });
      session.status = 'EXPIRED';

      AuditService.log({
        adminUserId: null,
        action: 'CHECKOUT_EXPIRED',
        entityType: 'CheckoutSession',
        entityId: session.id,
        module: 'CHECKOUT',
        newValues: { checkoutId: session.id }
      });
    }

    return this.formatSessionView(session);
  }

  /**
   * UPDATE CHECKOUT ADDRESSES
   */
  public async updateAddresses(
    identity: any,
    checkoutId: string,
    dto: UpdateCheckoutAddressesDto
  ): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    if (session.status !== 'ACTIVE') {
      throw new ApiError(400, 'INVALID_CHECKOUT_STATUS', `Cannot modify addresses on a checkout with status ${session.status}`);
    }

    if (CheckoutPolicyService.isExpired(session.expiresAt)) {
      await CheckoutRepository.updateCheckoutSession(session.id, { status: 'EXPIRED' });
      throw new ApiError(400, 'CHECKOUT_EXPIRED', 'Checkout session has expired');
    }

    const isCustomer = identity.type === 'customer' || !!identity.customerId;
    const customerId = isCustomer ? identity.customerId : null;
    const addressesToUpdate: Array<CheckoutAddressPayload & { type: 'SHIPPING' | 'BILLING' }> = [];
    let shippingAddressId: string | null = session.shippingAddressId;
    let billingAddressId: string | null = session.billingAddressId;

    if (isCustomer && customerId) {
      if (dto.shippingAddressId) {
        const addr = prisma.customerAddress.findUnique({ where: { id: dto.shippingAddressId } });
        if (!addr || addr.customerId !== customerId) {
          throw new ApiError(404, 'ADDRESS_NOT_FOUND', 'Selected shipping address not found in your account');
        }
        shippingAddressId = addr.id;
        addressesToUpdate.push({
          type: 'SHIPPING',
          firstName: addr.firstName,
          lastName: addr.lastName,
          companyName: addr.companyName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone
        });
      } else if (dto.shippingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.shippingAddress, 'SHIPPING');
        addressesToUpdate.push({ type: 'SHIPPING', ...validated });
      }

      if (dto.billingAddressId) {
        const addr = prisma.customerAddress.findUnique({ where: { id: dto.billingAddressId } });
        if (!addr || addr.customerId !== identity.customerId) {
          throw new ApiError(404, 'ADDRESS_NOT_FOUND', 'Selected billing address not found in your account');
        }
        billingAddressId = addr.id;
        addressesToUpdate.push({
          type: 'BILLING',
          firstName: addr.firstName,
          lastName: addr.lastName,
          companyName: addr.companyName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone
        });
      } else if (dto.billingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.billingAddress, 'BILLING');
        addressesToUpdate.push({ type: 'BILLING', ...validated });
      }
    } else {
      // Guest address update
      if (dto.shippingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.shippingAddress, 'SHIPPING');
        addressesToUpdate.push({ type: 'SHIPPING', ...validated });
      }
      if (dto.billingAddress) {
        const validated = CheckoutPolicyService.validateAddress(dto.billingAddress, 'BILLING');
        addressesToUpdate.push({ type: 'BILLING', ...validated });
      }
    }

    if (addressesToUpdate.length > 0) {
      await CheckoutRepository.replaceAddresses(session.id, addressesToUpdate);
    }

    const updated = await CheckoutRepository.updateCheckoutSession(session.id, {
      shippingAddressId,
      billingAddressId
    });

    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_ADDRESS_CHANGED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: { addressCount: addressesToUpdate.length }
    });

    return this.formatSessionView(updated);
  }

  /**
   * RECALCULATE CHECKOUT
   */
  public async recalculateCheckout(identity: CartSessionIdentity, checkoutId: string): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    if (session.status === 'COMPLETED') {
      throw new ApiError(400, 'CHECKOUT_ALREADY_COMPLETED', 'Completed checkout cannot be recalculated');
    }

    if (session.status === 'CANCELLED') {
      throw new ApiError(400, 'CHECKOUT_CANCELLED', 'Cancelled checkout cannot be recalculated');
    }

    if (session.status === 'EXPIRED' || CheckoutPolicyService.isExpired(session.expiresAt)) {
      await CheckoutRepository.updateCheckoutSession(session.id, { status: 'EXPIRED' });
      throw new ApiError(400, 'CHECKOUT_EXPIRED', 'Checkout session has expired and cannot be recalculated');
    }

    // Reconcile items against live catalogue
    const warnings: CheckoutWarning[] = [];
    const updatedItems: Array<{
      productId: string;
      variantId?: string | null;
      sku: string;
      productName: string;
      variantDescription?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      currency?: string;
    }> = [];

    for (const itm of session.items) {
      const product = prisma.product.findUnique({ where: { id: itm.productId } });
      if (!product || product.status !== 'ACTIVE') {
        warnings.push({
          code: 'PRODUCT_UNAVAILABLE',
          productId: itm.productId,
          variantId: itm.variantId,
          productName: itm.productName,
          message: `${itm.productName} is no longer available`
        });
        continue;
      }

      let currentUnitPrice = Number(product.price);
      let sku = product.sku;

      if (itm.variantId) {
        const variant = prisma.productVariant.findUnique({ where: { id: itm.variantId } });
        if (!variant || variant.status !== 'ACTIVE') {
          warnings.push({
            code: 'VARIANT_UNAVAILABLE',
            productId: itm.productId,
            variantId: itm.variantId,
            productName: itm.productName,
            message: `Selected variant for ${itm.productName} is no longer available`
          });
          continue;
        }
        sku = variant.sku;
        if (variant.price !== null && variant.price !== undefined) {
          currentUnitPrice = Number(variant.price);
        }
      }

      // Detect price change
      if (currentUnitPrice !== Number(itm.unitPrice)) {
        warnings.push({
          code: 'PRICE_CHANGED',
          productId: itm.productId,
          variantId: itm.variantId,
          productName: itm.productName,
          message: `Price for ${itm.productName} changed from ₹${itm.unitPrice} to ₹${currentUnitPrice}`,
          details: { oldPrice: itm.unitPrice, newPrice: currentUnitPrice }
        });
      }

      updatedItems.push({
        productId: itm.productId,
        variantId: itm.variantId,
        sku,
        productName: product.name,
        variantDescription: itm.variantDescription,
        quantity: itm.quantity,
        unitPrice: currentUnitPrice,
        lineTotal: CheckoutPricingService.calculateLineTotal(currentUnitPrice, itm.quantity),
        currency: product.currency || 'INR'
      });
    }

    // Replace items snapshot in DB
    await CheckoutRepository.replaceItems(session.id, updatedItems);

    // Recompute totals
    const shippingAddr = session.addresses?.find((a: any) => a.type === 'SHIPPING');
    const totals = await this.pricingService.computeCheckoutTotals({
      items: updatedItems,
      currency: session.currency,
      customerId: session.customerId,
      shippingPostalCode: shippingAddr?.postalCode,
      country: shippingAddr?.country,
      state: shippingAddr?.state
    });

    const updatedSession = await CheckoutRepository.updateCheckoutSession(session.id, {
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal
    });

    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_RECALCULATED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: {
        grandTotal: totals.grandTotal,
        warningCount: warnings.length
      }
    });

    return this.formatSessionView(updatedSession, warnings);
  }

  /**
   * VALIDATE CHECKOUT READINESS
   */
  public async validateCheckout(identity: CartSessionIdentity, checkoutId: string): Promise<CheckoutValidationResult> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    const warnings: CheckoutWarning[] = [];
    const blockingIssues: CheckoutWarning[] = [];

    // 1. Status Check
    if (session.status !== 'ACTIVE') {
      blockingIssues.push({
        code: 'PRODUCT_UNAVAILABLE',
        productId: '',
        productName: '',
        message: `Checkout session is not active (status: ${session.status})`
      });
    }

    // 2. Expiration Check
    if (CheckoutPolicyService.isExpired(session.expiresAt)) {
      blockingIssues.push({
        code: 'PRODUCT_UNAVAILABLE',
        productId: '',
        productName: '',
        message: 'Checkout session has expired'
      });
    }

    // 3. Address Check
    const shippingAddr = session.addresses?.find((a: any) => a.type === 'SHIPPING');
    if (!shippingAddr) {
      blockingIssues.push({
        code: 'PRODUCT_UNAVAILABLE',
        productId: '',
        productName: '',
        message: 'A valid shipping address is required to complete checkout'
      });
    }

    // 4. Items & Stock Validation against live catalogue
    if (!session.items || session.items.length === 0) {
      blockingIssues.push({
        code: 'PRODUCT_UNAVAILABLE',
        productId: '',
        productName: '',
        message: 'Checkout contains no items'
      });
    } else {
      for (const itm of session.items) {
        const product = prisma.product.findUnique({ where: { id: itm.productId } });
        if (!product || product.status !== 'ACTIVE') {
          blockingIssues.push({
            code: 'PRODUCT_UNAVAILABLE',
            productId: itm.productId,
            variantId: itm.variantId,
            productName: itm.productName,
            message: `${itm.productName} is currently unavailable`
          });
          continue;
        }

        let availableStock = product.stockQuantity;
        let trackInventory = product.trackInventory;
        let allowBackorder = product.allowBackorder;

        if (itm.variantId) {
          const variant = prisma.productVariant.findUnique({ where: { id: itm.variantId } });
          if (!variant || variant.status !== 'ACTIVE') {
            blockingIssues.push({
              code: 'VARIANT_UNAVAILABLE',
              productId: itm.productId,
              variantId: itm.variantId,
              productName: itm.productName,
              message: `Selected edition for ${itm.productName} is currently unavailable`
            });
            continue;
          }
          if (variant.trackInventory !== undefined) trackInventory = variant.trackInventory;
          if (variant.allowBackorder !== undefined) allowBackorder = variant.allowBackorder;
          if (variant.stockQuantity !== undefined) availableStock = variant.stockQuantity;
        }

        if (trackInventory && !allowBackorder && availableStock < itm.quantity) {
          blockingIssues.push({
            code: 'INSUFFICIENT_STOCK',
            productId: itm.productId,
            variantId: itm.variantId,
            productName: itm.productName,
            message: `Only ${availableStock} units available for ${itm.productName}`
          });
        }
      }
    }

    const valid = blockingIssues.length === 0;

    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_VALIDATED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: { valid, blockingCount: blockingIssues.length }
    });

    return {
      valid,
      warnings,
      blockingIssues
    };
  }

  /**
   * COMPLETE CHECKOUT SESSION
   */
  public async completeCheckout(
    identity: CartSessionIdentity,
    checkoutId: string,
    idempotencyKey?: string | null
  ): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    // Idempotent completion check
    if (session.status === 'COMPLETED') {
      return this.formatSessionView(session);
    }

    if (session.status === 'CANCELLED') {
      throw new ApiError(400, 'CHECKOUT_CANCELLED', 'Cancelled checkout session cannot be completed');
    }

    if (session.status === 'EXPIRED' || CheckoutPolicyService.isExpired(session.expiresAt)) {
      await CheckoutRepository.updateCheckoutSession(session.id, { status: 'EXPIRED' });
      throw new ApiError(400, 'CHECKOUT_EXPIRED', 'Checkout session has expired and cannot be completed');
    }

    // Full validation before completion
    const validation = await this.validateCheckout(identity, checkoutId);
    if (!validation.valid) {
      throw new ApiError(409, 'CHECKOUT_VALIDATION_FAILED', 'Checkout cannot be completed due to validation issues', {
        blockingIssues: validation.blockingIssues
      });
    }

    // Mark completed
    const completedSession = await CheckoutRepository.updateCheckoutSession(session.id, {
      status: 'COMPLETED',
      completedAt: new Date()
    });

    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_COMPLETED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: {
        grandTotal: completedSession.grandTotal,
        itemCount: completedSession.items?.length
      }
    });

    return this.formatSessionView(completedSession);
  }

  /**
   * CANCEL CHECKOUT SESSION
   */
  public async cancelCheckout(identity: CartSessionIdentity, checkoutId: string): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    this.verifySessionOwnership(session, identity);

    if (session.status !== 'ACTIVE') {
      throw new ApiError(400, 'INVALID_CHECKOUT_STATUS', `Cannot cancel checkout with status ${session.status}`);
    }

    const cancelledSession = await CheckoutRepository.updateCheckoutSession(session.id, {
      status: 'CANCELLED'
    });

    AuditService.log({
      adminUserId: null,
      action: 'CHECKOUT_CANCELLED',
      entityType: 'CheckoutSession',
      entityId: session.id,
      module: 'CHECKOUT',
      newValues: { checkoutId: session.id }
    });

    return this.formatSessionView(cancelledSession);
  }

  /**
   * MODULE 20 ORDER MODULE CONTRACT
   */
  public async getCompletedCheckoutForOrder(checkoutId: string): Promise<CompletedCheckoutContract> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }

    if (session.status !== 'COMPLETED') {
      throw new ApiError(400, 'CHECKOUT_NOT_COMPLETED', 'Only COMPLETED checkout sessions can be converted to orders');
    }

    const shipping = session.addresses?.find((a: any) => a.type === 'SHIPPING');
    const billing = session.addresses?.find((a: any) => a.type === 'BILLING') || shipping;

    if (!shipping) {
      throw new ApiError(400, 'MISSING_SHIPPING_ADDRESS', 'Completed checkout is missing required shipping address snapshot');
    }

    return {
      checkoutId: session.id,
      customerId: session.customerId || null,
      cartId: session.cartId,
      email: session.email,
      currency: session.currency,
      status: 'COMPLETED',
      items: (session.items || []).map((itm: any) => ({
        productId: itm.productId,
        variantId: itm.variantId || null,
        sku: itm.sku,
        productName: itm.productName,
        variantDescription: itm.variantDescription || null,
        quantity: Number(itm.quantity),
        unitPrice: Number(itm.unitPrice),
        lineTotal: Number(itm.lineTotal),
        currency: itm.currency
      })),
      shippingAddress: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        companyName: shipping.companyName,
        addressLine1: shipping.addressLine1,
        addressLine2: shipping.addressLine2,
        landmark: shipping.landmark,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone
      },
      billingAddress: {
        firstName: billing.firstName,
        lastName: billing.lastName,
        companyName: billing.companyName,
        addressLine1: billing.addressLine1,
        addressLine2: billing.addressLine2,
        landmark: billing.landmark,
        city: billing.city,
        state: billing.state,
        postalCode: billing.postalCode,
        country: billing.country,
        phone: billing.phone
      },
      subtotal: Number(session.subtotal),
      discountTotal: Number(session.discountTotal),
      shippingTotal: Number(session.shippingTotal),
      taxTotal: Number(session.taxTotal),
      grandTotal: Number(session.grandTotal),
      completedAt: session.completedAt || new Date()
    };
  }

  /**
   * ADMIN INSPECT CHECKOUT BY ID
   */
  public async adminGetCheckoutById(checkoutId: string): Promise<CheckoutSessionView> {
    const session = await CheckoutRepository.findCheckoutById(checkoutId);
    if (!session) {
      throw new ApiError(404, 'CHECKOUT_NOT_FOUND', 'Checkout session not found');
    }
    return this.formatSessionView(session);
  }
}
