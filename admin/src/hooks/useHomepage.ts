import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  homepageApi,
  HomepageStatus,
  HomepageFilterParams,
  CreateHomepagePayload,
  UpdateHomepagePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  HomepageSectionMediaRole,
} from '../lib/api/homepage';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

// Homepage Hooks
export function useHomepages(params?: HomepageFilterParams) {
  return useQuery({
    queryKey: queryKeys.homepage.list(params),
    queryFn: () => homepageApi.getHomepages(params),
  });
}

export function useHomepageDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.homepage.detail(id),
    queryFn: () => homepageApi.getHomepage(id),
    enabled: Boolean(id),
  });
}

export function useCreateHomepage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateHomepagePayload) => homepageApi.createHomepage(payload),
    onSuccess: (newHp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.lists() });
      success(`Homepage "${newHp.name}" created successfully`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create homepage');
    },
  });
}

export function useUpdateHomepage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateHomepagePayload }) =>
      homepageApi.updateHomepage(id, payload),
    onSuccess: (updatedHp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(updatedHp.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.lists() });
      success(`Homepage updated successfully`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update homepage');
    },
  });
}

export function useDeleteHomepage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => homepageApi.deleteHomepage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.lists() });
      success('Homepage deleted successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete homepage');
    },
  });
}

export function useUpdateHomepageStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: HomepageStatus }) =>
      homepageApi.updateStatus(id, status),
    onSuccess: (hp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(hp.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.lists() });
      success(`Homepage status changed to ${hp.status}`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update status');
    },
  });
}

export function useSetDefaultHomepage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => homepageApi.setDefault(id),
    onSuccess: (hp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.all });
      success(`"${hp.name}" is now set as the active storefront homepage`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to set default homepage');
    },
  });
}

// Section Hooks
export function useHomepageSections(homepageId: string) {
  return useQuery({
    queryKey: queryKeys.homepage.sections(homepageId),
    queryFn: () => homepageApi.getSections(homepageId),
    enabled: Boolean(homepageId),
  });
}

export function useHomepageSectionDetail(homepageId: string, sectionId: string) {
  return useQuery({
    queryKey: queryKeys.homepage.section(homepageId, sectionId),
    queryFn: () => homepageApi.getSection(homepageId, sectionId),
    enabled: Boolean(homepageId && sectionId),
  });
}

export function useCreateHomepageSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ homepageId, payload }: { homepageId: string; payload: CreateSectionPayload }) =>
      homepageApi.createSection(homepageId, payload),
    onSuccess: (_, { homepageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(homepageId) });
      success('Section added to homepage');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to add section');
    },
  });
}

export function useUpdateHomepageSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      payload,
    }: {
      homepageId: string;
      sectionId: string;
      payload: UpdateSectionPayload;
    }) => homepageApi.updateSection(homepageId, sectionId, payload),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(homepageId) });
      success('Section updated successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update section');
    },
  });
}

export function useDeleteHomepageSection() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ homepageId, sectionId }: { homepageId: string; sectionId: string }) =>
      homepageApi.deleteSection(homepageId, sectionId),
    onSuccess: (_, { homepageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(homepageId) });
      success('Section removed');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete section');
    },
  });
}

export function useReorderHomepageSections() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({ homepageId, items }: { homepageId: string; items: Array<{ id: string; displayOrder: number }> }) =>
      homepageApi.reorderSections(homepageId, items),
    onSuccess: (_, { homepageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.detail(homepageId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to reorder sections');
    },
  });
}

// Junction Hooks
export function useSetSectionProducts() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      products,
    }: {
      homepageId: string;
      sectionId: string;
      products: Array<{ id: string; displayOrder?: number }>;
    }) => homepageApi.setSectionProducts(homepageId, sectionId, products),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Products assigned to section');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update section products');
    },
  });
}

export function useSetSectionCollections() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      collections,
    }: {
      homepageId: string;
      sectionId: string;
      collections: Array<{ id: string; displayOrder?: number }>;
    }) => homepageApi.setSectionCollections(homepageId, sectionId, collections),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Collections assigned to section');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update section collections');
    },
  });
}

export function useSetSectionArtists() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      artists,
    }: {
      homepageId: string;
      sectionId: string;
      artists: Array<{ id: string; displayOrder?: number }>;
    }) => homepageApi.setSectionArtists(homepageId, sectionId, artists),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Artists assigned to section');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update section artists');
    },
  });
}

export function useSetSectionCategories() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      categories,
    }: {
      homepageId: string;
      sectionId: string;
      categories: Array<{ id: string; displayOrder?: number }>;
    }) => homepageApi.setSectionCategories(homepageId, sectionId, categories),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Categories assigned to section');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update section categories');
    },
  });
}

// Media Hooks
export function useAttachSectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      payload,
    }: {
      homepageId: string;
      sectionId: string;
      payload: { mediaId: string; role?: HomepageSectionMediaRole; displayOrder?: number; altText?: string; customUrl?: string };
    }) => homepageApi.attachSectionMedia(homepageId, sectionId, payload),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Media asset attached');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to attach media');
    },
  });
}

export function useDetachSectionMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      mediaId,
      role,
    }: {
      homepageId: string;
      sectionId: string;
      mediaId: string;
      role?: HomepageSectionMediaRole;
    }) => homepageApi.detachSectionMedia(homepageId, sectionId, mediaId, role),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
      success('Media asset detached');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to detach media');
    },
  });
}

export function useReorderSectionMedia() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({
      homepageId,
      sectionId,
      items,
    }: {
      homepageId: string;
      sectionId: string;
      items: Array<{ mediaId: string; role: HomepageSectionMediaRole; displayOrder: number }>;
    }) => homepageApi.reorderSectionMedia(homepageId, sectionId, items),
    onSuccess: (_, { homepageId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.section(homepageId, sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homepage.sections(homepageId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to reorder media');
    },
  });
}

// Synonyms & convenience aliases
export const useHomepagesList = useHomepages;
export const useHomepage = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.homepage.detail(id),
    queryFn: () => homepageApi.getHomepage(id),
    enabled: options?.enabled !== undefined ? options.enabled : Boolean(id),
  });
};
export const useCreateSection = useCreateHomepageSection;
export const useUpdateSection = useUpdateHomepageSection;
export const useDeleteSection = useDeleteHomepageSection;
export const useReorderSections = useReorderHomepageSections;
export const useSyncSectionProducts = useSetSectionProducts;
export const useSyncSectionCollections = useSetSectionCollections;
export const useSyncSectionArtists = useSetSectionArtists;
export const useSyncSectionCategories = useSetSectionCategories;
export const useAddSectionMedia = useAttachSectionMedia;
export const useRemoveSectionMedia = useDetachSectionMedia;
