export type JournalPostType = 'ARTICLE' | 'ESSAY' | 'INTERVIEW' | 'STORY' | 'GUIDE' | 'NEWS';
export type JournalPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type JournalAuthorStatus = 'ACTIVE' | 'INACTIVE';
export type JournalCategoryStatus = 'ACTIVE' | 'INACTIVE';
export type JournalTagStatus = 'ACTIVE' | 'INACTIVE';
export type JournalPostMediaRole = 'COVER' | 'GALLERY' | 'OG';

export interface CreateJournalAuthorDTO {
  name: string;
  slug?: string;
  bio?: string;
  avatarMediaId?: string;
  status?: JournalAuthorStatus;
}

export interface UpdateJournalAuthorDTO {
  name?: string;
  slug?: string;
  bio?: string;
  avatarMediaId?: string;
  status?: JournalAuthorStatus;
}

export interface CreateJournalCategoryDTO {
  name: string;
  slug?: string;
  description?: string;
  status?: JournalCategoryStatus;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateJournalCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  status?: JournalCategoryStatus;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateJournalTagDTO {
  name: string;
  slug?: string;
  status?: JournalTagStatus;
}

export interface UpdateJournalTagDTO {
  name?: string;
  slug?: string;
  status?: JournalTagStatus;
}

export interface CreateJournalPostDTO {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  type?: JournalPostType;
  status?: JournalPostStatus;
  featured?: boolean;
  publishedAt?: string | Date;
  displayOrder?: number;
  authorId?: string;
  categoryId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  tags?: string[]; // tag IDs or slugs
  products?: Array<{ id: string; displayOrder?: number }>;
  collections?: Array<{ id: string; displayOrder?: number }>;
  artists?: Array<{ id: string; displayOrder?: number }>;
  sanskritEdits?: Array<{ id: string; displayOrder?: number }>;
  relatedPosts?: Array<{ id: string; displayOrder?: number }>;
}

export interface UpdateJournalPostDTO {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  type?: JournalPostType;
  status?: JournalPostStatus;
  featured?: boolean;
  publishedAt?: string | Date;
  displayOrder?: number;
  authorId?: string | null;
  categoryId?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface AttachJournalPostMediaDTO {
  mediaId: string;
  role?: JournalPostMediaRole;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ReorderJournalPostMediaDTO {
  items: Array<{
    mediaId: string;
    role: JournalPostMediaRole;
    sortOrder: number;
    isPrimary?: boolean;
  }>;
}

export interface ReorderJournalItemsDTO {
  items: Array<{
    id: string;
    displayOrder: number;
  }>;
}

export interface JournalPostQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: JournalPostStatus;
  type?: JournalPostType;
  featured?: boolean | string;
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  tagSlug?: string;
  categorySlug?: string;
  authorSlug?: string;
  sortBy?: 'publishedAt' | 'displayOrder' | 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
