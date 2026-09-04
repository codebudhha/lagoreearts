import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  navigationApi,
  NavigationFilterParams,
  CreateNavigationPayload,
  UpdateNavigationPayload,
  CreateNavigationItemPayload,
  UpdateNavigationItemPayload,
} from '../lib/api/navigation';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

export function useNavigations(params?: NavigationFilterParams) {
  return useQuery({
    queryKey: queryKeys.navigation.list(params),
    queryFn: () => navigationApi.getNavigations(params),
  });
}

export function useNavigationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.navigation.detail(id),
    queryFn: () => navigationApi.getNavigation(id),
    enabled: Boolean(id),
  });
}

export function useCreateNavigation() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (payload: CreateNavigationPayload) => navigationApi.createNavigation(payload),
    onSuccess: (nav) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.lists() });
      success(`Navigation "${nav.name}" created successfully`);
    },
    onError: (err: any) => { error(err?.message || 'Failed to create navigation'); },
  });
}

export function useUpdateNavigation() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNavigationPayload }) =>
      navigationApi.updateNavigation(id, payload),
    onSuccess: (nav) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(nav.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.lists() });
      success('Navigation updated successfully');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update navigation'); },
  });
}

export function useDeleteNavigation() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => navigationApi.deleteNavigation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.lists() });
      success('Navigation deleted successfully');
    },
    onError: (err: any) => { error(err?.message || 'Failed to delete navigation'); },
  });
}

export function useNavigationItems(navigationId: string) {
  return useQuery({
    queryKey: queryKeys.navigation.items(navigationId),
    queryFn: () => navigationApi.getNavigationItems(navigationId),
    enabled: Boolean(navigationId),
  });
}

export function useCreateNavigationItem() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ navigationId, payload }: { navigationId: string; payload: CreateNavigationItemPayload }) =>
      navigationApi.createItem(navigationId, payload),
    onSuccess: (_, { navigationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.items(navigationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(navigationId) });
      success('Menu item added');
    },
    onError: (err: any) => { error(err?.message || 'Failed to add menu item'); },
  });
}

export function useUpdateNavigationItem() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ navigationId, itemId, payload }: {
      navigationId: string; itemId: string; payload: UpdateNavigationItemPayload;
    }) => navigationApi.updateItem(navigationId, itemId, payload),
    onSuccess: (_, { navigationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.items(navigationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(navigationId) });
      success('Menu item updated');
    },
    onError: (err: any) => { error(err?.message || 'Failed to update menu item'); },
  });
}

export function useDeleteNavigationItem() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ navigationId, itemId }: { navigationId: string; itemId: string }) =>
      navigationApi.deleteItem(navigationId, itemId),
    onSuccess: (_, { navigationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.items(navigationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(navigationId) });
      success('Menu item deleted');
    },
    onError: (err: any) => { error(err?.message || 'Failed to delete menu item'); },
  });
}

export function useReorderNavigationItems() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ navigationId, items }: { navigationId: string; items: Array<{ id: string; parentId?: string | null; sortOrder: number }> }) =>
      navigationApi.reorderItems(navigationId, items),
    onSuccess: (_, { navigationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.items(navigationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(navigationId) });
      success('Menu items reordered');
    },
    onError: (err: any) => { error(err?.message || 'Failed to reorder menu items'); },
  });
}

export function useMoveNavigationItem() {
  const queryClient = useQueryClient();
  const { error } = useToast();
  return useMutation({
    mutationFn: ({ navigationId, itemId, payload }: {
      navigationId: string; itemId: string; payload: { parentId?: string | null; sortOrder?: number };
    }) => navigationApi.moveItem(navigationId, itemId, payload),
    onSuccess: (_, { navigationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.items(navigationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation.detail(navigationId) });
    },
    onError: (err: any) => { error(err?.message || 'Failed to move menu item'); },
  });
}

export const useNavigation = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.navigation.detail(id),
    queryFn: () => navigationApi.getNavigation(id),
    enabled: options?.enabled !== undefined ? options.enabled : Boolean(id),
  });
};
