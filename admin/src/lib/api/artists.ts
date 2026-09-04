/**
 * Artists & Master Makers API Client
 * Lagoree Arts Admin Panel
 */

import { apiClient } from './client';

export type ArtistStatus = 'ACTIVE' | 'INACTIVE';
export type ArtistRole = 'ARTIST' | 'MAKER' | 'DESIGNER' | 'ATTRIBUTED_TO';
export type ArtistMediaRole = 'PROFILE' | 'GALLERY' | 'OG';

export interface Artist {
  id: string;
  name: string;
  slug: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status: ArtistStatus;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  createdAt: string;
  updatedAt: string;
  products?: ProductArtist[];
  media?: ArtistMedia[];
  _count?: {
    products?: number;
    media?: number;
  };
}

export interface ProductArtist {
  productId: string;
  artistId: string;
  role: ArtistRole;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    status: string;
    image?: string | null;
  };
  artist?: Artist;
}

export interface ArtistMedia {
  artistId: string;
  mediaId: string;
  role: ArtistMediaRole;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  media?: {
    id: string;
    publicUrl: string;
    altText?: string | null;
    caption?: string | null;
    title?: string | null;
    width?: number | null;
    height?: number | null;
    mimeType?: string;
  };
}

export interface CreateArtistPayload {
  name: string;
  slug?: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status?: ArtistStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
}

export interface UpdateArtistPayload {
  name?: string;
  slug?: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status?: ArtistStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
}

export interface ListArtistsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ArtistStatus;
  isFeatured?: boolean;
  nationality?: string;
  tradition?: string;
  medium?: string;
  specialization?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListArtistsResponseData {
  data: Artist[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AttachProductArtistPayload {
  artistId: string;
  role?: ArtistRole;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface UpdateProductArtistPayload {
  role?: ArtistRole;
  isPrimary?: boolean;
  sortOrder?: number;
  currentRole?: ArtistRole;
}

export interface ProductArtistReorderItem {
  artistId: string;
  role: ArtistRole;
  sortOrder: number;
}

export interface ArtistReorderItem {
  id: string;
  sortOrder: number;
}

export interface AttachArtistMediaPayload {
  mediaId: string;
  role?: ArtistMediaRole;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ArtistMediaReorderItem {
  mediaId: string;
  role: ArtistMediaRole;
  sortOrder: number;
}

export const artistsApi = {
  /**
   * List artists with pagination and filters
   */
  list: async (params?: ListArtistsParams): Promise<ListArtistsResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.isFeatured !== undefined) searchParams.set('isFeatured', String(params.isFeatured));
    if (params?.nationality) searchParams.set('nationality', params.nationality);
    if (params?.tradition) searchParams.set('tradition', params.tradition);
    if (params?.medium) searchParams.set('medium', params.medium);
    if (params?.specialization) searchParams.set('specialization', params.specialization);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/artists${queryStr ? `?${queryStr}` : ''}`;
    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: Artist[] = Array.isArray(data) ? data : data?.items || data?.artists || [];
    const total = res.pagination?.total ?? data?.pagination?.total ?? (data?.total || items.length);
    const page = res.pagination?.page ?? data?.pagination?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? data?.pagination?.limit ?? (params?.limit || 15);
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
   * Get artist by ID
   */
  getById: async (id: string): Promise<Artist> => {
    const res = await apiClient<Artist>(`/admin/artists/${id}`);
    return res.data;
  },

  /**
   * Create artist
   */
  create: async (payload: CreateArtistPayload): Promise<Artist> => {
    const res = await apiClient<Artist>('/admin/artists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update artist details
   */
  update: async (id: string, payload: UpdateArtistPayload): Promise<Artist> => {
    const res = await apiClient<Artist>(`/admin/artists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Delete artist
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient<{ success: boolean; message: string }>(`/admin/artists/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  /**
   * Update status
   */
  updateStatus: async (id: string, status: ArtistStatus): Promise<Artist> => {
    const res = await apiClient<Artist>(`/admin/artists/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  /**
   * Update featured
   */
  updateFeatured: async (id: string, isFeatured: boolean): Promise<Artist> => {
    const res = await apiClient<Artist>(`/admin/artists/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ isFeatured }),
    });
    return res.data;
  },

  /**
   * Reorder artists
   */
  reorder: async (items: ArtistReorderItem[]): Promise<void> => {
    await apiClient<void>('/admin/artists/order', {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },

  // ==========================================
  // Artist Media APIs
  // ==========================================

  /**
   * List media attached to artist
   */
  listMedia: async (artistId: string): Promise<ArtistMedia[]> => {
    const res = await apiClient<ArtistMedia[]>(`/admin/artists/${artistId}/media`);
    return res.data || [];
  },

  /**
   * Attach media to artist
   */
  attachMedia: async (artistId: string, payload: AttachArtistMediaPayload): Promise<ArtistMedia> => {
    const res = await apiClient<ArtistMedia>(`/admin/artists/${artistId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Set primary media
   */
  setPrimaryMedia: async (artistId: string, mediaId: string, role: string = 'PROFILE'): Promise<ArtistMedia> => {
    const res = await apiClient<ArtistMedia>(`/admin/artists/${artistId}/media/${mediaId}/primary?role=${role}`, {
      method: 'PATCH',
    });
    return res.data;
  },

  /**
   * Detach media from artist
   */
  detachMedia: async (artistId: string, mediaId: string, role: string = 'PROFILE'): Promise<void> => {
    await apiClient<void>(`/admin/artists/${artistId}/media/${mediaId}?role=${role}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reorder artist media
   */
  reorderMedia: async (artistId: string, items: ArtistMediaReorderItem[]): Promise<void> => {
    await apiClient<void>(`/admin/artists/${artistId}/media/order`, {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },

  // ==========================================
  // Product Artists APIs
  // ==========================================

  /**
   * List artists attached to a product
   */
  listProductArtists: async (productId: string): Promise<ProductArtist[]> => {
    const res = await apiClient<ProductArtist[]>(`/admin/products/${productId}/artists`);
    return res.data || [];
  },

  /**
   * Attach artist to product
   */
  attachProductArtist: async (productId: string, payload: AttachProductArtistPayload): Promise<ProductArtist> => {
    const res = await apiClient<ProductArtist>(`/admin/products/${productId}/artists`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update product artist association
   */
  updateProductArtist: async (
    productId: string,
    artistId: string,
    payload: UpdateProductArtistPayload,
    currentRole: ArtistRole = 'ARTIST'
  ): Promise<ProductArtist> => {
    const res = await apiClient<ProductArtist>(
      `/admin/products/${productId}/artists/${artistId}?role=${currentRole}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  /**
   * Detach artist from product
   */
  detachProductArtist: async (productId: string, artistId: string, role: ArtistRole = 'ARTIST'): Promise<void> => {
    await apiClient<void>(`/admin/products/${productId}/artists/${artistId}?role=${role}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reorder product artists
   */
  reorderProductArtists: async (productId: string, items: ProductArtistReorderItem[]): Promise<void> => {
    await apiClient<void>(`/admin/products/${productId}/artists/order`, {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },
};
