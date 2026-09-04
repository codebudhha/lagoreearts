import { apiClient } from './client';

export type LookbookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type LookbookSectionType =
  | 'HERO' | 'EDITORIAL' | 'PRODUCTS' | 'COLLECTIONS' | 'ARTISTS'
  | 'CATEGORIES' | 'JOURNAL' | 'SANSKRIT_EDIT' | 'GALLERY' | 'MIXED';

export type LookbookSectionMediaRole = 'PRIMARY' | 'BACKGROUND' | 'GALLERY' | 'MOBILE' | 'DESKTOP' | 'OG';

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

export type SectionConfig =
  | HeroSectionConfig | EditorialSectionConfig | ProductsSectionConfig
  | CollectionsSectionConfig | ArtistsSectionConfig | CategoriesSectionConfig
  | JournalSectionConfig | SanskritEditSectionConfig | GallerySectionConfig
  | MixedSectionConfig | Record<string, any>;

export interface LookbookSectionMedia {
  lookbookSectionId: string;
  mediaAssetId: string;
  role: LookbookSectionMediaRole;
  sortOrder: number;
  isPrimary: boolean;
  media?: { id: string; url: string; thumbnailUrl?: string | null; filename?: string; originalFilename?: string; altText?: string | null; };
}

export interface LookbookSectionProduct { productId: string; displayOrder: number; product?: { id: string; title: string; slug: string; price: number; status: string; featuredImage?: { url: string } | null; }; }
export interface LookbookSectionCollection { collectionId: string; displayOrder: number; collection?: { id: string; name: string; slug: string; status: string; coverImage?: { url: string } | null; }; }
export interface LookbookSectionArtist { artistId: string; displayOrder: number; artist?: { id: string; name: string; slug: string; status: string; profileImage?: { url: string } | null; }; }
export interface LookbookSectionCategory { categoryId: string; displayOrder: number; category?: { id: string; name: string; slug: string; status: string; }; }
export interface LookbookSectionJournal { journalPostId: string; displayOrder: number; journalPost?: { id: string; title: string; slug: string; status: string; featuredImage?: { url: string } | null; }; }
export interface LookbookSectionSanskritEdit { sanskritEditProfileId: string; displayOrder: number; sanskritEditProfile?: { id: string; title: string; product?: { slug: string }; }; }

export interface LookbookSection {
  id: string;
  lookbookId: string;
  type: LookbookSectionType;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  displayOrder: number;
  isVisible: boolean;
  layout?: string | null;
  config?: SectionConfig;
  createdAt: string;
  updatedAt: string;
  media?: LookbookSectionMedia[];
  products?: LookbookSectionProduct[];
  collections?: LookbookSectionCollection[];
  artists?: LookbookSectionArtist[];
  categories?: LookbookSectionCategory[];
  journals?: LookbookSectionJournal[];
  sanskritEdits?: LookbookSectionSanskritEdit[];
}

export interface Lookbook {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  status: LookbookStatus;
  featured: boolean;
  coverMediaId?: string | null;
  displayOrder: number;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  createdAt: string;
  updatedAt: string;
  coverMedia?: { id: string; url: string; thumbnailUrl?: string | null; filename?: string; } | null;
  sections?: LookbookSection[];
  _count?: { sections: number; };
}

export type AdminLookbook = Lookbook;
export type AdminLookbookSection = LookbookSection;

export interface CreateLookbookPayload {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  status?: LookbookStatus;
  featured?: boolean;
  coverMediaId?: string;
  displayOrder?: number;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface UpdateLookbookPayload {
  title?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  status?: LookbookStatus;
  featured?: boolean;
  coverMediaId?: string | null;
  displayOrder?: number;
  publishedAt?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface LookbookFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LookbookStatus;
  featured?: boolean;
  sortBy?: 'displayOrder' | 'title' | 'publishedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLookbookSectionPayload {
  type: LookbookSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  displayOrder?: number;
  isVisible?: boolean;
  layout?: string;
  config?: SectionConfig;
}

export interface UpdateLookbookSectionPayload {
  type?: LookbookSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  displayOrder?: number;
  isVisible?: boolean;
  layout?: string;
  config?: SectionConfig;
}

export const lookbookSectionTypes: { value: LookbookSectionType; label: string }[] = [
  { value: 'HERO', label: 'Hero Banner' },
  { value: 'EDITORIAL', label: 'Editorial Narrative' },
  { value: 'PRODUCTS', label: 'Products Showcase' },
  { value: 'COLLECTIONS', label: 'Collections Showcase' },
  { value: 'ARTISTS', label: 'Artists Showcase' },
  { value: 'CATEGORIES', label: 'Categories Grid' },
  { value: 'JOURNAL', label: 'Journal Posts' },
  { value: 'SANSKRIT_EDIT', label: 'Sanskrit Edit' },
  { value: 'GALLERY', label: 'Media Gallery' },
  { value: 'MIXED', label: 'Mixed Content' },
];

export const lookbookSectionMediaRoles: { value: LookbookSectionMediaRole; label: string }[] = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'BACKGROUND', label: 'Background' },
  { value: 'GALLERY', label: 'Gallery' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'OG', label: 'Open Graph' },
];

