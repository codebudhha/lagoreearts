/**
 * Module 25: Reviews & Ratings — Domain Invariants & Policies
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import type { ReviewStatus, ProductReviewEntity } from './review.types.ts';

const VALID_STATUS_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'HIDDEN', 'PENDING'],
  APPROVED: ['HIDDEN', 'PENDING', 'REJECTED', 'APPROVED'],
  REJECTED: ['PENDING', 'APPROVED', 'HIDDEN', 'REJECTED'],
  HIDDEN: ['APPROVED', 'REJECTED', 'PENDING', 'HIDDEN']
};

export class ReviewPolicy {
  /**
   * Validate review state machine status transitions
   */
  static validateStatusTransition(currentStatus: ReviewStatus, nextStatus: ReviewStatus): void {
    if (currentStatus === nextStatus) return;

    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw {
        statusCode: 409,
        status: 409,
        code: 'INVALID_REVIEW_STATUS_TRANSITION',
        message: `Cannot transition review status from '${currentStatus}' to '${nextStatus}'`
      };
    }
  }

  /**
   * Validate customer review ownership for IDOR protection
   */
  static validateOwnership(review: { customerId: string | null }, customerId: string): void {
    if (!review.customerId || review.customerId !== customerId) {
      throw {
        statusCode: 403,
        status: 403,
        code: 'REVIEW_NOT_OWNER',
        message: 'You do not have permission to access or modify this review'
      };
    }
  }

  /**
   * Derive server-side verified purchase qualification
   */
  static async findQualifyingPurchase(
    customerId: string,
    productId: string,
    variantId?: string
  ): Promise<{ orderItem: any; order: any }> {
    // 1. Fetch customer orders that are PAID and DELIVERED
    const customerOrders = await prisma.order.findMany({
      where: {
        customerId,
        paymentStatus: 'PAID',
        status: 'DELIVERED'
      },
      include: {
        items: true
      },
      orderBy: { placedAt: 'desc' }
    });

    if (!customerOrders || customerOrders.length === 0) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'REVIEW_PURCHASE_REQUIRED',
        message: 'A verified, delivered purchase is required to submit a review for this artwork'
      };
    }

    // 2. Find matching order item for the product
    let matchingItem: any = null;
    let matchingOrder: any = null;

    for (const order of customerOrders) {
      const items = order.items || [];
      for (const item of items) {
        if (item.productId === productId) {
          if (variantId) {
            if (item.variantId === variantId) {
              matchingItem = item;
              matchingOrder = order;
              break;
            }
          } else {
            matchingItem = item;
            matchingOrder = order;
            break;
          }
        }
      }
      if (matchingItem) break;
    }

    if (!matchingItem) {
      if (variantId) {
        // Check if they bought the product under a different variant
        const boughtAnyVariant = customerOrders.some(o => (o.items || []).some((i: any) => i.productId === productId));
        if (boughtAnyVariant) {
          throw {
            statusCode: 400,
            status: 400,
            code: 'REVIEW_VARIANT_NOT_PURCHASED',
            message: 'You have not completed a delivered purchase for this specific artwork variant'
          };
        }
      }

      throw {
        statusCode: 400,
        status: 400,
        code: 'REVIEW_PURCHASE_REQUIRED',
        message: 'A verified, delivered purchase is required to submit a review for this artwork'
      };
    }

    return { orderItem: matchingItem, order: matchingOrder };
  }
}
