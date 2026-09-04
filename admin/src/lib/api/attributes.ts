import { apiClient } from './client';

export type AttributeType = 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';

export interface AttributeValue {
  id: string;
  attributeId: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAttribute {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  description?: string | null;
  isFilterable: boolean;
  isRequired: boolean;
  isSystem: boolean;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  values?: AttributeValue[];
  valuesCount?: number;
  categoriesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListAttributesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  filterable?: boolean;
  system?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ListAttributesResponseData {
  items: AdminAttribute[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAttributePayload {
  name: string;
  slug?: string;
  type?: AttributeType;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isFilterable?: boolean;
  isRequired?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
}

export interface UpdateAttributePayload extends Partial<CreateAttributePayload> {}

export interface CreateAttributeValuePayload {
  name: string;
  slug?: string;
  sortOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateAttributeValuePayload extends Partial<CreateAttributeValuePayload> {}

export const attributesApi = {
  list: async (params?: ListAttributesParams): Promise<ListAttributesResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.filterable !== undefined) searchParams.set('filterable', String(params.filterable));
    if (params?.system !== undefined) searchParams.set('system', String(params.system));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/attributes${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: AdminAttribute[] = Array.isArray(data)
      ? data
      : data?.items || data?.attributes || [];

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

  getById: async (id: string): Promise<AdminAttribute> => {
    const res = await apiClient<AdminAttribute>(`/admin/attributes/${id}`);
    return res.data;
  },

  create: async (payload: CreateAttributePayload): Promise<AdminAttribute> => {
    const res = await apiClient<AdminAttribute>('/admin/attributes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: UpdateAttributePayload): Promise<AdminAttribute> => {
    const res = await apiClient<AdminAttribute>(`/admin/attributes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/attributes/${id}`, {
      method: 'DELETE',
    });
  },

  // Attribute Values
  listValues: async (
    attributeId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<AttributeValue[]> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/attributes/${attributeId}/values${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    return Array.isArray(data) ? data : data?.items || data?.values || [];
  },

  createValue: async (
    attributeId: string,
    payload: CreateAttributeValuePayload
  ): Promise<AttributeValue> => {
    const res = await apiClient<AttributeValue>(`/admin/attributes/${attributeId}/values`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateValue: async (
    attributeId: string,
    valueId: string,
    payload: UpdateAttributeValuePayload
  ): Promise<AttributeValue> => {
    const res = await apiClient<AttributeValue>(
      `/admin/attributes/${attributeId}/values/${valueId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  deleteValue: async (attributeId: string, valueId: string): Promise<void> => {
    await apiClient(`/admin/attributes/${attributeId}/values/${valueId}`, {
      method: 'DELETE',
    });
  },
};
