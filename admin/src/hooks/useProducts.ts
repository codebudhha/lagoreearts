import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsApi,
  ListProductsParams,
  ListProductsResponseData,
  AdminProduct,
  CreateProductPayload,
  UpdateProductPayload,
  ProductAttributeAssignment,
} from '../lib/api/products';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useProductsList(params?: ListProductsParams) {
  return useQuery<ListProductsResponseData>({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => productsApi.list(params),
    staleTime: 1000 * 30, // 30s
  });
}

export function useProductDetail(id: string, enabled = true) {
  return useQuery<AdminProduct>({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStock });
      success(`Product "${data.name || data.title}" was successfully created.`, {
        title: 'Product Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'An unexpected error occurred while creating the product.', {
        title: 'Failed to Create Product',
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productsApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStock });
      success(`Product "${data.name || data.title}" was successfully updated.`, {
        title: 'Product Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'An unexpected error occurred while updating the product.', {
        title: 'Failed to Update Product',
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStock });
      success('Product was successfully removed.', {
        title: 'Product Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'An unexpected error occurred while deleting the product.', {
        title: 'Failed to Delete Product',
      });
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }) =>
      productsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      success(`Status changed to ${variables.status}.`, {
        title: 'Status Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update product status.', {
        title: 'Status Update Failed',
      });
    },
  });
}

export function useUpdateProductFeatured() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      productsApi.updateFeatured(id, isFeatured),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      success(variables.isFeatured ? 'Product marked as featured.' : 'Product removed from featured.', {
        title: 'Merchandising Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update featured status.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useUpdateProductSortOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      productsApi.updateSortOrder(id, sortOrder),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      success(`Sort order set to ${variables.sortOrder}.`, {
        title: 'Sort Order Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update sort order.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useProductCollections(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.collections(id),
    queryFn: () => productsApi.getCollections(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateProductCollections() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, collectionIds }: { id: string; collectionIds: string[] }) =>
      productsApi.setCollections(id, collectionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.collections(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      success('Product collection assignments have been updated.', {
        title: 'Collections Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update product collections.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useProductAttributes(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.attributes(id),
    queryFn: () => productsApi.getAttributes(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateProductAttributes() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, attributes }: { id: string; attributes: ProductAttributeAssignment[] }) =>
      productsApi.setAttributes(id, attributes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.attributes(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      success('Product attributes have been successfully saved.', {
        title: 'Attributes Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to save product attributes.', {
        title: 'Update Failed',
      });
    },
  });
}
