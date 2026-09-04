import { apiClient } from './client';

export type JournalPostType =
  | 'ARTICLE'
  | 'STORY'
  | 'INTERVIEW'
  | 'CURATION'
  | 'EDITORIAL';

export type JournalPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type JournalPostMediaRole = 'COVER' | 'GALLERY' | 'OG';

export interface JournalAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  role?: string | null;
  avatarMediaId?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
  } | null;
  _count?: {
    posts: number;
  };
}

export interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface JournalTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface JournalPostMedia {
  id?: string;
  postId: string;
  mediaId: string;
  role: JournalPostMediaRole;
  displayOrder: number;
  isPrimary?: boolean;
  media?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
  };
}

export interface JournalPostProduct {
  id?: string;
  postId: string;
  productId: string;
  displayOrder: number;
  product?: {
    id: string;
    title: string;
    sku?: string;
    price?: number;
    thumbnailUrl?: string | null;
  };
}

export interface JournalPostCollection {
  id?: string;
  postId: string;
  collectionId: string;
  displayOrder: number;
  collection?: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
}

export interface JournalPostArtist {
  id?: string;
  postId: string;
  artistId: string;
  displayOrder: number;
  artist?: {
    id: string;
    name: string;
    origin?: string | null;
    avatarUrl?: string | null;
  };
}

export interface JournalPostSanskritEdit {
  id?: string;
  postId: string;
  sanskritEditId: string;
  displayOrder: number;
  sanskritEdit?: {
    id: string;
    term: string;
    transliteration?: string | null;
  };
}

export interface JournalPostRelatedPost {
  id?: string;
  postId: string;
  relatedPostId: string;
  displayOrder: number;
  relatedPost?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string | null;
  };
}

export interface JournalPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  readingTime?: number | null;
  type: JournalPostType;
  status: JournalPostStatus;
  featured: boolean;
  publishedAt?: string | null;
  authorId?: string | null;
  categoryId?: string | null;
  coverImageId?: string | null;
  ogImageId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: JournalAuthor | null;
  category?: JournalCategory | null;
  coverImage?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
  } | null;
  ogImage?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
  } | null;
  tags?: Array<{
    postId: string;
    tagId: string;
    tag?: JournalTag;
  }>;
  products?: JournalPostProduct[];
  collections?: JournalPostCollection[];
  artists?: JournalPostArtist[];
  sanskritEdits?: JournalPostSanskritEdit[];
  relatedPosts?: JournalPostRelatedPost[];
  media?: JournalPostMedia[];
  _count?: {
    tags: number;
    products: number;
    collections: number;
    artists: number;
    relatedPosts: number;
  };
}

export interface CreateJournalPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  readingTime?: number;
  type?: JournalPostType;
  status?: JournalPostStatus;
  featured?: boolean;
  publishedAt?: string;
  authorId?: string;
  categoryId?: string;
  coverImageId?: string;
  ogImageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  tags?: string[];
  products?: string[];
  collections?: string[];
  artists?: string[];
  sanskritEdits?: string[];
  relatedPosts?: string[];
}

export interface UpdateJournalPostPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  readingTime?: number;
  type?: JournalPostType;
  status?: JournalPostStatus;
  featured?: boolean;
  publishedAt?: string;
  authorId?: string;
  categoryId?: string;
  coverImageId?: string;
  ogImageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  tags?: string[];
  products?: string[];
  collections?: string[];
  artists?: string[];
  sanskritEdits?: string[];
  relatedPosts?: string[];
}

