import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attributesApi,
  AdminAttribute,
  AttributeValue,
  ListAttributesParams,
  ListAttributesResponseData,
  CreateAttributePayload,
  UpdateAttributePayload,
  CreateAttributeValuePayload,
  UpdateAttributeValuePayload,
} from '../lib/api/attributes';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useAttributesList(params?: ListAttributesParams, enabled = true) {
  return useQuery<ListAttributesResponseData>({
    queryKey: queryKeys.attributes.list(params || {}),
    queryFn: () => attributesApi.list(params),
    enabled,
    staleTime: 1000 * 30, // 30s
  });
}

export function useAttributeDetail(id: string, enabled = true) {
  return useQuery<AdminAttribute>({
    queryKey: queryKeys.attributes.detail(id),
    queryFn: () => attributesApi.getById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateAttributePayload) => attributesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.all });
      success(`Attribute "${data.name}" was successfully created.`, {
        title: 'Attribute Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create attribute.', {
        title: 'Creation Failed',
      });
    },
  });
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAttributePayload }) =>
      attributesApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.all });
      success(`Attribute "${data.name}" has been updated.`, {
        title: 'Attribute Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update attribute.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => attributesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.all });
      success('Attribute deleted successfully.', {
        title: 'Attribute Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete attribute. Make sure it is not in use or system-protected.', {
        title: 'Delete Failed',
      });
    },
  });
}

// ----------------------------------------------------
// Attribute Value Hooks
// ----------------------------------------------------

export function useAttributeValuesList(
  attributeId: string,
  params?: { page?: number; limit?: number; search?: string; status?: string },
  enabled = true
) {
  return useQuery<AttributeValue[]>({
    queryKey: queryKeys.attributes.values(attributeId),
    queryFn: () => attributesApi.listValues(attributeId, params),
    enabled: Boolean(attributeId) && enabled,
    staleTime: 1000 * 30,
  });
}

export function useCreateAttributeValue() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      attributeId,
      payload,
    }: {
      attributeId: string;
      payload: CreateAttributeValuePayload;
    }) => attributesApi.createValue(attributeId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.values(variables.attributeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.attributeId),
      });
      success(`Value "${data.name}" added successfully.`, {
        title: 'Value Added',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to add attribute value.', {
        title: 'Failed to Add Value',
      });
    },
  });
}

export function useUpdateAttributeValue() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      attributeId,
      valueId,
      payload,
    }: {
      attributeId: string;
      valueId: string;
      payload: UpdateAttributeValuePayload;
    }) => attributesApi.updateValue(attributeId, valueId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.values(variables.attributeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.attributeId),
      });
      success(`Value "${data.name}" updated successfully.`, {
        title: 'Value Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update attribute value.', {
        title: 'Failed to Update Value',
      });
    },
  });
}

export function useDeleteAttributeValue() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      attributeId,
      valueId,
    }: {
      attributeId: string;
      valueId: string;
    }) => attributesApi.deleteValue(attributeId, valueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.values(variables.attributeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.attributeId),
      });
      success('Attribute value removed successfully.', {
        title: 'Value Removed',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to remove attribute value.', {
        title: 'Failed to Remove Value',
      });
    },
  });
}
