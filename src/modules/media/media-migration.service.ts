import { prisma } from '../../database/prisma.ts';
import { MediaRepository } from './media.repository.ts';
import crypto from 'node:crypto';

export class MediaMigrationService {
  /**
   * Migrate legacy image URLs across products, variants, categories, and collections
   */
  static async migrateLegacyImages(): Promise<{
    migratedProducts: number;
    migratedVariants: number;
    migratedCategories: number;
    migratedCollections: number;
  }> {
    let migratedProducts = 0;
    let migratedVariants = 0;
    let migratedCategories = 0;
    let migratedCollections = 0;

    // 1. Products
    const products = await prisma.product.findMany({});
    for (const prod of products) {
      if (prod.image) {
        const asset = await this.findOrCreateLegacyAsset(prod.image, prod.name);
        const existingAttachment = await MediaRepository.findProductMediaItem(prod.id, asset.id);
        if (!existingAttachment) {
          await MediaRepository.attachProductMedia(prod.id, {
            mediaId: asset.id,
            isPrimary: true,
            role: 'PRIMARY',
            sortOrder: 0
          });
          migratedProducts++;
        }
      }
    }

    // 2. Variants
    const variants = await prisma.productVariant.findMany({});
    for (const v of variants) {
      if (v.image) {
        const asset = await this.findOrCreateLegacyAsset(v.image, `Variant ${v.sku}`);
        const existingAttachment = await MediaRepository.findVariantMediaItem(v.id, asset.id);
        if (!existingAttachment) {
          await MediaRepository.attachVariantMedia(v.id, {
            mediaId: asset.id,
            isPrimary: true,
            role: 'PRIMARY',
            sortOrder: 0
          });
          migratedVariants++;
        }
      }
    }

    // 3. Categories
    const categories = await prisma.category.findMany({});
    for (const cat of categories) {
      if (cat.image) {
        const asset = await this.findOrCreateLegacyAsset(cat.image, cat.name);
        const existingAttachment = await MediaRepository.findCategoryMediaItem(cat.id, asset.id);
        if (!existingAttachment) {
          await MediaRepository.attachCategoryMedia(cat.id, {
            mediaId: asset.id,
            isPrimary: true,
            role: 'PRIMARY',
            sortOrder: 0
          });
          migratedCategories++;
        }
      }
    }

    // 4. Collections
    const collections = await prisma.collection.findMany({});
    for (const col of collections) {
      if (col.image) {
        const asset = await this.findOrCreateLegacyAsset(col.image, col.name);
        const existingAttachment = await MediaRepository.findCollectionMediaItem(col.id, asset.id);
        if (!existingAttachment) {
          await MediaRepository.attachCollectionMedia(col.id, {
            mediaId: asset.id,
            isPrimary: true,
            role: 'PRIMARY',
            sortOrder: 0
          });
          migratedCollections++;
        }
      }
    }

    return {
      migratedProducts,
      migratedVariants,
      migratedCategories,
      migratedCollections
    };
  }

  /**
   * Helper: Find or create media asset for legacy URL
   */
  private static async findOrCreateLegacyAsset(url: string, title: string) {
    const filename = url.split('/').pop() || 'legacy-asset.jpg';
    const storageKey = url.replace(/^[/\\]+/, '');
    const checksum = crypto.createHash('sha256').update(url).digest('hex');

    const existing = await MediaRepository.findAssetByStorageKey(storageKey);
    if (existing) return existing;

    return MediaRepository.createAsset({
      filename,
      originalFilename: filename,
      storageKey,
      publicUrl: url,
      mimeType: url.endsWith('.png') ? 'image/png' : url.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
      mediaType: 'IMAGE',
      fileSize: 1024,
      checksum,
      title,
      altText: title
    });
  }
}
