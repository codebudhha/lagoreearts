/**
 * Module 26: SEO Management System — Policy, Fallback & Resolution Rules
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type {
  SeoEntityType,
  SeoMetadataModel,
  SeoSiteSettingsModel,
  ResolvedSeoView,
  AdminSeoPreviewView
} from './seo.types.ts';

export interface EntityInspectionData {
  type: SeoEntityType;
  id: string;
  nameOrTitle: string;
  slug?: string;
  description?: string | null;
  status?: string;
  publishedAt?: Date | string | null;
  primaryImageUrl?: string | null;
  isPublic: boolean;
  rawEntity?: any;
}

export class SeoPolicy {
  /**
   * Determine whether an entity is publicly indexable according to domain invariants
   */
  static isEntityPublic(type: SeoEntityType, entity: any): boolean {
    if (!entity) return false;

    switch (type) {
      case 'PRODUCT':
      case 'ANTIQUE':
        return entity.status === 'ACTIVE';

      case 'CATEGORY':
      case 'COLLECTION':
      case 'ARTIST':
        return entity.status === 'ACTIVE';

      case 'JOURNAL_POST':
        return entity.status === 'PUBLISHED';

      case 'LOOKBOOK':
        if (entity.status !== 'PUBLISHED') return false;
        if (entity.publishedAt) {
          const pubDate = new Date(entity.publishedAt);
          return !isNaN(pubDate.getTime()) && pubDate <= new Date();
        }
        return true;

      case 'SANSKRIT_EDIT':
        // Product must be active and profile published/active
        if (entity.product && entity.product.status !== 'ACTIVE') return false;
        return entity.status === 'ACTIVE' || entity.status === 'PUBLISHED';

      case 'HOMEPAGE':
      case 'PAGE':
        return true;

      default:
        return false;
    }
  }

  /**
   * Compute deterministic canonical URL
   */
  static resolveCanonicalUrl(
    type: SeoEntityType,
    entity: EntityInspectionData,
    explicitUrl: string | null | undefined,
    baseUrl: string
  ): { url: string; source: 'explicit' | 'generated' } {
    if (explicitUrl && explicitUrl.trim()) {
      return { url: explicitUrl.trim(), source: 'explicit' };
    }

    const cleanBase = baseUrl.replace(/\/+$/, '');
    const slug = entity.slug || entity.id;

    switch (type) {
      case 'PRODUCT':
      case 'ANTIQUE':
        return { url: `${cleanBase}/products/${slug}`, source: 'generated' };

      case 'CATEGORY':
        return { url: `${cleanBase}/categories/${slug}`, source: 'generated' };

      case 'COLLECTION':
        return { url: `${cleanBase}/collections/${slug}`, source: 'generated' };

      case 'ARTIST':
        return { url: `${cleanBase}/artists/${slug}`, source: 'generated' };

      case 'JOURNAL_POST':
        return { url: `${cleanBase}/journal/${slug}`, source: 'generated' };

      case 'LOOKBOOK':
        return { url: `${cleanBase}/lookbooks/${slug}`, source: 'generated' };

      case 'SANSKRIT_EDIT':
        return { url: `${cleanBase}/sanskrit-edit/${slug}`, source: 'generated' };

      case 'HOMEPAGE':
        return { url: `${cleanBase}/`, source: 'generated' };

      case 'PAGE':
        return { url: `${cleanBase}/${slug}`, source: 'generated' };

      default:
        return { url: `${cleanBase}/`, source: 'generated' };
    }
  }

  /**
   * Format title according to brand strategy and template
   */
  static resolveTitle(
    type: SeoEntityType,
    entity: EntityInspectionData,
    explicitTitle: string | null | undefined,
    settings: SeoSiteSettingsModel
  ): { title: string; source: 'explicit' | 'fallback' | 'site_default' } {
    if (explicitTitle && explicitTitle.trim()) {
      return { title: explicitTitle.trim(), source: 'explicit' };
    }

    const brand = settings.siteName || 'Lagoree Arts';
    const name = entity.nameOrTitle?.trim();

    if (type === 'HOMEPAGE') {
      return {
        title: settings.defaultTitle || `${brand} | Heritage Luxury & Fine Art`,
        source: 'site_default'
      };
    }

    if (!name) {
      return {
        title: settings.defaultTitle || `${brand} | Heritage Luxury & Fine Art`,
        source: 'site_default'
      };
    }

    switch (type) {
      case 'PRODUCT':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      case 'CATEGORY':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      case 'COLLECTION':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      case 'ARTIST':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      case 'JOURNAL_POST':
        return { title: `${name} | ${brand} Journal`, source: 'fallback' };

      case 'LOOKBOOK':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      case 'SANSKRIT_EDIT':
        return { title: `${name} | The Sanskrit Edit | ${brand}`, source: 'fallback' };

      case 'ANTIQUE':
        return { title: `${name} | Antique Collectibles | ${brand}`, source: 'fallback' };

      case 'PAGE':
        return { title: `${name} | ${brand}`, source: 'fallback' };

      default:
        return { title: `${name} | ${brand}`, source: 'fallback' };
    }
  }

  /**
   * Resolve meta description fallback
   */
  static resolveDescription(
    entity: EntityInspectionData,
    explicitDesc: string | null | undefined,
    settings: SeoSiteSettingsModel
  ): { description: string; source: 'explicit' | 'fallback' | 'site_default' } {
    if (explicitDesc && explicitDesc.trim()) {
      return { description: explicitDesc.trim(), source: 'explicit' };
    }

    if (entity.description && entity.description.trim()) {
      let clean = entity.description
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (clean.length > 300) {
        clean = clean.substring(0, 297).trim() + '...';
      }
      return { description: clean, source: 'fallback' };
    }

    return {
      description: settings.defaultMetaDescription || '',
      source: 'site_default'
    };
  }

  /**
   * Resolve Open Graph image with deterministic priority hierarchy
   */
  static resolveOgImage(
    entity: EntityInspectionData,
    explicitOgImage: string | null | undefined,
    settings: SeoSiteSettingsModel
  ): { ogImage: string; source: 'explicit' | 'entity_media' | 'site_default' } {
    if (explicitOgImage && explicitOgImage.trim()) {
      return { ogImage: explicitOgImage.trim(), source: 'explicit' };
    }

    if (entity.primaryImageUrl && entity.primaryImageUrl.trim()) {
      return { ogImage: entity.primaryImageUrl.trim(), source: 'entity_media' };
    }

    return {
      ogImage: settings.defaultOgImage || '',
      source: 'site_default'
    };
  }

  /**
   * Resolve robots directive respecting public visibility invariant
   */
  static resolveRobots(
    isPublic: boolean,
    explicitRobots: string | null | undefined,
    settings: SeoSiteSettingsModel
  ): { robots: string; source: 'explicit' | 'system_enforced' | 'site_default' } {
    // CRITICAL: SEO metadata cannot make an unpublic entity indexable
    if (!isPublic) {
      return { robots: 'noindex,nofollow', source: 'system_enforced' };
    }

    if (explicitRobots && explicitRobots.trim()) {
      return { robots: explicitRobots.trim().toLowerCase(), source: 'explicit' };
    }

    return {
      robots: settings.defaultRobots || 'index,follow',
      source: 'site_default'
    };
  }

  /**
   * Build complete resolved SEO payload and diagnostics
   */
  static assembleResolvedSeo(
    type: SeoEntityType,
    entity: EntityInspectionData,
    explicit: SeoMetadataModel | null,
    settings: SeoSiteSettingsModel,
    structuredData: any | null
  ): AdminSeoPreviewView {
    const isPublic = this.isEntityPublic(type, entity.rawEntity);
    entity.isPublic = isPublic;

    const titleRes = this.resolveTitle(type, entity, explicit?.metaTitle, settings);
    const descRes = this.resolveDescription(entity, explicit?.metaDescription, settings);
    const canonRes = this.resolveCanonicalUrl(type, entity, explicit?.canonicalUrl, settings.canonicalBaseUrl);
    const robotsRes = this.resolveRobots(isPublic, explicit?.robots, settings);
    const ogImgRes = this.resolveOgImage(entity, explicit?.ogImage, settings);

    const ogTitle = explicit?.ogTitle?.trim() || titleRes.title;
    const ogDescription = explicit?.ogDescription?.trim() || descRes.description;
    const twitterTitle = explicit?.twitterTitle?.trim() || ogTitle;
    const twitterDescription = explicit?.twitterDescription?.trim() || ogDescription;
    const twitterImage = explicit?.twitterImage?.trim() || ogImgRes.ogImage;
    const twitterCard = explicit?.twitterCard?.trim() || settings.twitterCard || 'summary_large_image';

    const resolvedSeo: ResolvedSeoView = {
      title: titleRes.title,
      description: descRes.description,
      canonicalUrl: canonRes.url,
      robots: robotsRes.robots,
      ogTitle,
      ogDescription,
      ogImage: ogImgRes.ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      twitterCard,
      structuredData
    };

    return {
      entity: {
        type,
        id: entity.id,
        titleOrName: entity.nameOrTitle,
        slug: entity.slug,
        isPublic,
        status: entity.status
      },
      explicitMetadata: explicit,
      resolvedSeo,
      sources: {
        title: titleRes.source,
        description: descRes.source,
        canonicalUrl: canonRes.source,
        robots: robotsRes.source,
        ogTitle: explicit?.ogTitle ? 'explicit' : 'title_fallback',
        ogDescription: explicit?.ogDescription ? 'explicit' : 'description_fallback',
        ogImage: ogImgRes.source,
        twitterCard: explicit?.twitterCard ? 'explicit' : 'site_default',
        structuredData: explicit?.structuredData ? 'explicit' : structuredData ? 'generated' : 'none'
      }
    };
  }
}
