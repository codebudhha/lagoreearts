import { apiClient } from './client';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number | null;
  inventoryTracking?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder: number;
  optionValues?: Array<{
    optionId: string;
    optionName: string;
    valueId: string;
    valueName: string;
  }>;
  media?: Array<{ id: string; url: string; isPrimary: boolean }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttributeAssignment {
  attributeId: string;
  attributeSlug?: string;
  attributeName?: string;
  attributeType?: string;
  valueId?: string | null;
  valueIds?: string[] | null;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  value?: any;
}

export interface AdminProduct {
  id: string;
  name: string;
  title?: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  productType: 'SIMPLE' | 'VARIABLE';
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  inventoryTracking?: boolean;
  allowBackorder: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  sortOrder: number;
  categoryId: string;
  category?: { id: string; name: string; slug: string } | null;
  collections?: Array<{ id: string; name: string; slug: string; isFeatured?: boolean }>;
  attributes?: ProductAttributeAssignment[];
  variants?: ProductVariant[];
  media?: Array<{
    id: string;
    mediaId?: string;
    url: string;
    isPrimary: boolean;
    altText?: string;
    sortOrder?: number;
  }>;
  image?: string | null;
  thumbnail?: string | null;
  bannerImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  status?: string;
  productType?: string;
  search?: string;
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
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

export interface CreateProductPayload {
  name: string;
  sku: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  currency?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  productType?: 'SIMPLE' | 'VARIABLE';
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  sortOrder?: number;
  categoryId: string;
  collectionIds?: string[];
  attributes?: ProductAttributeAssignment[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export const productsApi = {
  list: async (params?: ListProductsParams): Promise<ListProductsResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.productType) searchParams.set('productType', params.productType);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.collectionId) searchParams.set('collectionId', params.collectionId);
    if (params?.isFeatured !== undefined) searchParams.set('isFeatured', String(params.isFeatured));
    if (params?.isNewArrival !== undefined) searchParams.set('isNewArrival', String(params.isNewArrival));
    if (params?.isBestseller !== undefined) searchParams.set('isBestseller', String(params.isBestseller));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/products${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data || {};
    const rawProducts = data.products || (Array.isArray(data) ? data : []);
    
    // Normalize products so `title` and `name` are always accessible
    const products: AdminProduct[] = rawProducts.map((p: any) => ({
      ...p,
      title: p.title || p.name,
      name: p.name || p.title,
    }));

    const total = data.total ?? res.pagination?.total ?? products.length;
    const page = data.page ?? res.pagination?.page ?? (params?.page || 1);
    const limit = data.limit ?? res.pagination?.limit ?? (params?.limit || 10);
    const totalPages = data.totalPages ?? res.pagination?.totalPages ?? Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  },

  getById: async (id: string): Promise<AdminProduct> => {
    const res = await apiClient<any>(`/admin/products/${id}`);
    const p = res.data;
    return {
      ...p,
      title: p.title || p.name,
      name: p.name || p.title,
    };
  },

  create: async (payload: CreateProductPayload): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: UpdateProductPayload): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (id: string, status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  updateFeatured: async (id: string, isFeatured: boolean): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>(`/admin/products/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ isFeatured }),
    });
    return res.data;
  },

  updateSortOrder: async (id: string, sortOrder: number): Promise<AdminProduct> => {
    const res = await apiClient<AdminProduct>(`/admin/products/${id}/sort`, {
      method: 'PATCH',
      body: JSON.stringify({ sortOrder }),
    });
    return res.data;
  },

  // Collections
  getCollections: async (id: string): Promise<any[]> => {
    const res = await apiClient<any[]>(`/admin/products/${id}/collections`);
    return res.data;
  },

  setCollections: async (id: string, collectionIds: string[]): Promise<any[]> => {
    const res = await apiClient<any[]>(`/admin/products/${id}/collections`, {
      method: 'PUT',
      body: JSON.stringify({ collectionIds }),
    });
    return res.data;
  },

  addCollection: async (id: string, collectionId: string): Promise<any[]> => {
    const res = await apiClient<any[]>(`/admin/products/${id}/collections`, {
      method: 'POST',
      body: JSON.stringify({ collectionId }),
    });
    return res.data;
  },

  removeCollection: async (id: string, collectionId: string): Promise<void> => {
    await apiClient(`/admin/products/${id}/collections/${collectionId}`, {
      method: 'DELETE',
    });
  },

  // Attributes
  getAttributes: async (id: string): Promise<ProductAttributeAssignment[]> => {
    const res = await apiClient<ProductAttributeAssignment[]>(`/admin/products/${id}/attributes`);
    return res.data;
  },

  setAttributes: async (id: string, attributes: ProductAttributeAssignment[]): Promise<ProductAttributeAssignment[]> => {
    const res = await apiClient<ProductAttributeAssignment[]>(`/admin/products/${id}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ attributes }),
    });
    return res.data;
  },
};
