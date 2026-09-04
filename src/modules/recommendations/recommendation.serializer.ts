/**
 * Module 24: Cross-sell & Upsell — Output Serializers
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type {
  ProductRecommendationRecord,
  PublicRecommendedProductView,
  AdminRecommendationView,
  AdminRecommendationPreviewItem
} from './recommendation.types.ts';

export class RecommendationSerializer {
  /**
   * Serialize Product for Public Customer Storefront
   * Strictly sanitizes costPrice, stockQuantity (returns availability bool), admin notes, audit data, and internal scores
   */
  static serializePublicProduct(p: any): PublicRecommendedProductView {
    if (!p) return null as any;

    const inStock = !p.trackInventory || (Number(p.stockQuantity) || 0) > 0 || Boolean(p.allowBackorder);

    const primaryMedia = p.media?.find((m: any) => m.isPrimary)?.media || p.media?.find((m: any) => m.isPrimary);
    const thumbMedia = p.media?.find((m: any) => m.role === 'THUMBNAIL')?.media || p.media?.find((m: any) => m.role === 'THUMBNAIL');
    const firstMedia = p.media?.[0]?.media || p.media?.[0];

    const image = primaryMedia?.publicUrl || primaryMedia?.url || firstMedia?.publicUrl || firstMedia?.url || p.image || null;
    const thumbnail = thumbMedia?.publicUrl || thumbMedia?.url || image || p.thumbnail || null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription || null,
      productType: p.productType || 'SIMPLE',
      price: Number(p.price || 0),
      compareAtPrice: p.compareAtPrice !== null && p.compareAtPrice !== undefined ? Number(p.compareAtPrice) : null,
      currency: p.currency || 'INR',
      availability: {
        inStock,
        allowBackorder: Boolean(p.allowBackorder)
      },
      isFeatured: Boolean(p.isFeatured),
      isNewArrival: Boolean(p.isNewArrival),
      isBestseller: Boolean(p.isBestseller),
      image,
      thumbnail,
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug
      } : null
    };
  }

  /**
   * Serialize Recommendation Record for Admin Management
   */
  static serializeAdminRecommendation(rec: any): AdminRecommendationView {
    if (!rec) return null as any;

    return {
      id: rec.id,
      sourceProductId: rec.sourceProductId,
      sourceProduct: rec.sourceProduct ? {
        id: rec.sourceProduct.id,
        name: rec.sourceProduct.name,
        slug: rec.sourceProduct.slug,
        sku: rec.sourceProduct.sku,
        status: rec.sourceProduct.status
      } : null,
      targetProductId: rec.targetProductId,
      targetProduct: rec.targetProduct ? {
        id: rec.targetProduct.id,
        name: rec.targetProduct.name,
        slug: rec.targetProduct.slug,
        sku: rec.targetProduct.sku,
        status: rec.targetProduct.status,
        price: Number(rec.targetProduct.price || 0)
      } : null,
      type: rec.type,
      sortOrder: Number(rec.sortOrder || 0),
      isActive: Boolean(rec.isActive),
      createdAt: rec.createdAt instanceof Date ? rec.createdAt : new Date(rec.createdAt),
      updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt : new Date(rec.updatedAt)
    };
  }

  /**
   * Serialize Diagnostic Recommendation Item for Admin Preview
   */
  static serializeRecommendationDiagnostic(item: any): AdminRecommendationPreviewItem {
    const product = item.product || item;
    const primaryMedia = product.media?.find((m: any) => m.isPrimary)?.media || product.media?.[0]?.media || product.media?.[0];
    const thumbnail = primaryMedia?.publicUrl || primaryMedia?.url || product.thumbnail || product.image || null;

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        status: product.status,
        price: Number(product.price || 0),
        thumbnail
      },
      source: item.source || 'EXPLICIT',
      score: Number(item.score || 0),
      rankingReason: item.rankingReason || 'Configured explicitly by administrator',
      recommendationId: item.recommendationId || null,
      sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : undefined
    };
  }
}
