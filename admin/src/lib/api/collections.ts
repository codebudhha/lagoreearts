import { apiClient } from './client';
import { AdminProduct, ListProductsParams, ListProductsResponseData } from './products';
import { AttachedMedia } from './media';

export type CollectionStatus = 'ACTIVE' | 'INACTIVE';
export type CollectionType = 'MANUAL' | 'SYSTEM';

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  heroTitle?: string | null;
  heroDescription?: string | null;
  status: CollectionStatus;
  type: CollectionType;
  isFeatured: boolean;
  sortOrder: number;
  productCount?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListCollectionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  featured?: boolean | string;
  sort?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface ListCollectionsResponseData {
  items: AdminCollection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCollectionPayload {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  heroTitle?: string;
  heroDescription?: string;
  status?: CollectionStatus;
  type?: CollectionType;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateCollectionPayload extends Partial<CreateCollectionPayload> {}

export interface AttachCollectionMediaPayload {
  mediaId: string;
  role?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ReorderCollectionMediaPayload {
  mediaOrders: Array<{ mediaId: string; sortOrder: number }>;
}

export const collectionsApi = {
  list: async (params?: ListCollectionsParams): Promise<ListCollectionsResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.featured !== undefined && params.featured !== '') {
      searchParams.set('featured', String(params.featured));
    }
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/collections${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: AdminCollection[] = Array.isArray(data)
      ? data
      : data?.items || data?.collections || [];

    const total = res.pagination?.total ?? data?.pagination?.total ?? items.length;
    const page = res.pagination?.page ?? data?.pagination?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? data?.pagination?.limit ?? (params?.limit || 20);
    const totalPages =
      res.pagination?.totalPages ??
      data?.pagination?.totalPages ??
      Math.max(1, Math.ceil(total / limit));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  getById: async (id: string): Promise<AdminCollection> => {
    const res = await apiClient<AdminCollection>(`/admin/collections/${id}`);
    return res.data;
  },

  create: async (payload: CreateCollectionPayload): Promise<AdminCollection> => {
    const res = await apiClient<AdminCollection>('/admin/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: UpdateCollectionPayload): Promise<AdminCollection> => {
    const res = await apiClient<AdminCollection>(`/admin/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateSort: async (id: string, sortOrder: number): Promise<AdminCollection> => {
    const res = await apiClient<AdminCollection>(`/admin/collections/${id}/sort`, {
      method: 'PATCH',
      body: JSON.stringify({ sortOrder }),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/collections/${id}`, {
      method: 'DELETE',
    });
  },

  // Assigned products methods
  getAssignedProducts: async (
    collectionId: string,
    params?: ListProductsParams
  ): Promise<ListProductsResponseData> => {
    const searchParams = new URLSearchParams();
    searchParams.set('collectionId', collectionId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/products${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const products: AdminProduct[] = Array.isArray(data)
      ? data
      : data?.products || data?.items || [];
    const total = res.pagination?.total ?? data?.total ?? products.length;
    const page = res.pagination?.page ?? data?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? data?.limit ?? (params?.limit || 20);
    const totalPages =
      res.pagination?.totalPages ??
      data?.totalPages ??
      Math.max(1, Math.ceil(total / limit));

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  },

  assignProduct: async (collectionId: string, productId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/collections`, {
      method: 'POST',
      body: JSON.stringify({ collectionId }),
    });
  },

  removeProduct: async (collectionId: string, productId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/collections/${collectionId}`, {
      method: 'DELETE',
    });
  },

  // Collection Media
  getMedia: async (collectionId: string): Promise<AttachedMedia[]> => {
    const res = await apiClient<any>(`/admin/collections/${collectionId}/media`);
    const data = res.data;
    const list = Array.isArray(data) ? data : data?.media || [];
    return list.map((item: any, idx: number) => ({
      id: item.id || item.mediaId || `col-media-${idx}`,
      mediaId: item.mediaId || item.id,
      url: item.url || item.media?.url,
      thumbnailUrl: item.thumbnailUrl || item.media?.thumbnailUrl || item.url,
      isPrimary: Boolean(item.isPrimary),
      altText: item.altText || item.media?.altText,
      sortOrder: item.sortOrder ?? idx + 1,
      filename: item.filename || item.media?.originalFilename,
    }));
  },

  attachMedia: async (
    collectionId: string,
    payload: AttachCollectionMediaPayload
  ): Promise<AttachedMedia> => {
    const res = await apiClient<any>(`/admin/collections/${collectionId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  detachMedia: async (collectionId: string, mediaId: string): Promise<void> => {
    await apiClient(`/admin/collections/${collectionId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  reorderMedia: async (
    collectionId: string,
    mediaOrders: Array<{ mediaId: string; sortOrder: number }>
  ): Promise<AttachedMedia[]> => {
    const res = await apiClient<any>(`/admin/collections/${collectionId}/media/order`, {
      method: 'PUT',
      body: JSON.stringify({ mediaOrders }),
    });
    return res.data;
  },
};
