import { prisma } from '../../database/prisma.ts';
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
  JournalPostMediaRole
} from './journal.types.ts';

export class JournalRepository {
  // ==========================================
  // Author Data Access
  // ==========================================

  static async findAuthorById(id: string) {
    return prisma.journalAuthor.findUnique({
      where: { id },
      include: { avatarMedia: true }
    });
  }

  static async findAuthorBySlug(slug: string) {
    return prisma.journalAuthor.findUnique({
      where: { slug },
      include: { avatarMedia: true }
    });
  }

  static async listAuthors(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) where.search = filters.search;

    const [items, total] = await Promise.all([
      prisma.journalAuthor.findMany({
        where,
        include: { avatarMedia: true },
        orderBy: { name: 'asc' },
        take: limit,
        skip
      }),
      prisma.journalAuthor.count({ where })
    ]);

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

  static async createAuthor(data: CreateJournalAuthorDTO) {
    return prisma.journalAuthor.create({
      data,
      include: { avatarMedia: true }
    });
  }

  static async updateAuthor(id: string, data: UpdateJournalAuthorDTO) {
    return prisma.journalAuthor.update({
      where: { id },
      data,
      include: { avatarMedia: true }
    });
  }

  static async deleteAuthor(id: string) {
    return prisma.journalAuthor.delete({
      where: { id }
    });
  }

  static async countPostsByAuthor(authorId: string) {
    return prisma.journalPost.count({
      where: { authorId }
    });
  }

  // ==========================================
  // Category Data Access
  // ==========================================

  static async findCategoryById(id: string) {
    return prisma.journalCategory.findUnique({
      where: { id }
    });
  }

  static async findCategoryBySlug(slug: string) {
    return prisma.journalCategory.findUnique({
      where: { slug }
    });
  }

