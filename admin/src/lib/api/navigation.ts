import { apiClient } from './client';

export type NavigationLocation = 'HEADER' | 'FOOTER' | 'MOBILE' | 'SECONDARY';
export type NavigationStatus = 'ACTIVE' | 'INACTIVE';

export type NavigationItemTargetType =
  | 'NONE' | 'CATEGORY' | 'COLLECTION' | 'PRODUCT' | 'ARTIST'
  | 'JOURNAL' | 'LOOKBOOK' | 'SANSKRIT_EDIT' | 'INTERNAL_URL' | 'EXTERNAL_URL';

export type NavigationItemDisplayType = 'LINK' | 'GROUP' | 'MEGA_MENU';

export interface NavigationItem {
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
  createdAt: string;
  updatedAt: string;
  children?: NavigationItem[];
}

export interface Navigation {
  id: string;
  name: string;
  slug: string;
  location: NavigationLocation;
  status: NavigationStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  items?: NavigationItem[];
  _count?: { items: number; };
}

export type AdminNavigation = Navigation;
export type AdminNavigationItem = NavigationItem;

export interface CreateNavigationPayload {
  name: string;
  slug?: string;
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean;
}

export interface UpdateNavigationPayload {
  name?: string;
  slug?: string;
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean;
}

export interface CreateNavigationItemPayload {
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

export interface UpdateNavigationItemPayload {
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

export interface NavigationFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: NavigationLocation;
  status?: NavigationStatus;
  isDefault?: boolean;
  sortBy?: 'name' | 'location' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const navigationLocations: { value: NavigationLocation; label: string }[] = [
  { value: 'HEADER', label: 'Header' },
  { value: 'FOOTER', label: 'Footer' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'SECONDARY', label: 'Secondary / Top Bar' },
];

export const navigationItemTargetTypes: { value: NavigationItemTargetType; label: string }[] = [
  { value: 'NONE', label: 'No Link (Container)' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'ARTIST', label: 'Artist' },
  { value: 'JOURNAL', label: 'Journal Post' },
  { value: 'LOOKBOOK', label: 'Lookbook' },
  { value: 'SANSKRIT_EDIT', label: 'Sanskrit Edit' },
  { value: 'INTERNAL_URL', label: 'Internal URL' },
  { value: 'EXTERNAL_URL', label: 'External URL' },
];

export const navigationItemDisplayTypes: { value: NavigationItemDisplayType; label: string }[] = [
  { value: 'LINK', label: 'Simple Link' },
  { value: 'GROUP', label: 'Group / Dropdown' },
  { value: 'MEGA_MENU', label: 'Mega Menu' },
];

export const navigationApi = {
  async getNavigations(params?: NavigationFilterParams): Promise<{ items: AdminNavigation[]; pagination: { total: number; page: number; limit: number; totalPages: number; } }> {
    const res = await apiClient('/admin/navigation', { params });
    return res.data;
  },

  async getNavigation(id: string): Promise<AdminNavigation> {
    const res = await apiClient(`/admin/navigation/${id}`);
    return res.data;
  },

  async createNavigation(payload: CreateNavigationPayload): Promise<AdminNavigation> {
    const res = await apiClient('/admin/navigation', { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async updateNavigation(id: string, payload: UpdateNavigationPayload): Promise<AdminNavigation> {
    const res = await apiClient(`/admin/navigation/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return res.data;
  },

  async deleteNavigation(id: string): Promise<void> {
    await apiClient(`/admin/navigation/${id}`, { method: 'DELETE' });
  },

  async getNavigationItems(id: string): Promise<AdminNavigationItem[]> {
    const res = await apiClient(`/admin/navigation/${id}/items`);
    return res.data;
  },

  async createItem(navigationId: string, payload: CreateNavigationItemPayload): Promise<AdminNavigationItem> {
    const res = await apiClient(`/admin/navigation/${navigationId}/items`, { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async updateItem(navigationId: string, itemId: string, payload: UpdateNavigationItemPayload): Promise<AdminNavigationItem> {
    const res = await apiClient(`/admin/navigation/${navigationId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return res.data;
  },

  async deleteItem(navigationId: string, itemId: string): Promise<void> {
    await apiClient(`/admin/navigation/${navigationId}/items/${itemId}`, { method: 'DELETE' });
  },

  async reorderItems(navigationId: string, items: Array<{ id: string; parentId?: string | null; sortOrder: number }>): Promise<AdminNavigationItem[]> {
    const res = await apiClient(`/admin/navigation/${navigationId}/items/order`, { method: 'PUT', body: JSON.stringify({ items }) });
    return res.data;
  },

  async moveItem(navigationId: string, itemId: string, payload: { parentId?: string | null; sortOrder?: number }): Promise<AdminNavigationItem> {
    const res = await apiClient(`/admin/navigation/${navigationId}/items/${itemId}/move`, { method: 'POST', body: JSON.stringify(payload) });
    return res.data;
  },

  async getItemById(navigationId: string, itemId: string): Promise<AdminNavigationItem> {
    const res = await apiClient(`/admin/navigation/${navigationId}/items/${itemId}`);
    return res.data;
  },
};

export function buildNavigationTree(items: AdminNavigationItem[]): AdminNavigationItem[] {
  const itemMap = new Map<string, AdminNavigationItem>();
  const roots: AdminNavigationItem[] = [];

  for (const item of items) {
    itemMap.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: AdminNavigationItem[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    }
  };

  sortTree(roots);
  return roots;
}

export function flattenTree(items: AdminNavigationItem[]): AdminNavigationItem[] {
  const result: AdminNavigationItem[] = [];
  const walk = (nodes: AdminNavigationItem[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(items);
  return result;
}
