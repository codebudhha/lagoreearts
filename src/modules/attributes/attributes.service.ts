import { AttributesRepository } from './attributes.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateAttributeInput,
  UpdateAttributeInput,
  AttributeFilterQuery,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
  AttributeValueFilterQuery
} from './attributes.types.ts';

export class AttributesService {
  /**
   * Helper: Generate URL-safe slug
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Resolve globally unique slug for Attribute
   */
  static async resolveUniqueAttributeSlug(baseNameOrSlug: string, currentId?: string): Promise<string> {
    let slug = this.slugify(baseNameOrSlug);
    if (!slug) slug = 'attribute';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await AttributesRepository.findBySlug(candidate);
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  /**
   * Helper: Resolve unique slug for Attribute Value within its parent Attribute
   */
  static async resolveUniqueValueSlug(attributeId: string, baseNameOrSlug: string, currentId?: string): Promise<string> {
    let slug = this.slugify(baseNameOrSlug);
    if (!slug) slug = 'value';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await AttributesRepository.findValueBySlug(attributeId, candidate);
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  // ==========================================
  // 1. ATTRIBUTE METHODS
  // ==========================================

  static async createAttribute(input: CreateAttributeInput, actorAdminId: string, meta: any = {}) {
    const name = input.name.trim();

    // 1. Check duplicate name
    const existingName = await AttributesRepository.findByName(name);
    if (existingName) {
      throw { status: 400, code: 'DUPLICATE_NAME', message: `An attribute named "${name}" already exists` };
    }

    // 2. Resolve Slug
    const slug = input.slug
      ? this.slugify(input.slug)
      : await this.resolveUniqueAttributeSlug(name);

    const existingSlug = await AttributesRepository.findBySlug(slug);
    if (existingSlug) {
      throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
    }

    // 3. Create
    const attribute = await AttributesRepository.create({
      name,
      slug,
      type: input.type || 'MULTI_SELECT',
      description: input.description || null,
      status: input.status || 'ACTIVE',
      isFilterable: input.isFilterable !== undefined ? Boolean(input.isFilterable) : true,
      isRequired: Boolean(input.isRequired),
      isSystem: Boolean(input.isSystem),
      sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0
    });

    // 4. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ATTRIBUTE_CREATED',
      module: 'ATTRIBUTES',
      entityType: 'Attribute',
      entityId: attribute?.id,
      newValues: { name: attribute?.name, slug: attribute?.slug, type: attribute?.type, status: attribute?.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return attribute;
  }

  static async updateAttribute(id: string, input: UpdateAttributeInput, actorAdminId: string, meta: any = {}) {
    const existing = await AttributesRepository.findById(id);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute not found' };
    }

    const updates: any = {};

    // 1. Name Check
    if (input.name) {
      const name = input.name.trim();
      const duplicateName = await AttributesRepository.findByName(name);
      if (duplicateName && duplicateName.id !== id) {
        throw { status: 400, code: 'DUPLICATE_NAME', message: `An attribute named "${name}" already exists` };
      }
      updates.name = name;
    }

    // 2. Slug Check
    if (input.slug) {
      const slug = this.slugify(input.slug);
      const duplicateSlug = await AttributesRepository.findBySlug(slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
      }
      updates.slug = slug;
    }

    // 3. Type modification check
    if (input.type && input.type !== existing.type) {
      const valueCount = await AttributesRepository.countValuesForAttribute(id);
      if (valueCount > 0 && (input.type === 'BOOLEAN' || input.type === 'NUMBER')) {
        throw {
          status: 409,
          code: 'TYPE_CHANGE_CONFLICT',
          message: `Cannot change attribute type to ${input.type} because ${valueCount} attribute value(s) already exist.`
        };
      }
      updates.type = input.type;
    }

    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.isFilterable !== undefined) updates.isFilterable = Boolean(input.isFilterable);
    if (input.isRequired !== undefined) updates.isRequired = Boolean(input.isRequired);
    if (input.sortOrder !== undefined) updates.sortOrder = Number(input.sortOrder);

    const updated = await AttributesRepository.update(id, updates);

    // Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: updates.status && updates.status !== existing.status ? 'ATTRIBUTE_STATUS_CHANGED' : 'ATTRIBUTE_UPDATED',
      module: 'ATTRIBUTES',
      entityType: 'Attribute',
      entityId: id,
      oldValues: { name: existing.name, slug: existing.slug, status: existing.status, type: existing.type },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  static async deleteAttribute(id: string, actorAdminId: string, meta: any = {}) {
    const attribute = await AttributesRepository.findById(id);
    if (!attribute) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute not found' };
    }

    if (attribute.isSystem) {
      throw { status: 400, code: 'SYSTEM_ATTRIBUTE_PROTECTED', message: 'System default attributes cannot be deleted' };
    }

    // Safe deletion: Check values
    const valueCount = await AttributesRepository.countValuesForAttribute(id);
    if (valueCount > 0) {
      throw {
        status: 409,
        code: 'ATTRIBUTE_IN_USE',
        message: `This attribute cannot be deleted because it contains ${valueCount} attribute value(s). Please delete all values first.`
      };
    }

    // Safe deletion: Check category bindings
    const bindingCount = await AttributesRepository.countCategoryBindings(id);
    if (bindingCount > 0) {
      throw {
        status: 409,
        code: 'ATTRIBUTE_IN_USE',
        message: `This attribute cannot be deleted because it is mapped to ${bindingCount} category filter(s).`
      };
    }

    await AttributesRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ATTRIBUTE_DELETED',
      module: 'ATTRIBUTES',
      entityType: 'Attribute',
      entityId: id,
      oldValues: { name: attribute.name, slug: attribute.slug },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Attribute deleted successfully' };
  }

  static async listAdminAttributes(query: AttributeFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.filterable !== undefined) where.isFilterable = query.filterable === 'true' || query.filterable === true;
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sort) {
      const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy[query.sort] = order;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const { items, total } = await AttributesRepository.listAttributes({
      where,
      orderBy,
      skip,
      take: limit,
      include: { values: true }
    });

    return {
      items: items.map(item => ({
        ...item,
        valuesCount: (item as any).values?.length || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAttributeById(idOrSlug: string) {
    let attribute = await AttributesRepository.findById(idOrSlug, { values: true, categoryAttributes: true });
    if (!attribute) {
      attribute = await AttributesRepository.findBySlug(idOrSlug, { values: true, categoryAttributes: true });
    }
    if (!attribute) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute not found' };
    }
    return attribute;
  }

  // ==========================================
  // 2. ATTRIBUTE VALUE METHODS
  // ==========================================

  static async createAttributeValue(attributeId: string, input: CreateAttributeValueInput, actorAdminId: string, meta: any = {}) {
    // 1. Verify Parent Attribute exists & is active
    const attribute = await AttributesRepository.findById(attributeId);
    if (!attribute) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Parent attribute not found' };
    }

    const name = input.name.trim();

    // 2. Check duplicate name under this attribute
    const duplicateName = await AttributesRepository.findValueByName(attributeId, name);
    if (duplicateName) {
      throw {
        status: 400,
        code: 'DUPLICATE_VALUE_NAME',
        message: `Value "${name}" already exists for attribute "${attribute.name}"`
      };
    }

    // 3. Resolve Slug
    const slug = input.slug
      ? this.slugify(input.slug)
      : await this.resolveUniqueValueSlug(attributeId, name);

    const duplicateSlug = await AttributesRepository.findValueBySlug(attributeId, slug);
    if (duplicateSlug) {
      throw {
        status: 400,
        code: 'DUPLICATE_VALUE_SLUG',
        message: `Value slug "${slug}" already exists for attribute "${attribute.name}"`
      };
    }

    // 4. Create Value
    const value = await AttributesRepository.createValue({
      attributeId,
      name,
      slug,
      description: input.description || null,
      sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0,
      status: input.status || 'ACTIVE'
    });

    // 5. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ATTRIBUTE_VALUE_CREATED',
      module: 'ATTRIBUTES',
      entityType: 'AttributeValue',
      entityId: value?.id,
      newValues: { attributeId, name: value?.name, slug: value?.slug, status: value?.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return value;
  }

  static async updateAttributeValue(attributeId: string, valueId: string, input: UpdateAttributeValueInput, actorAdminId: string, meta: any = {}) {
    const existing = await AttributesRepository.findValueById(valueId);
    if (!existing || existing.attributeId !== attributeId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute value not found' };
    }

    const updates: any = {};

    if (input.name) {
      const name = input.name.trim();
      const duplicateName = await AttributesRepository.findValueByName(attributeId, name);
      if (duplicateName && duplicateName.id !== valueId) {
        throw { status: 400, code: 'DUPLICATE_VALUE_NAME', message: `Value "${name}" already exists for this attribute` };
      }
      updates.name = name;
    }

    if (input.slug) {
      const slug = this.slugify(input.slug);
      const duplicateSlug = await AttributesRepository.findValueBySlug(attributeId, slug);
      if (duplicateSlug && duplicateSlug.id !== valueId) {
        throw { status: 400, code: 'DUPLICATE_VALUE_SLUG', message: `Value slug "${slug}" already exists for this attribute` };
      }
      updates.slug = slug;
    }

    if (input.description !== undefined) updates.description = input.description;
    if (input.sortOrder !== undefined) updates.sortOrder = Number(input.sortOrder);
    if (input.status !== undefined) updates.status = input.status;

    const updated = await AttributesRepository.updateValue(valueId, updates);

    AuditService.log({
      adminUserId: actorAdminId,
      action: updates.status && updates.status !== existing.status ? 'ATTRIBUTE_VALUE_STATUS_CHANGED' : 'ATTRIBUTE_VALUE_UPDATED',
      module: 'ATTRIBUTES',
      entityType: 'AttributeValue',
      entityId: valueId,
      oldValues: { name: existing.name, slug: existing.slug, status: existing.status },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  static async deleteAttributeValue(attributeId: string, valueId: string, actorAdminId: string, meta: any = {}) {
    const value = await AttributesRepository.findValueById(valueId);
    if (!value || value.attributeId !== attributeId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute value not found' };
    }

    await AttributesRepository.deleteValue(valueId);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ATTRIBUTE_VALUE_DELETED',
      module: 'ATTRIBUTES',
      entityType: 'AttributeValue',
      entityId: valueId,
      oldValues: { name: value.name, slug: value.slug, attributeId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Attribute value deleted successfully' };
  }

  static async listAttributeValues(attributeId: string, query: AttributeValueFilterQuery = {}) {
    const attribute = await AttributesRepository.findById(attributeId);
    if (!attribute) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Attribute not found' };
    }

    const where: any = { attributeId };
    if (query.status) where.status = query.status;
    if (query.search) where.search = query.search;

    const page = query.page ? Math.max(1, Number(query.page)) : undefined;
    const limit = query.limit ? Math.min(100, Math.max(1, Number(query.limit))) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const { items, total } = await AttributesRepository.listValues({
      where,
      orderBy: { sortOrder: 'asc', name: 'asc' },
      skip,
      take: limit
    });

    return { items, total };
  }

  // ==========================================
  // 3. PUBLIC STOREFRONT ATTRIBUTES
  // ==========================================

  static async listPublicAttributes() {
    const { items } = await AttributesRepository.listAttributes({
      where: {
        status: 'ACTIVE',
        isFilterable: true
      },
      orderBy: { sortOrder: 'asc', name: 'asc' },
      include: { values: true }
    });

    return items.map(attr => ({
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      values: ((attr as any).values || [])
        .filter((v: any) => v.status === 'ACTIVE')
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((v: any) => ({
          name: v.name,
          slug: v.slug
        }))
    }));
  }
}
