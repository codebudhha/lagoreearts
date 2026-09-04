import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  lookbookApi,
  LookbookFilterParams,
  CreateLookbookPayload,
  UpdateLookbookPayload,
  CreateLookbookSectionPayload,
  UpdateLookbookSectionPayload,
  LookbookSectionMediaRole,
} from '../lib/api/lookbook';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useLookbooks(params?: LookbookFilterParams) {
  return useQuery({
    queryKey: queryKeys.lookbook.list(params),
    queryFn: () => lookbookApi.getLookbooks(params),
  });
}

export function useLookbookDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.lookbook.detail(id),
    queryFn: () => lookbookApi.getLookbook(id),
    enabled: Boolean(id),
  });
}

export function useCreateLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (payload: CreateLookbookPayload) => lookbookApi.createLookbook(payload),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success(`Lookbook "${lookbook.title}" created successfully`);
    },
    onError: (err: any) => { error(err?.message || 'Failed to create lookbook'); },
  });
}

export function useUpdateLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLookbookPayload }) =>
      lookbookApi.updateLookbook(id, payload),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbook.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success('Lookbook updated successfully');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update lookbook'); },
  });
}

export function useDeleteLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => lookbookApi.deleteLookbook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success('Lookbook deleted successfully');
    },
    onError: (err: any) => { error(err?.message || 'Failed to delete lookbook'); },
  });
}

export function useDuplicateLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => lookbookApi.duplicateLookbook(id),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success(`Duplicated as "${lookbook.title}"`);
    },
    onError: (err: any) => { error(err?.message || 'Failed to duplicate lookbook'); },
  });
}

export function usePublishLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, publishedAt }: { id: string; publishedAt?: string }) =>
      lookbookApi.publishLookbook(id, publishedAt),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbook.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success('Lookbook published');
    },
    onError: (err: any) => { error(err?.message || 'Failed to publish lookbook'); },
  });
}

export function useUnpublishLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => lookbookApi.unpublishLookbook(id),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbook.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success('Lookbook unpublished');
    },
    onError: (err: any) => { error(err?.message || 'Failed to unpublish lookbook'); },
  });
}

export function useArchiveLookbook() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => lookbookApi.archiveLookbook(id),
    onSuccess: (lookbook) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbook.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.lists() });
      success('Lookbook archived');
    },
    onError: (err: any) => { error(err?.message || 'Failed to archive lookbook'); },
  });
}

export function useLookbookSections(lookbookId: string) {
  return useQuery({
    queryKey: queryKeys.lookbook.sections(lookbookId),
    queryFn: () => lookbookApi.getSections(lookbookId),
    enabled: Boolean(lookbookId),
  });
}

export function useCreateLookbookSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ lookbookId, payload }: { lookbookId: string; payload: CreateLookbookSectionPayload }) =>
      lookbookApi.createSection(lookbookId, payload),
    onSuccess: (_, { lookbookId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbookId) });
      success('Section added to lookbook');
    },
    onError: (err: any) => { error(err?.message || 'Failed to add section'); },
  });
}

export function useUpdateLookbookSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ lookbookId: _lookbookId, sectionId, payload }: {
      lookbookId: string; sectionId: string; payload: UpdateLookbookSectionPayload;
    }) => lookbookApi.updateSection(sectionId, payload),
    onSuccess: (_, { lookbookId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.section(lookbookId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbookId) });
      success('Section updated successfully');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section'); },
  });
}

export function useDeleteLookbookSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ lookbookId: _lookbookId, sectionId }: { lookbookId: string; sectionId: string }) =>
      lookbookApi.deleteSection(sectionId),
    onSuccess: (_, { lookbookId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbookId) });
      success('Section removed');
    },
    onError: (err: any) => { error(err?.message || 'Failed to delete section'); },
  });
}

export function useReorderLookbookSections() {
  const queryClient = useQueryClient();
  const { error } = useToast();
  return useMutation({
    mutationFn: ({ lookbookId, items }: { lookbookId: string; items: Array<{ id: string; displayOrder: number }> }) =>
      lookbookApi.reorderSections(lookbookId, items),
    onSuccess: (_, { lookbookId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(lookbookId) });
    },
    onError: (err: any) => { error(err?.message || 'Failed to reorder sections'); },
  });
}

export function useSetSectionProducts() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, products }: { sectionId: string; products: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionProducts(sectionId, products),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section products updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section products'); },
  });
}

export function useSetSectionCollections() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, collections }: { sectionId: string; collections: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionCollections(sectionId, collections),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section collections updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section collections'); },
  });
}

export function useSetSectionArtists() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, artists }: { sectionId: string; artists: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionArtists(sectionId, artists),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section artists updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section artists'); },
  });
}

export function useSetSectionCategories() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, categories }: { sectionId: string; categories: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionCategories(sectionId, categories),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section categories updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section categories'); },
  });
}

export function useSetSectionJournals() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, journals }: { sectionId: string; journals: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionJournals(sectionId, journals),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section journal posts updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section journals'); },
  });
}

export function useSetSectionSanskritEdits() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, sanskritEdits }: { sectionId: string; sanskritEdits: Array<{ id: string; displayOrder?: number }> }) =>
      lookbookApi.setSectionSanskritEdits(sectionId, sanskritEdits),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Section sanskrit edits updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update section sanskrit edits'); },
  });
}

export function useAttachSectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: { mediaId: string; role?: LookbookSectionMediaRole; sortOrder?: number; isPrimary?: boolean } }) =>
      lookbookApi.attachSectionMedia(sectionId, payload),
    onSuccess: (section) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.detail(section.lookbookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.sections(section.lookbookId) });
      success('Media attached to section');
    },
    onError: (err: any) => { error(err?.message || 'Failed to attach media'); },
  });
}

export function useDetachSectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, mediaId, role }: { sectionId: string; mediaId: string; role: LookbookSectionMediaRole }) =>
      lookbookApi.detachSectionMedia(sectionId, mediaId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.all });
      success('Media detached from section');
    },
    onError: (err: any) => { error(err?.message || 'Failed to detach media'); },
  });
}

export function useReorderSectionMedia() {
  const queryClient = useQueryClient();
  const { error } = useToast();
  return useMutation({
    mutationFn: ({ sectionId, items }: { sectionId: string; items: Array<{ mediaId: string; role: LookbookSectionMediaRole; sortOrder: number; isPrimary?: boolean }> }) =>
      lookbookApi.reorderSectionMedia(sectionId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lookbook.all });
    },
    onError: (err: any) => { error(err?.message || 'Failed to reorder media'); },
  });
}

export const useLookbook = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.lookbook.detail(id),
    queryFn: () => lookbookApi.getLookbook(id),
    enabled: options?.enabled !== undefined ? options.enabled : Boolean(id),
  });
};
