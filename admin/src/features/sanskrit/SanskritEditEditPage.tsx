import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { SanskritEditForm } from '../../components/sanskrit/SanskritEditForm';
import { useProductDetail } from '../../hooks/useProducts';
import { useSanskritEditProfile, useUpdateSanskritEditProfile, useCreateSanskritEditProfile } from '../../hooks/useSanskritEdit';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';

export const SanskritEditEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading: productLoading, isError, error, refetch } = useProductDetail(id);
  const { data: profile, isLoading: profileLoading } = useSanskritEditProfile(id);

  const createMutation = useCreateSanskritEditProfile();
  const updateMutation = useUpdateSanskritEditProfile();

  const handleSave = async (data: any) => {
    if (profile) {
      await updateMutation.mutateAsync({ productId: id, payload: data });
    } else {
      await createMutation.mutateAsync({ productId: id, payload: data });
    }
    navigate(`/admin/sanskrit-edit/${id}`);
  };

  if (productLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !product) {
    return (
      <PageContainer>
        <ErrorState
          title="Product Not Found"
          message={(error as any)?.message || 'Could not find product for Sanskrit Edit editing.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit The Sanskrit Edit: ${product.name}`}
        description={`Update sacred verses, calligraphy, and editorial narratives for SKU ${product.sku}.`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'The Sanskrit Edit', path: '/admin/sanskrit-edit' },
          { label: product.name, path: `/admin/sanskrit-edit/${product.id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="max-w-4xl">
        <SanskritEditForm
          productId={product.id}
          initialData={profile}
          onSubmit={handleSave}
          onCancel={() => navigate(`/admin/sanskrit-edit/${product.id}`)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
