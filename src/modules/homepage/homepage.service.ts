import { prisma } from '../../database/prisma.ts';
import { HomepageRepository } from './homepage.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateHomepageInput,
  UpdateHomepageInput,
  HomepageFilterQuery,
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  SectionReorderItem,
  AttachSectionMediaInput,
  SectionMediaReorderItem,
  HomepageStatus
} from './homepage.types.ts';

export class HomepageService {
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
    if (!slug) slug = 'homepage';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await HomepageRepository.findBySlug(candidate, false);
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  // ==========================================
  // Homepage Admin CRUD
  // ==========================================

  static async createHomepage(
    input: CreateHomepageInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    let slug: string;
    if (input.slug) {
      const customSlug = this.slugify(input.slug);
      const existing = await HomepageRepository.findBySlug(customSlug, false);
      if (existing) {
        const err: any = new Error(`Slug "${customSlug}" is already in use by another homepage.`);
        err.status = 400;
        err.code = 'HOMEPAGE_DUPLICATE_SLUG';
        throw err;
      }
      slug = customSlug;
    } else {
      slug = await this.resolveUniqueSlug(input.name);
    }

    if (input.isDefault && input.status !== 'PUBLISHED') {
      const err: any = new Error('Default homepage must be in PUBLISHED status.');
      err.status = 400;
      err.code = 'HOMEPAGE_DEFAULT_REQUIRES_PUBLISHED';
      throw err;
    }

    const created = await HomepageRepository.create({
      ...input,
      slug
    });

    if (created.isDefault) {
      await HomepageRepository.unsetOtherDefaults(created.id);
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_CREATED',
        module: 'HOMEPAGE',
        entityType: 'Homepage',
        entityId: created.id,
        newValues: { name: created.name, slug: created.slug, status: created.status, isDefault: created.isDefault },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return created;
  }

  static async getHomepageById(id: string) {
    const homepage = await HomepageRepository.findById(id, true);
    if (!homepage) {
      const err: any = new Error(`Homepage with ID "${id}" not found.`);
      err.status = 404;
      err.code = 'HOMEPAGE_NOT_FOUND';
      throw err;
    }
    return homepage;
  }

  static async listHomepages(query: HomepageFilterQuery) {
    return HomepageRepository.list(query);
  }

  static async updateHomepage(
    id: string,
    input: UpdateHomepageInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getHomepageById(id);

    let slug = existing.slug;
    if (input.slug !== undefined && input.slug !== existing.slug) {
      const customSlug = this.slugify(input.slug);
      const existingWithSlug = await HomepageRepository.findBySlug(customSlug, false);
      if (existingWithSlug && existingWithSlug.id !== id) {
        const err: any = new Error(`Slug "${customSlug}" is already in use by another homepage.`);
        err.status = 400;
        err.code = 'HOMEPAGE_DUPLICATE_SLUG';
        throw err;
      }
      slug = customSlug;
    }

    const newStatus = input.status || existing.status;
    const newIsDefault = input.isDefault !== undefined ? input.isDefault : existing.isDefault;

    if (newIsDefault && newStatus !== 'PUBLISHED') {
      const err: any = new Error('Default homepage must be in PUBLISHED status.');
      err.status = 400;
      err.code = 'HOMEPAGE_DEFAULT_REQUIRES_PUBLISHED';
      throw err;
    }

    const updated = await HomepageRepository.update(id, {
      ...input,
      slug
    });

    if (updated.isDefault) {
      await HomepageRepository.unsetOtherDefaults(id);
    }

    if (adminUserId) {
      const action = input.isDefault !== undefined && input.isDefault !== existing.isDefault
        ? 'HOMEPAGE_DEFAULT_CHANGED'
        : 'HOMEPAGE_UPDATED';

      await AuditService.log({
        adminUserId,
        action,
        module: 'HOMEPAGE',
        entityType: 'Homepage',
        entityId: id,
        oldValues: { name: existing.name, slug: existing.slug, status: existing.status, isDefault: existing.isDefault },
        newValues: { name: updated.name, slug: updated.slug, status: updated.status, isDefault: updated.isDefault },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async updateHomepageStatus(
    id: string,
    status: HomepageStatus,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getHomepageById(id);

    let isDefault = existing.isDefault;
    if (status !== 'PUBLISHED' && existing.isDefault) {
      // If unpublishing or archiving a default homepage, unset isDefault
      isDefault = false;
    }

    const updated = await HomepageRepository.update(id, { status, isDefault });

    if (adminUserId) {
      let action = 'HOMEPAGE_UPDATED';
      if (status === 'PUBLISHED') action = 'HOMEPAGE_PUBLISHED';
      else if (status === 'DRAFT') action = 'HOMEPAGE_UNPUBLISHED';
      else if (status === 'ARCHIVED') action = 'HOMEPAGE_ARCHIVED';

      await AuditService.log({
        adminUserId,
        action,
        module: 'HOMEPAGE',
        entityType: 'Homepage',
        entityId: id,
        oldValues: { status: existing.status, isDefault: existing.isDefault },
        newValues: { status: updated.status, isDefault: updated.isDefault },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async setDefaultHomepage(
    id: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getHomepageById(id);

    if (existing.status !== 'PUBLISHED') {
      const err: any = new Error('Default homepage must be in PUBLISHED status.');
      err.status = 400;
      err.code = 'HOMEPAGE_DEFAULT_REQUIRES_PUBLISHED';
      throw err;
    }

    await HomepageRepository.unsetOtherDefaults(id);
    const updated = await HomepageRepository.update(id, { isDefault: true });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_DEFAULT_CHANGED',
        module: 'HOMEPAGE',
        entityType: 'Homepage',
        entityId: id,
        oldValues: { isDefault: existing.isDefault },
        newValues: { isDefault: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async deleteHomepage(
    id: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getHomepageById(id);

    if (existing.isDefault || existing.status === 'PUBLISHED') {
      const err: any = new Error('Cannot delete a published or default homepage. Please unpublish or archive it first.');
      err.status = 409;
      err.code = 'HOMEPAGE_DELETE_PUBLISHED_FORBIDDEN';
      throw err;
    }

    const deleted = await HomepageRepository.delete(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_DELETED',
        module: 'HOMEPAGE',
        entityType: 'Homepage',
        entityId: id,
        oldValues: { name: existing.name, slug: existing.slug, status: existing.status },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return deleted;
  }

  // ==========================================
  // Section Management
  // ==========================================

  static async createSection(
    homepageId: string,
    input: CreateHomepageSectionInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getHomepageById(homepageId);

    const created = await HomepageRepository.createSection(homepageId, input);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_SECTION_CREATED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: created.id,
        newValues: { homepageId, type: created.type, title: created.title, displayOrder: created.displayOrder },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return created;
  }

  static async getSectionById(homepageId: string, sectionId: string) {
    const section = await HomepageRepository.findSectionById(sectionId, true);
    if (!section || section.homepageId !== homepageId) {
      const err: any = new Error(`Section with ID "${sectionId}" not found for homepage "${homepageId}".`);
      err.status = 404;
      err.code = 'HOMEPAGE_SECTION_NOT_FOUND';
      throw err;
    }
    return section;
  }

  static async listSections(homepageId: string) {
    await this.getHomepageById(homepageId);
    return HomepageRepository.listSections(homepageId, false);
  }

  static async updateSection(
    homepageId: string,
    sectionId: string,
    input: UpdateHomepageSectionInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getSectionById(homepageId, sectionId);

    const updated = await HomepageRepository.updateSection(sectionId, input);

    if (adminUserId) {
      const isVisChanged = input.isVisible !== undefined && input.isVisible !== existing.isVisible;
      const action = isVisChanged ? 'HOMEPAGE_SECTION_VISIBILITY_CHANGED' : 'HOMEPAGE_SECTION_UPDATED';

      await AuditService.log({
        adminUserId,
        action,
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        oldValues: { title: existing.title, isVisible: existing.isVisible, displayOrder: existing.displayOrder },
        newValues: { title: updated.title, isVisible: updated.isVisible, displayOrder: updated.displayOrder },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async deleteSection(
    homepageId: string,
    sectionId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getSectionById(homepageId, sectionId);

    const deleted = await HomepageRepository.deleteSection(sectionId);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_SECTION_DELETED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        oldValues: { type: existing.type, title: existing.title, homepageId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return deleted;
  }

  static async reorderSections(
    homepageId: string,
    items: SectionReorderItem[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getHomepageById(homepageId);

    // Verify all section IDs belong to this homepage
    const sections = await HomepageRepository.listSections(homepageId, false);
    const validSectionIds = new Set(sections.map(s => s.id));

    for (const item of items) {
      if (!validSectionIds.has(item.id)) {
        const err: any = new Error(`Section ID "${item.id}" does not belong to homepage "${homepageId}".`);
        err.status = 400;
        err.code = 'HOMEPAGE_SECTION_MISMATCH';
        throw err;
      }
    }

    await HomepageRepository.bulkReorderSections(items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_SECTION_REORDERED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: homepageId,
        newValues: { count: items.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }

  // ==========================================
  // Section Items Management
  // ==========================================

  static async setSectionProducts(
    homepageId: string,
    sectionId: string,
    rawItems: any[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const normalizedItems: { id: string; displayOrder?: number }[] = rawItems.map((item, idx) => {
      if (typeof item === 'string') return { id: item, displayOrder: idx + 1 };
      return { id: item.id, displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx + 1 };
    });

    // Check duplicates
    const seen = new Set<string>();
    for (const item of normalizedItems) {
      if (seen.has(item.id)) {
        const err: any = new Error(`Duplicate product ID "${item.id}" in section item list.`);
        err.status = 400;
        err.code = 'DUPLICATE_SECTION_ITEM';
        throw err;
      }
      seen.add(item.id);

      // Verify product exists in database
      const prod = await prisma.product.findUnique({ where: { id: item.id } });
      if (!prod) {
        const err: any = new Error(`Product with ID "${item.id}" not found.`);
        err.status = 404;
        err.code = 'PRODUCT_NOT_FOUND';
        throw err;
      }
    }

    await HomepageRepository.replaceSectionProducts(sectionId, normalizedItems);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_PRODUCTS_CHANGED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        newValues: { productCount: normalizedItems.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.getSectionById(homepageId, sectionId);
  }

  static async setSectionCollections(
    homepageId: string,
    sectionId: string,
    rawItems: any[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const normalizedItems: { id: string; displayOrder?: number }[] = rawItems.map((item, idx) => {
      if (typeof item === 'string') return { id: item, displayOrder: idx + 1 };
      return { id: item.id, displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx + 1 };
    });

    const seen = new Set<string>();
    for (const item of normalizedItems) {
      if (seen.has(item.id)) {
        const err: any = new Error(`Duplicate collection ID "${item.id}" in section item list.`);
        err.status = 400;
        err.code = 'DUPLICATE_SECTION_ITEM';
        throw err;
      }
      seen.add(item.id);

      const col = await prisma.collection.findUnique({ where: { id: item.id } });
      if (!col) {
        const err: any = new Error(`Collection with ID "${item.id}" not found.`);
        err.status = 404;
        err.code = 'COLLECTION_NOT_FOUND';
        throw err;
      }
    }

    await HomepageRepository.replaceSectionCollections(sectionId, normalizedItems);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_COLLECTIONS_CHANGED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        newValues: { collectionCount: normalizedItems.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.getSectionById(homepageId, sectionId);
  }

  static async setSectionArtists(
    homepageId: string,
    sectionId: string,
    rawItems: any[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const normalizedItems: { id: string; displayOrder?: number }[] = rawItems.map((item, idx) => {
      if (typeof item === 'string') return { id: item, displayOrder: idx + 1 };
      return { id: item.id, displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx + 1 };
    });

    const seen = new Set<string>();
    for (const item of normalizedItems) {
      if (seen.has(item.id)) {
        const err: any = new Error(`Duplicate artist ID "${item.id}" in section item list.`);
        err.status = 400;
        err.code = 'DUPLICATE_SECTION_ITEM';
        throw err;
      }
      seen.add(item.id);

      const art = await prisma.artist.findUnique({ where: { id: item.id } });
      if (!art) {
        const err: any = new Error(`Artist with ID "${item.id}" not found.`);
        err.status = 404;
        err.code = 'ARTIST_NOT_FOUND';
        throw err;
      }
    }

    await HomepageRepository.replaceSectionArtists(sectionId, normalizedItems);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_ARTISTS_CHANGED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        newValues: { artistCount: normalizedItems.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.getSectionById(homepageId, sectionId);
  }

  static async setSectionCategories(
    homepageId: string,
    sectionId: string,
    rawItems: any[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const normalizedItems: { id: string; displayOrder?: number }[] = rawItems.map((item, idx) => {
      if (typeof item === 'string') return { id: item, displayOrder: idx + 1 };
      return { id: item.id, displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx + 1 };
    });

    const seen = new Set<string>();
    for (const item of normalizedItems) {
      if (seen.has(item.id)) {
        const err: any = new Error(`Duplicate category ID "${item.id}" in section item list.`);
        err.status = 400;
        err.code = 'DUPLICATE_SECTION_ITEM';
        throw err;
      }
      seen.add(item.id);

      const cat = await prisma.category.findUnique({ where: { id: item.id } });
      if (!cat) {
        const err: any = new Error(`Category with ID "${item.id}" not found.`);
        err.status = 404;
        err.code = 'CATEGORY_NOT_FOUND';
        throw err;
      }
    }

    await HomepageRepository.replaceSectionCategories(sectionId, normalizedItems);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_CATEGORIES_CHANGED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSection',
        entityId: sectionId,
        newValues: { categoryCount: normalizedItems.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.getSectionById(homepageId, sectionId);
  }

  // ==========================================
  // Section Media Management
  // ==========================================

  static async attachSectionMedia(
    homepageId: string,
    sectionId: string,
    input: AttachSectionMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const media = await prisma.mediaAsset.findUnique({ where: { id: input.mediaId } });
    if (!media) {
      const err: any = new Error(`Media asset with ID "${input.mediaId}" not found.`);
      err.status = 404;
      err.code = 'MEDIA_NOT_FOUND';
      throw err;
    }

    const role = input.role || 'PRIMARY';
    const displayOrder = input.displayOrder !== undefined ? input.displayOrder : 0;

    const attached = await HomepageRepository.attachSectionMedia(sectionId, input.mediaId, role, displayOrder);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_MEDIA_ATTACHED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSectionMedia',
        entityId: `${sectionId}:${input.mediaId}:${role}`,
        newValues: { sectionId, mediaId: input.mediaId, role, displayOrder },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return attached;
  }

  static async detachSectionMedia(
    homepageId: string,
    sectionId: string,
    mediaId: string,
    role?: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    const existing = await prisma.homepageSectionMedia.findMany({
      where: { sectionId, mediaId }
    });

    if (!existing || existing.length === 0) {
      const err: any = new Error(`Media asset "${mediaId}" is not attached to this section.`);
      err.status = 404;
      err.code = 'MEDIA_NOT_ATTACHED';
      throw err;
    }

    await HomepageRepository.detachSectionMedia(sectionId, mediaId, role);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_MEDIA_DETACHED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSectionMedia',
        entityId: `${sectionId}:${mediaId}`,
        oldValues: { sectionId, mediaId, role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }

  static async reorderSectionMedia(
    homepageId: string,
    sectionId: string,
    items: SectionMediaReorderItem[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    await this.getSectionById(homepageId, sectionId);

    await HomepageRepository.bulkReorderSectionMedia(sectionId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'HOMEPAGE_MEDIA_REORDERED',
        module: 'HOMEPAGE',
        entityType: 'HomepageSectionMedia',
        entityId: sectionId,
        newValues: { count: items.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }
}
