import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi, AttachedMedia, MediaAsset } from '../lib/api/media';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useProductMedia(productId: string, enabled = true) {
  return useQuery<AttachedMedia[]>({
    queryKey: queryKeys.products.media(productId),
    queryFn: () => mediaApi.getProductMedia(productId),
    enabled: Boolean(productId) && enabled,
  });
}

export function useMediaLibrary(params?: { page?: number; limit?: number; search?: string; folderId?: string }) {
  return useQuery<{ media: MediaAsset[]; total: number }>({
    queryKey: queryKeys.media.list(params || {}),
    queryFn: () => mediaApi.list(params),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      file,
      folderId,
      title,
      altText,
    }: {
      file: File;
      folderId?: string;
      title?: string;
      altText?: string;
    }) => mediaApi.upload(file, folderId, title, altText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      success('Image was successfully uploaded to the Media Library.', {
        title: 'Upload Complete',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to upload media asset.', {
        title: 'Upload Failed',
      });
    },
  });
}

export function useAttachProductMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: { mediaId: string; isPrimary?: boolean; altText?: string; sortOrder?: number };
    }) => mediaApi.attachProductMedia(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.media(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Image successfully attached to product.', {
        title: 'Media Attached',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to attach image to product.', {
        title: 'Attachment Failed',
      });
    },
  });
}

export function useDetachProductMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      mediaApi.detachProductMedia(productId, mediaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.media(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      success('Image removed from product.', {
        title: 'Media Detached',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to remove media from product.', {
        title: 'Detach Failed',
      });
    },
  });
}

export function useReorderProductMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ productId, mediaIds }: { productId: string; mediaIds: string[] }) =>
      mediaApi.reorderProductMedia(productId, mediaIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.media(variables.productId) });
      success('Image order has been updated.', {
        title: 'Media Reordered',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update image order.', {
        title: 'Reorder Failed',
      });
    },
  });
}
