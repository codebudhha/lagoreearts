import { CollectionsRepository } from './collections.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionFilterQuery
} from './collections.types.ts';

export class CollectionsService {
  /**
   * Helper: Normalize string to URL-safe slug
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
   * Helper: Resolve globally unique slug with deterministic numeric suffix
   */
  static async resolveUniqueSlug(baseNameOrSlug: string, currentId?: string): Promise<string> {
    let slug = this.slugify(baseNameOrSlug);
    if (!slug) slug = 'collection';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await CollectionsRepository.findBySlug(candidate);
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  /**
   * Helper: Resolve SEO fallbacks
   */
  static resolveSeo(name: string, input: { metaTitle?: string; ogTitle?: string }) {
    const metaTitle = input.metaTitle?.trim() || name;
    const ogTitle = input.ogTitle?.trim() || metaTitle;
    return { metaTitle, ogTitle };
  }

  // ==========================================
  // 1. ADMIN COLLECTION METHODS
  // ==========================================

  static async createCollection(input: CreateCollectionInput, actorAdminId: string, meta: any = {}) {
    const name = input.name.trim();

    // 1. Duplicate Name Check
    const existingName = await CollectionsRepository.findByName(name);
    if (existingName) {
      throw { status: 400, code: 'DUPLICATE_NAME', message: `A collection named "${name}" already exists` };
    }

    // 2. Resolve Unique Slug
    const slug = input.slug
      ? this.slugify(input.slug)
      : await this.resolveUniqueSlug(name);

    const existingSlug = await CollectionsRepository.findBySlug(slug);
    if (existingSlug) {
      throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
    }

    // 3. SEO Fallbacks
    const { metaTitle, ogTitle } = this.resolveSeo(name, input);

    // 4. Create Record
    const collection = await CollectionsRepository.create({
      name,
      slug,
      shortDescription: input.shortDescription || null,
      description: input.description || null,
      image: input.image || null,
      bannerImage: input.bannerImage || null,
      heroTitle: input.heroTitle || null,
      heroDescription: input.heroDescription || null,
      status: input.status || 'ACTIVE',
      type: input.type || 'MANUAL',
      isFeatured: Boolean(input.isFeatured),
      sortOrder: input.sortOrder !== undefined ? Math.max(0, Number(input.sortOrder)) : 0,
      metaTitle,
      metaDescription: input.metaDescription || null,
      canonicalUrl: input.canonicalUrl || null,
      ogTitle,
      ogDescription: input.ogDescription || null,
      ogImage: input.ogImage || null
    });

    // 5. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'COLLECTION_CREATED',
      module: 'COLLECTIONS',
      entityType: 'Collection',
      entityId: collection?.id,
      newValues: {
        name: collection?.name,
        slug: collection?.slug,
        status: collection?.status,
        type: collection?.type,
        isFeatured: collection?.isFeatured
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return collection;
  }

  static async getCollectionById(id: string) {
    const collection = await CollectionsRepository.findById(id);
    if (!collection) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Collection not found' };
    }
    return collection;
  }

  static async listAdminCollections(query: CollectionFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.featured !== undefined) {
      where.isFeatured = query.featured === 'true' || query.featured === true;
    }
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sort) {
      const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy[query.sort] = order;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const { items, total } = await CollectionsRepository.listCollections({
      where,
      orderBy,
      skip,
      take: limit
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updateCollection(id: string, input: UpdateCollectionInput, actorAdminId: string, meta: any = {}) {
    const existing = await CollectionsRepository.findById(id);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Collection not found' };
    }

    const updates: any = {};

    // 1. Name check
    if (input.name !== undefined) {
      const name = input.name.trim();
      const duplicateName = await CollectionsRepository.findByName(name);
      if (duplicateName && duplicateName.id !== id) {
        throw { status: 400, code: 'DUPLICATE_NAME', message: `A collection named "${name}" already exists` };
      }
      updates.name = name;
    }

    // 2. Slug check
    if (input.slug !== undefined) {
      const slug = this.slugify(input.slug);
      const duplicateSlug = await CollectionsRepository.findBySlug(slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
      }
      updates.slug = slug;
    }

    if (input.shortDescription !== undefined) updates.shortDescription = input.shortDescription;
    if (input.description !== undefined) updates.description = input.description;
    if (input.image !== undefined) updates.image = input.image;
    if (input.bannerImage !== undefined) updates.bannerImage = input.bannerImage;
    if (input.heroTitle !== undefined) updates.heroTitle = input.heroTitle;
    if (input.heroDescription !== undefined) updates.heroDescription = input.heroDescription;
    if (input.status !== undefined) updates.status = input.status;
    if (input.type !== undefined) updates.type = input.type;
    if (input.isFeatured !== undefined) updates.isFeatured = Boolean(input.isFeatured);
    if (input.sortOrder !== undefined) updates.sortOrder = Math.max(0, Number(input.sortOrder));
    if (input.metaTitle !== undefined) updates.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updates.metaDescription = input.metaDescription;
    if (input.canonicalUrl !== undefined) updates.canonicalUrl = input.canonicalUrl;
    if (input.ogTitle !== undefined) updates.ogTitle = input.ogTitle;
    if (input.ogDescription !== undefined) updates.ogDescription = input.ogDescription;
    if (input.ogImage !== undefined) updates.ogImage = input.ogImage;

    const updated = await CollectionsRepository.update(id, updates);

    // Audit Logging
    let auditAction = 'COLLECTION_UPDATED';
    if (updates.status && updates.status !== existing.status) {
      auditAction = 'COLLECTION_STATUS_CHANGED';
    } else if (updates.isFeatured !== undefined && updates.isFeatured !== existing.isFeatured) {
      auditAction = 'COLLECTION_FEATURED_CHANGED';
    } else if (updates.sortOrder !== undefined && updates.sortOrder !== existing.sortOrder) {
      auditAction = 'COLLECTION_SORT_CHANGED';
    }

    AuditService.log({
      adminUserId: actorAdminId,
      action: auditAction,
      module: 'COLLECTIONS',
      entityType: 'Collection',
      entityId: id,
      oldValues: {
        name: existing.name,
        slug: existing.slug,
        status: existing.status,
        isFeatured: existing.isFeatured,
        sortOrder: existing.sortOrder
      },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  static async updateSortOrder(id: string, sortOrder: number, actorAdminId: string, meta: any = {}) {
    const existing = await CollectionsRepository.findById(id);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Collection not found' };
    }

    const orderNum = Math.max(0, Number(sortOrder));
    const updated = await CollectionsRepository.update(id, { sortOrder: orderNum });

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'COLLECTION_SORT_CHANGED',
      module: 'COLLECTIONS',
      entityType: 'Collection',
      entityId: id,
      oldValues: { sortOrder: existing.sortOrder },
      newValues: { sortOrder: orderNum },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  static async deleteCollection(id: string, actorAdminId: string, meta: any = {}) {
    const collection = await CollectionsRepository.findById(id);
    if (!collection) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Collection not found' };
    }

    await CollectionsRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'COLLECTION_DELETED',
      module: 'COLLECTIONS',
      entityType: 'Collection',
      entityId: id,
      oldValues: { name: collection.name, slug: collection.slug },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Collection deleted successfully' };
  }

  // ==========================================
  // 2. PUBLIC STOREFRONT METHODS
  // ==========================================

  static async listPublicCollections(query: { page?: number; limit?: number; featured?: boolean | string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };
    if (query.featured !== undefined) {
      where.isFeatured = query.featured === 'true' || query.featured === true;
    }

    const { items, total } = await CollectionsRepository.listCollections({
      where,
      orderBy: { sortOrder: 'asc', name: 'asc' },
      skip,
      take: limit
    });

    return {
      items: items.map(coll => ({
        id: coll.id,
        name: coll.name,
        slug: coll.slug,
        shortDescription: coll.shortDescription,
        description: coll.description,
        image: coll.image,
        bannerImage: coll.bannerImage,
        heroTitle: coll.heroTitle,
        heroDescription: coll.heroDescription,
        isFeatured: coll.isFeatured,
        sortOrder: coll.sortOrder,
        metaTitle: coll.metaTitle || coll.name,
        metaDescription: coll.metaDescription,
        canonicalUrl: coll.canonicalUrl,
        ogTitle: coll.ogTitle || coll.metaTitle || coll.name,
        ogDescription: coll.ogDescription || coll.metaDescription,
        ogImage: coll.ogImage || coll.image
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getPublicCollectionBySlug(slug: string) {
    const collection = await CollectionsRepository.findBySlug(slug, { media: true });
    if (!collection || collection.status !== 'ACTIVE') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Collection not found or inactive' };
    }

    const primaryMediaUrl = collection.media?.find((m: any) => m.isPrimary)?.media?.publicUrl;
    const bannerMediaUrl = collection.media?.find((m: any) => m.role === 'BANNER')?.media?.publicUrl;

    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      shortDescription: collection.shortDescription,
      description: collection.description,
      media: (collection.media || []).map((m: any) => {
        const asset = m.media || m;
        return {
          id: asset.id,
          url: asset.publicUrl || asset.url,
          altText: asset.altText || null,
          caption: asset.caption || null,
          width: asset.width || null,
          height: asset.height || null,
          sortOrder: m.sortOrder !== undefined ? m.sortOrder : 0,
          role: m.role || 'PRIMARY',
          isPrimary: Boolean(m.isPrimary)
        };
      }),
      image: primaryMediaUrl || collection.image || null,
      bannerImage: bannerMediaUrl || collection.bannerImage || null,
      heroTitle: collection.heroTitle,
      heroDescription: collection.heroDescription,
      isFeatured: collection.isFeatured,
      sortOrder: collection.sortOrder,
      metaTitle: collection.metaTitle || collection.name,
      metaDescription: collection.metaDescription,
      canonicalUrl: collection.canonicalUrl,
      ogTitle: collection.ogTitle || collection.metaTitle || collection.name,
      ogDescription: collection.ogDescription || collection.metaDescription,
      ogImage: collection.ogImage || primaryMediaUrl || collection.image
    };
  }
}
