import { prisma } from '../../database/prisma.ts';
import type { CheckoutStatus, CheckoutAddressType, CheckoutAddressPayload } from './checkout.types.ts';

export class CheckoutRepository {
  /**
   * Find checkout session by ID with items and addresses
   */
  public static async findCheckoutById(id: string) {
    return prisma.checkoutSession.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        addresses: true
      }
    });
  }

  /**
   * Find checkout session by idempotency key
   */
  public static async findCheckoutByIdempotencyKey(idempotencyKey: string) {
    return prisma.checkoutSession.findUnique({
      where: { idempotencyKey },
      include: {
        items: true,
        addresses: true
      }
    });
  }

  /**
   * Find active checkout session for a given cart ID
   */
  public static async findActiveCheckoutByCartId(cartId: string) {
    return prisma.checkoutSession.findFirst({
      where: {
        cartId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      include: {
        items: true,
        addresses: true
      }
    });
  }

  /**
   * Create a full checkout session with item and address snapshots
   */
  public static async createCheckoutSession(params: {
    customerId?: string | null;
    cartId: string;
    guestTokenHash?: string | null;
    status?: CheckoutStatus;
    currency?: string;
    email: string;
    billingAddressId?: string | null;
    shippingAddressId?: string | null;
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    taxTotal: number;
    grandTotal: number;
    idempotencyKey?: string | null;
    expiresAt: Date;
    items: Array<{
      productId: string;
      variantId?: string | null;
      sku: string;
      productName: string;
      variantDescription?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      currency?: string;
    }>;
    addresses: Array<CheckoutAddressPayload & { type: CheckoutAddressType }>;
  }) {
    return prisma.checkoutSession.create({
      data: {
        customerId: params.customerId || null,
        cartId: params.cartId,
        guestTokenHash: params.guestTokenHash || null,
        status: params.status || 'ACTIVE',
        currency: params.currency || 'INR',
        email: params.email,
        billingAddressId: params.billingAddressId || null,
        shippingAddressId: params.shippingAddressId || null,
        subtotal: params.subtotal,
        discountTotal: params.discountTotal,
        shippingTotal: params.shippingTotal,
        taxTotal: params.taxTotal,
        grandTotal: params.grandTotal,
        idempotencyKey: params.idempotencyKey || null,
        expiresAt: params.expiresAt,
        items: {
          create: params.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            sku: item.sku,
            productName: item.productName,
            variantDescription: item.variantDescription || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            currency: item.currency || 'INR'
          }))
        },
        addresses: {
          create: params.addresses.map(addr => ({
            type: addr.type,
            firstName: addr.firstName,
            lastName: addr.lastName,
            companyName: addr.companyName || null,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || null,
            landmark: addr.landmark || null,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country || 'INDIA',
            phone: addr.phone
          }))
        }
      },
      include: {
        items: true,
        addresses: true
      }
    });
  }

  /**
   * Update checkout session metadata & status
   */
  public static async updateCheckoutSession(id: string, data: any) {
    return prisma.checkoutSession.update({
      where: { id },
      data,
      include: {
        items: true,
        addresses: true
      }
    });
  }

  /**
   * Replace addresses for checkout session
   */
  public static async replaceAddresses(
    checkoutSessionId: string,
    addresses: Array<CheckoutAddressPayload & { type: CheckoutAddressType }>
  ) {
    prisma.checkoutAddress.deleteMany({
      where: { checkoutSessionId }
    });

    for (const addr of addresses) {
      prisma.checkoutAddress.create({
        data: {
          checkoutSessionId,
          type: addr.type,
          firstName: addr.firstName,
          lastName: addr.lastName,
          companyName: addr.companyName || null,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 || null,
          landmark: addr.landmark || null,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country || 'INDIA',
          phone: addr.phone
        }
      });
    }

    return prisma.checkoutAddress.findMany({
      where: { checkoutSessionId }
    });
  }

  /**
   * Replace items for checkout session (used during recalculation)
   */
  public static async replaceItems(
    checkoutSessionId: string,
    items: Array<{
      productId: string;
      variantId?: string | null;
      sku: string;
      productName: string;
      variantDescription?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      currency?: string;
    }>
  ) {
    prisma.checkoutItem.deleteMany({
      where: { checkoutSessionId }
    });

    for (const item of items) {
      prisma.checkoutItem.create({
        data: {
          checkoutSessionId,
          productId: item.productId,
          variantId: item.variantId || null,
          sku: item.sku,
          productName: item.productName,
          variantDescription: item.variantDescription || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          currency: item.currency || 'INR'
        }
      });
    }

    return prisma.checkoutItem.findMany({
      where: { checkoutSessionId }
    });
  }

  /**
   * Mark all past active sessions as expired
   */
  public static async expireStaleSessions(beforeDate: Date = new Date()) {
    const expiredSessions = prisma.checkoutSession.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: beforeDate }
      }
    });

    for (const sess of expiredSessions) {
      prisma.checkoutSession.update({
        where: { id: sess.id },
        data: { status: 'EXPIRED' }
      });
    }

    return expiredSessions.length;
  }
}
