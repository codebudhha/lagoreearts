/**
 * Module 26: SEO Management System — Data Access Layer & Repository
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  SeoEntityType,
  SeoMetadataModel,
  SeoSiteSettingsModel,
  UpsertSeoMetadataDto,
  UpdateSeoSiteSettingsDto,
  AdminSeoFilterQuery
} from './seo.types.ts';

export class SeoRepository {
  /**
   * Find explicit SEO metadata by entity type and ID
   */
  static async findMetadata(entityType: SeoEntityType, entityId: string): Promise<SeoMetadataModel | null> {
    return prisma.seoMetadata.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId
        }
      }
    });
  }

  /**
   * Upsert explicit SEO metadata
   */
  static async upsertMetadata(
    entityType: SeoEntityType,
    entityId: string,
    dto: UpsertSeoMetadataDto
  ): Promise<SeoMetadataModel> {
    const existing = await this.findMetadata(entityType, entityId);
    if (existing) {
      return prisma.seoMetadata.update({
        where: {
          entityType_entityId: {
            entityType,
            entityId
          }
        },
        data: dto
      });
    }

    return prisma.seoMetadata.create({
      data: {
        entityType,
        entityId,
        ...dto
      }
    });
  }

  /**
   * Delete explicit SEO metadata
   */
  static async deleteMetadata(entityType: SeoEntityType, entityId: string): Promise<SeoMetadataModel | null> {
    const existing = await this.findMetadata(entityType, entityId);
    if (!existing) return null;

    return prisma.seoMetadata.delete({
      where: {
        id: existing.id
      }
    });
  }

  /**
   * List SEO metadata entries with filtering and pagination
   */
  static async listMetadata(
    query: AdminSeoFilterQuery
  ): Promise<{ data: SeoMetadataModel[]; total: number }> {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { metaTitle: { contains: term } },
        { metaDescription: { contains: term } },
        { entityId: { contains: term } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.seoMetadata.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.seoMetadata.count({ where })
    ]);

    return { data, total };
  }

  /**
   * Retrieve global SEO site settings (singleton)
   */
  static async getSiteSettings(): Promise<SeoSiteSettingsModel> {
    let settings = await prisma.seoSiteSettings.findFirst();
    if (!settings) {
      settings = await prisma.seoSiteSettings.create({
        data: {
          id: 'global',
          siteName: 'Lagoree Arts',
          defaultTitle: 'Lagoree Arts | Heritage Luxury & Fine Art',
          titleTemplate: '%s | Lagoree Arts',
          defaultMetaDescription:
            'Lagoree Arts presents timeless Indian masterworks, museum-grade antiquities, Sanskrit editorial treasures, and bespoke atelier framing.',
          defaultOgImage: 'https://lagoreearts.com/assets/og-default.jpg',
          defaultRobots: 'index,follow',
          canonicalBaseUrl: 'https://lagoreearts.com',
          twitterCard: 'summary_large_image',
          organizationName: 'Lagoree Arts',
          organizationLogo: 'https://lagoreearts.com/assets/logo.png',
          organizationUrl: 'https://lagoreearts.com'
        }
      });
    }
    return settings;
  }

  /**
   * Update global SEO site settings
   */
  static async updateSiteSettings(dto: UpdateSeoSiteSettingsDto): Promise<SeoSiteSettingsModel> {
    const current = await this.getSiteSettings();
    return prisma.seoSiteSettings.update({
      where: { id: current.id },
      data: dto
    });
  }

  // ==========================================
  // Entity Loaders for SEO Resolution
  // ==========================================

  static async loadProduct(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.product.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.product.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.product.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadCategory(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.category.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.category.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.category.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadCollection(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.collection.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.collection.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.collection.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadArtist(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.artist.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.artist.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.artist.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadJournalPost(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.journalPost.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.journalPost.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.journalPost.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadLookbook(idOrSlug: string): Promise<any | null> {
    return (
      (await prisma.lookbook.findUnique({ where: { id: idOrSlug } })) ||
      (await prisma.lookbook.findUnique({ where: { slug: idOrSlug } })) ||
      (await prisma.lookbook.findFirst({ where: { id: idOrSlug } }))
    );
  }

  static async loadSanskritEdit(idOrSlug: string): Promise<any | null> {
    let profile = await prisma.sanskritEditProfile.findUnique({ where: { id: idOrSlug } });
    if (!profile) {
      profile = await prisma.sanskritEditProfile.findFirst({
        where: { OR: [{ id: idOrSlug }, { productId: idOrSlug }, { slug: idOrSlug }] }
      });
    }
    if (!profile) {
      // Check if product slug was given
      const prod = await prisma.product.findUnique({ where: { slug: idOrSlug } });
      if (prod) {
        profile = await prisma.sanskritEditProfile.findFirst({ where: { productId: prod.id } });
      }
    }
    return profile;
  }

  // ==========================================
  // Bulk Sitemap Entity Loaders
  // ==========================================

  static async loadAllPublicCategories(): Promise<any[]> {
    return prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async loadAllPublicCollections(): Promise<any[]> {
    return prisma.collection.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async loadAllPublicProducts(): Promise<any[]> {
    return prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async loadAllPublicArtists(): Promise<any[]> {
    return prisma.artist.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async loadAllPublicJournalPosts(): Promise<any[]> {
    return prisma.journalPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' }
    });
  }

  static async loadAllPublicLookbooks(): Promise<any[]> {
    return prisma.lookbook.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async loadAllPublicSanskritEdits(): Promise<any[]> {
    return prisma.sanskritEditProfile.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
