import { apiClient } from './client';

export interface SeoMetadata {
  id?: string;
  entityType: string;
  entityId: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
  jsonLd?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertSeoPayload {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  jsonLd?: any;
}

export const seoApi = {
  getMetadata: async (entityType: string, entityId: string): Promise<SeoMetadata | null> => {
    try {
      const res = await apiClient<SeoMetadata>(`/admin/seo/${entityType}/${entityId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  upsertMetadata: async (entityType: string, entityId: string, payload: UpsertSeoPayload): Promise<SeoMetadata> => {
    const res = await apiClient<SeoMetadata>(`/admin/seo/${entityType}/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteMetadata: async (entityType: string, entityId: string): Promise<void> => {
    await apiClient(`/admin/seo/${entityType}/${entityId}`, {
      method: 'DELETE',
    });
  },
};
