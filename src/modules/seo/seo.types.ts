/**
 * Module 26: SEO Management System — Domain Types & DTOs
 * Lagoree Arts Luxury E-Commerce Backend
 */

export type SeoEntityType =
  | 'PRODUCT'
  | 'CATEGORY'
  | 'COLLECTION'
  | 'ARTIST'
  | 'JOURNAL_POST'
  | 'LOOKBOOK'
  | 'SANSKRIT_EDIT'
  | 'ANTIQUE'
  | 'HOMEPAGE'
  | 'PAGE';

export interface SeoMetadataModel {
  id: string;
  entityType: SeoEntityType;
  entityId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterCard: string | null;
  structuredData: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoSiteSettingsModel {
  id: string;
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  defaultRobots: string;
  canonicalBaseUrl: string;
  twitterCard: string;
  organizationName: string;
  organizationLogo: string;
  organizationUrl: string;
  updatedAt: Date;
}

export interface UpsertSeoMetadataDto {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  twitterCard?: string | null;
  structuredData?: any | null;
}

export interface UpdateSeoSiteSettingsDto {
  siteName?: string;
  defaultTitle?: string;
  titleTemplate?: string;
  defaultMetaDescription?: string;
  defaultOgImage?: string;
  defaultRobots?: string;
  canonicalBaseUrl?: string;
  twitterCard?: string;
  organizationName?: string;
  organizationLogo?: string;
  organizationUrl?: string;
}

export interface AdminSeoFilterQuery {
  entityType?: SeoEntityType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ResolvedSeoView {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: string;
  structuredData: any | null;
}

export interface LightweightStorefrontSeoView {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
}

export interface AdminSeoPreviewView {
  entity: {
    type: SeoEntityType;
    id: string;
    titleOrName?: string;
    slug?: string;
    isPublic: boolean;
    status?: string;
  };
  explicitMetadata: SeoMetadataModel | null;
  resolvedSeo: ResolvedSeoView;
  sources: {
    title: 'explicit' | 'fallback' | 'site_default';
    description: 'explicit' | 'fallback' | 'site_default';
    canonicalUrl: 'explicit' | 'generated';
    robots: 'explicit' | 'system_enforced' | 'site_default';
    ogTitle: 'explicit' | 'title_fallback';
    ogDescription: 'explicit' | 'description_fallback';
    ogImage: 'explicit' | 'entity_media' | 'site_default';
    twitterCard: 'explicit' | 'site_default';
    structuredData: 'explicit' | 'generated' | 'none';
  };
}

export interface SitemapItem {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}
