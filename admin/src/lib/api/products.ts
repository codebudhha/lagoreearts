import { apiClient } from './client';

export interface ProductVariant {
  id: string;
  sku: string;
  price?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  inventoryTracking?: boolean;
}

export interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  stockQuantity: number;
  lowStockThreshold: number;
  inventoryTracking: boolean;
  isFeatured: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  type?: 'SIMPLE' | 'VARIABLE';
  category?: { id: string; name: string; slug: string } | null;
  variants?: ProductVariant[];
  media?: Array<{ id: string; url: string; isPrimary: boolean; altText?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  categoryId?: string;
  collectionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListProductsResponseData {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productsApi = {
  list: async (params?: ListProductsParams): Promise<ListProductsResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoryId) searchParams.set('category', params.categoryId);
    if (params?.collectionId) searchParams.set('collection', params.collectionId);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/products${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const products = res.data?.products || (Array.isArray(res.data) ? res.data : []);
    const total = res.pagination?.total ?? res.data?.total ?? products.length;
    const page = res.pagination?.page ?? res.data?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? res.data?.limit ?? (params?.limit || 10);
    const totalPages = res.pagination?.totalPages ?? res.data?.totalPages ?? Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  },

  getById: async (id: string): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>(`/admin/products/${id}`);
    return res.data;
  },
};
