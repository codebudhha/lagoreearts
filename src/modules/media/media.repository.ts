import { prisma } from '../../database/prisma.ts';
import type { MediaFilterQuery, MediaRole } from './media.types.ts';

export class MediaRepository {
  /* ========================================================================
   * FOLDER OPERATIONS
   * ======================================================================== */

  static async findFolderById(id: string, include?: any) {
    return prisma.mediaFolder.findUnique({
      where: { id },
      include: include || { parent: true, children: true }
    });
  }

  static async findFolderByParentAndSlug(parentId: string | null, slug: string) {
    return prisma.mediaFolder.findUnique({
      where: {
        parentId_slug: { parentId, slug }
      }
    });
  }

  static async findFolderBySlug(slug: string) {
    return prisma.mediaFolder.findFirst({
      where: { slug }
    });
  }

  static async findFolders(search?: string) {
    return prisma.mediaFolder.findMany({
      where: search ? { search } : {},
      include: { children: true }
    });
  }

  static async countFolderChildren(parentId: string) {
    return prisma.mediaFolder.count({
      where: { parentId }
    });
  }

  static async countFolderAssets(folderId: string) {
    return prisma.mediaAsset.count({
      where: { folderId }
    });
  }

  static async createFolder(data: { name: string; slug: string; parentId?: string | null }) {
    return prisma.mediaFolder.create({
      data,
      include: { parent: true, children: true }
    });
  }

  static async updateFolder(id: string, data: { name?: string; slug?: string; parentId?: string | null }) {
    return prisma.mediaFolder.update({
      where: { id },
      data,
      include: { parent: true, children: true }
    });
  }

  static async deleteFolder(id: string) {
    return prisma.mediaFolder.delete({
      where: { id }
    });
  }

  /* ========================================================================
   * ASSET OPERATIONS
   * ======================================================================== */

  static async findAssetById(id: string, include?: any) {
    return prisma.mediaAsset.findUnique({
      where: { id },
      include: include || { folder: true }
    });
  }

  static async findAssetByStorageKey(storageKey: string) {
    return prisma.mediaAsset.findUnique({
      where: { storageKey }
    });
  }

  static async findAssetByChecksum(checksum: string) {
    return prisma.mediaAsset.findFirst({
      where: { checksum }
    });
  }

  static async listAssets(query: MediaFilterQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.folderId !== undefined) {
      where.folderId = query.folderId === 'null' || query.folderId === '' ? null : query.folderId;
    }
    if (query.mimeType) where.mimeType = query.mimeType;
    if (query.mediaType) where.mediaType = query.mediaType;
    if (query.search) where.search = query.search.trim();
    if (query.isOrphan) where.isOrphan = true;

