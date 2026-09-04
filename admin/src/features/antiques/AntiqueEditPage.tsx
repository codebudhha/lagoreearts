import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AntiqueProfileForm } from '../../components/antiques/AntiqueProfileForm';
import { useProductDetail } from '../../hooks/useProducts';
import { useAntiqueProfile, useUpdateAntiqueProfile, useCreateAntiqueProfile } from '../../hooks/useAntiques';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';

export const AntiqueEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading: productLoading, isError, error, refetch } = useProductDetail(id);
  const { data: profile, isLoading: profileLoading } = useAntiqueProfile(id);

  const createMutation = useCreateAntiqueProfile();
  const updateMutation = useUpdateAntiqueProfile();

  const handleSave = async (data: any) => {
    if (profile) {
      await updateMutation.mutateAsync({ productId: id, payload: data });
    } else {
      await createMutation.mutateAsync({ productId: id, payload: data });
    }
    navigate(`/admin/antiques/${id}`);
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
          message={(error as any)?.message || 'Could not find product for antique editing.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Antique Specifications: ${product.name}`}
        description={`Configure authenticity certificates, era, and dimensions for SKU ${product.sku}.`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Antiques & Collectibles', path: '/admin/antiques' },
          { label: product.name, path: `/admin/antiques/${product.id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="max-w-4xl">
        <AntiqueProfileForm
          productId={product.id}
          initialData={profile}
          productStock={product.stockQuantity}
          productAllowBackorder={product.allowBackorder}
          onSubmit={handleSave}
          onCancel={() => navigate(`/admin/antiques/${product.id}`)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
