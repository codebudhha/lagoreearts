import { apiClient } from './client';

export interface ProductOptionValue {
  id: string;
  optionId: string;
  name: string;
  sortOrder: number;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
  values?: ProductOptionValue[];
}

export interface ProductVariantItem {
  id: string;
  productId: string;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number | null;
  inventoryTracking?: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder: number;
  optionValues?: Array<{
    optionId: string;
    optionName?: string;
    valueId: string;
    valueName?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOptionPayload {
  name: string;
  sortOrder?: number;
}

export interface CreateOptionValuePayload {
  name: string;
  sortOrder?: number;
}

export interface CreateVariantPayload {
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  inventoryTracking?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;
  optionValueIds: string[];
}

export interface UpdateVariantPayload {
  sku?: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  inventoryTracking?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;
}

export const variantsApi = {
  // Options
  listOptions: async (productId: string): Promise<ProductOption[]> => {
    const res = await apiClient<ProductOption[]>(`/admin/products/${productId}/options`);
    return res.data || [];
  },

  createOption: async (productId: string, payload: CreateOptionPayload): Promise<ProductOption> => {
    const res = await apiClient<ProductOption>(`/admin/products/${productId}/options`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateOption: async (productId: string, optionId: string, payload: Partial<CreateOptionPayload>): Promise<ProductOption> => {
    const res = await apiClient<ProductOption>(`/admin/products/${productId}/options/${optionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteOption: async (productId: string, optionId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/options/${optionId}`, {
      method: 'DELETE',
    });
  },

  // Option Values
  listOptionValues: async (productId: string, optionId: string): Promise<ProductOptionValue[]> => {
    const res = await apiClient<ProductOptionValue[]>(`/admin/products/${productId}/options/${optionId}/values`);
    return res.data || [];
  },

  createOptionValue: async (productId: string, optionId: string, payload: CreateOptionValuePayload): Promise<ProductOptionValue> => {
    const res = await apiClient<ProductOptionValue>(`/admin/products/${productId}/options/${optionId}/values`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateOptionValue: async (
    productId: string,
    optionId: string,
    valueId: string,
    payload: Partial<CreateOptionValuePayload>
  ): Promise<ProductOptionValue> => {
    const res = await apiClient<ProductOptionValue>(`/admin/products/${productId}/options/${optionId}/values/${valueId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteOptionValue: async (productId: string, optionId: string, valueId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/options/${optionId}/values/${valueId}`, {
      method: 'DELETE',
    });
  },

  // Variants
  listVariants: async (productId: string): Promise<ProductVariantItem[]> => {
    const res = await apiClient<ProductVariantItem[]>(`/admin/products/${productId}/variants`);
    return res.data || [];
  },

  createVariant: async (productId: string, payload: CreateVariantPayload): Promise<ProductVariantItem> => {
    const res = await apiClient<ProductVariantItem>(`/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateVariant: async (productId: string, variantId: string, payload: UpdateVariantPayload): Promise<ProductVariantItem> => {
    const res = await apiClient<ProductVariantItem>(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateStatus: async (productId: string, variantId: string, status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'): Promise<ProductVariantItem> => {
    const res = await apiClient<ProductVariantItem>(`/admin/products/${productId}/variants/${variantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  deleteVariant: async (productId: string, variantId: string): Promise<void> => {
    await apiClient(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  },
};
