/**
 * React Query hooks for Antiques & Collectibles
 * Lagoree Arts Admin Panel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  antiquesApi,
  CreateAntiqueProfilePayload,
  UpdateAntiqueProfilePayload,
  ListAntiquesParams,
} from '../lib/api/antiques';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

/**
 * Hook to list antique products with pagination and filters
 */
export function useAntiquesList(params?: ListAntiquesParams) {
  return useQuery({
    queryKey: queryKeys.antiques.list(params),
    queryFn: () => antiquesApi.list(params),
  });
}

/**
 * Hook to get antique profile for a product
 */
export function useAntiqueProfile(productId: string) {
  return useQuery({
    queryKey: queryKeys.antiques.profile(productId),
    queryFn: () => antiquesApi.getProfile(productId),
    enabled: Boolean(productId),
    retry: false,
  });
}

/**
 * Hook to create an antique profile for a product
 */
export function useCreateAntiqueProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: CreateAntiqueProfilePayload;
    }) => antiquesApi.createProfile(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.profile(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Antique & collectible specifications saved successfully.', {
        title: 'Antique Profile Created',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while creating the antique profile.', {
        title: 'Failed to Save Profile',
      });
    },
  });
}

/**
 * Hook to update an antique profile
 */
export function useUpdateAntiqueProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateAntiqueProfilePayload;
    }) => antiquesApi.updateProfile(productId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.profile(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.productId) });
      toast.success('Antique specifications updated successfully.', {
        title: 'Antique Profile Updated',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred while updating the antique profile.', {
        title: 'Failed to Update Profile',
      });
    },
  });
}

/**
 * Hook to delete an antique profile (product preserved)
 */
export function useDeleteAntiqueProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (productId: string) => antiquesApi.deleteProfile(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.profile(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.antiques.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast.success('Antique specifications removed from product.', {
        title: 'Antique Profile Removed',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove antique profile.', {
        title: 'Deletion Failed',
      });
    },
  });
}
