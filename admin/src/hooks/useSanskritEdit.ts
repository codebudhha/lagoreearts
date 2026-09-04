/**
 * React Query hooks for The Sanskrit Edit
 * Lagoree Arts Admin Panel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sanskritEditApi,
  CreateSanskritEditProfilePayload,
  UpdateSanskritEditProfilePayload,
  ListSanskritEditParams,
  SanskritEditReorderItem,
} from '../lib/api/sanskritEdit';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

/**
 * Hook to list Sanskrit Edit profiles with pagination and filters
 */
export function useSanskritEditList(params?: ListSanskritEditParams) {
  return useQuery({
    queryKey: queryKeys.sanskritEdit.list(params),
    queryFn: () => sanskritEditApi.list(params),
  });
}

/**
 * Hook to get Sanskrit Edit profile for a product
 */
export function useSanskritEditProfile(productId: string) {
  return useQuery({
    queryKey: queryKeys.sanskritEdit.profile(productId),
    queryFn: () => sanskritEditApi.getProfile(productId),
    enabled: Boolean(productId),
    retry: false,
  });
}

/**
 * Hook to create a Sanskrit Edit profile
 */
export function useCreateSanskritEditProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: CreateSanskritEditProfilePayload;
    }) => sanskritEditApi.createProfile(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.profile(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Sanskrit verse and editorial interpretation saved.', {
        title: 'Sanskrit Edit Profile Created',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while creating the Sanskrit Edit profile.', {
        title: 'Creation Failed',
      });
    },
  });
}

/**
 * Hook to update a Sanskrit Edit profile
 */
export function useUpdateSanskritEditProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateSanskritEditProfilePayload;
    }) => sanskritEditApi.updateProfile(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.profile(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Sanskrit editorial content updated successfully.', {
        title: 'Sanskrit Edit Profile Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while updating the Sanskrit Edit profile.', {
        title: 'Update Failed',
      });
    },
  });
}

/**
 * Hook to delete a Sanskrit Edit profile (product preserved)
 */
export function useDeleteSanskritEditProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (productId: string) => sanskritEditApi.deleteProfile(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.profile(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast.success('Sanskrit Edit editorial entry removed from product.', {
        title: 'Sanskrit Edit Profile Removed',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove Sanskrit Edit profile.', {
        title: 'Deletion Failed',
      });
    },
  });
}

/**
 * Hook to reorder Sanskrit Edit profiles
 */
export function useReorderSanskritEditProfiles() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (items: SanskritEditReorderItem[]) => sanskritEditApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sanskritEdit.lists() });
      toast.success('Sanskrit Edit order saved successfully.', {
        title: 'Display Sequence Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder Sanskrit Edit profiles.', {
        title: 'Reorder Failed',
      });
    },
  });
}
