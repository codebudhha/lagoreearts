import { apiClient } from './client';

export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  url: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachedMedia {
  id: string;
  mediaId: string;
  url: string;
  thumbnailUrl?: string | null;
  isPrimary: boolean;
  altText?: string | null;
  sortOrder: number;
  filename?: string;
}

export const mediaApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; folderId?: string }): Promise<{
    media: MediaAsset[];
    total: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.folderId) searchParams.set('folderId', params.folderId);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/media${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    const media = Array.isArray(data) ? data : (data?.media || data?.items || []);
    const total = res.pagination?.total ?? data?.total ?? media.length;

    return { media, total };
  },

  upload: async (file: File, folderId?: string, title?: string, altText?: string): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (title) formData.append('title', title);
    if (altText) formData.append('altText', altText);

    const res = await apiClient<MediaAsset>('/admin/media', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  // Product media attachments
  getProductMedia: async (productId: string): Promise<AttachedMedia[]> => {
    const res = await apiClient<any>(`/admin/products/${productId}/media`);
    const data = res.data;
    const list = Array.isArray(data) ? data : (data?.media || []);
    return list.map((item: any, idx: number) => ({
      id: item.id || item.mediaId || `media-${idx}`,
      mediaId: item.mediaId || item.id,
      url: item.url || item.media?.url,
      thumbnailUrl: item.thumbnailUrl || item.media?.thumbnailUrl || item.url,
      isPrimary: Boolean(item.isPrimary),
      altText: item.altText || item.media?.altText,
      sortOrder: item.sortOrder ?? idx + 1,
      filename: item.filename || item.media?.originalFilename,
    }));
  },

  attachProductMedia: async (
    productId: string,
    payload: { mediaId: string; isPrimary?: boolean; altText?: string; sortOrder?: number }
  ): Promise<AttachedMedia> => {
    const res = await apiClient<any>(`/admin/products/${productId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  detachProductMedia: async (productId: string, mediaId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  reorderProductMedia: async (productId: string, mediaIds: string[]): Promise<void> => {
    await apiClient(`/admin/products/${productId}/media/order`, {
      method: 'PUT',
      body: JSON.stringify({ mediaIds }),
    });
  },
};
