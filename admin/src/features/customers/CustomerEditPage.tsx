import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useAuth } from '../../hooks/useAuth';

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
}

export const CustomerEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const { data: customer, isLoading, isError, error } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditForm>();

  useEffect(() => {
    if (customer) {
      reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: EditForm) => {
    if (!id) return;
    await updateCustomer.mutateAsync({
      id,
      data: {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phone: data.phone || null,
      },
    });
    navigate(`/admin/customers/${id}`);
  };

  if (!hasPermission('customer.update')) {
    return (
      <PageContainer>
        <ErrorState
          title="Permission denied"
          message="You do not have permission to edit customers."
        />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !customer) {
    return (
      <PageContainer>
        <ErrorState
          title="Customer not found"
          message={(error as Error)?.message || 'Could not load customer data.'}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit ${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Customers', path: '/admin/customers' },
          { label: customer.firstName, path: `/admin/customers/${id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-ivory-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-charcoal-900">
              Profile Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...register('firstName', { required: 'Required' })}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  {...register('lastName', { required: 'Required' })}
                  error={errors.lastName?.message}
                />
              </div>
              <Input
                label="Phone"
                {...register('phone', {
                  pattern: {
                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/,
                    message: 'Invalid phone number',
                  },
                })}
                error={errors.phone?.message}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Email"
                value={customer.email}
                disabled
                className="bg-ivory-50"
              />
              <p className="text-xs text-charcoal-500">
                Email changes must go through the customer's own verification workflow and cannot
                be made directly from admin.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/customers/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending || !isDirty}>
              {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
