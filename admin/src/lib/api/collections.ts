import { apiClient } from './client';

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  isFeatured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const collectionsApi = {
  list: async (params?: { search?: string; status?: string }): Promise<AdminCollection[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/collections${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    return Array.isArray(data) ? data : (data?.collections || []);
  },

  getById: async (id: string): Promise<AdminCollection> => {
    const res = await apiClient<AdminCollection>(`/admin/collections/${id}`);
    return res.data;
  },
};
