/**
 * Module 26: SEO Management System — Serialization & JSON-LD Schemas
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type {
  ResolvedSeoView,
  LightweightStorefrontSeoView,
  AdminSeoPreviewView,
  SeoMetadataModel,
  SeoSiteSettingsModel
} from './seo.types.ts';

export class SeoSerializer {
  /**
   * Serialize public SEO payload (safe for storefront HTML head tags)
   */
  static serializePublicSeo(resolved: ResolvedSeoView): ResolvedSeoView {
    return {
      title: resolved.title,
      description: resolved.description,
      canonicalUrl: resolved.canonicalUrl,
      robots: resolved.robots,
      ogTitle: resolved.ogTitle,
      ogDescription: resolved.ogDescription,
      ogImage: resolved.ogImage,
      twitterTitle: resolved.twitterTitle,
      twitterDescription: resolved.twitterDescription,
      twitterImage: resolved.twitterImage,
      twitterCard: resolved.twitterCard,
      structuredData: resolved.structuredData
    };
  }

  /**
   * Serialize lightweight SEO block embedded in product/entity responses
   */
  static serializeLightweightSeo(resolved: ResolvedSeoView): LightweightStorefrontSeoView {
    return {
      title: resolved.title,
      description: resolved.description,
      canonicalUrl: resolved.canonicalUrl,
      robots: resolved.robots,
      ogTitle: resolved.ogTitle,
      ogDescription: resolved.ogDescription,
      ogImage: resolved.ogImage,
      twitterCard: resolved.twitterCard
    };
  }

  /**
   * Serialize admin preview diagnostic view
   */
  static serializeAdminPreview(preview: AdminSeoPreviewView): any {
    return {
      entity: preview.entity,
      explicitMetadata: preview.explicitMetadata
        ? {
            id: preview.explicitMetadata.id,
            entityType: preview.explicitMetadata.entityType,
            entityId: preview.explicitMetadata.entityId,
            metaTitle: preview.explicitMetadata.metaTitle,
            metaDescription: preview.explicitMetadata.metaDescription,
            canonicalUrl: preview.explicitMetadata.canonicalUrl,
            robots: preview.explicitMetadata.robots,
            ogTitle: preview.explicitMetadata.ogTitle,
            ogDescription: preview.explicitMetadata.ogDescription,
            ogImage: preview.explicitMetadata.ogImage,
            twitterTitle: preview.explicitMetadata.twitterTitle,
            twitterDescription: preview.explicitMetadata.twitterDescription,
            twitterImage: preview.explicitMetadata.twitterImage,
            twitterCard: preview.explicitMetadata.twitterCard,
            structuredData: preview.explicitMetadata.structuredData
              ? typeof preview.explicitMetadata.structuredData === 'string'
                ? JSON.parse(preview.explicitMetadata.structuredData)
                : preview.explicitMetadata.structuredData
              : null,
            createdAt: preview.explicitMetadata.createdAt,
            updatedAt: preview.explicitMetadata.updatedAt
          }
        : null,
      resolvedSeo: preview.resolvedSeo,
      sources: preview.sources
    };
  }

  /**
   * Generate Schema.org Organization JSON-LD
   */
  static generateOrganizationSchema(settings: SeoSiteSettingsModel): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.organizationName || settings.siteName || 'Lagoree Arts',
      url: settings.organizationUrl || settings.canonicalBaseUrl || 'https://lagoreearts.com',
      logo: settings.organizationLogo || `${settings.canonicalBaseUrl}/assets/logo.png`
    };
  }

  /**
   * Generate Schema.org WebSite JSON-LD
   */
  static generateWebSiteSchema(settings: SeoSiteSettingsModel): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.siteName || 'Lagoree Arts',
      url: settings.canonicalBaseUrl || 'https://lagoreearts.com'
    };
  }

  /**
   * Generate Schema.org BreadcrumbList JSON-LD
   */
  static generateBreadcrumbListSchema(items: { name: string; url: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generate Schema.org Product JSON-LD (with strictly Authoritative Data)
   */
  static generateProductSchema(
    product: any,
    reviewSummary: any,
    canonicalUrl: string,
    ogImage: string,
    settings: SeoSiteSettingsModel
  ): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription || product.description || '',
      image: ogImage || product.image || undefined,
      sku: product.sku || undefined,
      brand: {
        '@type': 'Brand',
        name: settings.siteName || 'Lagoree Arts'
      },
      offers: {
        '@type': 'Offer',
        price: Number(product.price || 0),
        priceCurrency: product.currency || 'INR',
        availability:
          (product.stockQuantity ?? 0) > 0 || product.allowBackorder
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: canonicalUrl
      }
    };

    // Attach aggregateRating ONLY when qualifying approved reviews exist
    if (reviewSummary && reviewSummary.totalReviews > 0 && reviewSummary.averageRating > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: reviewSummary.averageRating,
        reviewCount: reviewSummary.totalReviews,
        bestRating: 5,
        worstRating: 1
      };
    }

    return schema;
  }

  /**
   * Generate Schema.org Article / BlogPosting JSON-LD
   */
  static generateArticleSchema(
    post: any,
    canonicalUrl: string,
    ogImage: string,
    settings: SeoSiteSettingsModel
  ): any {
    const authorName = post.author?.name || settings.siteName || 'Lagoree Arts';
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || post.description || '',
      image: ogImage || post.featuredImage || undefined,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Person',
        name: authorName
      },
      publisher: {
        '@type': 'Organization',
        name: settings.siteName || 'Lagoree Arts',
        logo: {
          '@type': 'ImageObject',
          url: settings.organizationLogo || `${settings.canonicalBaseUrl}/assets/logo.png`
        }
      }
    };
  }
}
