import { LookbookRepository } from './lookbook.repository.ts';
import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { sanitizeHtml } from './lookbook.validator.ts';
import type {
  CreateLookbookDTO,
  UpdateLookbookDTO,
  LookbookQueryFilter,
  CreateLookbookSectionDTO,
  UpdateLookbookSectionDTO,
  LookbookStatus,
  LookbookSectionMediaRole
} from './lookbook.types.ts';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class LookbookService {
  // ==========================================
  // Slug Generator
  // ==========================================

  static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(title) || 'lookbook';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.lookbook.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  // ==========================================
  // Lookbook Lifecycle & Management
  // ==========================================

  static async getLookbookById(id: string) {
    const lookbook = await LookbookRepository.findById(id);
    if (!lookbook) {
      const error: any = new Error('Lookbook not found');
      error.statusCode = 404;
      error.code = 'LOOKBOOK_NOT_FOUND';
      throw error;
    }
    return lookbook;
  }

  static async listLookbooks(query: LookbookQueryFilter) {
    return LookbookRepository.list(query, false);
  }

  static async createLookbook(dto: CreateLookbookDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    let slug = dto.slug ? slugify(dto.slug) : await this.generateUniqueSlug(dto.title);

    const existingSlug = await prisma.lookbook.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Lookbook with slug "${slug}" already exists`);
      error.statusCode = 409;
      error.code = 'LOOKBOOK_SLUG_EXISTS';
      throw error;
    }

    const status: LookbookStatus = dto.status || 'DRAFT';
    if (dto.featured && status !== 'PUBLISHED') {
      const error: any = new Error('Only published lookbooks can be featured');
      error.statusCode = 400;
      error.code = 'LOOKBOOK_FEATURED_REQUIRES_PUBLISHED';
      throw error;
    }

    if (dto.coverMediaId) {
      const media = await prisma.mediaAsset.findUnique({ where: { id: dto.coverMediaId } });
      if (!media) {
        const error: any = new Error('Cover media asset not found');
        error.statusCode = 404;
        error.code = 'MEDIA_NOT_FOUND';
        throw error;
      }
    }

    let publishedAt: Date | undefined = undefined;
    if (status === 'PUBLISHED') {
      publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
    }

    const lookbook = await LookbookRepository.create({
      ...dto,
      slug,
      status,
      featured: dto.featured || false,
      publishedAt,
      description: sanitizeHtml(dto.description) || undefined,
      shortDescription: sanitizeHtml(dto.shortDescription) || undefined
    });

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_CREATED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK',
        entityId: lookbook.id,
        newValues: lookbook,
        ipAddress,
        userAgent
      });
    }

    return lookbook;
  }

  static async updateLookbook(id: string, dto: UpdateLookbookDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.getLookbookById(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = slugify(dto.slug);
      const duplicate = await prisma.lookbook.findUnique({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Lookbook with slug "${slug}" already exists`);
        error.statusCode = 409;
        error.code = 'LOOKBOOK_SLUG_EXISTS';
        throw error;
      }
    }

    const nextStatus: LookbookStatus = dto.status !== undefined ? dto.status : existing.status;
    let nextFeatured: boolean = dto.featured !== undefined ? dto.featured : existing.featured;

    // Invariant: Unpublishing/Archiving resets featured to false
    if (nextStatus !== 'PUBLISHED' && nextFeatured) {
      if (dto.featured === true) {
        const error: any = new Error('Only published lookbooks can be featured');
        error.statusCode = 400;
        error.code = 'LOOKBOOK_FEATURED_REQUIRES_PUBLISHED';
        throw error;
      }
      nextFeatured = false;
    }

    if (dto.coverMediaId) {
      const media = await prisma.mediaAsset.findUnique({ where: { id: dto.coverMediaId } });
      if (!media) {
        const error: any = new Error('Cover media asset not found');
        error.statusCode = 404;
        error.code = 'MEDIA_NOT_FOUND';
        throw error;
      }
    }

    let publishedAt = existing.publishedAt;
    if (nextStatus === 'PUBLISHED') {
      if (dto.publishedAt !== undefined) {
        publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
      } else if (!existing.publishedAt) {
        publishedAt = new Date();
      }
    } else {
      if (dto.publishedAt !== undefined) {
        publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
      }
    }

    const updated = await LookbookRepository.update(id, {
      ...dto,
      slug,
      status: nextStatus,
      featured: nextFeatured,
      publishedAt,
      description: dto.description !== undefined ? sanitizeHtml(dto.description) || undefined : undefined,
      shortDescription: dto.shortDescription !== undefined ? sanitizeHtml(dto.shortDescription) || undefined : undefined
    });

    if (userId) {
      const isStatusChanged = existing.status !== nextStatus;
      const isFeaturedChanged = existing.featured !== nextFeatured;

      let primaryAction = 'LOOKBOOK_UPDATED';
      if (isStatusChanged) {
        if (nextStatus === 'PUBLISHED') primaryAction = 'LOOKBOOK_PUBLISHED';
        else if (nextStatus === 'ARCHIVED') primaryAction = 'LOOKBOOK_ARCHIVED';
        else primaryAction = 'LOOKBOOK_UNPUBLISHED';
      } else if (isFeaturedChanged) {
        primaryAction = 'LOOKBOOK_FEATURED_CHANGED';
      }

      AuditService.log({
        adminUserId: userId,
        action: primaryAction,
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async deleteLookbook(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.getLookbookById(id);

    if (existing.status === 'PUBLISHED') {
      const error: any = new Error('Published lookbooks cannot be deleted. Please unpublish or archive first.');
      error.statusCode = 409;
      error.code = 'LOOKBOOK_DELETE_PUBLISHED_FORBIDDEN';
      throw error;
    }

    const deleted = await LookbookRepository.delete(id);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_DELETED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK',
        entityId: id,
        oldValues: existing,
        ipAddress,
        userAgent
      });
    }

    return deleted;
  }

  static async publishLookbook(id: string, publishedAt?: string | Date, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.updateLookbook(
      id,
      {
        status: 'PUBLISHED',
        publishedAt: publishedAt || new Date()
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  static async unpublishLookbook(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.updateLookbook(
      id,
      {
        status: 'DRAFT',
        featured: false
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  static async archiveLookbook(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.updateLookbook(
      id,
      {
        status: 'ARCHIVED',
        featured: false
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  static async duplicateLookbook(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const source = await this.getLookbookById(id);

    const baseTitle = `${source.title} (Copy)`;
    const newSlug = await this.generateUniqueSlug(baseTitle);

    const created = await LookbookRepository.create({
      title: baseTitle,
      slug: newSlug,
      shortDescription: source.shortDescription,
      description: source.description,
      status: 'DRAFT',
      featured: false,
      coverMediaId: source.coverMediaId,
      displayOrder: source.displayOrder + 1,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      seoKeywords: source.seoKeywords
    });

    if (source.sections && source.sections.length > 0) {
      for (const section of source.sections) {
        const newSec = await LookbookRepository.createSection(created.id, {
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          body: section.body,
          ctaLabel: section.ctaLabel,
          ctaUrl: section.ctaUrl,
          displayOrder: section.displayOrder,
          isVisible: section.isVisible,
          layout: section.layout,
          config: section.config
        });

        if (section.products?.length) {
          await LookbookRepository.setSectionProducts(
            newSec.id,
            section.products.map((p: any) => ({ id: p.productId, displayOrder: p.displayOrder }))
          );
        }
        if (section.collections?.length) {
          await LookbookRepository.setSectionCollections(
            newSec.id,
            section.collections.map((c: any) => ({ id: c.collectionId, displayOrder: c.displayOrder }))
          );
        }
        if (section.artists?.length) {
          await LookbookRepository.setSectionArtists(
            newSec.id,
            section.artists.map((a: any) => ({ id: a.artistId, displayOrder: a.displayOrder }))
          );
        }
        if (section.categories?.length) {
          await LookbookRepository.setSectionCategories(
            newSec.id,
            section.categories.map((k: any) => ({ id: k.categoryId, displayOrder: k.displayOrder }))
          );
        }
        if (section.journals?.length) {
          await LookbookRepository.setSectionJournals(
            newSec.id,
            section.journals.map((j: any) => ({ id: j.journalPostId, displayOrder: j.displayOrder }))
          );
        }
        if (section.sanskritEdits?.length) {
          await LookbookRepository.setSectionSanskritEdits(
            newSec.id,
            section.sanskritEdits.map((s: any) => ({ id: s.sanskritEditProfileId, displayOrder: s.displayOrder }))
          );
        }
        if (section.media?.length) {
          for (const m of section.media) {
            await LookbookRepository.attachSectionMedia(newSec.id, m.mediaAssetId, m.role, m.sortOrder, m.isPrimary);
          }
        }
      }
    }

    const fullCopy = await this.getLookbookById(created.id);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_CREATED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK',
        entityId: fullCopy.id,
        newValues: { duplicatedFrom: id, ...fullCopy },
        ipAddress,
        userAgent
      });
    }

    return fullCopy;
  }

  // ==========================================
  // Section Operations
  // ==========================================

  static async getSectionById(id: string) {
    const section = await LookbookRepository.findSectionById(id);
    if (!section) {
      const error: any = new Error('Lookbook section not found');
      error.statusCode = 404;
      error.code = 'LOOKBOOK_SECTION_NOT_FOUND';
      throw error;
    }
    return section;
  }

  static async createSection(lookbookId: string, dto: CreateLookbookSectionDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    await this.getLookbookById(lookbookId);

    const section = await LookbookRepository.createSection(lookbookId, {
      ...dto,
      body: sanitizeHtml(dto.body) || undefined
    });

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_SECTION_CREATED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: section.id,
        newValues: section,
        ipAddress,
        userAgent
      });
    }

    return section;
  }

  static async updateSection(id: string, dto: UpdateLookbookSectionDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.getSectionById(id);

    const updated = await LookbookRepository.updateSection(id, {
      ...dto,
      body: dto.body !== undefined ? sanitizeHtml(dto.body) || undefined : undefined
    });

    if (userId) {
      const isVisibilityChanged = dto.isVisible !== undefined && dto.isVisible !== existing.isVisible;
      AuditService.log({
        adminUserId: userId,
        action: isVisibilityChanged ? 'LOOKBOOK_SECTION_VISIBILITY_CHANGED' : 'LOOKBOOK_SECTION_UPDATED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async deleteSection(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.getSectionById(id);
    const deleted = await LookbookRepository.deleteSection(id);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_SECTION_DELETED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: id,
        oldValues: existing,
        ipAddress,
        userAgent
      });
    }

    return deleted;
  }

  static async reorderSections(
    lookbookId: string,
    items: Array<{ id: string; displayOrder: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getLookbookById(lookbookId);

    const sections = await LookbookRepository.reorderSections(lookbookId, items);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_SECTION_REORDERED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK',
        entityId: lookbookId,
        newValues: { reorderedSections: items },
        ipAddress,
        userAgent
      });
    }

    return sections;
  }

  // ==========================================
  // Section Entity Relationships
  // ==========================================

  static async setSectionProducts(
    sectionId: string,
    products: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const p of products) {
      const exists = await prisma.product.findUnique({ where: { id: p.id } });
      if (!exists) {
        const error: any = new Error(`Product with ID "${p.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionProducts(sectionId, products);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_PRODUCTS_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { products },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async setSectionCollections(
    sectionId: string,
    collections: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const c of collections) {
      const exists = await prisma.collection.findUnique({ where: { id: c.id } });
      if (!exists) {
        const error: any = new Error(`Collection with ID "${c.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'COLLECTION_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionCollections(sectionId, collections);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_COLLECTIONS_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { collections },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async setSectionArtists(
    sectionId: string,
    artists: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const a of artists) {
      const exists = await prisma.artist.findUnique({ where: { id: a.id } });
      if (!exists) {
        const error: any = new Error(`Artist with ID "${a.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionArtists(sectionId, artists);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_ARTISTS_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { artists },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async setSectionCategories(
    sectionId: string,
    categories: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const cat of categories) {
      const exists = await prisma.category.findUnique({ where: { id: cat.id } });
      if (!exists) {
        const error: any = new Error(`Category with ID "${cat.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'CATEGORY_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionCategories(sectionId, categories);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_CATEGORIES_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { categories },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async setSectionJournals(
    sectionId: string,
    journals: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const j of journals) {
      const exists = await prisma.journalPost.findUnique({ where: { id: j.id } });
      if (!exists) {
        const error: any = new Error(`Journal post with ID "${j.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'JOURNAL_POST_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionJournals(sectionId, journals);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_JOURNAL_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { journals },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async setSectionSanskritEdits(
    sectionId: string,
    sanskritEdits: Array<{ id: string; displayOrder?: number }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    for (const s of sanskritEdits) {
      const exists = await prisma.sanskritEditProfile.findUnique({ where: { id: s.id } });
      if (!exists) {
        const error: any = new Error(`Sanskrit Edit profile with ID "${s.id}" does not exist`);
        error.statusCode = 404;
        error.code = 'SANSKRIT_EDIT_NOT_FOUND';
        throw error;
      }
    }

    const updated = await LookbookRepository.setSectionSanskritEdits(sectionId, sanskritEdits);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_SANSKRIT_EDIT_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { sanskritEdits },
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  // ==========================================
  // Section Media Operations
  // ==========================================

  static async attachSectionMedia(
    sectionId: string,
    mediaAssetId: string,
    role: LookbookSectionMediaRole = 'GALLERY',
    sortOrder?: number,
    isPrimary: boolean = false,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    const media = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
    if (!media) {
      const error: any = new Error('Media asset not found');
      error.statusCode = 404;
      error.code = 'MEDIA_NOT_FOUND';
      throw error;
    }

    const attached = await LookbookRepository.attachSectionMedia(sectionId, mediaAssetId, role, sortOrder, isPrimary);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_MEDIA_ATTACHED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: attached,
        ipAddress,
        userAgent
      });
    }

    return attached;
  }

  static async detachSectionMedia(
    sectionId: string,
    mediaAssetId: string,
    role: LookbookSectionMediaRole,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    const existingMedia = prisma.lookbookSectionMedia.findUnique({
      where: {
        lookbookSectionId_mediaAssetId_role: {
          lookbookSectionId: sectionId,
          mediaAssetId,
          role
        }
      }
    });

    if (!existingMedia) {
      const error: any = new Error('Media attachment not found on this section');
      error.statusCode = 404;
      error.code = 'LOOKBOOK_MEDIA_NOT_FOUND';
      throw error;
    }

    const detached = await LookbookRepository.detachSectionMedia(sectionId, mediaAssetId, role);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_MEDIA_DETACHED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        oldValues: { mediaAssetId, role },
        ipAddress,
        userAgent
      });
    }

    return detached;
  }

  static async reorderSectionMedia(
    sectionId: string,
    items: Array<{ mediaId: string; role: LookbookSectionMediaRole; sortOrder: number; isPrimary?: boolean }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    const reordered = await LookbookRepository.reorderSectionMedia(sectionId, items);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_MEDIA_REORDERED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { reorderedMedia: items },
        ipAddress,
        userAgent
      });
    }

    return reordered;
  }

  static async setSectionPrimaryMedia(
    sectionId: string,
    mediaAssetId: string,
    role: LookbookSectionMediaRole,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getSectionById(sectionId);

    const media = await LookbookRepository.setSectionPrimaryMedia(sectionId, mediaAssetId, role);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'LOOKBOOK_MEDIA_PRIMARY_CHANGED',
        module: 'LOOKBOOK',
        entityType: 'LOOKBOOK_SECTION',
        entityId: sectionId,
        newValues: { primaryMediaId: mediaAssetId, role },
        ipAddress,
        userAgent
      });
    }

    return media;
  }
}
