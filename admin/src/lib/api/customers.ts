import { apiClient } from './client';

// ── Enums ──

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

// ── Customer ──

export interface AdminCustomer {
  id: string;
  email: string;
  normalizedEmail: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: CustomerStatus;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  addressCount?: number;
  sessionCount?: number;
}

// ── Address ──

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressFormData {
  type?: AddressType;
  firstName: string;
  lastName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

// ── Session ──

export interface CustomerSession {
  id: string;
  customerId: string;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  isActive: boolean;
}

// ── Query params ──

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  status?: CustomerStatus;
  search?: string;
  sortBy?: 'createdAt' | 'firstName' | 'email';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface ListCustomersResponseData {
  customers: AdminCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API Client ──

export const customersApi = {
  // ── List ──

  list: async (params?: ListCustomersParams): Promise<ListCustomersResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/customers${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    const items = data?.items || (Array.isArray(data) ? data : []);
    const total = res.pagination?.total ?? data?.pagination?.total ?? items.length;
    const page = res.pagination?.page ?? data?.pagination?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? data?.pagination?.limit ?? (params?.limit || 20);
    const totalPages =
      res.pagination?.totalPages ?? data?.pagination?.totalPages ?? Math.ceil(total / limit);

    return { customers: items, total, page, limit, totalPages };
  },

  // ── Detail ──

  getById: async (id: string): Promise<AdminCustomer> => {
    const res = await apiClient<AdminCustomer>(`/admin/customers/${id}`);
    return res.data;
  },

  // ── Update profile ──

  update: async (
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string | null }
  ): Promise<AdminCustomer> => {
    const res = await apiClient<AdminCustomer>(`/admin/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // ── Update status ──

  updateStatus: async (id: string, status: CustomerStatus): Promise<AdminCustomer> => {
    const res = await apiClient<AdminCustomer>(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  // ── Addresses ──

  getAddresses: async (id: string): Promise<CustomerAddress[]> => {
    const res = await apiClient<CustomerAddress[]>(`/admin/customers/${id}/addresses`);
    return res.data;
  },

  createAddress: async (id: string, data: CustomerAddressFormData): Promise<CustomerAddress> => {
    const res = await apiClient<CustomerAddress>(`/admin/customers/${id}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateAddress: async (
    customerId: string,
    addressId: string,
    data: Partial<CustomerAddressFormData>
  ): Promise<CustomerAddress> => {
    const res = await apiClient<CustomerAddress>(
      `/admin/customers/${customerId}/addresses/${addressId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
    return res.data;
  },

  deleteAddress: async (customerId: string, addressId: string): Promise<void> => {
    await apiClient(`/admin/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },

  setDefaultShipping: async (
    customerId: string,
    addressId: string
  ): Promise<CustomerAddress> => {
    const res = await apiClient<CustomerAddress>(
      `/admin/customers/${customerId}/addresses/${addressId}/default-shipping`,
      { method: 'POST' }
    );
    return res.data;
  },

  setDefaultBilling: async (
    customerId: string,
    addressId: string
  ): Promise<CustomerAddress> => {
    const res = await apiClient<CustomerAddress>(
      `/admin/customers/${customerId}/addresses/${addressId}/default-billing`,
      { method: 'POST' }
    );
    return res.data;
  },

  // ── Sessions ──

  getSessions: async (id: string): Promise<CustomerSession[]> => {
    const res = await apiClient<CustomerSession[]>(`/admin/customers/${id}/sessions`);
    return res.data;
  },

  revokeSessions: async (id: string): Promise<{ revokedCount: number }> => {
    const res = await apiClient<{ revokedCount: number }>(
      `/admin/customers/${id}/revoke-sessions`,
      { method: 'POST' }
    );
    return res.data;
  },
};