export const lookbookApi = {
  async getLookbooks(params?: LookbookFilterParams): Promise<{ items: AdminLookbook[]; pagination: { total: number; page: number; limit: number; totalPages: number; } }> {
    const res = await apiClient('/admin/lookbooks', { params });
    return res.data;
  },

  async getLookbook(id: string): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}`);
    return res.data;
  },

  async createLookbook(payload: CreateLookbookPayload): Promise<AdminLookbook> {
    const res = await apiClient('/admin/lookbooks', { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async updateLookbook(id: string, payload: UpdateLookbookPayload): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return res.data;
  },

  async deleteLookbook(id: string): Promise<void> {
    await apiClient(`/admin/lookbooks/${id}`, { method: 'DELETE' });
  },

  async duplicateLookbook(id: string): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}/duplicate`, { method: 'POST' });
    return res.data;
  },

  async publishLookbook(id: string, publishedAt?: string): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}/publish`, { method: 'POST', body: JSON.stringify(publishedAt ? { publishedAt } : {}) });
    return res.data;
  },

  async unpublishLookbook(id: string): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}/unpublish`, { method: 'POST' });
    return res.data;
  },

  async archiveLookbook(id: string): Promise<AdminLookbook> {
    const res = await apiClient(`/admin/lookbooks/${id}/archive`, { method: 'POST' });
    return res.data;
  },

  async getSections(lookbookId: string): Promise<AdminLookbookSection[]> {
    const res = await apiClient(`/admin/lookbooks/${lookbookId}/sections`);
    return res.data;
  },

  async createSection(lookbookId: string, payload: CreateLookbookSectionPayload): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/${lookbookId}/sections`, { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async updateSection(sectionId: string, payload: UpdateLookbookSectionPayload): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return res.data;
  },

  async deleteSection(sectionId: string): Promise<void> {
    await apiClient(`/admin/lookbooks/sections/${sectionId}`, { method: 'DELETE' });
  },

  async reorderSections(lookbookId: string, items: Array<{ id: string; displayOrder: number }>): Promise<void> {
    await apiClient(`/admin/lookbooks/${lookbookId}/sections/reorder`, { method: 'POST', body: JSON.stringify({ items }) });
  },

  async setSectionProducts(sectionId: string, products: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/products`, { method: 'PUT', body: JSON.stringify({ products }) });
    return res.data;
  },

  async setSectionCollections(sectionId: string, collections: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/collections`, { method: 'PUT', body: JSON.stringify({ collections }) });
    return res.data;
  },

  async setSectionArtists(sectionId: string, artists: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/artists`, { method: 'PUT', body: JSON.stringify({ artists }) });
    return res.data;
  },

  async setSectionCategories(sectionId: string, categories: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/categories`, { method: 'PUT', body: JSON.stringify({ categories }) });
    return res.data;
  },

  async setSectionJournals(sectionId: string, journals: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/journals`, { method: 'PUT', body: JSON.stringify({ journals }) });
    return res.data;
  },

  async setSectionSanskritEdits(sectionId: string, sanskritEdits: Array<{ id: string; displayOrder?: number }>): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/sanskrit-edits`, { method: 'PUT', body: JSON.stringify({ sanskritEdits }) });
    return res.data;
  },

  async attachSectionMedia(sectionId: string, payload: { mediaId: string; role?: LookbookSectionMediaRole; sortOrder?: number; isPrimary?: boolean }): Promise<AdminLookbookSection> {
    const res = await apiClient(`/admin/lookbooks/sections/${sectionId}/media`, { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async detachSectionMedia(sectionId: string, mediaId: string, role: LookbookSectionMediaRole): Promise<void> {
    await apiClient(`/admin/lookbooks/sections/${sectionId}/media/${mediaId}/${role}`, { method: 'DELETE' });
  },

  async reorderSectionMedia(sectionId: string, items: Array<{ mediaId: string; role: LookbookSectionMediaRole; sortOrder: number; isPrimary?: boolean }>): Promise<void> {
    await apiClient(`/admin/lookbooks/sections/${sectionId}/media/reorder`, { method: 'PUT', body: JSON.stringify({ items }) });
  },

  async setSectionPrimaryMedia(sectionId: string, mediaId: string, role: LookbookSectionMediaRole): Promise<void> {
    await apiClient(`/admin/lookbooks/sections/${sectionId}/media/primary`, { method: 'PUT', body: JSON.stringify({ mediaId, role }) });
  },
};
