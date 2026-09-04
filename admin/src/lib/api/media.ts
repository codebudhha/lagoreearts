import { apiClient } from './client';

export type MediaType = 'IMAGE';
export type MediaRole = 'PRIMARY' | 'GALLERY' | 'THUMBNAIL' | 'BANNER' | 'OG';

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: MediaFolder | null;
  children?: MediaFolder[];
  assetCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderPayload {
  name: string;
  slug?: string;
  parentId?: string | null;
}

export interface UpdateFolderPayload {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  thumbnailUrl?: string | null;
  mimeType: string;
  mediaType: MediaType;
  fileSize: number;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
  checksum?: string;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  folderId?: string | null;
  folder?: MediaFolder | null;
  usageCount?: number;
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
  role?: MediaRole;
}

export interface ListMediaParams {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
  mimeType?: string;
  mediaType?: MediaType;
  isOrphan?: boolean;
  sortBy?: 'createdAt' | 'fileSize' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface ListMediaResponseData {
  media: MediaAsset[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface UpdateMediaPayload {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  folderId?: string | null;
}

export interface AttachEntityMediaPayload {
  mediaId: string;
  sortOrder?: number;
  isPrimary?: boolean;
  role?: MediaRole;
  altText?: string;
}

export interface ReorderEntityMediaPayload {
  items: Array<{
    mediaId: string;
    sortOrder: number;
  }>;
}

export const mediaApi = {
  /* ========================================================================
   * FOLDER ENDPOINTS
   * ======================================================================== */
  listFolders: async (search?: string): Promise<MediaFolder[]> => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set('search', search);
    const queryStr = searchParams.toString();
    const res = await apiClient<MediaFolder[]>(`/admin/media/folders${queryStr ? `?${queryStr}` : ''}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  getFolder: async (id: string): Promise<MediaFolder> => {
    const res = await apiClient<MediaFolder>(`/admin/media/folders/${id}`);
    return res.data;
  },

  createFolder: async (payload: CreateFolderPayload): Promise<MediaFolder> => {
    const res = await apiClient<MediaFolder>('/admin/media/folders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateFolder: async (id: string, payload: UpdateFolderPayload): Promise<MediaFolder> => {
    const res = await apiClient<MediaFolder>(`/admin/media/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteFolder: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient<{ success: boolean }>(`/admin/media/folders/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  /* ========================================================================
   * ASSET ENDPOINTS
   * ======================================================================== */
  list: async (params?: ListMediaParams): Promise<ListMediaResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.folderId) searchParams.set('folderId', params.folderId);
    if (params?.mimeType) searchParams.set('mimeType', params.mimeType);
    if (params?.mediaType) searchParams.set('mediaType', params.mediaType);
    if (params?.isOrphan) searchParams.set('isOrphan', 'true');
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/media${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    const media = Array.isArray(data)
      ? data
      : data?.items || data?.media || [];
    const total = res.pagination?.total ?? data?.meta?.total ?? data?.total ?? media.length;
    const page = res.pagination?.page ?? data?.meta?.page ?? params?.page ?? 1;
    const limit = res.pagination?.limit ?? data?.meta?.limit ?? params?.limit ?? 20;
    const totalPages = res.pagination?.totalPages ?? data?.meta?.totalPages ?? (Math.ceil(total / limit) || 1);

    return { media, total, page, limit, totalPages };
  },

  getById: async (id: string): Promise<MediaAsset> => {
    const res = await apiClient<MediaAsset>(`/admin/media/${id}`);
    return res.data;
  },

  upload: async (
    file: File,
    folderId?: string,
    title?: string,
    altText?: string,
    caption?: string
  ): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (title) formData.append('title', title);
    if (altText) formData.append('altText', altText);
    if (caption) formData.append('caption', caption);

    const res = await apiClient<MediaAsset>('/admin/media', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  update: async (id: string, payload: UpdateMediaPayload): Promise<MediaAsset> => {
    const res = await apiClient<MediaAsset>(`/admin/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient<{ success: boolean }>(`/admin/media/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  listOrphans: async (params?: ListMediaParams): Promise<ListMediaResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/media/orphans${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<any>(endpoint);
    const data = res.data;
    const media = Array.isArray(data)
      ? data
      : data?.items || data?.media || [];
    const total = res.pagination?.total ?? data?.meta?.total ?? data?.total ?? media.length;
    const page = res.pagination?.page ?? data?.meta?.page ?? params?.page ?? 1;
    const limit = res.pagination?.limit ?? data?.meta?.limit ?? params?.limit ?? 20;
    const totalPages = res.pagination?.totalPages ?? data?.meta?.totalPages ?? (Math.ceil(total / limit) || 1);

    return { media, total, page, limit, totalPages };
  },

  /* ========================================================================
   * ENTITY MEDIA ATTACHMENTS
   * ======================================================================== */
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
      role: item.role,
    }));
  },

  attachProductMedia: async (
    productId: string,
    payload: { mediaId: string; isPrimary?: boolean; altText?: string; sortOrder?: number; role?: MediaRole }
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
    const items = mediaIds.map((mediaId, idx) => ({ mediaId, sortOrder: idx + 1 }));
    await apiClient(`/admin/products/${productId}/media/order`, {
      method: 'PUT',
      body: JSON.stringify({ items, mediaIds }),
    });
  },
};
