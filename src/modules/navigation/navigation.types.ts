export type NavigationLocation = 'HEADER' | 'FOOTER' | 'MOBILE' | 'SECONDARY';
export type NavigationStatus = 'ACTIVE' | 'INACTIVE';
export type NavigationItemTargetType =
  | 'NONE'
  | 'CATEGORY'
  | 'COLLECTION'
  | 'PRODUCT'
  | 'ARTIST'
  | 'JOURNAL'
  | 'LOOKBOOK'
  | 'SANSKRIT_EDIT'
  | 'INTERNAL_URL'
  | 'EXTERNAL_URL';

export type NavigationItemDisplayType = 'LINK' | 'GROUP' | 'MEGA_MENU';

export interface NavigationModel {
  id: string;
  name: string;
  slug: string;
  location: NavigationLocation;
  status: NavigationStatus;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: NavigationItemModel[];
}

export interface NavigationItemModel {
  id: string;
  navigationId: string;
  parentId?: string | null;
  label: string;
  description?: string | null;
  targetType: NavigationItemTargetType;
  targetId?: string | null;
  url?: string | null;
  displayType: NavigationItemDisplayType;
  openInNewTab: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children?: NavigationItemModel[];
  parent?: NavigationItemModel | null;
}

export interface CreateNavigationDTO {
  name: string;
  slug?: string;
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean;
}

export interface UpdateNavigationDTO {
  name?: string;
  slug?: string;
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean;
}

export interface CreateNavigationItemDTO {
  parentId?: string | null;
  label: string;
  description?: string;
  targetType?: NavigationItemTargetType;
  targetId?: string | null;
  url?: string | null;
  displayType?: NavigationItemDisplayType;
  openInNewTab?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface UpdateNavigationItemDTO {
  parentId?: string | null;
  label?: string;
  description?: string | null;
  targetType?: NavigationItemTargetType;
  targetId?: string | null;
  url?: string | null;
  displayType?: NavigationItemDisplayType;
  openInNewTab?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface ReorderNavigationItemsDTO {
  items: Array<{
    id: string;
    parentId?: string | null;
    sortOrder: number;
  }>;
}

export interface MoveNavigationItemDTO {
  parentId?: string | null;
  sortOrder?: number;
}

export interface NavigationQueryFilter {
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean | string;
  search?: string;
  page?: number | string;
  limit?: number | string;
  sortBy?: 'name' | 'location' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicNavigationItem {
  id: string;
  label: string;
  description?: string | null;
  targetType: NavigationItemTargetType;
  targetId?: string | null;
  url?: string | null;
  resolvedUrl?: string | null;
  displayType: NavigationItemDisplayType;
  openInNewTab: boolean;
  isFeatured: boolean;
  sortOrder: number;
  children?: PublicNavigationItem[];
}

export interface PublicNavigationResponse {
  id: string;
  name: string;
  slug: string;
  location: NavigationLocation;
  items: PublicNavigationItem[];
}
