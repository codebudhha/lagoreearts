import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoriesApi,
  CategoryTreeNode,
  AdminCategory,
  ListCategoriesParams,
  ListCategoriesResponseData,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryAttributeBinding,
  AddCategoryAttributePayload,
  UpdateCategoryAttributePayload,
  CategoryPublicFilterFacet,
} from '../lib/api/categories';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useCategoryTree(enabled = true) {
  return useQuery<CategoryTreeNode[]>({
    queryKey: queryKeys.categories.tree,
    queryFn: categoriesApi.getTree,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useCategoriesList(params?: ListCategoriesParams, enabled = true) {
  return useQuery<ListCategoriesResponseData>({
    queryKey: queryKeys.categories.list(params || {}),
    queryFn: () => categoriesApi.list(params),
    enabled,
    staleTime: 1000 * 30, // 30s
  });
}

export function useCategoryDetail(id: string, enabled = true) {
  return useQuery<AdminCategory>({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useCategoryChildren(id: string, enabled = true) {
  return useQuery<AdminCategory[]>({
    queryKey: queryKeys.categories.children(id),
    queryFn: () => categoriesApi.getChildren(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60,
  });
}

export function useCategoryAncestors(id: string, enabled = true) {
  return useQuery<AdminCategory[]>({
    queryKey: queryKeys.categories.ancestors(id),
    queryFn: () => categoriesApi.getAncestors(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoriesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree });
      success(`Category "${data.name}" was successfully created.`, {
        title: 'Category Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create category.', {
        title: 'Creation Failed',
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      categoriesApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree });
      success(`Category "${data.name}" has been updated.`, {
        title: 'Category Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update category.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree });
      success('Category was successfully removed.', {
        title: 'Category Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Cannot delete category.', {
        title: 'Delete Conflict',
      });
    },
  });
}

// Category Attributes
export function useCategoryAttributesList(categoryId: string, enabled = true) {
  return useQuery<CategoryAttributeBinding[]>({
    queryKey: queryKeys.categories.attributes(categoryId),
    queryFn: () => categoriesApi.getCategoryAttributes(categoryId),
    enabled: Boolean(categoryId) && enabled,
  });
}

export function useAddCategoryAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: AddCategoryAttributePayload;
    }) => categoriesApi.addCategoryAttribute(categoryId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.attributes(variables.categoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      success('Attribute assigned to category filter list.', {
        title: 'Attribute Bound',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to assign attribute.', {
        title: 'Binding Failed',
      });
    },
  });
}

export function useUpdateCategoryAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      categoryId,
      attributeId,
      payload,
    }: {
      categoryId: string;
      attributeId: string;
      payload: UpdateCategoryAttributePayload;
    }) => categoriesApi.updateCategoryAttribute(categoryId, attributeId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.attributes(variables.categoryId) });
      success('Category attribute settings updated.', {
        title: 'Settings Saved',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update category attribute.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useRemoveCategoryAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ categoryId, attributeId }: { categoryId: string; attributeId: string }) =>
      categoriesApi.removeCategoryAttribute(categoryId, attributeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.attributes(variables.categoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      success('Attribute removed from category.', {
        title: 'Attribute Unbound',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to remove category attribute.', {
        title: 'Removal Failed',
      });
    },
  });
}

export function useCategoryPublicFilters(slug: string, enabled = true) {
  return useQuery<CategoryPublicFilterFacet[]>({
    queryKey: queryKeys.categories.filters(slug),
    queryFn: () => categoriesApi.getPublicFilters(slug),
    enabled: Boolean(slug) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}
