/**
 * Module 24: Cross-sell & Upsell — Domain Policy & Business Invariants
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { RecommendationType } from './recommendation.types.ts';
import { prisma } from '../../database/prisma.ts';

export class RecommendationPolicy {
  /**
   * Validate that a product does not recommend itself
   */
  static validateNotSelfReference(sourceProductId: string, targetProductId: string): void {
    if (sourceProductId === targetProductId) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'PRODUCT_RECOMMENDATION_SELF_REFERENCE',
        message: 'A product cannot have a recommendation relationship to itself'
      };
    }
  }

  /**
   * Validate that no duplicate recommendation of the same (source, target, type) exists
   */
  static async validateNoDuplicate(
    sourceProductId: string,
    targetProductId: string,
    type: RecommendationType,
    excludeRecommendationId?: string
  ): Promise<void> {
    const existing = await prisma.productRecommendation.findFirst({
      where: {
        sourceProductId,
        targetProductId,
        type
      }
    });

    if (existing && existing.id !== excludeRecommendationId) {
      throw {
        statusCode: 409,
        status: 409,
        code: 'PRODUCT_RECOMMENDATION_DUPLICATE',
        message: `A ${type} recommendation already exists between source product and target product`
      };
    }
  }

  /**
   * Detect and prevent cycles in recommendation relationships (e.g. A -> B -> A or multi-hop cycles)
   * A cycle occurs if there is already a direct or indirect path from targetProductId back to sourceProductId
   * within the same recommendation type or direct explicit graph.
   */
  static async validateNoCycle(
    sourceProductId: string,
    targetProductId: string,
    type: RecommendationType,
    maxHops: number = 10
  ): Promise<void> {
    // 1. Direct reciprocal check (fast path)
    const directInverse = await prisma.productRecommendation.findFirst({
      where: {
        sourceProductId: targetProductId,
        targetProductId: sourceProductId,
        type
      }
    });

    if (directInverse) {
      throw {
        statusCode: 409,
        status: 409,
        code: 'PRODUCT_RECOMMENDATION_CYCLE',
        message: `Creating this ${type} recommendation creates a circular dependency between the two products`
      };
    }

    // 2. Multi-hop traversal check: Search if targetProductId reaches sourceProductId
    const visited = new Set<string>();
    const queue: { productId: string; depth: number }[] = [{ productId: targetProductId, depth: 1 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.productId) || current.depth > maxHops) {
        continue;
      }
      visited.add(current.productId);

      const nextRecs = await prisma.productRecommendation.findMany({
        where: {
          sourceProductId: current.productId,
          type,
          isActive: true
        }
      });

      for (const rec of nextRecs) {
        if (rec.targetProductId === sourceProductId) {
          throw {
            statusCode: 409,
            status: 409,
            code: 'PRODUCT_RECOMMENDATION_CYCLE',
            message: `Creating this ${type} recommendation creates an indirect circular dependency chain`
          };
        }
        if (!visited.has(rec.targetProductId)) {
          queue.push({ productId: rec.targetProductId, depth: current.depth + 1 });
        }
      }
    }
  }
}
