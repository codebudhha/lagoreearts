import { apiClient } from './client';

export interface AdminCustomer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  totalOrders?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListCustomersResponseData {
  customers: AdminCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const customersApi = {
  list: async (params?: ListCustomersParams): Promise<ListCustomersResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/customers${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const customers = res.data?.customers || (Array.isArray(res.data) ? res.data : []);
    const total = res.pagination?.total ?? res.data?.total ?? customers.length;
    const page = res.pagination?.page ?? res.data?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? res.data?.limit ?? (params?.limit || 10);
    const totalPages = res.pagination?.totalPages ?? res.data?.totalPages ?? Math.ceil(total / limit);

    return {
      customers,
      total,
      page,
      limit,
      totalPages,
    };
  },

  getById: async (id: string): Promise<AdminCustomer> => {
    const res = await apiClient<AdminCustomer>(`/admin/customers/${id}`);
    return res.data;
  },
};
