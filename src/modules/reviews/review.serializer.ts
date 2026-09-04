/**
 * Module 25: Reviews & Ratings — Data Serializers & Security Sanitizers
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type {
  ProductReviewEntity,
  PublicReviewItemView,
  CustomerReviewView,
  AdminReviewView
} from './review.types.ts';

export class ReviewSerializer {
  /**
   * Format privacy-safe reviewer display name (e.g. "Aarav S." or "Verified Patron")
   * Strictly prevents any email or PII leakage to public storefront.
   */
  static formatReviewerDisplayName(customer?: any): string {
    if (!customer) return 'Verified Patron';
    const first = (customer.firstName || '').trim();
    const last = (customer.lastName || '').trim();

    if (first && last) {
      return `${first} ${last.charAt(0).toUpperCase()}.`;
    }
    if (first) {
      return first;
    }
    return 'Verified Patron';
  }

  /**
   * Safe public storefront review item serialization
   */
  static serializePublicReview(review: ProductReviewEntity): PublicReviewItemView {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title || null,
      body: review.body,
      verifiedPurchase: Boolean(review.verifiedPurchase),
      purchasedVariantName: review.purchasedVariantName || null,
      reviewerDisplayName: this.formatReviewerDisplayName(review.customer),
      helpfulCount: review.helpfulCount || 0,
      createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
      publishedAt: review.publishedAt ? (review.publishedAt instanceof Date ? review.publishedAt.toISOString() : String(review.publishedAt)) : null
    };
  }

  /**
   * Authenticated customer own review serialization
   */
  static serializeCustomerReview(review: ProductReviewEntity): CustomerReviewView {
    return {
      id: review.id,
      productId: review.productId,
      productName: review.product?.name,
      productSlug: review.product?.slug,
      productThumbnail: review.product?.thumbnail || review.product?.image || null,
      variantId: review.variantId || null,
      purchasedVariantName: review.purchasedVariantName || null,
      purchasedSku: review.purchasedSku || null,
      rating: review.rating,
      title: review.title || null,
      body: review.body,
      status: review.status,
      verifiedPurchase: Boolean(review.verifiedPurchase),
      verifiedPurchaseAt: review.verifiedPurchaseAt ? (review.verifiedPurchaseAt instanceof Date ? review.verifiedPurchaseAt.toISOString() : String(review.verifiedPurchaseAt)) : null,
      publishedAt: review.publishedAt ? (review.publishedAt instanceof Date ? review.publishedAt.toISOString() : String(review.publishedAt)) : null,
      createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
      updatedAt: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : String(review.updatedAt)
    };
  }

  /**
   * Administrative detailed review serialization
   */
  static serializeAdminReview(review: ProductReviewEntity): AdminReviewView {
    return {
      id: review.id,
      productId: review.productId,
      product: review.product
        ? {
            id: review.product.id,
            name: review.product.name,
            slug: review.product.slug,
            sku: review.product.sku,
            thumbnail: review.product.thumbnail || review.product.image || null,
            status: review.product.status
          }
        : null,
      customerId: review.customerId || null,
      customer: review.customer
        ? {
            id: review.customer.id,
            email: review.customer.email,
            firstName: review.customer.firstName,
            lastName: review.customer.lastName
          }
        : null,
      orderItemId: review.orderItemId || null,
      orderItem: review.orderItem
        ? {
            id: review.orderItem.id,
            orderId: review.orderItem.orderId,
            sku: review.orderItem.sku,
            productName: review.orderItem.productName,
            variantDescription: review.orderItem.variantDescription || null,
            lineTotal: Number(review.orderItem.lineTotal || 0)
          }
        : null,
      variantId: review.variantId || null,
      variant: review.variant
        ? {
            id: review.variant.id,
            sku: review.variant.sku
          }
        : null,
      rating: review.rating,
      title: review.title || null,
      body: review.body,
      status: review.status,
      verifiedPurchase: Boolean(review.verifiedPurchase),
      verifiedPurchaseAt: review.verifiedPurchaseAt ? (review.verifiedPurchaseAt instanceof Date ? review.verifiedPurchaseAt.toISOString() : String(review.verifiedPurchaseAt)) : null,
      purchasedSku: review.purchasedSku || null,
      purchasedVariantName: review.purchasedVariantName || null,
      helpfulCount: review.helpfulCount || 0,
      reportCount: review.reportCount || 0,
      publishedAt: review.publishedAt ? (review.publishedAt instanceof Date ? review.publishedAt.toISOString() : String(review.publishedAt)) : null,
      createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
      updatedAt: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : String(review.updatedAt)
    };
  }
}
