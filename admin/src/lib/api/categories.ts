import { apiClient } from './client';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  children?: CategoryTreeNode[];
}

export interface CategoryAttributeBinding {
  id: string;
  categoryId: string;
  attributeId: string;
  sortOrder: number;
  isVisible: boolean;
  isRequired: boolean;
  attribute: {
    id: string;
    name: string;
    slug: string;
    type: 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
    description?: string | null;
    isFilterable: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    values?: Array<{
      id: string;
      name: string;
      slug: string;
      sortOrder: number;
      status: 'ACTIVE' | 'INACTIVE';
    }>;
  };
}

export const categoriesApi = {
  getTree: async (): Promise<CategoryTreeNode[]> => {
    const res = await apiClient<CategoryTreeNode[]>('/admin/categories/tree');
    return res.data;
  },

  list: async (): Promise<CategoryTreeNode[]> => {
    const res = await apiClient<CategoryTreeNode[]>('/admin/categories');
    return res.data;
  },

  getCategoryAttributes: async (categoryId: string): Promise<CategoryAttributeBinding[]> => {
    const res = await apiClient<CategoryAttributeBinding[]>(`/admin/categories/${categoryId}/attributes`);
    return res.data;
  },
};
