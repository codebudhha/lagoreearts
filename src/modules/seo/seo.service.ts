/**
 * Module 26: SEO Management System — Business Logic & Orchestration Service
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { SeoRepository } from './seo.repository.ts';
import { SeoPolicy, type EntityInspectionData } from './seo.policy.ts';
import { SeoSerializer } from './seo.serializer.ts';
import { ProductReviewRepository } from '../reviews/review.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  SeoEntityType,
  SeoMetadataModel,
  SeoSiteSettingsModel,
  UpsertSeoMetadataDto,
  UpdateSeoSiteSettingsDto,
  AdminSeoFilterQuery,
  AdminSeoPreviewView,
  ResolvedSeoView,
  SitemapItem
} from './seo.types.ts';

export class SeoService {
  /**
   * Load and normalize an entity into EntityInspectionData
   */
  static async loadEntityData(entityType: SeoEntityType, entityId: string): Promise<EntityInspectionData> {
    switch (entityType) {
      case 'PRODUCT':
      case 'ANTIQUE': {
        const product = await SeoRepository.loadProduct(entityId);
        if (!product) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Artwork product '${entityId}' not found`
          };
        }
        return {
          type: entityType,
          id: product.id,
          nameOrTitle: product.name,
          slug: product.slug,
          description: product.shortDescription || product.description,
          status: product.status,
          primaryImageUrl: product.image || product.thumbnail,
          isPublic: product.status === 'ACTIVE',
          rawEntity: product
        };
      }

      case 'CATEGORY': {
        const category = await SeoRepository.loadCategory(entityId);
        if (!category) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Category '${entityId}' not found`
          };
        }
        return {
          type: 'CATEGORY',
          id: category.id,
          nameOrTitle: category.name,
          slug: category.slug,
          description: category.description,
          status: category.status,
          primaryImageUrl: category.image || category.bannerImage,
          isPublic: category.status === 'ACTIVE',
          rawEntity: category
        };
      }

      case 'COLLECTION': {
        const collection = await SeoRepository.loadCollection(entityId);
        if (!collection) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Collection '${entityId}' not found`
          };
        }
        return {
          type: 'COLLECTION',
          id: collection.id,
          nameOrTitle: collection.name,
          slug: collection.slug,
          description: collection.description,
          status: collection.status,
          primaryImageUrl: collection.image || collection.bannerImage,
          isPublic: collection.status === 'ACTIVE',
          rawEntity: collection
        };
      }

      case 'ARTIST': {
        const artist = await SeoRepository.loadArtist(entityId);
        if (!artist) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Artist '${entityId}' not found`
          };
        }
        return {
          type: 'ARTIST',
          id: artist.id,
          nameOrTitle: artist.name,
          slug: artist.slug,
          description: artist.biography || artist.bio,
          status: artist.status,
          primaryImageUrl: artist.profileImage || artist.ogImage,
          isPublic: artist.status === 'ACTIVE',
          rawEntity: artist
        };
      }

      case 'JOURNAL_POST': {
        const post = await SeoRepository.loadJournalPost(entityId);
        if (!post) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Journal article '${entityId}' not found`
          };
        }
        return {
          type: 'JOURNAL_POST',
          id: post.id,
          nameOrTitle: post.title,
          slug: post.slug,
          description: post.excerpt || post.content,
          status: post.status,
          publishedAt: post.publishedAt,
          primaryImageUrl: post.featuredImage,
          isPublic: post.status === 'PUBLISHED',
          rawEntity: post
        };
      }

      case 'LOOKBOOK': {
        const lookbook = await SeoRepository.loadLookbook(entityId);
        if (!lookbook) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Lookbook '${entityId}' not found`
          };
        }
        return {
          type: 'LOOKBOOK',
          id: lookbook.id,
          nameOrTitle: lookbook.title,
          slug: lookbook.slug,
          description: lookbook.description,
          status: lookbook.status,
          publishedAt: lookbook.publishedAt,
          primaryImageUrl: lookbook.coverImage || lookbook.heroImage,
          isPublic: SeoPolicy.isEntityPublic('LOOKBOOK', lookbook),
          rawEntity: lookbook
        };
      }

      case 'SANSKRIT_EDIT': {
        const profile = await SeoRepository.loadSanskritEdit(entityId);
        if (!profile) {
          throw {
            statusCode: 404,
            status: 404,
            code: 'SEO_ENTITY_NOT_FOUND',
            message: `Sanskrit Edit profile '${entityId}' not found`
          };
        }
        // Load associated product
        const prod = profile.productId ? await SeoRepository.loadProduct(profile.productId) : null;
        return {
          type: 'SANSKRIT_EDIT',
          id: profile.id,
          nameOrTitle: profile.title || prod?.name || 'The Sanskrit Edit',
          slug: profile.slug || prod?.slug || profile.id,
          description: profile.summary || profile.description || prod?.shortDescription,
          status: profile.status,
          primaryImageUrl: profile.heroImage || prod?.image,
          isPublic: (prod ? prod.status === 'ACTIVE' : true) && (profile.status === 'ACTIVE' || profile.status === 'PUBLISHED'),
          rawEntity: { ...profile, product: prod }
        };
      }

      case 'HOMEPAGE': {
        return {
          type: 'HOMEPAGE',
          id: 'homepage',
          nameOrTitle: 'Lagoree Arts Storefront',
          slug: '',
          description: null,
          status: 'ACTIVE',
          primaryImageUrl: null,
          isPublic: true,
          rawEntity: { id: 'homepage', status: 'ACTIVE' }
        };
      }

      case 'PAGE': {
        return {
          type: 'PAGE',
          id: entityId,
          nameOrTitle: entityId.charAt(0).toUpperCase() + entityId.slice(1).replace(/[-_]/g, ' '),
          slug: entityId,
          description: null,
          status: 'ACTIVE',
          primaryImageUrl: null,
          isPublic: true,
          rawEntity: { id: entityId, status: 'ACTIVE' }
        };
      }

      default:
        throw {
          statusCode: 400,
          status: 400,
          code: 'SEO_INVALID_ENTITY_TYPE',
          message: `Unsupported entity type '${entityType}'`
        };
    }
  }

  /**
   * The SINGLE authoritative SEO resolution path for any entity
   */
  static async resolveSeo(entityType: SeoEntityType, entityId: string): Promise<AdminSeoPreviewView> {
    const [entityData, explicit, settings] = await Promise.all([
      this.loadEntityData(entityType, entityId),
      SeoRepository.findMetadata(entityType, entityId),
      SeoRepository.getSiteSettings()
    ]);

    // Structured Data resolution
    let structuredData: any = null;
    if (explicit?.structuredData) {
      try {
        structuredData =
          typeof explicit.structuredData === 'string'
            ? JSON.parse(explicit.structuredData)
            : explicit.structuredData;
      } catch {
        structuredData = null;
      }
    } else {
      // Generate default Schema.org structured data based on entity type
      if (entityType === 'PRODUCT' || entityType === 'ANTIQUE') {
        const reviewSummary = await ProductReviewRepository.getAggregateSummary(entityData.id);
        const canonRes = SeoPolicy.resolveCanonicalUrl(entityType, entityData, explicit?.canonicalUrl, settings.canonicalBaseUrl);
        const ogRes = SeoPolicy.resolveOgImage(entityData, explicit?.ogImage, settings);
        structuredData = SeoSerializer.generateProductSchema(
          entityData.rawEntity,
          reviewSummary,
          canonRes.url,
          ogRes.ogImage,
          settings
        );
      } else if (entityType === 'JOURNAL_POST') {
        const canonRes = SeoPolicy.resolveCanonicalUrl(entityType, entityData, explicit?.canonicalUrl, settings.canonicalBaseUrl);
        const ogRes = SeoPolicy.resolveOgImage(entityData, explicit?.ogImage, settings);
        structuredData = SeoSerializer.generateArticleSchema(
          entityData.rawEntity,
          canonRes.url,
          ogRes.ogImage,
          settings
        );
      } else if (entityType === 'HOMEPAGE') {
        structuredData = SeoSerializer.generateWebSiteSchema(settings);
      }
    }

    return SeoPolicy.assembleResolvedSeo(entityType, entityData, explicit, settings, structuredData);
  }

  /**
   * Admin: Get explicit SEO metadata + preview diagnostics
   */
  static async getMetadata(entityType: SeoEntityType, entityId: string): Promise<AdminSeoPreviewView> {
    return this.resolveSeo(entityType, entityId);
  }

  /**
   * Admin: Upsert explicit SEO metadata
   */
  static async upsertMetadata(
    entityType: SeoEntityType,
    entityId: string,
    dto: UpsertSeoMetadataDto,
    meta: any = {}
  ): Promise<AdminSeoPreviewView> {
    // 1. Verify entity exists
    await this.loadEntityData(entityType, entityId);

    // 2. Check existing for audit diff
    const existing = await SeoRepository.findMetadata(entityType, entityId);

    // 3. Upsert record
    const updated = await SeoRepository.upsertMetadata(entityType, entityId, dto);

    // 4. Audit Log
    AuditService.log({
      adminUserId: meta.adminUserId || null,
      action: existing ? 'SEO_UPDATED' : 'SEO_CREATED',
      module: 'SEO',
      entityType,
      entityId,
      oldValues: existing,
      newValues: updated,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    // 5. Return updated preview
    return this.resolveSeo(entityType, entityId);
  }

  /**
   * Admin: Delete explicit SEO metadata (restores deterministic fallback)
   */
  static async deleteMetadata(
    entityType: SeoEntityType,
    entityId: string,
    meta: any = {}
  ): Promise<AdminSeoPreviewView> {
    const existing = await SeoRepository.findMetadata(entityType, entityId);
    if (existing) {
      await SeoRepository.deleteMetadata(entityType, entityId);

      AuditService.log({
        adminUserId: meta.adminUserId || null,
        action: 'SEO_DELETED',
        module: 'SEO',
        entityType,
        entityId,
        oldValues: existing,
        newValues: null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
    }

    return this.resolveSeo(entityType, entityId);
  }

  /**
   * Admin: List metadata overrides
   */
  static async listMetadata(
    query: AdminSeoFilterQuery
  ): Promise<{ data: SeoMetadataModel[]; total: number }> {
    return SeoRepository.listMetadata(query);
  }

  /**
   * Admin: Get global site settings
   */
  static async getSiteSettings(): Promise<SeoSiteSettingsModel> {
    return SeoRepository.getSiteSettings();
  }

  /**
   * Admin: Update global site settings
   */
  static async updateSiteSettings(
    dto: UpdateSeoSiteSettingsDto,
    meta: any = {}
  ): Promise<SeoSiteSettingsModel> {
    const oldSettings = await SeoRepository.getSiteSettings();
    const updated = await SeoRepository.updateSiteSettings(dto);

    AuditService.log({
      adminUserId: meta.adminUserId || null,
      action: 'SEO_SETTINGS_UPDATED',
      module: 'SEO',
      entityType: 'SITE_SETTINGS',
      entityId: 'global',
      oldValues: oldSettings,
      newValues: updated,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  // ==========================================
  // Sitemap & Robots Generation
  // ==========================================

  /**
   * Generate sitemap.xml for all publicly indexable entities
   */
  static async generateSitemapXml(): Promise<string> {
    const settings = await SeoRepository.getSiteSettings();
    const baseUrl = settings.canonicalBaseUrl.replace(/\/+$/, '');

    const [categories, collections, products, artists, posts, lookbooks, sanskritEdits] =
      await Promise.all([
        SeoRepository.loadAllPublicCategories(),
        SeoRepository.loadAllPublicCollections(),
        SeoRepository.loadAllPublicProducts(),
        SeoRepository.loadAllPublicArtists(),
        SeoRepository.loadAllPublicJournalPosts(),
        SeoRepository.loadAllPublicLookbooks(),
        SeoRepository.loadAllPublicSanskritEdits()
      ]);

    const items: SitemapItem[] = [];

    // 1. Homepage
    items.push({
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString()
    });

    // 2. Categories
    for (const cat of categories) {
      items.push({
        loc: `${baseUrl}/categories/${cat.slug}`,
        lastmod: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : undefined
      });
    }

    // 3. Collections
    for (const col of collections) {
      items.push({
        loc: `${baseUrl}/collections/${col.slug}`,
        lastmod: col.updatedAt ? new Date(col.updatedAt).toISOString() : undefined
      });
    }

    // 4. Products (including Antiques)
    for (const prod of products) {
      items.push({
        loc: `${baseUrl}/products/${prod.slug}`,
        lastmod: prod.updatedAt ? new Date(prod.updatedAt).toISOString() : undefined
      });
    }

    // 5. Artists
    for (const art of artists) {
      items.push({
        loc: `${baseUrl}/artists/${art.slug}`,
        lastmod: art.updatedAt ? new Date(art.updatedAt).toISOString() : undefined
      });
    }

    // 6. Journal Posts
    for (const post of posts) {
      items.push({
        loc: `${baseUrl}/journal/${post.slug}`,
        lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined
      });
    }

    // 7. Lookbooks
    for (const lb of lookbooks) {
      items.push({
        loc: `${baseUrl}/lookbooks/${lb.slug}`,
        lastmod: lb.updatedAt ? new Date(lb.updatedAt).toISOString() : undefined
      });
    }

    // 8. Sanskrit Edits
    for (const se of sanskritEdits) {
      const slug = se.slug || se.productId || se.id;
      items.push({
        loc: `${baseUrl}/sanskrit-edit/${slug}`,
        lastmod: se.updatedAt ? new Date(se.updatedAt).toISOString() : undefined
      });
    }

    // Deduplicate and Sort Deterministically by loc
    const uniqueMap = new Map<string, SitemapItem>();
    for (const item of items) {
      if (!uniqueMap.has(item.loc)) {
        uniqueMap.set(item.loc, item);
      }
    }

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.loc.localeCompare(b.loc));

    // Construct XML string
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const entry of sorted) {
      xml += '  <url>\n';
      xml += `    <loc>${entry.loc}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }
      xml += '  </url>\n';
    }
    xml += '</urlset>\n';

    return xml;
  }

  /**
   * Generate robots.txt file
   */
  static async generateRobotsTxt(): Promise<string> {
    const settings = await SeoRepository.getSiteSettings();
    const baseUrl = settings.canonicalBaseUrl.replace(/\/+$/, '');

    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/v1/admin/',
      'Disallow: /api/v1/customer/',
      'Disallow: /admin/',
      'Disallow: /account/',
      'Disallow: /my-account/',
      'Disallow: /cart/',
      'Disallow: /checkout/',
      'Disallow: /order-confirmation',
      'Disallow: /order-detail',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`
    ].join('\n');
  }
}
