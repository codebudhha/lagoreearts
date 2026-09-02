export type CollectionStatus = 'ACTIVE' | 'INACTIVE';
export type CollectionType = 'MANUAL' | 'SYSTEM';

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  heroTitle?: string;
  heroDescription?: string;
  status?: CollectionStatus;
  type?: CollectionType;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  heroTitle?: string;
  heroDescription?: string;
  status?: CollectionStatus;
  type?: CollectionType;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface CollectionFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CollectionStatus;
  type?: CollectionType;
  featured?: boolean | string;
  sort?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface UpdateSortOrderInput {
  sortOrder: number;
}
