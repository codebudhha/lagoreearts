import { JournalRepository } from './journal.repository.ts';
import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { sanitizeHtmlContent } from './journal.validator.ts';
import type {
  CreateJournalAuthorDTO,
  UpdateJournalAuthorDTO,
  CreateJournalCategoryDTO,
  UpdateJournalCategoryDTO,
  CreateJournalTagDTO,
  UpdateJournalTagDTO,
  CreateJournalPostDTO,
  UpdateJournalPostDTO,
  JournalPostQueryFilters,
  JournalPostMediaRole,
  JournalPostStatus
} from './journal.types.ts';

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

export class JournalService {
  // ==========================================
  // Slug Generators
  // ==========================================

  static async generateUniqueAuthorSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name) || 'author';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.journalAuthor.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  static async generateUniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name) || 'category';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.journalCategory.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  static async generateUniqueTagSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name) || 'tag';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.journalTag.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  static async generateUniquePostSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(title) || 'journal-post';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.journalPost.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  // ==========================================
  // Author Operations
  // ==========================================

  static async listAuthors(filters: { search?: string; status?: string; page?: number; limit?: number }) {
    return JournalRepository.listAuthors(filters);
  }

  static async getAuthorById(id: string) {
    const author = await JournalRepository.findAuthorById(id);
    if (!author) {
      const error: any = new Error(`Author with ID "${id}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_AUTHOR_NOT_FOUND';
      throw error;
    }
    return author;
  }

  static async createAuthor(data: CreateJournalAuthorDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    let slug = data.slug ? slugify(data.slug) : await this.generateUniqueAuthorSlug(data.name);

    const existingSlug = await prisma.journalAuthor.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Slug "${slug}" is already in use by another author.`);
      error.status = 400;
      error.code = 'JOURNAL_SLUG_CONFLICT';
      throw error;
    }

    if (data.avatarMediaId) {
      const media = await prisma.mediaAsset.findUnique({ where: { id: data.avatarMediaId } });
      if (!media) {
        const error: any = new Error(`Avatar media asset with ID "${data.avatarMediaId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_MEDIA_INVALID';
        throw error;
      }
    }

    const sanitizedBio = data.bio ? sanitizeHtmlContent(data.bio) : null;

    const author = await JournalRepository.createAuthor({
      ...data,
      slug,
      bio: sanitizedBio || undefined
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_AUTHOR_CREATED',
        module: 'JOURNAL',
        entityType: 'JournalAuthor',
        entityId: author.id,
        newValues: author,
        ...meta
      });
    }

    return author;
  }

  static async updateAuthor(id: string, data: UpdateJournalAuthorDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getAuthorById(id);

    if (data.slug) {
      const formattedSlug = slugify(data.slug);
      const duplicate = await prisma.journalAuthor.findUnique({ where: { slug: formattedSlug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Slug "${formattedSlug}" is already in use by another author.`);
        error.status = 400;
        error.code = 'JOURNAL_SLUG_CONFLICT';
        throw error;
      }
      data.slug = formattedSlug;
    }

    if (data.avatarMediaId) {
      const media = await prisma.mediaAsset.findUnique({ where: { id: data.avatarMediaId } });
      if (!media) {
        const error: any = new Error(`Avatar media asset with ID "${data.avatarMediaId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_MEDIA_INVALID';
        throw error;
      }
    }

    if (data.bio !== undefined) {
      data.bio = data.bio ? sanitizeHtmlContent(data.bio) : undefined;
    }

    const updated = await JournalRepository.updateAuthor(id, data);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_AUTHOR_UPDATED',
        module: 'JOURNAL',
        entityType: 'JournalAuthor',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ...meta
      });
    }

    return updated;
  }

  static async deleteAuthor(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getAuthorById(id);

    const postCount = await JournalRepository.countPostsByAuthor(id);
    if (postCount > 0) {
      const error: any = new Error(`Cannot delete author "${existing.name}" because they are referenced by ${postCount} journal post(s). Please reassign or delete the posts first.`);
      error.status = 409;
      error.code = 'JOURNAL_AUTHOR_IN_USE';
      throw error;
    }

    const deleted = await JournalRepository.deleteAuthor(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_AUTHOR_DELETED',
        module: 'JOURNAL',
        entityType: 'JournalAuthor',
        entityId: id,
        oldValues: existing,
        ...meta
      });
    }

    return deleted;
  }

  // ==========================================
  // Category Operations
  // ==========================================

  static async listCategories(filters: { search?: string; status?: string; page?: number; limit?: number }) {
    return JournalRepository.listCategories(filters);
  }

  static async getCategoryById(id: string) {
    const category = await JournalRepository.findCategoryById(id);
    if (!category) {
      const error: any = new Error(`Journal category with ID "${id}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_CATEGORY_NOT_FOUND';
      throw error;
    }
    return category;
  }

  static async createCategory(data: CreateJournalCategoryDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    let slug = data.slug ? slugify(data.slug) : await this.generateUniqueCategorySlug(data.name);

    const existingSlug = await prisma.journalCategory.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Slug "${slug}" is already in use by another category.`);
      error.status = 400;
      error.code = 'JOURNAL_SLUG_CONFLICT';
      throw error;
    }

    const sanitizedDescription = data.description ? sanitizeHtmlContent(data.description) : null;

    const category = await JournalRepository.createCategory({
      ...data,
      slug,
      description: sanitizedDescription || undefined
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_CATEGORY_CREATED',
        module: 'JOURNAL',
        entityType: 'JournalCategory',
        entityId: category.id,
        newValues: category,
        ...meta
      });
    }

    return category;
  }

  static async updateCategory(id: string, data: UpdateJournalCategoryDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getCategoryById(id);

    if (data.slug) {
      const formattedSlug = slugify(data.slug);
      const duplicate = await prisma.journalCategory.findUnique({ where: { slug: formattedSlug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Slug "${formattedSlug}" is already in use by another category.`);
        error.status = 400;
        error.code = 'JOURNAL_SLUG_CONFLICT';
        throw error;
      }
      data.slug = formattedSlug;
    }

    if (data.description !== undefined) {
      data.description = data.description ? sanitizeHtmlContent(data.description) : undefined;
    }

    const updated = await JournalRepository.updateCategory(id, data);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_CATEGORY_UPDATED',
        module: 'JOURNAL',
        entityType: 'JournalCategory',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ...meta
      });
    }

    return updated;
  }

  static async deleteCategory(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getCategoryById(id);

    const postCount = await JournalRepository.countPostsByCategory(id);
    if (postCount > 0) {
      const error: any = new Error(`Cannot delete category "${existing.name}" because it is referenced by ${postCount} journal post(s). Please reassign or delete the posts first.`);
      error.status = 409;
      error.code = 'JOURNAL_CATEGORY_IN_USE';
      throw error;
    }

    const deleted = await JournalRepository.deleteCategory(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_CATEGORY_DELETED',
        module: 'JOURNAL',
        entityType: 'JournalCategory',
        entityId: id,
        oldValues: existing,
        ...meta
      });
    }

    return deleted;
  }

  static async reorderCategories(items: Array<{ id: string; sortOrder: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await JournalRepository.reorderCategories(items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_CATEGORY_ORDER_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalCategory',
        entityId: 'BULK_REORDER',
        newValues: items,
        ...meta
      });
    }
  }

  // ==========================================
  // Tag Operations
  // ==========================================

  static async listTags(filters: { search?: string; status?: string; page?: number; limit?: number }) {
    return JournalRepository.listTags(filters);
  }

  static async getTagById(id: string) {
    const tag = await JournalRepository.findTagById(id);
    if (!tag) {
      const error: any = new Error(`Journal tag with ID "${id}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_TAG_NOT_FOUND';
      throw error;
    }
    return tag;
  }

  static async createTag(data: CreateJournalTagDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    let slug = data.slug ? slugify(data.slug) : await this.generateUniqueTagSlug(data.name);

    const existingSlug = await prisma.journalTag.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Slug "${slug}" is already in use by another tag.`);
      error.status = 400;
      error.code = 'JOURNAL_SLUG_CONFLICT';
      throw error;
    }

    const tag = await JournalRepository.createTag({
      ...data,
      slug
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_TAG_CREATED',
        module: 'JOURNAL',
        entityType: 'JournalTag',
        entityId: tag.id,
        newValues: tag,
        ...meta
      });
    }

    return tag;
  }

  static async updateTag(id: string, data: UpdateJournalTagDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getTagById(id);

    if (data.slug) {
      const formattedSlug = slugify(data.slug);
      const duplicate = await prisma.journalTag.findUnique({ where: { slug: formattedSlug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Slug "${formattedSlug}" is already in use by another tag.`);
        error.status = 400;
        error.code = 'JOURNAL_SLUG_CONFLICT';
        throw error;
      }
      data.slug = formattedSlug;
    }

    const updated = await JournalRepository.updateTag(id, data);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_TAG_UPDATED',
        module: 'JOURNAL',
        entityType: 'JournalTag',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ...meta
      });
    }

    return updated;
  }

  static async deleteTag(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getTagById(id);
    const deleted = await JournalRepository.deleteTag(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_TAG_DELETED',
        module: 'JOURNAL',
        entityType: 'JournalTag',
        entityId: id,
        oldValues: existing,
        ...meta
      });
    }

    return deleted;
  }

  // ==========================================
  // Post Operations
  // ==========================================

  static async listPosts(filters: JournalPostQueryFilters) {
    return JournalRepository.listPosts(filters);
  }

  static async getPostById(id: string) {
    const post = await JournalRepository.findPostById(id);
    if (!post) {
      const error: any = new Error(`Journal post with ID "${id}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_POST_NOT_FOUND';
      throw error;
    }
    return post;
  }

  static async getPostBySlug(slug: string) {
    const post = await JournalRepository.findPostBySlug(slug);
    if (!post) {
      const error: any = new Error(`Journal post with slug "${slug}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_POST_NOT_FOUND';
      throw error;
    }
    return post;
  }

  static async createPost(data: CreateJournalPostDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    let slug = data.slug ? slugify(data.slug) : await this.generateUniquePostSlug(data.title);

    const existingSlug = await prisma.journalPost.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Slug "${slug}" is already in use by another post.`);
      error.status = 400;
      error.code = 'JOURNAL_SLUG_CONFLICT';
      throw error;
    }

    if (data.authorId) {
      const author = await prisma.journalAuthor.findUnique({ where: { id: data.authorId } });
      if (!author) {
        const error: any = new Error(`Author with ID "${data.authorId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_AUTHOR_NOT_FOUND';
        throw error;
      }
    }

    if (data.categoryId) {
      const category = await prisma.journalCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        const error: any = new Error(`Category with ID "${data.categoryId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_CATEGORY_NOT_FOUND';
        throw error;
      }
    }

    const sanitizedContent = sanitizeHtmlContent(data.content);
    if (data.status === 'PUBLISHED' && (!sanitizedContent || !sanitizedContent.trim())) {
      const error: any = new Error('Publishing a journal post requires non-empty content.');
      error.status = 400;
      error.code = 'JOURNAL_PUBLISH_VALIDATION_FAILED';
      throw error;
    }

    const sanitizedExcerpt = data.excerpt ? sanitizeHtmlContent(data.excerpt) : null;

    const post = await JournalRepository.createPost({
      ...data,
      slug,
      content: sanitizedContent,
      excerpt: sanitizedExcerpt || undefined
    });

    // Attach initial relations if supplied
    if (data.tags && Array.isArray(data.tags)) {
      await this.setPostTags(post.id, data.tags);
    }
    if (data.products && Array.isArray(data.products)) {
      await this.setPostProducts(post.id, data.products);
    }
    if (data.collections && Array.isArray(data.collections)) {
      await this.setPostCollections(post.id, data.collections);
    }
    if (data.artists && Array.isArray(data.artists)) {
      await this.setPostArtists(post.id, data.artists);
    }
    if (data.sanskritEdits && Array.isArray(data.sanskritEdits)) {
      await this.setPostSanskritEdits(post.id, data.sanskritEdits);
    }
    if (data.relatedPosts && Array.isArray(data.relatedPosts)) {
      await this.setPostRelatedPosts(post.id, data.relatedPosts);
    }

    const finalPost = await this.getPostById(post.id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_CREATED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: post.id,
        newValues: finalPost,
        ...meta
      });
    }

    return finalPost;
  }

  static async updatePost(id: string, data: UpdateJournalPostDTO, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getPostById(id);

    if (data.slug) {
      const formattedSlug = slugify(data.slug);
      const duplicate = await prisma.journalPost.findUnique({ where: { slug: formattedSlug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Slug "${formattedSlug}" is already in use by another post.`);
        error.status = 400;
        error.code = 'JOURNAL_SLUG_CONFLICT';
        throw error;
      }
      data.slug = formattedSlug;
    }

    if (data.authorId) {
      const author = await prisma.journalAuthor.findUnique({ where: { id: data.authorId } });
      if (!author) {
        const error: any = new Error(`Author with ID "${data.authorId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_AUTHOR_NOT_FOUND';
        throw error;
      }
    }

    if (data.categoryId) {
      const category = await prisma.journalCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        const error: any = new Error(`Category with ID "${data.categoryId}" not found.`);
        error.status = 400;
        error.code = 'JOURNAL_CATEGORY_NOT_FOUND';
        throw error;
      }
    }

    if (data.content !== undefined) {
      data.content = sanitizeHtmlContent(data.content);
    }

    if (data.excerpt !== undefined) {
      data.excerpt = data.excerpt ? sanitizeHtmlContent(data.excerpt) : undefined;
    }

    // Status transition & featured rules
    if (data.status === 'PUBLISHED') {
      const finalContent = data.content !== undefined ? data.content : existing.content;
      if (!finalContent || !finalContent.trim()) {
        const error: any = new Error('Publishing a journal post requires non-empty content.');
        error.status = 400;
        error.code = 'JOURNAL_PUBLISH_VALIDATION_FAILED';
        throw error;
      }
      if (!existing.publishedAt && !data.publishedAt) {
        data.publishedAt = new Date();
      }
    } else if (data.status && data.status !== 'PUBLISHED') {
      // Unpublishing / archiving automatically removes featured status
      data.featured = false;
    }

    if (data.featured === true && (data.status === 'DRAFT' || data.status === 'ARCHIVED' || (!data.status && existing.status !== 'PUBLISHED'))) {
      const error: any = new Error('Only published posts can be marked as featured.');
      error.status = 400;
      error.code = 'JOURNAL_PUBLISH_VALIDATION_FAILED';
      throw error;
    }

    const updated = await JournalRepository.updatePost(id, data);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_UPDATED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ...meta
      });
      if (data.status && data.status !== existing.status) {
        await AuditService.log({
          adminUserId,
          action: 'JOURNAL_POST_STATUS_CHANGED',
          module: 'JOURNAL',
          entityType: 'JournalPost',
          entityId: id,
          oldValues: { status: existing.status },
          newValues: { status: data.status },
          ...meta
        });
      }
      if (data.featured !== undefined && data.featured !== existing.featured) {
        await AuditService.log({
          adminUserId,
          action: 'JOURNAL_POST_FEATURED_CHANGED',
          module: 'JOURNAL',
          entityType: 'JournalPost',
          entityId: id,
          oldValues: { featured: existing.featured },
          newValues: { featured: data.featured },
          ...meta
        });
      }
    }

    return updated;
  }

  static async updatePostStatus(id: string, status: JournalPostStatus, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    return this.updatePost(id, { status }, adminUserId, meta);
  }

  static async deletePost(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const existing = await this.getPostById(id);
    const deleted = await JournalRepository.deletePost(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_DELETED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: id,
        oldValues: existing,
        ...meta
      });
    }

    return deleted;
  }

  // ==========================================
  // Media Operations
  // ==========================================

  static async attachPostMedia(journalPostId: string, data: { mediaId: string; role?: JournalPostMediaRole; sortOrder?: number; isPrimary?: boolean }, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const media = await prisma.mediaAsset.findUnique({ where: { id: data.mediaId } });
    if (!media) {
      const error: any = new Error(`Media asset with ID "${data.mediaId}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_MEDIA_INVALID';
      throw error;
    }

    const role = data.role || 'GALLERY';
    const isPrimary = role === 'COVER' || Boolean(data.isPrimary);

    if (isPrimary || role === 'COVER') {
      await JournalRepository.clearPrimaryMedia(journalPostId, role);
    }

    const attached = await JournalRepository.attachPostMedia(
      journalPostId,
      data.mediaId,
      role,
      data.sortOrder !== undefined ? data.sortOrder : 0,
      isPrimary
    );

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_MEDIA_ATTACHED',
        module: 'JOURNAL',
        entityType: 'JournalPostMedia',
        entityId: `${journalPostId}_${data.mediaId}_${role}`,
        newValues: attached,
        ...meta
      });
    }

    return attached;
  }

  static async detachPostMedia(journalPostId: string, mediaId: string, role: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const existing = await JournalRepository.findPostMedia(journalPostId, mediaId, role);
    if (!existing) {
      const error: any = new Error(`Media asset "${mediaId}" with role "${role}" is not attached to this post.`);
      error.status = 404;
      error.code = 'JOURNAL_MEDIA_INVALID';
      throw error;
    }

    const detached = await JournalRepository.detachPostMedia(journalPostId, mediaId, role);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_MEDIA_DETACHED',
        module: 'JOURNAL',
        entityType: 'JournalPostMedia',
        entityId: `${journalPostId}_${mediaId}_${role}`,
        oldValues: existing,
        ...meta
      });
    }

    return detached;
  }

  static async reorderPostMedia(journalPostId: string, items: Array<{ mediaId: string; role: JournalPostMediaRole; sortOrder: number; isPrimary?: boolean }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    for (const item of items) {
      await JournalRepository.updatePostMedia(journalPostId, item.mediaId, item.role, {
        sortOrder: item.sortOrder,
        isPrimary: item.isPrimary
      });
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_MEDIA_ORDER_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }
  }

  // ==========================================
  // Junction Operations
  // ==========================================

  static async setPostTags(journalPostId: string, tagIdentifiers: string[], adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const resolvedTagIds: string[] = [];
    for (const ident of tagIdentifiers) {
      let tag = await prisma.journalTag.findUnique({ where: { id: ident } });
      if (!tag) {
        tag = await prisma.journalTag.findUnique({ where: { slug: ident } });
      }
      if (!tag) {
        const error: any = new Error(`Tag "${ident}" not found.`);
        error.status = 404;
        error.code = 'JOURNAL_TAG_NOT_FOUND';
        throw error;
      }
      if (!resolvedTagIds.includes(tag.id)) {
        resolvedTagIds.push(tag.id);
      }
    }

    await JournalRepository.setPostTags(journalPostId, resolvedTagIds);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_TAGS_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: { tagIds: resolvedTagIds },
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }

  static async setPostProducts(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        const error: any = new Error(`Duplicate product ID "${item.id}" in post relations.`);
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      seen.add(item.id);

      const prod = await prisma.product.findUnique({ where: { id: item.id } });
      if (!prod) {
        const error: any = new Error(`Product with ID "${item.id}" not found.`);
        error.status = 404;
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
      }
    }

    await JournalRepository.setPostProducts(journalPostId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_PRODUCTS_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }

  static async setPostCollections(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        const error: any = new Error(`Duplicate collection ID "${item.id}" in post relations.`);
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      seen.add(item.id);

      const col = await prisma.collection.findUnique({ where: { id: item.id } });
      if (!col) {
        const error: any = new Error(`Collection with ID "${item.id}" not found.`);
        error.status = 404;
        error.code = 'COLLECTION_NOT_FOUND';
        throw error;
      }
    }

    await JournalRepository.setPostCollections(journalPostId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_COLLECTIONS_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }

  static async setPostArtists(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        const error: any = new Error(`Duplicate artist ID "${item.id}" in post relations.`);
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      seen.add(item.id);

      const artist = await prisma.artist.findUnique({ where: { id: item.id } });
      if (!artist) {
        const error: any = new Error(`Artist with ID "${item.id}" not found.`);
        error.status = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }
    }

    await JournalRepository.setPostArtists(journalPostId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_ARTISTS_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }

  static async setPostSanskritEdits(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        const error: any = new Error(`Duplicate Sanskrit Edit profile ID "${item.id}" in post relations.`);
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      seen.add(item.id);

      const profile = await prisma.sanskritEditProfile.findUnique({ where: { id: item.id } });
      if (!profile) {
        const error: any = new Error(`Sanskrit Edit profile with ID "${item.id}" not found.`);
        error.status = 404;
        error.code = 'SANSKRIT_EDIT_NOT_FOUND';
        throw error;
      }
    }

    await JournalRepository.setPostSanskritEdits(journalPostId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_SANSKRIT_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }

  static async setPostRelatedPosts(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    await this.getPostById(journalPostId);

    const seen = new Set<string>();
    for (const item of items) {
      if (item.id === journalPostId) {
        const error: any = new Error('A journal post cannot relate to itself.');
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      if (seen.has(item.id)) {
        const error: any = new Error(`Duplicate related post ID "${item.id}" in relations.`);
        error.status = 400;
        error.code = 'JOURNAL_RELATION_INVALID';
        throw error;
      }
      seen.add(item.id);

      const relPost = await prisma.journalPost.findUnique({ where: { id: item.id } });
      if (!relPost) {
        const error: any = new Error(`Related journal post with ID "${item.id}" not found.`);
        error.status = 404;
        error.code = 'JOURNAL_POST_NOT_FOUND';
        throw error;
      }
    }

    await JournalRepository.setPostRelatedPosts(journalPostId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'JOURNAL_POST_RELATED_CHANGED',
        module: 'JOURNAL',
        entityType: 'JournalPost',
        entityId: journalPostId,
        newValues: items,
        ...meta
      });
    }

    return this.getPostById(journalPostId);
  }
}