export interface JournalPostFilterParams {
  page?: number;
  limit?: number;
  status?: JournalPostStatus;
  type?: JournalPostType;
  featured?: boolean;
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  sortBy?: 'title' | 'publishedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAuthorPayload {
  name: string;
  slug?: string;
  bio?: string;
  role?: string;
  avatarMediaId?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateAuthorPayload {
  name?: string;
  slug?: string;
  bio?: string;
  role?: string;
  avatarMediaId?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  isActive?: boolean;
}

export type CreateJournalAuthorPayload = CreateAuthorPayload;
export type UpdateJournalAuthorPayload = UpdateAuthorPayload;

export interface CreateJournalCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateJournalCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateJournalTagPayload {
  name: string;
  slug?: string;
}

export interface UpdateJournalTagPayload {
  name?: string;
  slug?: string;
}

export const journalApi = {
  // Posts CRUD
  async getPosts(params?: JournalPostFilterParams): Promise<{ items: JournalPost[]; pagination: any }> {
    const res = await apiClient<{ items: JournalPost[]; pagination: any }>('/admin/journal', {
      params,
    });
    return res.data;
  },

  async getPost(id: string): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}`);
    return res.data;
  },

  async createPost(payload: CreateJournalPostPayload): Promise<JournalPost> {
    const res = await apiClient<JournalPost>('/admin/journal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updatePost(id: string, payload: UpdateJournalPostPayload): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deletePost(id: string): Promise<void> {
    await apiClient<void>(`/admin/journal/${id}`, {
      method: 'DELETE',
    });
  },

  async publishPost(id: string): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}/publish`, {
      method: 'POST',
    });
    return res.data;
  },

  async unpublishPost(id: string): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}/unpublish`, {
      method: 'POST',
    });
    return res.data;
  },

  async archivePost(id: string): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}/archive`, {
      method: 'POST',
    });
    return res.data;
  },

  async updateStatus(id: string, status: JournalPostStatus): Promise<JournalPost> {
    const res = await apiClient<JournalPost>(`/admin/journal/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  // Media
  async attachMedia(
    postId: string,
    payload: { mediaId: string; role?: JournalPostMediaRole; displayOrder?: number; isPrimary?: boolean }
  ): Promise<JournalPostMedia> {
    const res = await apiClient<JournalPostMedia>(`/admin/journal/${postId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async detachMedia(postId: string, mediaId: string, role?: JournalPostMediaRole): Promise<void> {
    await apiClient<void>(
      `/admin/journal/${postId}/media/${mediaId}${role ? `?role=${role}` : ''}`,
      {
        method: 'DELETE',
      }
    );
  },

  async reorderMedia(
    postId: string,
    items: Array<{ mediaId: string; role: JournalPostMediaRole; sortOrder?: number; displayOrder?: number; isPrimary?: boolean }>
  ): Promise<void> {
    await apiClient<void>(`/admin/journal/${postId}/media/order`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Junctions
  async setTags(postId: string, tags: string[]): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    });
    return res.data;
  },

  async setProducts(postId: string, products: Array<{ id: string; displayOrder?: number }>): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/products`, {
      method: 'PUT',
      body: JSON.stringify({ products }),
    });
    return res.data;
  },

  async setCollections(postId: string, collections: Array<{ id: string; displayOrder?: number }>): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/collections`, {
      method: 'PUT',
      body: JSON.stringify({ collections }),
    });
    return res.data;
  },

  async setArtists(postId: string, artists: Array<{ id: string; displayOrder?: number }>): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/artists`, {
      method: 'PUT',
      body: JSON.stringify({ artists }),
    });
    return res.data;
  },

  async setSanskritEdits(postId: string, sanskritEdits: Array<{ id: string; displayOrder?: number }>): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/sanskrit-edit`, {
      method: 'PUT',
      body: JSON.stringify({ sanskritEdits }),
    });
    return res.data;
  },

  async setRelatedPosts(postId: string, relatedPosts: Array<{ id: string; displayOrder?: number }>): Promise<any> {
    const res = await apiClient(`/admin/journal/${postId}/related-posts`, {
      method: 'PUT',
      body: JSON.stringify({ relatedPosts }),
    });
    return res.data;
  },

  // Authors
  async getAuthors(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ items: JournalAuthor[]; pagination: any }> {
    const res = await apiClient<{ items: JournalAuthor[]; pagination: any }>('/admin/journal/authors', {
      params,
    });
    return res.data;
  },

  async getAuthor(id: string): Promise<JournalAuthor> {
    const res = await apiClient<JournalAuthor>(`/admin/journal/authors/${id}`);
    return res.data;
  },

  async createAuthor(payload: CreateAuthorPayload): Promise<JournalAuthor> {
    const res = await apiClient<JournalAuthor>('/admin/journal/authors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateAuthor(id: string, payload: UpdateAuthorPayload): Promise<JournalAuthor> {
    const res = await apiClient<JournalAuthor>(`/admin/journal/authors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteAuthor(id: string): Promise<void> {
    await apiClient<void>(`/admin/journal/authors/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }): Promise<{ items: JournalCategory[]; pagination: any }> {
    const res = await apiClient<{ items: JournalCategory[]; pagination: any }>('/admin/journal/categories', {
      params,
    });
    return res.data;
  },

  async getCategory(id: string): Promise<JournalCategory> {
    const res = await apiClient<JournalCategory>(`/admin/journal/categories/${id}`);
    return res.data;
  },

  async createCategory(payload: CreateJournalCategoryPayload): Promise<JournalCategory> {
    const res = await apiClient<JournalCategory>('/admin/journal/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateCategory(id: string, payload: UpdateJournalCategoryPayload): Promise<JournalCategory> {
    const res = await apiClient<JournalCategory>(`/admin/journal/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient<void>(`/admin/journal/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderCategories(items: Array<{ id: string; displayOrder: number }>): Promise<void> {
    await apiClient<void>('/admin/journal/categories/order', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Tags
  async getTags(params?: { search?: string; page?: number; limit?: number }): Promise<{ items: JournalTag[]; pagination: any }> {
    const res = await apiClient<{ items: JournalTag[]; pagination: any }>('/admin/journal/tags', {
      params,
    });
    return res.data;
  },

  async getTag(id: string): Promise<JournalTag> {
    const res = await apiClient<JournalTag>(`/admin/journal/tags/${id}`);
    return res.data;
  },

  async createTag(payload: CreateJournalTagPayload): Promise<JournalTag> {
    const res = await apiClient<JournalTag>('/admin/journal/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateTag(id: string, payload: UpdateJournalTagPayload): Promise<JournalTag> {
    const res = await apiClient<JournalTag>(`/admin/journal/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteTag(id: string): Promise<void> {
    await apiClient<void>(`/admin/journal/tags/${id}`, {
      method: 'DELETE',
    });
  },
};
