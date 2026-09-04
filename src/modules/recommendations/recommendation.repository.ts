/**
 * Module 24: Cross-sell & Upsell — Repository Layer
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  RecommendationType,
  ProductRecommendationRecord,
  RecommendationFilterQuery,
  ReorderItemDto
} from './recommendation.types.ts';

export class ProductRecommendationRepository {
  /**
   * Find recommendation by ID
   */
  static async findById(id: string, include?: any): Promise<any> {
    return prisma.productRecommendation.findUnique({
      where: { id },
      include: include || {
        sourceProduct: {
          include: { category: true, media: true }
        },
        targetProduct: {
          include: { category: true, media: true }
        }
      }
    });
  }

  /**
   * Find duplicate recommendation
   */
  static async findDuplicate(
    sourceProductId: string,
    targetProductId: string,
    type: RecommendationType,
    excludeId?: string
  ): Promise<any> {
    const existing = await prisma.productRecommendation.findFirst({
      where: {
        sourceProductId,
        targetProductId,
        type
      }
    });

    if (existing && existing.id !== excludeId) {
      return existing;
    }
    return null;
  }

  /**
   * Create recommendation
   */
  static async create(data: {
    sourceProductId: string;
    targetProductId: string;
    type: RecommendationType;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<any> {
    return prisma.productRecommendation.create({
      data: {
        sourceProductId: data.sourceProductId,
        targetProductId: data.targetProductId,
        type: data.type,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : 0,
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      include: {
        sourceProduct: true,
        targetProduct: {
          include: { category: true, media: true }
        }
      }
    });
  }

  /**
   * Update recommendation
   */
  static async update(
    id: string,
    data: {
      type?: RecommendationType;
      sortOrder?: number;
      isActive?: boolean;
      targetProductId?: string;
    }
  ): Promise<any> {
    return prisma.productRecommendation.update({
      where: { id },
      data,
      include: {
        sourceProduct: true,
        targetProduct: {
          include: { category: true, media: true }
        }
      }
    });
  }

  /**
   * Delete recommendation
   */
  static async delete(id: string): Promise<any> {
    return prisma.productRecommendation.delete({
      where: { id }
    });
  }

  /**
   * Delete all recommendations referencing a product (source or target)
   */
  static async deleteByProductId(productId: string): Promise<void> {
    await prisma.productRecommendation.deleteMany({
      where: {
        sourceProductId: productId
      }
    });
    await prisma.productRecommendation.deleteMany({
      where: {
        targetProductId: productId
      }
    });
  }

  /**
   * Find explicit recommendations by source product ID
   */
  static async findBySourceProduct(
    sourceProductId: string,
    options: {
      type?: RecommendationType;
      isActive?: boolean;
    } = {}
  ): Promise<any[]> {
    const where: any = {
      sourceProductId
    };

    if (options.type) {
      where.type = options.type;
    }
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return prisma.productRecommendation.findMany({
      where,
      include: {
        targetProduct: {
          include: {
            category: true,
            collections: true,
            attributes: {
              include: { attribute: true, attributeValue: true }
            },
            media: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
  }

  /**
   * Bulk reorder recommendations for a source product
   */
  static async bulkReorder(sourceProductId: string, items: ReorderItemDto[]): Promise<any[]> {
    const recIds = items.map(i => i.id);

    // Verify all recommendations belong to sourceProductId
    const existingList = await prisma.productRecommendation.findMany({
      where: {
        id: { in: recIds },
        sourceProductId
      }
    });

    if (existingList.length !== items.length) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_REORDER_ITEMS',
        message: 'All recommendation IDs in reorder payload must belong to the specified source product'
      };
    }

    // Execute updates in transaction
    await prisma.$transaction(
      items.map(item =>
        prisma.productRecommendation.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );

    return this.findBySourceProduct(sourceProductId);
  }

  /**
   * List recommendations with admin filtering, search and pagination
   */
  static async list(
    filter: RecommendationFilterQuery
  ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = {};

    if (filter.sourceProductId) {
      where.sourceProductId = filter.sourceProductId;
    }
    if (filter.targetProductId) {
      where.targetProductId = filter.targetProductId;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.productRecommendation.findMany({
        where,
        include: {
          sourceProduct: true,
          targetProduct: {
            include: { category: true, media: true }
          }
        },
        orderBy: filter.sortBy
          ? { [filter.sortBy]: filter.sortOrder || 'asc' }
          : { sortOrder: 'asc' },
        take: limit,
        skip
      }),
      prisma.productRecommendation.count({ where })
    ]);

    // In-memory search filtering if product name/SKU is requested
    let filteredItems = items;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filteredItems = items.filter((rec: any) =>
        rec.sourceProduct?.name?.toLowerCase().includes(q) ||
        rec.sourceProduct?.sku?.toLowerCase().includes(q) ||
        rec.targetProduct?.name?.toLowerCase().includes(q) ||
        rec.targetProduct?.sku?.toLowerCase().includes(q)
      );
    }

    const totalPages = Math.ceil((filter.search ? filteredItems.length : total) / limit) || 1;

    return {
      items: filteredItems,
      total: filter.search ? filteredItems.length : total,
      page,
      limit,
      totalPages
    };
  }
}
