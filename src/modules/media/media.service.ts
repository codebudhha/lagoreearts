import { MediaRepository } from './media.repository.ts';
import { ImageMetadataService } from './image-metadata.service.ts';
import { defaultStorageProvider } from './storage/local-storage.provider.ts';
import type { StorageProvider } from './storage/storage.interface.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { ENV } from '../../config/env.ts';
import { prisma } from '../../database/prisma.ts';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MediaFolderResponse,
  UploadMediaInput,
  UpdateMediaInput,
  MediaFilterQuery,
  MediaAssetResponse,
  AttachEntityMediaInput,
  ReorderEntityMediaInput,
  PublicMediaItem
} from './media.types.ts';

export class MediaService {
  private static storageProvider: StorageProvider = defaultStorageProvider;

  /**
   * Set custom storage provider (e.g. for S3 or tests)
   */
  static setStorageProvider(provider: StorageProvider) {
    this.storageProvider = provider;
  }

  /**
   * Slugify helper
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* ========================================================================
   * FOLDER OPERATIONS
   * ======================================================================== */

  static async createFolder(input: CreateFolderInput, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const name = input.name.trim();
    const slug = input.slug ? this.slugify(input.slug) : this.slugify(name);
    const parentId = input.parentId || null;

    if (parentId) {
      const parent = await MediaRepository.findFolderById(parentId);
      if (!parent) {
        throw { status: 400, code: 'INVALID_PARENT_FOLDER', message: 'Specified parent folder does not exist' };
      }
    }

    const existing = await MediaRepository.findFolderByParentAndSlug(parentId, slug);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_FOLDER_SLUG', message: `A folder with slug "${slug}" already exists at this level` };
    }

    const folder = await MediaRepository.createFolder({ name, slug, parentId });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_FOLDER_CREATED',
        module: 'media',
        entityType: 'MediaFolder',
        entityId: folder.id,
        newValues: { name: folder.name, slug: folder.slug, parentId: folder.parentId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return folder;
  }

