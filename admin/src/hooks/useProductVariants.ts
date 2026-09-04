import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  variantsApi,
  ProductOption,
  ProductVariantItem,
  CreateOptionPayload,
  CreateOptionValuePayload,
  CreateVariantPayload,
  UpdateVariantPayload,
} from '../lib/api/variants';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useProductOptions(productId: string, enabled = true) {
  return useQuery<ProductOption[]>({
    queryKey: queryKeys.products.options(productId),
    queryFn: () => variantsApi.listOptions(productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useCreateProductOption() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: CreateOptionPayload }) =>
      variantsApi.createOption(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.options(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      success('Product option was successfully created.', {
        title: 'Option Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not create option.', {
        title: 'Failed to Create Option',
      });
    },
  });
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      optionId,
      payload,
    }: {
      productId: string;
      optionId: string;
      payload: Partial<CreateOptionPayload>;
    }) => variantsApi.updateOption(productId, optionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.options(variables.productId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update option.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, optionId }: { productId: string; optionId: string }) =>
      variantsApi.deleteOption(productId, optionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.options(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      success('Option and its associated values were removed.', {
        title: 'Option Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not delete option.', {
        title: 'Delete Failed',
      });
    },
  });
}

export function useCreateProductOptionValue() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      optionId,
      payload,
    }: {
      productId: string;
      optionId: string;
      payload: CreateOptionValuePayload;
    }) => variantsApi.createOptionValue(productId, optionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.options(variables.productId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not add option value.', {
        title: 'Value Creation Failed',
      });
    },
  });
}

export function useDeleteProductOptionValue() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      optionId,
      valueId,
    }: {
      productId: string;
      optionId: string;
      valueId: string;
    }) => variantsApi.deleteOptionValue(productId, optionId, valueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.options(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not remove option value.', {
        title: 'Delete Failed',
      });
    },
  });
}

export function useProductVariantsList(productId: string, enabled = true) {
  return useQuery<ProductVariantItem[]>({
    queryKey: queryKeys.products.variants(productId),
    queryFn: () => variantsApi.listVariants(productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useCreateProductVariant() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: CreateVariantPayload }) =>
      variantsApi.createVariant(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Product variant was successfully added.', {
        title: 'Variant Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not create product variant.', {
        title: 'Variant Creation Failed',
      });
    },
  });
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      payload,
    }: {
      productId: string;
      variantId: string;
      payload: UpdateVariantPayload;
    }) => variantsApi.updateVariant(productId, variantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Product variant was updated.', {
        title: 'Variant Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not update product variant.', {
        title: 'Variant Update Failed',
      });
    },
  });
}

export function useUpdateProductVariantStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      status,
    }: {
      productId: string;
      variantId: string;
      status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    }) => variantsApi.updateStatus(productId, variantId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      success(`Status updated to ${variables.status}.`, {
        title: 'Variant Status Changed',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update variant status.', {
        title: 'Status Update Failed',
      });
    },
  });
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      variantsApi.deleteVariant(productId, variantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Product variant was deleted.', {
        title: 'Variant Removed',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Could not delete variant.', {
        title: 'Delete Failed',
      });
    },
  });
}
