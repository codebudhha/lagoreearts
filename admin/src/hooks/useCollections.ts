import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collectionsApi,
  AdminCollection,
  ListCollectionsParams,
  ListCollectionsResponseData,
  CreateCollectionPayload,
  UpdateCollectionPayload,
  AttachCollectionMediaPayload,
} from '../lib/api/collections';
import { ListProductsParams, ListProductsResponseData } from '../lib/api/products';
import { AttachedMedia } from '../lib/api/media';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useCollectionsList(params?: ListCollectionsParams, enabled = true) {
  return useQuery<ListCollectionsResponseData>({
    queryKey: queryKeys.collections.list(params || {}),
    queryFn: () => collectionsApi.list(params),
    enabled,
    staleTime: 1000 * 30, // 30s
  });
}

export function useCollectionDetail(id: string, enabled = true) {
  return useQuery<AdminCollection>({
    queryKey: queryKeys.collections.detail(id),
    queryFn: () => collectionsApi.getById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) => collectionsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      success(`Collection "${data.name}" was successfully created.`, {
        title: 'Collection Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create collection.', {
        title: 'Creation Failed',
      });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCollectionPayload }) =>
      collectionsApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      success(`Collection "${data.name}" has been updated.`, {
        title: 'Collection Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update collection.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useUpdateCollectionSort() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      collectionsApi.updateSort(id, sortOrder),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      success(`Sort order updated for "${data.name}".`, {
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

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      success('Collection deleted successfully.', {
        title: 'Collection Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete collection. System collections cannot be removed.', {
        title: 'Delete Failed',
      });
    },
  });
}

// ----------------------------------------------------
// Product ↔ Collection Associations
// ----------------------------------------------------

export function useCollectionProducts(
  collectionId: string,
  params?: ListProductsParams,
  enabled = true
) {
  return useQuery<ListProductsResponseData>({
    queryKey: queryKeys.collections.products(collectionId, params),
    queryFn: () => collectionsApi.getAssignedProducts(collectionId, params),
    enabled: Boolean(collectionId) && enabled,
    staleTime: 1000 * 30,
  });
}

export function useAssignProductToCollection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      collectionId,
      productId,
    }: {
      collectionId: string;
      productId: string;
    }) => collectionsApi.assignProduct(collectionId, productId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collections', 'products', variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
      success('Product added to collection.', {
        title: 'Product Assigned',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to assign product to collection.', {
        title: 'Assignment Failed',
      });
    },
  });
}

export function useRemoveProductFromCollection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      collectionId,
      productId,
    }: {
      collectionId: string;
      productId: string;
    }) => collectionsApi.removeProduct(collectionId, productId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collections', 'products', variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
      success('Product removed from collection.', {
        title: 'Product Removed',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to remove product from collection.', {
        title: 'Removal Failed',
      });
    },
  });
}

// ----------------------------------------------------
// Collection Media Hooks
// ----------------------------------------------------

export function useCollectionMedia(collectionId: string, enabled = true) {
  return useQuery<AttachedMedia[]>({
    queryKey: queryKeys.collections.media(collectionId),
    queryFn: () => collectionsApi.getMedia(collectionId),
    enabled: Boolean(collectionId) && enabled,
    staleTime: 1000 * 60,
  });
}

export function useAttachCollectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      collectionId,
      payload,
    }: {
      collectionId: string;
      payload: AttachCollectionMediaPayload;
    }) => collectionsApi.attachMedia(collectionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.media(variables.collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
      success('Media attached to collection.', {
        title: 'Media Attached',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to attach media to collection.', {
        title: 'Attachment Failed',
      });
    },
  });
}

export function useDetachCollectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      collectionId,
      mediaId,
    }: {
      collectionId: string;
      mediaId: string;
    }) => collectionsApi.detachMedia(collectionId, mediaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.media(variables.collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
      success('Media removed from collection.', {
        title: 'Media Detached',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to detach media from collection.', {
        title: 'Detach Failed',
      });
    },
  });
}

export function useReorderCollectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      collectionId,
      mediaOrders,
    }: {
      collectionId: string;
      mediaOrders: Array<{ mediaId: string; sortOrder: number }>;
    }) => collectionsApi.reorderMedia(collectionId, mediaOrders),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.media(variables.collectionId),
      });
      success('Media display order updated.', {
        title: 'Order Saved',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to reorder media.', {
        title: 'Reorder Failed',
      });
    },
  });
}
