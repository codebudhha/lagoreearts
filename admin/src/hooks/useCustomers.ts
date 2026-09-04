import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customersApi, ListCustomersParams, CustomerStatus, CustomerAddressFormData } from '../lib/api/customers';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

// ── Queries ──

export function useCustomerList(params?: ListCustomersParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id || ''),
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
  });
}

export function useCustomerAddresses(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.addresses(id || ''),
    queryFn: () => customersApi.getAddresses(id!),
    enabled: !!id,
  });
}

export function useCustomerSessions(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.sessions(id || ''),
    queryFn: () => customersApi.getSessions(id!),
    enabled: !!id,
  });
}

// ── Mutations ──

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { firstName?: string; lastName?: string; phone?: string | null } }) =>
      customersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      success('Customer updated successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update customer');
    },
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerStatus }) =>
      customersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      success('Customer status updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update customer status');
    },
  });
}

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: CustomerAddressFormData }) =>
      customersApi.createAddress(customerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.customerId) });
      success('Address created successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create address');
    },
  });
}

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({
      customerId,
      addressId,
      data,
    }: {
      customerId: string;
      addressId: string;
      data: Partial<CustomerAddressFormData>;
    }) => customersApi.updateAddress(customerId, addressId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(variables.customerId) });
      success('Address updated successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update address');
    },
  });
}

export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ customerId, addressId }: { customerId: string; addressId: string }) =>
      customersApi.deleteAddress(customerId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.customerId) });
      success('Address deleted');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete address');
    },
  });
}

export function useSetDefaultShippingAddress() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ customerId, addressId }: { customerId: string; addressId: string }) =>
      customersApi.setDefaultShipping(customerId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(variables.customerId) });
      success('Default shipping address updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to set default shipping address');
    },
  });
}

export function useSetDefaultBillingAddress() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: ({ customerId, addressId }: { customerId: string; addressId: string }) =>
      customersApi.setDefaultBilling(customerId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.addresses(variables.customerId) });
      success('Default billing address updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to set default billing address');
    },
  });
}

export function useRevokeCustomerSessions() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  return useMutation({
    mutationFn: (id: string) => customersApi.revokeSessions(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.sessions(id) });
      success(`${data.revokedCount} session(s) revoked`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to revoke sessions');
    },
  });
}
