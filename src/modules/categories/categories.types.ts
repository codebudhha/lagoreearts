export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  shortDescription?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  bannerImage?: string;
  bannerImageAlt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  shortDescription?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  bannerImage?: string;
  bannerImageAlt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface CategoryFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  parentId?: string | null;
  featured?: boolean | string;
  sort?: 'name' | 'sortOrder' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  shortDescription?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  bannerImage?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  sortOrder: number;
  children: CategoryTreeNode[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}