  static async listCategories(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 50)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) where.search = filters.search;

    const [items, total] = await Promise.all([
      prisma.journalCategory.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        take: limit,
        skip
      }),
      prisma.journalCategory.count({ where })
    ]);

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

  static async createCategory(data: CreateJournalCategoryDTO) {
    return prisma.journalCategory.create({
      data
    });
  }

  static async updateCategory(id: string, data: UpdateJournalCategoryDTO) {
    return prisma.journalCategory.update({
      where: { id },
      data
    });
  }

  static async deleteCategory(id: string) {
    return prisma.journalCategory.delete({
      where: { id }
    });
  }

  static async countPostsByCategory(categoryId: string) {
    return prisma.journalPost.count({
      where: { categoryId }
    });
  }

  static async reorderCategories(items: Array<{ id: string; sortOrder: number }>) {
    for (const item of items) {
      await prisma.journalCategory.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      });
    }
  }

  // ==========================================
  // Tag Data Access
  // ==========================================

  static async findTagById(id: string) {
    return prisma.journalTag.findUnique({
      where: { id }
    });
  }

  static async findTagBySlug(slug: string) {
    return prisma.journalTag.findUnique({
      where: { slug }
    });
  }

  static async listTags(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 50)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) where.search = filters.search;

    const [items, total] = await Promise.all([
      prisma.journalTag.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip
      }),
      prisma.journalTag.count({ where })
    ]);

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

  static async createTag(data: CreateJournalTagDTO) {
    return prisma.journalTag.create({
      data
    });
  }

  static async updateTag(id: string, data: UpdateJournalTagDTO) {
    return prisma.journalTag.update({
      where: { id },
      data
    });
  }

  static async deleteTag(id: string) {
    return prisma.journalTag.delete({
      where: { id }
    });
  }

  // ==========================================
  // Post Data Access
  // ==========================================

  static async findPostById(id: string) {
    return prisma.journalPost.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        tags: true,
        products: true,
        collections: true,
        artists: true,
        sanskritEdits: true,
        relatedPosts: true,
        media: true
      }
    });
  }

  static async findPostBySlug(slug: string) {
    return prisma.journalPost.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
        tags: true,
        products: true,
        collections: true,
        artists: true,
        sanskritEdits: true,
        relatedPosts: true,
        media: true
      }
    });
  }

  static async listPosts(filters: JournalPostQueryFilters = {}) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.featured !== undefined) {
      where.featured = filters.featured === true || filters.featured === 'true';
    }
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tagId) where.tagId = filters.tagId;
    if (filters.tagSlug) where.tagSlug = filters.tagSlug;
    if (filters.search) where.search = filters.search;

    const orderBy: any = {};
    const sortBy = filters.sortBy || 'displayOrder';
    const sortOrder = filters.sortOrder || (sortBy === 'publishedAt' || sortBy === 'createdAt' ? 'desc' : 'asc');
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.journalPost.findMany({
        where,
        include: {
          author: true,
          category: true,
          tags: true,
          media: true
        },
        orderBy,
        take: limit,
        skip
      }),
      prisma.journalPost.count({ where })
    ]);

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

  static async createPost(data: CreateJournalPostDTO) {
    return prisma.journalPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        type: data.type,
        status: data.status,
        featured: data.featured,
        publishedAt: data.publishedAt,
        displayOrder: data.displayOrder,
        authorId: data.authorId,
        categoryId: data.categoryId,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords
      },
      include: {
        author: true,
        category: true,
        tags: true,
        products: true,
        collections: true,
        artists: true,
        sanskritEdits: true,
        relatedPosts: true,
        media: true
      }
    });
  }

  static async updatePost(id: string, data: UpdateJournalPostDTO) {
    return prisma.journalPost.update({
      where: { id },
      data,
      include: {
        author: true,
        category: true,
        tags: true,
        products: true,
        collections: true,
        artists: true,
        sanskritEdits: true,
        relatedPosts: true,
        media: true
      }
    });
  }

  static async deletePost(id: string) {
    return prisma.journalPost.delete({
      where: { id }
    });
  }

  // ==========================================
  // Media Attachments
  // ==========================================

  static async findPostMedia(journalPostId: string, mediaAssetId: string, role: string) {
    return prisma.journalPostMedia.findUnique({
      where: {
        journalPostId_mediaAssetId_role: { journalPostId, mediaAssetId, role }
      },
      include: { media: true }
    });
  }

  static async listPostMedia(journalPostId: string) {
    return prisma.journalPostMedia.findMany({
      where: { journalPostId },
      include: { media: true }
    });
  }

  static async attachPostMedia(journalPostId: string, mediaAssetId: string, role: JournalPostMediaRole = 'GALLERY', sortOrder: number = 0, isPrimary: boolean = false) {
    return prisma.journalPostMedia.create({
      data: {
        journalPostId,
        mediaAssetId,
        role,
        sortOrder,
        isPrimary
      },
      include: { media: true }
    });
  }

  static async updatePostMedia(journalPostId: string, mediaAssetId: string, role: string, data: { sortOrder?: number; isPrimary?: boolean }) {
    return prisma.journalPostMedia.update({
      where: {
        journalPostId_mediaAssetId_role: { journalPostId, mediaAssetId, role }
      },
      data,
      include: { media: true }
    });
  }

  static async clearPrimaryMedia(journalPostId: string, role: string) {
    await prisma.journalPostMedia.updateMany({
      where: { journalPostId, role },
      data: { isPrimary: false }
    });
  }

  static async detachPostMedia(journalPostId: string, mediaAssetId: string, role: string) {
    return prisma.journalPostMedia.delete({
      where: {
        journalPostId_mediaAssetId_role: { journalPostId, mediaAssetId, role }
      }
    });
  }

  // ==========================================
  // Junction Replacements
  // ==========================================

  static async setPostTags(journalPostId: string, tagIds: string[]) {
    await prisma.journalPostTag.deleteMany({ where: { journalPostId } });
    for (const tagId of tagIds) {
      await prisma.journalPostTag.create({
        data: { journalPostId, tagId }
      });
    }
  }

  static async setPostProducts(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>) {
    await prisma.journalPostProduct.deleteMany({ where: { journalPostId } });
    let order = 0;
    for (const item of items) {
      await prisma.journalPostProduct.create({
        data: {
          journalPostId,
          productId: item.id,
          displayOrder: item.displayOrder !== undefined ? item.displayOrder : ++order
        }
      });
    }
  }

  static async setPostCollections(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>) {
    await prisma.journalPostCollection.deleteMany({ where: { journalPostId } });
    let order = 0;
    for (const item of items) {
      await prisma.journalPostCollection.create({
        data: {
          journalPostId,
          collectionId: item.id,
          displayOrder: item.displayOrder !== undefined ? item.displayOrder : ++order
        }
      });
    }
  }

  static async setPostArtists(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>) {
    await prisma.journalPostArtist.deleteMany({ where: { journalPostId } });
    let order = 0;
    for (const item of items) {
      await prisma.journalPostArtist.create({
        data: {
          journalPostId,
          artistId: item.id,
          displayOrder: item.displayOrder !== undefined ? item.displayOrder : ++order
        }
      });
    }
  }

  static async setPostSanskritEdits(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>) {
    await prisma.journalPostSanskritEdit.deleteMany({ where: { journalPostId } });
    let order = 0;
    for (const item of items) {
      await prisma.journalPostSanskritEdit.create({
        data: {
          journalPostId,
          sanskritEditProfileId: item.id,
          displayOrder: item.displayOrder !== undefined ? item.displayOrder : ++order
        }
      });
    }
  }

  static async setPostRelatedPosts(journalPostId: string, items: Array<{ id: string; displayOrder?: number }>) {
    await prisma.journalPostRelatedPost.deleteMany({ where: { journalPostId } });
    let order = 0;
    for (const item of items) {
      if (item.id === journalPostId) continue; // prevent self-reference
      await prisma.journalPostRelatedPost.create({
        data: {
          journalPostId,
          relatedPostId: item.id,
          displayOrder: item.displayOrder !== undefined ? item.displayOrder : ++order
        }
      });
    }
  }
}
