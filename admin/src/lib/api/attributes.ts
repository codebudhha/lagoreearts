import { apiClient } from './client';

export interface AttributeValue {
  id: string;
  attributeId: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AdminAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
  description?: string | null;
  isFilterable: boolean;
  isSystem: boolean;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  values?: AttributeValue[];
}

export const attributesApi = {
  list: async (): Promise<AdminAttribute[]> => {
    const res = await apiClient<any>('/admin/attributes');
    const data = res.data;
    return Array.isArray(data) ? data : (data?.attributes || []);
  },

  getById: async (id: string): Promise<AdminAttribute> => {
    const res = await apiClient<AdminAttribute>(`/admin/attributes/${id}`);
    return res.data;
  },

  listValues: async (attributeId: string): Promise<AttributeValue[]> => {
    const res = await apiClient<AttributeValue[]>(`/admin/attributes/${attributeId}/values`);
    return res.data;
  },
};