  static async updateFolder(id: string, input: UpdateFolderInput, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const folder = await MediaRepository.findFolderById(id);
    if (!folder) {
      throw { status: 404, code: 'MEDIA_FOLDER_NOT_FOUND', message: 'Media folder not found' };
    }

    const name = input.name !== undefined ? input.name.trim() : folder.name;
    const slug = input.slug !== undefined ? this.slugify(input.slug) : folder.slug;
    const parentId = input.parentId !== undefined ? (input.parentId || null) : folder.parentId;

    // Check self-parenting
    if (parentId === id) {
      throw { status: 400, code: 'CIRCULAR_FOLDER_HIERARCHY', message: 'A folder cannot be its own parent' };
    }

    // Check circular loop
    if (parentId) {
      let currentParentId: string | null = parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          throw { status: 400, code: 'CIRCULAR_FOLDER_HIERARCHY', message: 'Cannot assign a folder as a child of its own descendant' };
        }
        const parentFolder: any = await MediaRepository.findFolderById(currentParentId);
        currentParentId = parentFolder?.parentId || null;
      }
    }

    if (slug !== folder.slug || parentId !== folder.parentId) {
      const existing = await MediaRepository.findFolderByParentAndSlug(parentId, slug);
      if (existing && existing.id !== id) {
        throw { status: 400, code: 'DUPLICATE_FOLDER_SLUG', message: `A folder with slug "${slug}" already exists at this level` };
      }
    }

    const updated = await MediaRepository.updateFolder(id, { name, slug, parentId });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_FOLDER_UPDATED',
        module: 'media',
        entityType: 'MediaFolder',
        entityId: id,
        oldValues: { name: folder.name, slug: folder.slug, parentId: folder.parentId },
        newValues: { name: updated.name, slug: updated.slug, parentId: updated.parentId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async deleteFolder(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const folder = await MediaRepository.findFolderById(id);
    if (!folder) {
      throw { status: 404, code: 'MEDIA_FOLDER_NOT_FOUND', message: 'Media folder not found' };
    }

    const childrenCount = await MediaRepository.countFolderChildren(id);
    if (childrenCount > 0) {
      throw { status: 409, code: 'MEDIA_FOLDER_HAS_CHILDREN', message: 'Cannot delete folder containing subfolders' };
    }

    const assetsCount = await MediaRepository.countFolderAssets(id);
    if (assetsCount > 0) {
      throw { status: 409, code: 'MEDIA_FOLDER_NOT_EMPTY', message: 'Cannot delete folder containing media assets' };
    }

    const deleted = await MediaRepository.deleteFolder(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_FOLDER_DELETED',
        module: 'media',
        entityType: 'MediaFolder',
        entityId: id,
        oldValues: { name: folder.name, slug: folder.slug, parentId: folder.parentId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return deleted;
  }

  static async getFolder(id: string) {
    const folder = await MediaRepository.findFolderById(id);
    if (!folder) {
      throw { status: 404, code: 'MEDIA_FOLDER_NOT_FOUND', message: 'Media folder not found' };
    }
    return folder;
  }

  static async listFolders(search?: string) {
    return MediaRepository.findFolders(search);
  }

  /* ========================================================================
   * MEDIA ASSET OPERATIONS
   * ======================================================================== */

  static async uploadMedia(
    fileBuffer: Buffer,
    originalFilename: string,
    input: UploadMediaInput = {},
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<MediaAssetResponse> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw { status: 400, code: 'MEDIA_EMPTY_FILE', message: 'Uploaded file cannot be empty' };
    }

    if (fileBuffer.length > ENV.MEDIA_MAX_FILE_SIZE_BYTES) {
      throw {
        status: 413,
        code: 'MEDIA_TOO_LARGE',
        message: `File size exceeds maximum allowed limit of ${Math.round(ENV.MEDIA_MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB`
      };
    }

    // Inspect file signature and extract metadata
    const inspection = ImageMetadataService.inspect(fileBuffer);
    if (!inspection.isValid) {
      throw {
        status: 400,
        code: 'MEDIA_INVALID_IMAGE',
        message: inspection.error || 'Invalid or unsupported image file'
      };
    }

    if (input.folderId) {
      const folder = await MediaRepository.findFolderById(input.folderId);
      if (!folder) {
        throw { status: 400, code: 'MEDIA_FOLDER_NOT_FOUND', message: 'Specified folder does not exist' };
      }
    }

    // Store file via storage provider
    const putResult = await this.storageProvider.put(fileBuffer, originalFilename, inspection.mimeType);

    // Create database asset
    const asset = await MediaRepository.createAsset({
      filename: putResult.storageKey.split('/').pop() || 'asset.jpg',
      originalFilename: originalFilename.replace(/[\/\\]/g, '_'),
      storageKey: putResult.storageKey,
      publicUrl: putResult.publicUrl,
      mimeType: inspection.mimeType,
      mediaType: 'IMAGE',
      fileSize: putResult.fileSize,
      width: inspection.width,
      height: inspection.height,
      checksum: inspection.checksum,
      title: input.title || null,
      altText: input.altText || null,
      caption: input.caption || null,
      folderId: input.folderId || null
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_CREATED',
        module: 'media',
        entityType: 'MediaAsset',
        entityId: asset.id,
        newValues: {
          filename: asset.filename,
          storageKey: asset.storageKey,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.formatAsset(asset);
  }

  static async getMedia(id: string): Promise<MediaAssetResponse> {
    const asset = await MediaRepository.findAssetById(id);
    if (!asset) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }
    return this.formatAsset(asset);
  }

  static async updateMedia(
    id: string,
    input: UpdateMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<MediaAssetResponse> {
    const asset = await MediaRepository.findAssetById(id);
    if (!asset) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    if (input.folderId !== undefined && input.folderId !== null && input.folderId !== asset.folderId) {
      const folder = await MediaRepository.findFolderById(input.folderId);
      if (!folder) {
        throw { status: 400, code: 'MEDIA_FOLDER_NOT_FOUND', message: 'Specified folder does not exist' };
      }
    }

    const updated = await MediaRepository.updateAsset(id, {
      title: input.title !== undefined ? input.title : asset.title,
      altText: input.altText !== undefined ? input.altText : asset.altText,
      caption: input.caption !== undefined ? input.caption : asset.caption,
      folderId: input.folderId !== undefined ? (input.folderId || null) : asset.folderId
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_UPDATED',
        module: 'media',
        entityType: 'MediaAsset',
        entityId: id,
        oldValues: { title: asset.title, altText: asset.altText, caption: asset.caption, folderId: asset.folderId },
        newValues: { title: updated.title, altText: updated.altText, caption: updated.caption, folderId: updated.folderId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.formatAsset(updated);
  }

  static async deleteMedia(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const asset = await MediaRepository.findAssetById(id);
    if (!asset) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    // Check usage across entities
    const usageCount = await MediaRepository.countAssetUsage(id);
    if (usageCount > 0) {
      throw {
        status: 409,
        code: 'MEDIA_IN_USE',
        message: 'Cannot delete media asset that is currently attached to one or more entities'
      };
    }

    // Delete DB record
    const deleted = await MediaRepository.deleteAsset(id);

    // Delete physical file
    await this.storageProvider.delete(asset.storageKey);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_DELETED',
        module: 'media',
        entityType: 'MediaAsset',
        entityId: id,
        oldValues: { filename: asset.filename, storageKey: asset.storageKey },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.formatAsset(deleted);
  }

  static async listMedia(query: MediaFilterQuery) {
    const result = await MediaRepository.listAssets(query);
    return {
      items: result.items.map(item => this.formatAsset(item)),
      meta: result.meta
    };
  }

  static async listOrphans(query: MediaFilterQuery) {
    const result = await MediaRepository.listAssets({ ...query, isOrphan: true });
    return {
      items: result.items.map(item => this.formatAsset(item)),
      meta: result.meta
    };
  }

  /* ========================================================================
   * PRODUCT MEDIA ATTACHMENTS
   * ======================================================================== */

  static async listProductMedia(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }
    const items = await MediaRepository.findProductMedia(productId);
    return items.map(i => this.formatEntityMedia(i));
  }

  static async attachProductMedia(
    productId: string,
    input: AttachEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    const media = await MediaRepository.findAssetById(input.mediaId);
    if (!media) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    const existing = await MediaRepository.findProductMediaItem(productId, input.mediaId);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_MEDIA_ATTACHMENT', message: 'Media asset is already attached to this product' };
    }

    const isPrimary = Boolean(input.isPrimary);

    if (isPrimary) {
      await MediaRepository.unsetPrimaryProductMedia(productId);
    }

    const attached = await MediaRepository.attachProductMedia(productId, {
      mediaId: input.mediaId,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : 0,
      isPrimary,
      role: input.role || (isPrimary ? 'PRIMARY' : 'GALLERY')
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_ATTACHED',
        module: 'media',
        entityType: 'Product',
        entityId: productId,
        newValues: { mediaId: input.mediaId, isPrimary, role: attached.role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'MEDIA_PRIMARY_CHANGED',
          module: 'media',
          entityType: 'Product',
          entityId: productId,
          newValues: { mediaId: input.mediaId },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return this.formatEntityMedia(attached);
  }

  static async detachProductMedia(
    productId: string,
    mediaId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    const existing = await MediaRepository.findProductMediaItem(productId, mediaId);
    if (!existing) {
      throw { status: 404, code: 'MEDIA_NOT_ATTACHED', message: 'Media asset is not attached to this product' };
    }

    await MediaRepository.detachProductMedia(productId, mediaId);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_DETACHED',
        module: 'media',
        entityType: 'Product',
        entityId: productId,
        oldValues: { mediaId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return { success: true, message: 'Product media detached successfully' };
  }

  static async reorderProductMedia(
    productId: string,
    input: ReorderEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
    }

    for (const item of input.items) {
      const mId = item.mediaId || (item as any).id;
      if (mId) {
        await MediaRepository.updateProductMediaOrder(productId, mId, Number(item.sortOrder));
      }
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_REORDERED',
        module: 'media',
        entityType: 'Product',
        entityId: productId,
        newValues: { items: input.items },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.listProductMedia(productId);
  }

  /* ========================================================================
   * VARIANT MEDIA ATTACHMENTS
   * ======================================================================== */

  static async listVariantMedia(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw { status: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' };
    }
    const items = await MediaRepository.findVariantMedia(variantId);
    return items.map(i => this.formatEntityMedia(i));
  }

  static async attachVariantMedia(
    variantId: string,
    input: AttachEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw { status: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' };
    }

    const media = await MediaRepository.findAssetById(input.mediaId);
    if (!media) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    const existing = await MediaRepository.findVariantMediaItem(variantId, input.mediaId);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_MEDIA_ATTACHMENT', message: 'Media asset is already attached to this variant' };
    }

    const isPrimary = Boolean(input.isPrimary);

    if (isPrimary) {
      await MediaRepository.unsetPrimaryVariantMedia(variantId);
    }

    const attached = await MediaRepository.attachVariantMedia(variantId, {
      mediaId: input.mediaId,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : 0,
      isPrimary,
      role: input.role || (isPrimary ? 'PRIMARY' : 'GALLERY')
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_ATTACHED',
        module: 'media',
        entityType: 'ProductVariant',
        entityId: variantId,
        newValues: { mediaId: input.mediaId, isPrimary, role: attached.role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'MEDIA_PRIMARY_CHANGED',
          module: 'media',
          entityType: 'ProductVariant',
          entityId: variantId,
          newValues: { mediaId: input.mediaId },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return this.formatEntityMedia(attached);
  }

  static async detachVariantMedia(
    variantId: string,
    mediaId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw { status: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' };
    }

    const existing = await MediaRepository.findVariantMediaItem(variantId, mediaId);
    if (!existing) {
      throw { status: 404, code: 'MEDIA_NOT_ATTACHED', message: 'Media asset is not attached to this variant' };
    }

    await MediaRepository.detachVariantMedia(variantId, mediaId);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_DETACHED',
        module: 'media',
        entityType: 'ProductVariant',
        entityId: variantId,
        oldValues: { mediaId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return { success: true, message: 'Variant media detached successfully' };
  }

  static async reorderVariantMedia(
    variantId: string,
    input: ReorderEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw { status: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found' };
    }

    for (const item of input.items) {
      const mId = item.mediaId || (item as any).id;
      if (mId) {
        await MediaRepository.updateVariantMediaOrder(variantId, mId, Number(item.sortOrder));
      }
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_REORDERED',
        module: 'media',
        entityType: 'ProductVariant',
        entityId: variantId,
        newValues: { items: input.items },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.listVariantMedia(variantId);
  }

  /* ========================================================================
   * CATEGORY MEDIA ATTACHMENTS
   * ======================================================================== */

  static async listCategoryMedia(categoryId: string) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }
    const items = await MediaRepository.findCategoryMedia(categoryId);
    return items.map(i => this.formatEntityMedia(i));
  }

  static async attachCategoryMedia(
    categoryId: string,
    input: AttachEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    const media = await MediaRepository.findAssetById(input.mediaId);
    if (!media) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    const existing = await MediaRepository.findCategoryMediaItem(categoryId, input.mediaId);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_MEDIA_ATTACHMENT', message: 'Media asset is already attached to this category' };
    }

    const isPrimary = Boolean(input.isPrimary);

    if (isPrimary) {
      await MediaRepository.unsetPrimaryCategoryMedia(categoryId);
    }

    const attached = await MediaRepository.attachCategoryMedia(categoryId, {
      mediaId: input.mediaId,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : 0,
      isPrimary,
      role: input.role || (isPrimary ? 'PRIMARY' : 'BANNER')
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_ATTACHED',
        module: 'media',
        entityType: 'Category',
        entityId: categoryId,
        newValues: { mediaId: input.mediaId, isPrimary, role: attached.role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'MEDIA_PRIMARY_CHANGED',
          module: 'media',
          entityType: 'Category',
          entityId: categoryId,
          newValues: { mediaId: input.mediaId },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return this.formatEntityMedia(attached);
  }

  static async detachCategoryMedia(
    categoryId: string,
    mediaId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    const existing = await MediaRepository.findCategoryMediaItem(categoryId, mediaId);
    if (!existing) {
      throw { status: 404, code: 'MEDIA_NOT_ATTACHED', message: 'Media asset is not attached to this category' };
    }

    await MediaRepository.detachCategoryMedia(categoryId, mediaId);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_DETACHED',
        module: 'media',
        entityType: 'Category',
        entityId: categoryId,
        oldValues: { mediaId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return { success: true, message: 'Category media detached successfully' };
  }

  static async reorderCategoryMedia(
    categoryId: string,
    input: ReorderEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    for (const item of input.items) {
      const mId = item.mediaId || (item as any).id;
      if (mId) {
        await MediaRepository.updateCategoryMediaOrder(categoryId, mId, Number(item.sortOrder));
      }
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_REORDERED',
        module: 'media',
        entityType: 'Category',
        entityId: categoryId,
        newValues: { items: input.items },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.listCategoryMedia(categoryId);
  }

  /* ========================================================================
   * COLLECTION MEDIA ATTACHMENTS
   * ======================================================================== */

  static async listCollectionMedia(collectionId: string) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      throw { status: 404, code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' };
    }
    const items = await MediaRepository.findCollectionMedia(collectionId);
    return items.map(i => this.formatEntityMedia(i));
  }

  static async attachCollectionMedia(
    collectionId: string,
    input: AttachEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      throw { status: 404, code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' };
    }

    const media = await MediaRepository.findAssetById(input.mediaId);
    if (!media) {
      throw { status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media asset not found' };
    }

    const existing = await MediaRepository.findCollectionMediaItem(collectionId, input.mediaId);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_MEDIA_ATTACHMENT', message: 'Media asset is already attached to this collection' };
    }

    const isPrimary = Boolean(input.isPrimary);

    if (isPrimary) {
      await MediaRepository.unsetPrimaryCollectionMedia(collectionId);
    }

    const attached = await MediaRepository.attachCollectionMedia(collectionId, {
      mediaId: input.mediaId,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : 0,
      isPrimary,
      role: input.role || (isPrimary ? 'PRIMARY' : 'BANNER')
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_ATTACHED',
        module: 'media',
        entityType: 'Collection',
        entityId: collectionId,
        newValues: { mediaId: input.mediaId, isPrimary, role: attached.role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'MEDIA_PRIMARY_CHANGED',
          module: 'media',
          entityType: 'Collection',
          entityId: collectionId,
          newValues: { mediaId: input.mediaId },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return this.formatEntityMedia(attached);
  }

  static async detachCollectionMedia(
    collectionId: string,
    mediaId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      throw { status: 404, code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' };
    }

    const existing = await MediaRepository.findCollectionMediaItem(collectionId, mediaId);
    if (!existing) {
      throw { status: 404, code: 'MEDIA_NOT_ATTACHED', message: 'Media asset is not attached to this collection' };
    }

    await MediaRepository.detachCollectionMedia(collectionId, mediaId);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_DETACHED',
        module: 'media',
        entityType: 'Collection',
        entityId: collectionId,
        oldValues: { mediaId },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return { success: true, message: 'Collection media detached successfully' };
  }

  static async reorderCollectionMedia(
    collectionId: string,
    input: ReorderEntityMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      throw { status: 404, code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' };
    }

    for (const item of input.items) {
      const mId = item.mediaId || (item as any).id;
      if (mId) {
        await MediaRepository.updateCollectionMediaOrder(collectionId, mId, Number(item.sortOrder));
      }
    }

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'MEDIA_REORDERED',
        module: 'media',
        entityType: 'Collection',
        entityId: collectionId,
        newValues: { items: input.items },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return this.listCollectionMedia(collectionId);
  }

  /* ========================================================================
   * SERIALIZATION HELPERS
   * ======================================================================== */

  static formatAsset(asset: any): MediaAssetResponse {
    return {
      id: asset.id,
      filename: asset.filename,
      originalFilename: asset.originalFilename,
      url: asset.publicUrl,
      mimeType: asset.mimeType,
      mediaType: asset.mediaType || 'IMAGE',
      fileSize: asset.fileSize,
      width: asset.width || null,
      height: asset.height || null,
      checksum: asset.checksum,
      title: asset.title || null,
      altText: asset.altText || null,
      caption: asset.caption || null,
      folderId: asset.folderId || null,
      folder: asset.folder
        ? {
            id: asset.folder.id,
            name: asset.folder.name,
            slug: asset.folder.slug,
            parentId: asset.folder.parentId,
            createdAt: asset.folder.createdAt instanceof Date ? asset.folder.createdAt.toISOString() : String(asset.folder.createdAt),
            updatedAt: asset.folder.updatedAt instanceof Date ? asset.folder.updatedAt.toISOString() : String(asset.folder.updatedAt)
          }
        : null,
      createdAt: asset.createdAt instanceof Date ? asset.createdAt.toISOString() : String(asset.createdAt),
      updatedAt: asset.updatedAt instanceof Date ? asset.updatedAt.toISOString() : String(asset.updatedAt)
    };
  }

  static formatEntityMedia(junction: any) {
    return {
      mediaId: junction.mediaId,
      sortOrder: junction.sortOrder,
      isPrimary: Boolean(junction.isPrimary),
      role: junction.role,
      createdAt: junction.createdAt instanceof Date ? junction.createdAt.toISOString() : String(junction.createdAt),
      media: junction.media ? this.formatAsset(junction.media) : null
    };
  }

  static formatPublicMedia(junction: any): PublicMediaItem {
    const asset = junction.media;
    return {
      id: asset.id,
      url: asset.publicUrl,
      altText: asset.altText || null,
      caption: asset.caption || null,
      width: asset.width || null,
      height: asset.height || null,
      sortOrder: junction.sortOrder,
      role: junction.role,
      isPrimary: Boolean(junction.isPrimary)
    };
  }
}
