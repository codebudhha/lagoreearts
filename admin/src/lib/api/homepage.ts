import { apiClient } from './client';

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
  ctaText?: string;
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
  ctaText?: string;
  ctaUrl?: string;
}

export interface FeaturedCollectionsSectionConfig {
  layout?: 'grid' | 'carousel' | 'spotlight';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface FeaturedArtistsSectionConfig {
  layout?: 'grid' | 'carousel' | 'editorial';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CategoriesSectionConfig {
  layout?: 'grid' | 'pills' | 'cards';
  columns?: number;
  maxItems?: number;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface AntiquesSectionConfig {
  layout?: 'featured' | 'grid' | 'timeline';
  showProvenance?: boolean;
  showCondition?: boolean;
  maxItems?: number;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface SanskritEditSectionConfig {
  layout?: 'spotlight' | 'dual' | 'curated-grid';
  showCategoryPill?: boolean;
  showAuthor?: boolean;
  maxItems?: number;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface EditorialSectionConfig {
  layout?: 'magazine' | 'quote' | 'story-banner';
  authorName?: string;
  authorRole?: string;
  quote?: string;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface BannerSectionConfig {
  bannerType?: 'standard' | 'countdown' | 'announcement';
  backgroundColor?: string;
  textColor?: string;
  ctaLabel?: string;
  ctaText?: string;
  ctaUrl?: string;
  fullWidth?: boolean;
}

export interface SpacerSectionConfig {
  heightPx?: number;
  showDivider?: boolean;
  dividerStyle?: 'solid' | 'dashed' | 'gold-accent';
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
  | BannerSectionConfig
  | SpacerSectionConfig
  | Record<string, any>;

export interface HomepageSectionMedia {
  id?: string;
  sectionId?: string;
  mediaId: string;
  role: HomepageSectionMediaRole;
  displayOrder: number;
  altText?: string | null;
  customUrl?: string | null;
  media?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    filename?: string;
    altText?: string | null;
  };
}

export interface HomepageSectionProduct {
  id?: string;
  sectionId?: string;
  productId: string;
  displayOrder: number;
  product?: {
    id: string;
    title: string;
    sku?: string;
    price?: number;
    thumbnailUrl?: string | null;
    status?: string;
  };
}

export interface HomepageSectionCollection {
  id?: string;
  sectionId?: string;
  collectionId: string;
  displayOrder: number;
  collection?: {
    id: string;
    title: string;
    slug?: string;
    imageUrl?: string | null;
    status?: string;
  };
}

export interface HomepageSectionArtist {
  id?: string;
  sectionId?: string;
  artistId: string;
  displayOrder: number;
  artist?: {
    id: string;
    name: string;
    origin?: string | null;
    avatarUrl?: string | null;
    status?: string;
  };
}

export interface HomepageSectionCategory {
  id?: string;
  sectionId?: string;
  categoryId: string;
  displayOrder: number;
  category?: {
    id: string;
    name: string;
    slug?: string;
    status?: string;
  };
}

export interface HomepageSection {
  id: string;
  homepageId: string;
  type: HomepageSectionType;
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  content?: string | null;
  config?: SectionConfig;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: HomepageSectionMedia[];
  products?: HomepageSectionProduct[];
  collections?: HomepageSectionCollection[];
  artists?: HomepageSectionArtist[];
  categories?: HomepageSectionCategory[];
}

export interface Homepage {
  id: string;
  name: string;
  slug: string;
  status: HomepageStatus;
  isDefault: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageId?: string | null;
  createdAt: string;
  updatedAt: string;
  sections?: HomepageSection[];
  _count?: {
    sections: number;
  };
}

// Synonyms
export type AdminHomepage = Homepage;
export type AdminHomepageSection = HomepageSection;

export interface CreateHomepagePayload {
  name: string;
  slug?: string;
  status?: HomepageStatus;
  isDefault?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageId?: string;
}

export interface UpdateHomepagePayload {
  name?: string;
  slug?: string;
  status?: HomepageStatus;
  isDefault?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageId?: string;
}

export interface HomepageFilterParams {
  page?: number;
  limit?: number;
  status?: HomepageStatus;
  isDefault?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'isDefault';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateHomepageSectionPayload {
  type: HomepageSectionType;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  content?: string;
  config?: SectionConfig;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateHomepageSectionPayload {
  type?: HomepageSectionType;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  content?: string;
  config?: SectionConfig;
  displayOrder?: number;
  isActive?: boolean;
}

// Synonyms
export type CreateSectionPayload = CreateHomepageSectionPayload;
export type UpdateSectionPayload = UpdateHomepageSectionPayload;

export const homepageApi = {
  // Homepage Management
  async getHomepages(params?: HomepageFilterParams): Promise<{ items: AdminHomepage[]; pagination: any }> {
    const res = await apiClient<{ items: AdminHomepage[]; pagination: any }>('/admin/homepage', {
      params,
    });
    return res.data;
  },

  async getHomepage(id: string): Promise<AdminHomepage> {
    const res = await apiClient<AdminHomepage>(`/admin/homepage/${id}`);
    return res.data;
  },

  async createHomepage(payload: CreateHomepagePayload): Promise<AdminHomepage> {
    const res = await apiClient<AdminHomepage>('/admin/homepage', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateHomepage(id: string, payload: UpdateHomepagePayload): Promise<AdminHomepage> {
    const res = await apiClient<AdminHomepage>(`/admin/homepage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteHomepage(id: string): Promise<void> {
    await apiClient<void>(`/admin/homepage/${id}`, {
      method: 'DELETE',
    });
  },

  async updateStatus(id: string, status: HomepageStatus): Promise<AdminHomepage> {
    const res = await apiClient<AdminHomepage>(`/admin/homepage/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async setDefault(id: string): Promise<AdminHomepage> {
    const res = await apiClient<AdminHomepage>(`/admin/homepage/${id}/default`, {
      method: 'PATCH',
    });
    return res.data;
  },

  // Sections Management
  async getSections(homepageId: string): Promise<AdminHomepageSection[]> {
    const res = await apiClient<AdminHomepageSection[]>(`/admin/homepage/${homepageId}/sections`);
    return res.data || [];
  },

  async getSection(homepageId: string, sectionId: string): Promise<AdminHomepageSection> {
    const res = await apiClient<AdminHomepageSection>(
      `/admin/homepage/${homepageId}/sections/${sectionId}`
    );
    return res.data;
  },

  async createSection(homepageId: string, payload: CreateHomepageSectionPayload): Promise<AdminHomepageSection> {
    const res = await apiClient<AdminHomepageSection>(
      `/admin/homepage/${homepageId}/sections`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async updateSection(
    homepageId: string,
    sectionId: string,
    payload: UpdateHomepageSectionPayload
  ): Promise<AdminHomepageSection> {
    const res = await apiClient<AdminHomepageSection>(
      `/admin/homepage/${homepageId}/sections/${sectionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async deleteSection(homepageId: string, sectionId: string): Promise<void> {
    await apiClient<void>(`/admin/homepage/${homepageId}/sections/${sectionId}`, {
      method: 'DELETE',
    });
  },

  async reorderSections(
    homepageId: string,
    items: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    await apiClient<void>(`/admin/homepage/${homepageId}/sections/order`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Section Entity Junctions
  async setSectionProducts(
    homepageId: string,
    sectionId: string,
    products: Array<{ id: string; displayOrder?: number }>
  ): Promise<any> {
    const res = await apiClient(
      `/admin/homepage/${homepageId}/sections/${sectionId}/products`,
      {
        method: 'PUT',
        body: JSON.stringify({ products }),
      }
    );
    return res.data;
  },

  async setSectionCollections(
    homepageId: string,
    sectionId: string,
    collections: Array<{ id: string; displayOrder?: number }>
  ): Promise<any> {
    const res = await apiClient(
      `/admin/homepage/${homepageId}/sections/${sectionId}/collections`,
      {
        method: 'PUT',
        body: JSON.stringify({ collections }),
      }
    );
    return res.data;
  },

  async setSectionArtists(
    homepageId: string,
    sectionId: string,
    artists: Array<{ id: string; displayOrder?: number }>
  ): Promise<any> {
    const res = await apiClient(
      `/admin/homepage/${homepageId}/sections/${sectionId}/artists`,
      {
        method: 'PUT',
        body: JSON.stringify({ artists }),
      }
    );
    return res.data;
  },

  async setSectionCategories(
    homepageId: string,
    sectionId: string,
    categories: Array<{ id: string; displayOrder?: number }>
  ): Promise<any> {
    const res = await apiClient(
      `/admin/homepage/${homepageId}/sections/${sectionId}/categories`,
      {
        method: 'PUT',
        body: JSON.stringify({ categories }),
      }
    );
    return res.data;
  },

  // Section Media
  async attachSectionMedia(
    homepageId: string,
    sectionId: string,
    payload: {
      mediaId: string;
      role?: HomepageSectionMediaRole;
      displayOrder?: number;
      altText?: string;
      customUrl?: string;
    }
  ): Promise<any> {
    const res = await apiClient(
      `/admin/homepage/${homepageId}/sections/${sectionId}/media`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async detachSectionMedia(
    homepageId: string,
    sectionId: string,
    mediaId: string,
    role?: HomepageSectionMediaRole
  ): Promise<void> {
    await apiClient<void>(
      `/admin/homepage/${homepageId}/sections/${sectionId}/media/${mediaId}${role ? `?role=${role}` : ''}`,
      {
        method: 'DELETE',
      }
    );
  },

  async reorderSectionMedia(
    homepageId: string,
    sectionId: string,
    items: Array<{ mediaId: string; role: HomepageSectionMediaRole; displayOrder: number }>
  ): Promise<void> {
    await apiClient<void>(
      `/admin/homepage/${homepageId}/sections/${sectionId}/media/order`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }
    );
  },
};
