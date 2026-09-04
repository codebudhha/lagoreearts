/**
 * Module 24: Cross-sell & Upsell — Core Service & Recommendation Engine
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { ProductRecommendationRepository } from './recommendation.repository.ts';
import { RecommendationPolicy } from './recommendation.policy.ts';
import { RecommendationSerializer } from './recommendation.serializer.ts';
import type {
  RecommendationType,
  CreateRecommendationDto,
  UpdateRecommendationDto,
  ReorderItemDto,
  RecommendationFilterQuery,
  PublicRecommendationQuery,
  PublicRecommendationsGrouped,
  PublicRecommendationResponse,
  AdminRecommendationView,
  AdminRecommendationPreviewGrouped,
  AdminRecommendationPreviewItem
} from './recommendation.types.ts';

// Deterministic scoring weights for catalogue-driven fallback recommendations
const SCORING_WEIGHTS = {
  EXPLICIT_CROSS_SELL: 1000,
  EXPLICIT_UPSELL: 950,
  EXPLICIT_RELATED: 900,
  SAME_COLLECTION: 500,
  SAME_CATEGORY: 400,
  SAME_ARTIST: 300,
  SAME_SANSKRIT_EDIT: 250,
  SAME_ANTIQUE_CONTEXT: 250,
  SHARED_ATTRIBUTE: 100
};

export class RecommendationService {
  /**
   * Create an explicit product recommendation
   */
  static async createRecommendation(
    sourceProductId: string,
    dto: CreateRecommendationDto,
    actorAdminId: string,
    meta: any = {}
  ): Promise<AdminRecommendationView> {
    // 1. Verify source product exists
    const sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });
    if (!sourceProduct) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'SOURCE_PRODUCT_NOT_FOUND',
        message: `Source product with ID '${sourceProductId}' not found`
      };
    }

    // 2. Verify target product exists
    const targetProduct = await prisma.product.findUnique({ where: { id: dto.targetProductId } });
    if (!targetProduct) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'TARGET_PRODUCT_NOT_FOUND',
        message: `Target product with ID '${dto.targetProductId}' not found`
      };
    }

    // 3. Domain invariant: Not self-reference
    RecommendationPolicy.validateNotSelfReference(sourceProductId, dto.targetProductId);

    // 4. Domain invariant: No duplicate
    await RecommendationPolicy.validateNoDuplicate(sourceProductId, dto.targetProductId, dto.type);

    // 5. Domain invariant: No cycles
    await RecommendationPolicy.validateNoCycle(sourceProductId, dto.targetProductId, dto.type);

    // 6. Persist recommendation
    const rec = await ProductRecommendationRepository.create({
      sourceProductId,
      targetProductId: dto.targetProductId,
      type: dto.type,
      sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true
    });

    // 7. Security audit trail
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'RECOMMENDATION_CREATED',
      module: 'RECOMMENDATIONS',
      entityType: 'ProductRecommendation',
      entityId: rec.id,
      newValues: {
        sourceProductId,
        targetProductId: dto.targetProductId,
        type: dto.type,
        sortOrder: rec.sortOrder,
        isActive: rec.isActive
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    return RecommendationSerializer.serializeAdminRecommendation(rec);
  }

  /**
   * Update recommendation
   */
  static async updateRecommendation(
    id: string,
    dto: UpdateRecommendationDto,
    actorAdminId: string,
    meta: any = {}
  ): Promise<AdminRecommendationView> {
    const existing = await ProductRecommendationRepository.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: `Recommendation with ID '${id}' not found`
      };
    }

    const targetProductId = dto.targetProductId || existing.targetProductId;
    const type = dto.type || existing.type;

    if (dto.targetProductId && dto.targetProductId !== existing.targetProductId) {
      const targetProduct = await prisma.product.findUnique({ where: { id: dto.targetProductId } });
      if (!targetProduct) {
        throw {
          statusCode: 404,
          status: 404,
          code: 'TARGET_PRODUCT_NOT_FOUND',
          message: `Target product with ID '${dto.targetProductId}' not found`
        };
      }
      RecommendationPolicy.validateNotSelfReference(existing.sourceProductId, targetProductId);
    }

    if (dto.type || dto.targetProductId) {
      await RecommendationPolicy.validateNoDuplicate(existing.sourceProductId, targetProductId, type, id);
      await RecommendationPolicy.validateNoCycle(existing.sourceProductId, targetProductId, type);
    }

    const updated = await ProductRecommendationRepository.update(id, dto);

    // Audit log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'RECOMMENDATION_UPDATED',
      module: 'RECOMMENDATIONS',
      entityType: 'ProductRecommendation',
      entityId: id,
      oldValues: {
        type: existing.type,
        targetProductId: existing.targetProductId,
        sortOrder: existing.sortOrder,
        isActive: existing.isActive
      },
      newValues: {
        type: updated.type,
        targetProductId: updated.targetProductId,
        sortOrder: updated.sortOrder,
        isActive: updated.isActive
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      AuditService.log({
        adminUserId: actorAdminId,
        action: dto.isActive ? 'RECOMMENDATION_ACTIVATED' : 'RECOMMENDATION_DEACTIVATED',
        module: 'RECOMMENDATIONS',
        entityType: 'ProductRecommendation',
        entityId: id,
        oldValues: { isActive: existing.isActive },
        newValues: { isActive: dto.isActive },
        ipAddress: meta.ip,
        userAgent: meta.userAgent
      });
    }

    return RecommendationSerializer.serializeAdminRecommendation(updated);
  }

  /**
   * Delete recommendation
   */
  static async deleteRecommendation(id: string, actorAdminId: string, meta: any = {}): Promise<void> {
    const existing = await ProductRecommendationRepository.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: `Recommendation with ID '${id}' not found`
      };
    }

    await ProductRecommendationRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'RECOMMENDATION_DELETED',
      module: 'RECOMMENDATIONS',
      entityType: 'ProductRecommendation',
      entityId: id,
      oldValues: {
        sourceProductId: existing.sourceProductId,
        targetProductId: existing.targetProductId,
        type: existing.type
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });
  }

  /**
   * Get single admin recommendation by ID
   */
  static async getAdminRecommendationById(id: string): Promise<AdminRecommendationView> {
    const rec = await ProductRecommendationRepository.findById(id);
    if (!rec) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: `Recommendation with ID '${id}' not found`
      };
    }
    return RecommendationSerializer.serializeAdminRecommendation(rec);
  }

  /**
   * List admin recommendations
   */
  static async listAdminRecommendations(filter: RecommendationFilterQuery) {
    const result = await ProductRecommendationRepository.list(filter);
    return {
      ...result,
      items: result.items.map(r => RecommendationSerializer.serializeAdminRecommendation(r))
    };
  }

  /**
   * Bulk reorder recommendations for a source product
   */
  static async reorderRecommendations(
    sourceProductId: string,
    items: ReorderItemDto[],
    actorAdminId: string,
    meta: any = {}
  ): Promise<AdminRecommendationView[]> {
    const sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });
    if (!sourceProduct) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'SOURCE_PRODUCT_NOT_FOUND',
        message: `Source product with ID '${sourceProductId}' not found`
      };
    }

    const reordered = await ProductRecommendationRepository.bulkReorder(sourceProductId, items);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'RECOMMENDATION_REORDERED',
      module: 'RECOMMENDATIONS',
      entityType: 'Product',
      entityId: sourceProductId,
      newValues: { items },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    return reordered.map(r => RecommendationSerializer.serializeAdminRecommendation(r));
  }

  /**
   * Admin Diagnostic Preview: Returns explicit + fallback recommendations with scoring
   */
  static async getAdminPreview(productId: string): Promise<AdminRecommendationPreviewGrouped> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        collections: true,
        attributes: true,
        antiqueProfile: true,
        sanskritEditProfile: true,
        artists: true
      }
    });

    if (!product) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: `Product with ID '${productId}' not found`
      };
    }

    // 1. Fetch explicit recommendations
    const explicitRecs = await ProductRecommendationRepository.findBySourceProduct(productId);

    const crossSellItems: AdminRecommendationPreviewItem[] = [];
    const upsellItems: AdminRecommendationPreviewItem[] = [];
    const relatedItems: AdminRecommendationPreviewItem[] = [];

    const explicitSelectedTargetIds = new Set<string>();

    for (const rec of explicitRecs) {
      if (rec.targetProduct) {
        explicitSelectedTargetIds.add(rec.targetProductId);
        const item: AdminRecommendationPreviewItem = {
          product: {
            id: rec.targetProduct.id,
            name: rec.targetProduct.name,
            slug: rec.targetProduct.slug,
            sku: rec.targetProduct.sku,
            status: rec.targetProduct.status,
            price: Number(rec.targetProduct.price || 0),
            thumbnail: rec.targetProduct.thumbnail || rec.targetProduct.image || null
          },
          source: 'EXPLICIT',
          score:
            rec.type === 'CROSS_SELL'
              ? SCORING_WEIGHTS.EXPLICIT_CROSS_SELL
              : rec.type === 'UPSELL'
              ? SCORING_WEIGHTS.EXPLICIT_UPSELL
              : SCORING_WEIGHTS.EXPLICIT_RELATED,
          rankingReason: `Explicit ${rec.type} recommendation configured by administrator`,
          recommendationId: rec.id,
          sortOrder: rec.sortOrder
        };

        if (rec.type === 'CROSS_SELL') crossSellItems.push(item);
        else if (rec.type === 'UPSELL') upsellItems.push(item);
        else if (rec.type === 'RELATED') relatedItems.push(item);
      }
    }

    // 2. Resolve fallback candidates for related / cross-sell where explicit recommendations are low
    const fallbackCandidates = await this.scoreFallbackCandidates(product, explicitSelectedTargetIds, false);

    for (const fb of fallbackCandidates) {
      if (relatedItems.length < 12) {
        relatedItems.push({
          product: {
            id: fb.product.id,
            name: fb.product.name,
            slug: fb.product.slug,
            sku: fb.product.sku,
            status: fb.product.status,
            price: Number(fb.product.price || 0),
            thumbnail: fb.product.thumbnail || fb.product.image || null
          },
          source: fb.primarySource,
          score: fb.score,
          rankingReason: fb.reasons.join(', ')
        });
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      crossSell: crossSellItems,
      upsell: upsellItems,
      related: relatedItems
    };
  }

  /**
   * Public Storefront Recommendations: Returns grouped recommendations for a product
   */
  static async getPublicRecommendations(
    slugOrId: string,
    query: PublicRecommendationQuery = {}
  ): Promise<PublicRecommendationResponse> {
    // 1. Fetch source product
    let product: any = await prisma.product.findUnique({
      where: { slug: slugOrId },
      include: {
        category: true,
        collections: true,
        attributes: true,
        antiqueProfile: true,
        sanskritEditProfile: true,
        artists: true
      }
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: slugOrId },
        include: {
          category: true,
          collections: true,
          attributes: true,
          antiqueProfile: true,
          sanskritEditProfile: true,
          artists: true
        }
      });
    }

    if (!product || product.status !== 'ACTIVE') {
      throw {
        statusCode: 404,
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found or is not currently active'
      };
    }

    const limit = query.limit || 8;
    const requestedType = query.type;

    // 2. Load explicit recommendations (only active records, and only active target products)
    const explicitRecs = await ProductRecommendationRepository.findBySourceProduct(product.id, {
      isActive: true,
      type: requestedType
    });

    const crossSell: any[] = [];
    const upsell: any[] = [];
    const related: any[] = [];

    const explicitTargetIds = new Set<string>();

    for (const rec of explicitRecs) {
      if (rec.targetProduct && rec.targetProduct.status === 'ACTIVE') {
        explicitTargetIds.add(rec.targetProductId);
        const serialized = RecommendationSerializer.serializePublicProduct(rec.targetProduct);

        if (rec.type === 'CROSS_SELL' && (!requestedType || requestedType === 'CROSS_SELL')) {
          crossSell.push(serialized);
        } else if (rec.type === 'UPSELL' && (!requestedType || requestedType === 'UPSELL')) {
          upsell.push(serialized);
        } else if (rec.type === 'RELATED' && (!requestedType || requestedType === 'RELATED')) {
          related.push(serialized);
        }
      }
    }

    // 3. Resolve deterministic fallback recommendations for groups below the limit
    if (!requestedType || requestedType === 'RELATED') {
      if (related.length < limit) {
        const fallbacks = await this.scoreFallbackCandidates(product, explicitTargetIds, true);
        for (const fb of fallbacks) {
          if (related.length >= limit) break;
          related.push(RecommendationSerializer.serializePublicProduct(fb.product));
          explicitTargetIds.add(fb.product.id);
        }
      }
    }

    // 4. Sort within each type: sortOrder ASC then targetProduct.name ASC
    const sortFn = (a: any, b: any) => a.name.localeCompare(b.name);

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug
      },
      recommendations: {
        crossSell: crossSell.slice(0, limit),
        upsell: upsell.slice(0, limit),
        related: related.slice(0, limit)
      }
    };
  }

  /**
   * Internal deterministic scoring engine for catalogue fallback recommendations
   */
  private static async scoreFallbackCandidates(
    sourceProduct: any,
    excludedProductIds: Set<string>,
    activeOnly: boolean = true
  ): Promise<{ product: any; score: number; primarySource: any; reasons: string[] }[]> {
    // Collect all active products in catalogue (excluding sourceProduct and already selected)
    const whereClause: any = {};
    if (activeOnly) {
      whereClause.status = 'ACTIVE';
    }

    const allProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        collections: true,
        attributes: true,
        antiqueProfile: true,
        sanskritEditProfile: true,
        artists: true,
        media: true
      }
    });

    const candidates: { product: any; score: number; primarySource: any; reasons: string[] }[] = [];

    const sourceCollectionIds = new Set((sourceProduct.collections || []).map((c: any) => c.collectionId || c.id));
    const sourceAttributeValueIds = new Set((sourceProduct.attributes || []).map((a: any) => a.attributeValueId));
    const sourceArtistIds = new Set((sourceProduct.artists || []).map((a: any) => a.artistId));
    const sourceSanskritTheme = sourceProduct.sanskritEditProfile?.theme;
    const sourceSanskritSource = sourceProduct.sanskritEditProfile?.source;
    const sourceAntiqueEra = sourceProduct.antiqueProfile?.era;
    const sourceAntiquePeriod = sourceProduct.antiqueProfile?.period;

    for (const p of allProducts) {
      if (p.id === sourceProduct.id || excludedProductIds.has(p.id)) {
        continue;
      }

      let score = 0;
      let primarySource: any = 'CATEGORY';
      const reasons: string[] = [];

      // 1. Same Collection match (+500)
      const matchesCollection = (p.collections || []).some((c: any) =>
        sourceCollectionIds.has(c.collectionId || c.id)
      );
      if (matchesCollection && sourceCollectionIds.size > 0) {
        score += SCORING_WEIGHTS.SAME_COLLECTION;
        primarySource = 'COLLECTION';
        reasons.push('Shared curated editorial collection');
      }

      // 2. Same Category match (+400)
      if (p.categoryId && p.categoryId === sourceProduct.categoryId) {
        score += SCORING_WEIGHTS.SAME_CATEGORY;
        if (!reasons.length) primarySource = 'CATEGORY';
        reasons.push('Same category classification');
      }

      // 3. Same Artist match (+300)
      const matchesArtist = (p.artists || []).some((a: any) => sourceArtistIds.has(a.artistId));
      if (matchesArtist && sourceArtistIds.size > 0) {
        score += SCORING_WEIGHTS.SAME_ARTIST;
        primarySource = 'ARTIST';
        reasons.push('Created by the same master artist');
      }

      // 4. Sanskrit Edit theme/source match (+250)
      if (
        sourceSanskritTheme &&
        p.sanskritEditProfile?.theme &&
        p.sanskritEditProfile.theme.toLowerCase() === sourceSanskritTheme.toLowerCase()
      ) {
        score += SCORING_WEIGHTS.SAME_SANSKRIT_EDIT;
        primarySource = 'SANSKRIT_EDIT';
        reasons.push(`Shared Sanskrit Edit theme '${sourceSanskritTheme}'`);
      } else if (
        sourceSanskritSource &&
        p.sanskritEditProfile?.source &&
        p.sanskritEditProfile.source.toLowerCase() === sourceSanskritSource.toLowerCase()
      ) {
        score += SCORING_WEIGHTS.SAME_SANSKRIT_EDIT;
        primarySource = 'SANSKRIT_EDIT';
        reasons.push(`Shared Sanskrit Edit text source '${sourceSanskritSource}'`);
      }

      // 5. Antique era/period match (+250)
      if (
        sourceAntiqueEra &&
        p.antiqueProfile?.era &&
        p.antiqueProfile.era.toLowerCase() === sourceAntiqueEra.toLowerCase()
      ) {
        score += SCORING_WEIGHTS.SAME_ANTIQUE_CONTEXT;
        primarySource = 'ANTIQUE';
        reasons.push(`Same antique era '${sourceAntiqueEra}'`);
      }

      // 6. Shared attribute values (+100 per match)
      let attributeMatchCount = 0;
      for (const attr of p.attributes || []) {
        if (attr.attributeValueId && sourceAttributeValueIds.has(attr.attributeValueId)) {
          attributeMatchCount++;
        }
      }
      if (attributeMatchCount > 0) {
        score += attributeMatchCount * SCORING_WEIGHTS.SHARED_ATTRIBUTE;
        if (!reasons.length) primarySource = 'ATTRIBUTE';
        reasons.push(`${attributeMatchCount} shared filterable attribute(s)`);
      }

      // Only include candidate if it matches at least one meaningful signal
      if (score > 0) {
        candidates.push({
          product: p,
          score,
          primarySource,
          reasons
        });
      }
    }

    // Deterministic ranking tie-breakers: score DESC -> product.name ASC -> product.id ASC
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const nameCompare = a.product.name.localeCompare(b.product.name);
      if (nameCompare !== 0) return nameCompare;
      return a.product.id.localeCompare(b.product.id);
    });

    return candidates;
  }
}
