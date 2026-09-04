import { apiClient } from './client';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  paymentStatus: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'REFUNDED' | 'FAILED';
  fulfillmentStatus?: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListOrdersResponseData {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ordersApi = {
  list: async (params?: ListOrdersParams): Promise<ListOrdersResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/orders${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    // Backend returns { success: true, data: orders, pagination: { page, limit, total, totalPages } } or { data: { orders, total... } }
    const orders = res.data?.orders || (Array.isArray(res.data) ? res.data : []);
    const total = res.pagination?.total ?? res.data?.total ?? orders.length;
    const page = res.pagination?.page ?? res.data?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? res.data?.limit ?? (params?.limit || 10);
    const totalPages = res.pagination?.totalPages ?? res.data?.totalPages ?? Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    };
  },

  getById: async (id: string): Promise<AdminOrder> => {
    const res = await apiClient<AdminOrder>(`/admin/orders/${id}`);
    return res.data;
  },
};
