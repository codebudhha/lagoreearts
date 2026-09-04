import { apiClient } from './client';

export interface AdminReview {
  id: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  customerName?: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  isVerifiedPurchase?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  status?: string;
  rating?: number;
  search?: string;
}

export interface ListReviewsResponseData {
  reviews: AdminReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const reviewsApi = {
  list: async (params?: ListReviewsParams): Promise<ListReviewsResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.rating) searchParams.set('rating', String(params.rating));
    if (params?.search) searchParams.set('search', params.search);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/reviews${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const reviews = res.data?.reviews || (Array.isArray(res.data) ? res.data : []);
    const total = res.pagination?.total ?? res.data?.total ?? reviews.length;
    const page = res.pagination?.page ?? res.data?.page ?? (params?.page || 1);
    const limit = res.pagination?.limit ?? res.data?.limit ?? (params?.limit || 10);
    const totalPages = res.pagination?.totalPages ?? res.data?.totalPages ?? Math.ceil(total / limit);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages,
    };
  },

  moderate: async (id: string, status: 'APPROVED' | 'REJECTED' | 'HIDDEN', reason?: string): Promise<AdminReview> => {
    const res = await apiClient<AdminReview>(`/admin/reviews/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status, moderationReason: reason }),
    });
    return res.data;
  },
};