    const orderBy: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        include: { folder: true },
        orderBy,
        take: limit,
        skip
      }),
      prisma.mediaAsset.count({ where })
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async createAsset(data: {
    filename: string;
    originalFilename: string;
    storageKey: string;
    publicUrl: string;
    mimeType: string;
    mediaType?: 'IMAGE';
    fileSize: number;
    width?: number | null;
    height?: number | null;
    checksum: string;
    title?: string | null;
    altText?: string | null;
    caption?: string | null;
    folderId?: string | null;
  }) {
    return prisma.mediaAsset.create({
      data,
      include: { folder: true }
    });
  }

  static async updateAsset(id: string, data: {
    title?: string | null;
    altText?: string | null;
    caption?: string | null;
    folderId?: string | null;
  }) {
    return prisma.mediaAsset.update({
      where: { id },
      data,
      include: { folder: true }
    });
  }

  static async deleteAsset(id: string) {
    return prisma.mediaAsset.delete({
      where: { id }
    });
  }

  static async countAssetUsage(mediaId: string): Promise<number> {
    const [pCount, vCount, catCount, colCount] = await Promise.all([
      prisma.productMedia.findMany({ where: { mediaId } }),
      prisma.productVariantMedia.findMany({ where: { mediaId } }),
      prisma.categoryMedia.findMany({ where: { mediaId } }),
      prisma.collectionMedia.findMany({ where: { mediaId } })
    ]);

    return pCount.length + vCount.length + catCount.length + colCount.length;
  }

  /* ========================================================================
   * PRODUCT MEDIA
   * ======================================================================== */

  static async findProductMedia(productId: string) {
    return prisma.productMedia.findMany({
      where: { productId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async findProductMediaItem(productId: string, mediaId: string) {
    return prisma.productMedia.findUnique({
      where: { productId_mediaId: { productId, mediaId } },
      include: { media: true }
    });
  }

  static async unsetPrimaryProductMedia(productId: string) {
    return prisma.productMedia.updateMany({
      where: { productId },
      data: { isPrimary: false }
    });
  }

  static async attachProductMedia(productId: string, data: {
    mediaId: string;
    sortOrder?: number;
    isPrimary?: boolean;
    role?: MediaRole;
  }) {
    return prisma.productMedia.create({
      data: {
        productId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder || 0,
        isPrimary: Boolean(data.isPrimary),
        role: data.role || 'GALLERY'
      },
      include: { media: true }
    });
  }

  static async detachProductMedia(productId: string, mediaId: string) {
    return prisma.productMedia.delete({
      where: { productId_mediaId: { productId, mediaId } }
    });
  }

  static async updateProductMediaOrder(productId: string, mediaId: string, sortOrder: number) {
    return prisma.productMedia.update({
      where: { productId_mediaId: { productId, mediaId } },
      data: { sortOrder }
    });
  }

  /* ========================================================================
   * VARIANT MEDIA
   * ======================================================================== */

  static async findVariantMedia(variantId: string) {
    return prisma.productVariantMedia.findMany({
      where: { variantId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async findVariantMediaItem(variantId: string, mediaId: string) {
    return prisma.productVariantMedia.findUnique({
      where: { variantId_mediaId: { variantId, mediaId } },
      include: { media: true }
    });
  }

  static async unsetPrimaryVariantMedia(variantId: string) {
    return prisma.productVariantMedia.updateMany({
      where: { variantId },
      data: { isPrimary: false }
    });
  }

  static async attachVariantMedia(variantId: string, data: {
    mediaId: string;
    sortOrder?: number;
    isPrimary?: boolean;
    role?: MediaRole;
  }) {
    return prisma.productVariantMedia.create({
      data: {
        variantId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder || 0,
        isPrimary: Boolean(data.isPrimary),
        role: data.role || 'GALLERY'
      },
      include: { media: true }
    });
  }

  static async detachVariantMedia(variantId: string, mediaId: string) {
    return prisma.productVariantMedia.delete({
      where: { variantId_mediaId: { variantId, mediaId } }
    });
  }

  static async updateVariantMediaOrder(variantId: string, mediaId: string, sortOrder: number) {
    return prisma.productVariantMedia.update({
      where: { variantId_mediaId: { variantId, mediaId } },
      data: { sortOrder }
    });
  }

  /* ========================================================================
   * CATEGORY MEDIA
   * ======================================================================== */

  static async findCategoryMedia(categoryId: string) {
    return prisma.categoryMedia.findMany({
      where: { categoryId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async findCategoryMediaItem(categoryId: string, mediaId: string) {
    return prisma.categoryMedia.findUnique({
      where: { categoryId_mediaId: { categoryId, mediaId } },
      include: { media: true }
    });
  }

  static async unsetPrimaryCategoryMedia(categoryId: string) {
    return prisma.categoryMedia.updateMany({
      where: { categoryId },
      data: { isPrimary: false }
    });
  }

  static async attachCategoryMedia(categoryId: string, data: {
    mediaId: string;
    sortOrder?: number;
    isPrimary?: boolean;
    role?: MediaRole;
  }) {
    return prisma.categoryMedia.create({
      data: {
        categoryId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder || 0,
        isPrimary: Boolean(data.isPrimary),
        role: data.role || 'PRIMARY'
      },
      include: { media: true }
    });
  }

  static async detachCategoryMedia(categoryId: string, mediaId: string) {
    return prisma.categoryMedia.delete({
      where: { categoryId_mediaId: { categoryId, mediaId } }
    });
  }

  static async updateCategoryMediaOrder(categoryId: string, mediaId: string, sortOrder: number) {
    return prisma.categoryMedia.update({
      where: { categoryId_mediaId: { categoryId, mediaId } },
      data: { sortOrder }
    });
  }

  /* ========================================================================
   * COLLECTION MEDIA
   * ======================================================================== */

  static async findCollectionMedia(collectionId: string) {
    return prisma.collectionMedia.findMany({
      where: { collectionId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async findCollectionMediaItem(collectionId: string, mediaId: string) {
    return prisma.collectionMedia.findUnique({
      where: { collectionId_mediaId: { collectionId, mediaId } },
      include: { media: true }
    });
  }

  static async unsetPrimaryCollectionMedia(collectionId: string) {
    return prisma.collectionMedia.updateMany({
      where: { collectionId },
      data: { isPrimary: false }
    });
  }

  static async attachCollectionMedia(collectionId: string, data: {
    mediaId: string;
    sortOrder?: number;
    isPrimary?: boolean;
    role?: MediaRole;
  }) {
    return prisma.collectionMedia.create({
      data: {
        collectionId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder || 0,
        isPrimary: Boolean(data.isPrimary),
        role: data.role || 'PRIMARY'
      },
      include: { media: true }
    });
  }

  static async detachCollectionMedia(collectionId: string, mediaId: string) {
    return prisma.collectionMedia.delete({
      where: { collectionId_mediaId: { collectionId, mediaId } }
    });
  }

  static async updateCollectionMediaOrder(collectionId: string, mediaId: string, sortOrder: number) {
    return prisma.collectionMedia.update({
      where: { collectionId_mediaId: { collectionId, mediaId } },
      data: { sortOrder }
    });
  }
}
