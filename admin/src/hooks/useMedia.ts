import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mediaApi,
  MediaFolder,
  CreateFolderPayload,
  UpdateFolderPayload,
  MediaAsset,
  ListMediaParams,
  ListMediaResponseData,
  UpdateMediaPayload,
} from '../lib/api/media';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

/* ========================================================================
 * MEDIA FOLDERS HOOKS
 * ======================================================================== */

export function useMediaFolders(search?: string, enabled = true) {
  return useQuery<MediaFolder[]>({
    queryKey: search ? ['media', 'folders', { search }] : queryKeys.media.folders,
    queryFn: () => mediaApi.listFolders(search),
    enabled,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useMediaFolderDetail(id: string, enabled = true) {
  return useQuery<MediaFolder>({
    queryKey: queryKeys.media.folder(id),
    queryFn: () => mediaApi.getFolder(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60,
  });
}

export function useCreateMediaFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => mediaApi.createFolder(payload),
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      success(`Folder "${folder.name}" created successfully.`, {
        title: 'Folder Created',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create media folder.', {
        title: 'Creation Failed',
      });
    },
  });
}

export function useUpdateMediaFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFolderPayload }) =>
      mediaApi.updateFolder(id, payload),
    onSuccess: (folder, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folder(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      success(`Folder "${folder.name}" updated successfully.`, {
        title: 'Folder Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update media folder.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDeleteMediaFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => mediaApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      success('Media folder deleted successfully.', {
        title: 'Folder Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete media folder.', {
        title: 'Delete Failed',
      });
    },
  });
}

/* ========================================================================
 * MEDIA ASSET HOOKS
 * ======================================================================== */

export function useMediaList(params?: ListMediaParams, enabled = true) {
  return useQuery<ListMediaResponseData>({
    queryKey: queryKeys.media.list(params || {}),
    queryFn: () => mediaApi.list(params),
    enabled,
    staleTime: 1000 * 30, // 30s
  });
}

export function useMediaDetail(id: string, enabled = true) {
  return useQuery<MediaAsset>({
    queryKey: queryKeys.media.detail(id),
    queryFn: () => mediaApi.getById(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60,
  });
}

export function useOrphanMediaList(params?: ListMediaParams, enabled = true) {
  return useQuery<ListMediaResponseData>({
    queryKey: queryKeys.media.orphans(params || {}),
    queryFn: () => mediaApi.listOrphans(params),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useUploadMediaAsset() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      file,
      folderId,
      title,
      altText,
      caption,
    }: {
      file: File;
      folderId?: string;
      title?: string;
      altText?: string;
      caption?: string;
    }) => mediaApi.upload(file, folderId, title, altText, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      success('Image uploaded successfully to the Media Library.', {
        title: 'Upload Successful',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to upload media asset.', {
        title: 'Upload Failed',
      });
    },
  });
}

export function useUpdateMediaAsset() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMediaPayload }) =>
      mediaApi.update(id, payload),
    onSuccess: (asset, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      success(`Media "${asset.title || asset.originalFilename}" updated successfully.`, {
        title: 'Media Updated',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update media details.', {
        title: 'Update Failed',
      });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      success('Media asset deleted from library.', {
        title: 'Asset Deleted',
      });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete media asset.', {
        title: 'Delete Failed',
      });
    },
  });
}

export function useMoveMediaAssets() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ assetIds, folderId }: { assetIds: string[]; folderId: string | null }) => {
      const promises = assetIds.map((id) =>
        mediaApi.update(id, { folderId })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.folders });
      success(
        `Moved ${variables.assetIds.length} asset${
          variables.assetIds.length > 1 ? 's' : ''
        } successfully.`,
        { title: 'Assets Moved' }
      );
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to move media assets.', {
        title: 'Move Failed',
      });
    },
  });
}
