import { apiClient } from './client';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  isFeatured?: boolean;
  productCount?: number;
  children?: CategoryTreeNode[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  shortDescription?: string | null;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  bannerImage?: string | null;
  bannerImageAlt?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  sortOrder: number;
  productCount?: number;
  children?: AdminCategory[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttributeBinding {
  id: string;
  categoryId: string;
  attributeId: string;
  sortOrder: number;
  isVisible: boolean;
  isRequired: boolean;
  attribute: {
    id: string;
    name: string;
    slug: string;
    type: 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
    description?: string | null;
    isFilterable: boolean;
    isSystem: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    values?: Array<{
      id: string;
      name: string;
      slug: string;
      sortOrder: number;
      status: 'ACTIVE' | 'INACTIVE';
    }>;
  };
}

export interface CategoryFilterFacetValue {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface CategoryPublicFilterFacet {
  attributeId: string;
  name: string;
  slug: string;
  type: 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
  isRequired?: boolean;
  values?: CategoryFilterFacetValue[];
  range?: {
    min: number;
    max: number;
  };
}

export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  parentId?: string | null;
  featured?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ListCategoriesResponseData {
  items: AdminCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: string | null;
  shortDescription?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  bannerImage?: string;
  bannerImageAlt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {}

export interface AddCategoryAttributePayload {
  attributeId: string;
  sortOrder?: number;
  isVisible?: boolean;
  isRequired?: boolean;
}

export interface UpdateCategoryAttributePayload {
  sortOrder?: number;
  isVisible?: boolean;
  isRequired?: boolean;
}

export const categoriesApi = {
  getTree: async (): Promise<CategoryTreeNode[]> => {
    const res = await apiClient<CategoryTreeNode[]>('/admin/categories/tree');
    return res.data || [];
  },

  list: async (params?: ListCategoriesParams): Promise<ListCategoriesResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.parentId !== undefined) {
      searchParams.set('parentId', params.parentId === null ? 'null' : params.parentId);
    }
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/categories${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: AdminCategory[] = Array.isArray(data)
      ? data
      : data?.items || data?.categories || [];

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

  getById: async (id: string): Promise<AdminCategory> => {
    const res = await apiClient<AdminCategory>(`/admin/categories/${id}`);
    return res.data;
  },

  getChildren: async (id: string): Promise<AdminCategory[]> => {
    const res = await apiClient<AdminCategory[]>(`/admin/categories/${id}/children`);
    return res.data || [];
  },

  getAncestors: async (id: string): Promise<AdminCategory[]> => {
    const res = await apiClient<AdminCategory[]>(`/admin/categories/${id}/ancestors`);
    return res.data || [];
  },

  create: async (payload: CreateCategoryPayload): Promise<AdminCategory> => {
    const res = await apiClient<AdminCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: UpdateCategoryPayload): Promise<AdminCategory> => {
    const res = await apiClient<AdminCategory>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Category Attribute Bindings
  getCategoryAttributes: async (categoryId: string): Promise<CategoryAttributeBinding[]> => {
    const res = await apiClient<CategoryAttributeBinding[]>(
      `/admin/categories/${categoryId}/attributes`
    );
    return res.data || [];
  },

  addCategoryAttribute: async (
    categoryId: string,
    payload: AddCategoryAttributePayload
  ): Promise<CategoryAttributeBinding> => {
    const res = await apiClient<CategoryAttributeBinding>(
      `/admin/categories/${categoryId}/attributes`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  updateCategoryAttribute: async (
    categoryId: string,
    attributeId: string,
    payload: UpdateCategoryAttributePayload
  ): Promise<CategoryAttributeBinding> => {
    const res = await apiClient<CategoryAttributeBinding>(
      `/admin/categories/${categoryId}/attributes/${attributeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  removeCategoryAttribute: async (categoryId: string, attributeId: string): Promise<void> => {
    await apiClient(`/admin/categories/${categoryId}/attributes/${attributeId}`, {
      method: 'DELETE',
    });
  },

  // Public Storefront Filter Preview Facets
  getPublicFilters: async (slug: string): Promise<CategoryPublicFilterFacet[]> => {
    try {
      const res = await apiClient<any>(`/categories/${slug}/filters`);
      return res.data?.filters || (Array.isArray(res.data) ? res.data : []);
    } catch {
      return [];
    }
  },
};
