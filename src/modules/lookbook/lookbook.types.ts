export type LookbookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type LookbookSectionType =
  | 'HERO'
  | 'EDITORIAL'
  | 'PRODUCTS'
  | 'COLLECTIONS'
  | 'ARTISTS'
  | 'CATEGORIES'
  | 'JOURNAL'
  | 'SANSKRIT_EDIT'
  | 'GALLERY'
  | 'MIXED';

export type LookbookSectionMediaRole =
  | 'PRIMARY'
  | 'BACKGROUND'
  | 'GALLERY'
  | 'MOBILE'
  | 'DESKTOP'
  | 'OG';

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

export interface EditorialSectionConfig {
  layout?: 'left-image' | 'right-image' | 'center' | 'full-quote';
  alignment?: 'left' | 'center' | 'right';
  ctaLabel?: string;
  ctaUrl?: string;
  quoteAuthor?: string;
}

export interface ProductsSectionConfig {
  layout?: 'grid' | 'carousel' | 'masonry' | 'lookbook-spotlight';
  columns?: number;
  maxItems?: number;
  showPrice?: boolean;
  showArtist?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CollectionsSectionConfig {
  layout?: 'grid' | 'carousel' | 'spotlight';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface ArtistsSectionConfig {
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

export interface JournalSectionConfig {
  layout?: 'grid' | 'carousel' | 'featured-lead';
  columns?: number;
  maxItems?: number;
  showExcerpt?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface SanskritEditSectionConfig {
  layout?: 'editorial-spotlight' | 'grid' | 'carousel';
  columns?: number;
  maxItems?: number;
  showTranslation?: boolean;
  showDevanagari?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface GallerySectionConfig {
  layout?: 'masonry' | 'grid' | 'carousel' | 'lightbox';
  columns?: number;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'original';
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface MixedSectionConfig {
  layout?: 'split-story' | 'magazine-spread' | 'curator-choice';
  showEntities?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CreateLookbookDTO {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  status?: LookbookStatus;
  featured?: boolean;
  coverMediaId?: string;
  displayOrder?: number;
  publishedAt?: string | Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface UpdateLookbookDTO {
  title?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  status?: LookbookStatus;
  featured?: boolean;
  coverMediaId?: string | null;
  displayOrder?: number;
  publishedAt?: string | Date | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface LookbookQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: LookbookStatus;
  featured?: boolean;
  sortBy?: 'displayOrder' | 'title' | 'publishedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLookbookSectionDTO {
  lookbookId?: string;
  type?: LookbookSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  displayOrder?: number;
  isVisible?: boolean;
  layout?: string;
  config?: any;
}

export interface UpdateLookbookSectionDTO {
  type?: LookbookSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  displayOrder?: number;
  isVisible?: boolean;
  layout?: string;
  config?: any;
}

export interface ReorderLookbookSectionsDTO {
  items: Array<{ id: string; displayOrder: number }>;
}

export interface AttachLookbookSectionMediaDTO {
  mediaId: string;
  role?: LookbookSectionMediaRole;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ReorderLookbookSectionMediaDTO {
  items: Array<{
    mediaId: string;
    role: LookbookSectionMediaRole;
    sortOrder: number;
    isPrimary?: boolean;
  }>;
}

export interface SetSectionProductsDTO {
  products: Array<{ id: string; displayOrder?: number }>;
}

export interface SetSectionCollectionsDTO {
  collections: Array<{ id: string; displayOrder?: number }>;
}

export interface SetSectionArtistsDTO {
  artists: Array<{ id: string; displayOrder?: number }>;
}

export interface SetSectionCategoriesDTO {
  categories: Array<{ id: string; displayOrder?: number }>;
}

export interface SetSectionJournalsDTO {
  journals: Array<{ id: string; displayOrder?: number }>;
}

export interface SetSectionSanskritEditsDTO {
  sanskritEdits: Array<{ id: string; displayOrder?: number }>;
}
