import { CategoryFiltersRepository } from './category-filters.repository.ts';
import { CategoriesRepository } from '../categories/categories.repository.ts';
import { AttributesRepository } from '../attributes/attributes.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  AddCategoryAttributeInput,
  UpdateCategoryAttributeInput,
  CategoryFilterResponse
} from './category-filters.types.ts';

export class CategoryFiltersService {
  /**
   * 1. Admin: List Attributes Configured for a Category
   */
  static async listAdminCategoryAttributes(categoryId: string) {
    const category = await CategoriesRepository.findById(categoryId);
    if (!category) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }

    const bindings = await CategoryFiltersRepository.listCategoryAttributes(categoryId, false);
    return bindings.map(b => ({
      categoryId: b.categoryId,
      attributeId: b.attributeId,
      attributeName: (b as any).attribute?.name,
      attributeSlug: (b as any).attribute?.slug,
      attributeType: (b as any).attribute?.type,
      attributeStatus: (b as any).attribute?.status,
      isFilterable: (b as any).attribute?.isFilterable,
      sortOrder: b.sortOrder,
      isVisible: b.isVisible,
      isRequired: b.isRequired,
      valuesCount: ((b as any).attribute?.values || []).length
    }));
  }

  /**
   * 2. Admin: Add Attribute to Category
   */
  static async addCategoryAttribute(categoryId: string, input: AddCategoryAttributeInput, actorAdminId: string, meta: any = {}) {
    // 1. Verify Category exists
    const category = await CategoriesRepository.findById(categoryId);
    if (!category) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }

    // 2. Verify Attribute exists
    const attribute = await AttributesRepository.findById(input.attributeId);
    if (!attribute) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute not found' };
    }

    // 3. Prevent duplicate binding
    const existing = await CategoryFiltersRepository.findBinding(categoryId, input.attributeId);
    if (existing) {
      throw {
        status: 400,
        code: 'DUPLICATE_CATEGORY_ATTRIBUTE',
        message: `Attribute "${attribute.name}" is already mapped to category "${category.name}"`
      };
    }

    const binding = await CategoryFiltersRepository.addCategoryAttribute({
      categoryId,
      attributeId: input.attributeId,
      sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0,
      isVisible: input.isVisible !== undefined ? Boolean(input.isVisible) : true,
      isRequired: Boolean(input.isRequired)
    });

    // 4. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_ATTRIBUTE_ADDED',
      module: 'CATEGORIES',
      entityType: 'CategoryAttribute',
      entityId: `${categoryId}:${input.attributeId}`,
      newValues: { categoryId, attributeId: input.attributeId, sortOrder: binding?.sortOrder, isVisible: binding?.isVisible },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return binding;
  }

  /**
   * 3. Admin: Update Category Attribute configuration
   */
  static async updateCategoryAttribute(
    categoryId: string,
    attributeId: string,
    input: UpdateCategoryAttributeInput,
    actorAdminId: string,
    meta: any = {}) {
    const existing = await CategoryFiltersRepository.findBinding(categoryId, attributeId);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category attribute mapping not found' };
    }

    const updates: any = {};
    if (input.sortOrder !== undefined) updates.sortOrder = Number(input.sortOrder);
    if (input.isVisible !== undefined) updates.isVisible = Boolean(input.isVisible);
    if (input.isRequired !== undefined) updates.isRequired = Boolean(input.isRequired);

    const updated = await CategoryFiltersRepository.updateCategoryAttribute(categoryId, attributeId, updates);

    // Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_ATTRIBUTE_UPDATED',
      module: 'CATEGORIES',
      entityType: 'CategoryAttribute',
      entityId: `${categoryId}:${attributeId}`,
      oldValues: { sortOrder: existing.sortOrder, isVisible: existing.isVisible, isRequired: existing.isRequired },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  /**
   * 4. Admin: Remove Attribute from Category
   */
  static async removeCategoryAttribute(categoryId: string, attributeId: string, actorAdminId: string, meta: any = {}) {
    const existing = await CategoryFiltersRepository.findBinding(categoryId, attributeId);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category attribute mapping not found' };
    }

    await CategoryFiltersRepository.deleteCategoryAttribute(categoryId, attributeId);

    // Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_ATTRIBUTE_REMOVED',
      module: 'CATEGORIES',
      entityType: 'CategoryAttribute',
      entityId: `${categoryId}:${attributeId}`,
      oldValues: { categoryId, attributeId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Attribute removed from category successfully' };
  }

  /**
   * 5. Public: Resolve Dynamic Category Filters for Storefront
   */
  static async getPublicCategoryFilters(categorySlugOrId: string): Promise<CategoryFilterResponse> {
    // 1. Load active category
    let category = await CategoriesRepository.findBySlug(categorySlugOrId);
    if (!category) {
      category = await CategoriesRepository.findById(categorySlugOrId);
    }
    if (!category || category.status !== 'ACTIVE') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found or inactive' };
    }

    // 2. Load active, visible CategoryAttributes ordered by sortOrder
    const bindings = await CategoryFiltersRepository.listCategoryAttributes(category.id, true);

    const filters = [];
    for (const binding of bindings) {
      const attr = (binding as any).attribute;
      // Must be active and filterable
      if (!attr || attr.status !== 'ACTIVE' || !attr.isFilterable) {
        continue;
      }

      // Load active values for this attribute
      const { items: values } = await AttributesRepository.listValues({
        where: {
          attributeId: attr.id,
          status: 'ACTIVE'
        },
        orderBy: { sortOrder: 'asc', name: 'asc' }
      });

      filters.push({
        id: attr.id,
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
        sortOrder: binding.sortOrder,
        isRequired: binding.isRequired,
        values: values.map(v => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          sortOrder: v.sortOrder
        }))
      });
    }

    // Sort filters according to CategoryAttribute.sortOrder
    filters.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      filters
    };
  }
}
