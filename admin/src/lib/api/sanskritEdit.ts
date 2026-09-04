/**
 * The Sanskrit Edit API Client
 * Lagoree Arts Admin Panel
 */

import { apiClient } from './client';

export interface SanskritEditProfile {
  id: string;
  productId: string;
  sanskritTitle?: string | null;
  devanagariText?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  pronunciation?: string | null;
  pronunciationGuide?: string | null;
  source?: string | null;
  sourceReference?: string | null;
  theme?: string | null;
  context?: string | null;
  editorialContent?: string | null;
  featuredExcerpt?: string | null;
  featuredExcerptTranslation?: string | null;
  editorialNote?: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    status: string;
    image?: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    collections?: Array<{
      collection?: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
}

export interface CreateSanskritEditProfilePayload {
  sanskritTitle?: string | null;
  devanagariText?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  pronunciation?: string | null;
  pronunciationGuide?: string | null;
  source?: string | null;
  sourceReference?: string | null;
  theme?: string | null;
  context?: string | null;
  editorialContent?: string | null;
  featuredExcerpt?: string | null;
  featuredExcerptTranslation?: string | null;
  editorialNote?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface UpdateSanskritEditProfilePayload {
  sanskritTitle?: string | null;
  devanagariText?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  pronunciation?: string | null;
  pronunciationGuide?: string | null;
  source?: string | null;
  sourceReference?: string | null;
  theme?: string | null;
  context?: string | null;
  editorialContent?: string | null;
  featuredExcerpt?: string | null;
  featuredExcerptTranslation?: string | null;
  editorialNote?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface SanskritEditReorderItem {
  productId: string;
  displayOrder: number;
}

export interface ListSanskritEditParams {
  page?: number;
  limit?: number;
  search?: string;
  theme?: string;
  source?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  categoryId?: string;
  collectionId?: string;
  status?: string;
  sortBy?: 'displayOrder' | 'createdAt' | 'updatedAt' | 'sanskritTitle' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ListSanskritEditResponseData {
  data: SanskritEditProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sanskritEditApi = {
  /**
   * List Sanskrit Edit profiles with pagination and filters
   */
  list: async (params?: ListSanskritEditParams): Promise<ListSanskritEditResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.theme) searchParams.set('theme', params.theme);
    if (params?.source) searchParams.set('source', params.source);
    if (params?.isFeatured !== undefined) searchParams.set('isFeatured', String(params.isFeatured));
    if (params?.isPublished !== undefined) searchParams.set('isPublished', String(params.isPublished));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.collectionId) searchParams.set('collectionId', params.collectionId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/sanskrit-edit${queryStr ? `?${queryStr}` : ''}`;
    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: SanskritEditProfile[] = Array.isArray(data) ? data : data?.items || [];
    const total = res.pagination?.total ?? data?.pagination?.total ?? (data?.total || items.length);
    const page = res.pagination?.page ?? data?.pagination?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? data?.pagination?.limit ?? (params?.limit || 20);
    const totalPages =
      res.pagination?.totalPages ??
      data?.pagination?.totalPages ??
      Math.max(1, Math.ceil(total / limit));

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Get Sanskrit Edit profile for a product
   */
  getProfile: async (productId: string): Promise<SanskritEditProfile> => {
    const res = await apiClient<SanskritEditProfile>(`/admin/products/${productId}/sanskrit-edit`);
    return res.data;
  },

  /**
   * Create Sanskrit Edit profile for a product
   */
  createProfile: async (productId: string, payload: CreateSanskritEditProfilePayload): Promise<SanskritEditProfile> => {
    const res = await apiClient<SanskritEditProfile>(`/admin/products/${productId}/sanskrit-edit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update Sanskrit Edit profile for a product
   */
  updateProfile: async (productId: string, payload: UpdateSanskritEditProfilePayload): Promise<SanskritEditProfile> => {
    const res = await apiClient<SanskritEditProfile>(`/admin/products/${productId}/sanskrit-edit`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Delete Sanskrit Edit profile for a product
   */
  deleteProfile: async (productId: string): Promise<void> => {
    await apiClient<void>(`/admin/products/${productId}/sanskrit-edit`, {
      method: 'DELETE',
    });
  },

  /**
   * Reorder Sanskrit Edit profiles
   */
  reorder: async (items: SanskritEditReorderItem[]): Promise<void> => {
    await apiClient<void>('/admin/sanskrit-edit/order', {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },
};
