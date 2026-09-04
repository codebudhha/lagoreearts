/**
 * React Query hooks for Artists & Master Makers
 * Lagoree Arts Admin Panel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  artistsApi,
  CreateArtistPayload,
  UpdateArtistPayload,
  ListArtistsParams,
  ArtistStatus,
  ArtistRole,
  AttachProductArtistPayload,
  UpdateProductArtistPayload,
  ProductArtistReorderItem,
  ArtistReorderItem,
  AttachArtistMediaPayload,
  ArtistMediaReorderItem,
} from '../lib/api/artists';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

/**
 * Hook to fetch paginated artists list
 */
export function useArtists(params?: ListArtistsParams) {
  return useQuery({
    queryKey: queryKeys.artists.list(params),
    queryFn: () => artistsApi.list(params),
  });
}

/**
 * Hook to fetch single artist details
 */
export function useArtistDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.artists.detail(id),
    queryFn: () => artistsApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to create an artist
 */
export function useCreateArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateArtistPayload) => artistsApi.create(payload),
    onSuccess: (artist) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      toast.success(`Artist "${artist.name}" created successfully.`, {
        title: 'Artist Created',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while creating the artist.', {
        title: 'Failed to Create Artist',
      });
    },
  });
}

/**
 * Hook to update an artist
 */
export function useUpdateArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateArtistPayload }) =>
      artistsApi.update(id, payload),
    onSuccess: (artist) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(artist.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.lists() });
      toast.success(`Artist "${artist.name}" updated successfully.`, {
        title: 'Artist Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while updating the artist.', {
        title: 'Failed to Update Artist',
      });
    },
  });
}

/**
 * Hook to delete an artist
 */
export function useDeleteArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => artistsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      toast.success('The artist profile was removed successfully.', {
        title: 'Artist Deleted',
      });
    },
    onError: (err: any) => {
      const isConflict = err.status === 409 || err.code === 'ARTIST_IN_USE';
      toast.error(
        isConflict
          ? 'This artist cannot be deleted because they are associated with products.'
          : (err.message || 'Could not delete artist profile.'),
        {
          title: isConflict ? 'Deletion Blocked' : 'Failed to Delete Artist',
        }
      );
    },
  });
}

/**
 * Hook to toggle artist status
 */
export function useUpdateArtistStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArtistStatus }) =>
      artistsApi.updateStatus(id, status),
    onSuccess: (artist) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(artist.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.lists() });
      toast.success(`Artist status set to ${artist.status}.`, {
        title: 'Status Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update artist status.', {
        title: 'Update Failed',
      });
    },
  });
}

/**
 * Hook to toggle artist featured flag
 */
export function useUpdateArtistFeatured() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      artistsApi.updateFeatured(id, isFeatured),
    onSuccess: (artist) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(artist.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.lists() });
      toast.success(`Artist featured status set to ${artist.isFeatured ? 'Featured' : 'Standard'}.`, {
        title: 'Featured Status Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update featured flag.', {
        title: 'Update Failed',
      });
    },
  });
}

/**
 * Hook to reorder artists
 */
export function useReorderArtists() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (items: ArtistReorderItem[]) => artistsApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.lists() });
      toast.success('Artists display sequence saved successfully.', {
        title: 'Order Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder artists.', {
        title: 'Reorder Failed',
      });
    },
  });
}

// ==========================================
// Artist Media Hooks
// ==========================================

export function useArtistMedia(artistId: string) {
  return useQuery({
    queryKey: queryKeys.artists.media(artistId),
    queryFn: () => artistsApi.listMedia(artistId),
    enabled: Boolean(artistId),
  });
}

export function useAttachArtistMedia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ artistId, payload }: { artistId: string; payload: AttachArtistMediaPayload }) =>
      artistsApi.attachMedia(artistId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.media(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(variables.artistId) });
      toast.success('Artwork media attached to artist profile.', {
        title: 'Media Attached',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to attach media.', {
        title: 'Media Attachment Failed',
      });
    },
  });
}

export function useSetPrimaryArtistMedia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ artistId, mediaId, role }: { artistId: string; mediaId: string; role?: string }) =>
      artistsApi.setPrimaryMedia(artistId, mediaId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.media(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(variables.artistId) });
      toast.success('Primary media designated for this artist profile.', {
        title: 'Primary Media Set',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to set primary media.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDetachArtistMedia() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ artistId, mediaId, role }: { artistId: string; mediaId: string; role?: string }) =>
      artistsApi.detachMedia(artistId, mediaId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.media(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(variables.artistId) });
      toast.success('Media detached from artist portfolio.', {
        title: 'Media Detached',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to detach media.', {
        title: 'Detach Failed',
      });
    },
  });
}

export function useReorderArtistMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artistId, items }: { artistId: string; items: ArtistMediaReorderItem[] }) =>
      artistsApi.reorderMedia(artistId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.media(variables.artistId) });
    },
  });
}

// ==========================================
// Product Artists Hooks
// ==========================================

export function useProductArtists(productId: string) {
  return useQuery({
    queryKey: queryKeys.artists.products(productId),
    queryFn: () => artistsApi.listProductArtists(productId),
    enabled: Boolean(productId),
  });
}

export function useAttachProductArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: AttachProductArtistPayload }) =>
      artistsApi.attachProductArtist(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.products(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Artist linked to product successfully.', {
        title: 'Artist Linked',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to link artist to product.', {
        title: 'Link Failed',
      });
    },
  });
}

export function useUpdateProductArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      artistId,
      payload,
      currentRole,
    }: {
      productId: string;
      artistId: string;
      payload: UpdateProductArtistPayload;
      currentRole?: ArtistRole;
    }) => artistsApi.updateProductArtist(productId, artistId, payload, currentRole),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.products(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Product artist role & primary status updated.', {
        title: 'Role Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update product artist.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDetachProductArtist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ productId, artistId, role }: { productId: string; artistId: string; role?: ArtistRole }) =>
      artistsApi.detachProductArtist(productId, artistId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.products(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Artist removed from this artwork.', {
        title: 'Artist Unlinked',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to unlink artist.', {
        title: 'Detach Failed',
      });
    },
  });
}

export function useReorderProductArtists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, items }: { productId: string; items: ProductArtistReorderItem[] }) =>
      artistsApi.reorderProductArtists(productId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.products(variables.productId) });
    },
  });
}
