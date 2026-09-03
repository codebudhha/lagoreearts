export type HomepageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type HomepageSectionType =
  | 'HERO'
  | 'FEATURED_COLLECTIONS'
  | 'FEATURED_PRODUCTS'
  | 'FEATURED_ARTISTS'
  | 'CATEGORIES'
  | 'ANTIQUES'
  | 'SANSKRIT_EDIT'
  | 'EDITORIAL'
  | 'IMAGE_BANNER'
  | 'PROMOTIONAL_BANNER'
  | 'SPACER';

export type HomepageSectionMediaRole = 'PRIMARY' | 'MOBILE' | 'BACKGROUND' | 'GALLERY';

export interface HeroSectionConfig {
  headline?: string;
  subheadline?: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  textAlignment?: 'left' | 'center' | 'right';
  overlayOpacity?: number;
  textColor?: string;
  overlayColor?: string;
  layout?: 'full-width' | 'split' | 'contained';
}

export interface FeaturedProductsSectionConfig {
  layout?: 'grid' | 'carousel' | 'masonry';
  columns?: number;
  maxItems?: number;
  showPrice?: boolean;
  showArtist?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface FeaturedCollectionsSectionConfig {
  layout?: 'grid' | 'carousel' | 'spotlight';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface FeaturedArtistsSectionConfig {
  layout?: 'grid' | 'carousel' | 'editorial';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CategoriesSectionConfig {
  layout?: 'grid' | 'circles' | 'cards';
  columns?: number;
  maxItems?: number;
  showCount?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface AntiquesSectionConfig {
  selectionMode?: 'MANUAL' | 'AUTOMATIC';
  layout?: 'curator-picks' | 'grid' | 'carousel';
  columns?: number;
  maxItems?: number;
  showEra?: boolean;
  showProvenance?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface SanskritEditSectionConfig {
  selectionMode?: 'MANUAL' | 'AUTOMATIC';
  layout?: 'editorial-spotlight' | 'grid' | 'carousel';
  columns?: number;
  maxItems?: number;
  showTranslation?: boolean;
  showDevanagari?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface EditorialSectionConfig {
  layout?: 'left-image' | 'right-image' | 'center' | 'full-quote';
  alignment?: 'left' | 'center' | 'right';
  ctaLabel?: string;
  ctaUrl?: string;
  quoteAuthor?: string;
}

export interface ImageBannerSectionConfig {
  layout?: 'full-width' | 'contained' | 'split';
  alignment?: 'left' | 'center' | 'right';
  ctaLabel?: string;
  ctaUrl?: string;
  overlayOpacity?: number;
}

export interface PromotionalBannerSectionConfig {
  theme?: 'dark' | 'light' | 'gold' | 'royal-saffron';
  alignment?: 'left' | 'center' | 'right';
  ctaLabel?: string;
  ctaUrl?: string;
  dismissible?: boolean;
}

export interface SpacerSectionConfig {
  height?: number;
  desktopHeight?: number;
  mobileHeight?: number;
}

export type SectionConfig =
  | HeroSectionConfig
  | FeaturedProductsSectionConfig
  | FeaturedCollectionsSectionConfig
  | FeaturedArtistsSectionConfig
  | CategoriesSectionConfig
  | AntiquesSectionConfig
  | SanskritEditSectionConfig
  | EditorialSectionConfig
  | ImageBannerSectionConfig
  | PromotionalBannerSectionConfig
  | SpacerSectionConfig
  | Record<string, any>;

export interface CreateHomepageInput {
  name: string;
  slug?: string;
  status?: HomepageStatus;
  isDefault?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageId?: string;
}

export interface UpdateHomepageInput {
  name?: string;
  slug?: string;
  status?: HomepageStatus;
  isDefault?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageId?: string;
}

export interface HomepageFilterQuery {
  page?: number;
  limit?: number;
  status?: HomepageStatus;
  isDefault?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'isDefault';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateHomepageSectionInput {
  type: HomepageSectionType;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  content?: string;
  config?: SectionConfig;
  displayOrder?: number;
  isVisible?: boolean;
}

export interface UpdateHomepageSectionInput {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  content?: string;
  config?: SectionConfig;
  displayOrder?: number;
  isVisible?: boolean;
  type?: HomepageSectionType;
}

export interface SectionReorderItem {
  id: string;
  displayOrder: number;
}

export interface SectionItemReorderInput {
  id: string;
  displayOrder?: number;
}

export interface AttachSectionMediaInput {
  mediaId: string;
  role?: HomepageSectionMediaRole;
  displayOrder?: number;
}

export interface SectionMediaReorderItem {
  mediaId: string;
  role: HomepageSectionMediaRole;
  displayOrder: number;
}
