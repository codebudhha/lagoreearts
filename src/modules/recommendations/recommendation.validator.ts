/**
 * Module 24: Cross-sell & Upsell — Input Validator
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type {
  CreateRecommendationDto,
  AdminCreateRecommendationBody,
  UpdateRecommendationDto,
  ReorderItemDto,
  RecommendationFilterQuery,
  PublicRecommendationQuery,
  RecommendationType
} from './recommendation.types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_TYPES: RecommendationType[] = ['CROSS_SELL', 'UPSELL', 'RELATED'];

export class RecommendationValidator {
  /**
   * Validate UUID
   */
  static validateUuid(id: string, fieldName: string = 'id'): string {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_ID_FORMAT',
        message: `${fieldName} must be a valid UUID`
      };
    }
    return id.trim();
  }

  /**
   * Validate recommendation type enum
   */
  static validateType(type: any): RecommendationType {
    if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type.trim().toUpperCase() as RecommendationType)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_RECOMMENDATION_TYPE',
        message: `Recommendation type must be one of: ${VALID_TYPES.join(', ')}`
      };
    }
    return type.trim().toUpperCase() as RecommendationType;
  }

  /**
   * Validate Create Recommendation payload
   */
  static validateCreate(data: AdminCreateRecommendationBody): CreateRecommendationDto & { sourceProductId?: string } {
    if (!data || typeof data !== 'object') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_REQUEST_BODY',
        message: 'Request body must be a valid JSON object'
      };
    }

    const targetProductId = this.validateUuid(data.targetProductId, 'targetProductId');
    const type = this.validateType(data.type);

    let sourceProductId: string | undefined = undefined;
    if (data.sourceProductId !== undefined) {
      sourceProductId = this.validateUuid(data.sourceProductId, 'sourceProductId');
    }

    let sortOrder = 0;
    if (data.sortOrder !== undefined) {
      const parsed = Number(data.sortOrder);
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_SORT_ORDER',
          message: 'sortOrder must be a non-negative integer'
        };
      }
      sortOrder = parsed;
    }

    let isActive = true;
    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_IS_ACTIVE',
          message: 'isActive must be a boolean'
        };
      }
      isActive = data.isActive;
    }

    return {
      sourceProductId,
      targetProductId,
      type,
      sortOrder,
      isActive
    };
  }

  /**
   * Validate Update Recommendation payload
   */
  static validateUpdate(data: UpdateRecommendationDto): UpdateRecommendationDto {
    if (!data || typeof data !== 'object') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_REQUEST_BODY',
        message: 'Request body must be a valid JSON object'
      };
    }

    const validated: UpdateRecommendationDto = {};

    if (data.type !== undefined) {
      validated.type = this.validateType(data.type);
    }

    if (data.targetProductId !== undefined) {
      validated.targetProductId = this.validateUuid(data.targetProductId, 'targetProductId');
    }

    if (data.sortOrder !== undefined) {
      const parsed = Number(data.sortOrder);
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_SORT_ORDER',
          message: 'sortOrder must be a non-negative integer'
        };
      }
      validated.sortOrder = parsed;
    }

    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_IS_ACTIVE',
          message: 'isActive must be a boolean'
        };
      }
      validated.isActive = data.isActive;
    }

    if (Object.keys(validated).length === 0) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'EMPTY_UPDATE_PAYLOAD',
        message: 'At least one field (type, sortOrder, isActive, targetProductId) must be provided for update'
      };
    }

    return validated;
  }

  /**
   * Validate Reorder payload
   */
  static validateReorder(items: any): ReorderItemDto[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'INVALID_REORDER_PAYLOAD',
        message: 'Reorder payload must be a non-empty array of items'
      };
    }

    const seenIds = new Set<string>();
    const validatedItems: ReorderItemDto[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_REORDER_ITEM',
          message: 'Each reorder item must be an object with id and sortOrder'
        };
      }

      const id = this.validateUuid(item.id, 'item.id');
      if (seenIds.has(id)) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'DUPLICATE_REORDER_ID',
          message: `Duplicate recommendation ID in reorder payload: ${id}`
        };
      }
      seenIds.add(id);

      const sortOrder = Number(item.sortOrder);
      if (isNaN(sortOrder) || !Number.isInteger(sortOrder) || sortOrder < 0) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_SORT_ORDER',
          message: 'sortOrder must be a non-negative integer'
        };
      }

      validatedItems.push({ id, sortOrder });
    }

    return validatedItems;
  }

  /**
   * Validate Admin Query Filter
   */
  static validateAdminFilter(query: any): RecommendationFilterQuery {
    const filter: RecommendationFilterQuery = {};

    if (query?.sourceProductId) {
      filter.sourceProductId = this.validateUuid(query.sourceProductId, 'sourceProductId');
    }
    if (query?.targetProductId) {
      filter.targetProductId = this.validateUuid(query.targetProductId, 'targetProductId');
    }
    if (query?.type) {
      filter.type = this.validateType(query.type);
    }
    if (query?.isActive !== undefined) {
      filter.isActive = String(query.isActive) === 'true' || query.isActive === true;
    }
    if (query?.search && typeof query.search === 'string') {
      filter.search = query.search.trim();
    }

    const page = Number(query?.page || 1);
    filter.page = !isNaN(page) && page > 0 ? page : 1;

    const limit = Number(query?.limit || 20);
    filter.limit = !isNaN(limit) && limit > 0 && limit <= 100 ? limit : 20;

    if (query?.sortBy && ['sortOrder', 'createdAt', 'type'].includes(query.sortBy)) {
      filter.sortBy = query.sortBy;
    }
    if (query?.sortOrder && ['asc', 'desc'].includes(String(query.sortOrder).toLowerCase())) {
      filter.sortOrder = String(query.sortOrder).toLowerCase() as 'asc' | 'desc';
    }

    return filter;
  }

  /**
   * Validate Public Query
   */
  static validatePublicQuery(query: any): PublicRecommendationQuery {
    const validated: PublicRecommendationQuery = {};

    if (query?.type) {
      validated.type = this.validateType(query.type);
    }

    if (query?.limit !== undefined) {
      const parsed = Number(query.limit);
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        throw {
          statusCode: 400,
          status: 400,
          code: 'INVALID_LIMIT',
          message: 'Limit must be a positive integer between 1 and 20'
        };
      }
      // Strictly clamp max limit to 20 to prevent query explosion
      validated.limit = Math.min(parsed, 20);
    } else {
      validated.limit = 8;
    }

    return validated;
  }
}
