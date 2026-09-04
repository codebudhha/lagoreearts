import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ProductAntiqueProfile } from '../../components/antiques/ProductAntiqueProfile';
import { useProductDetail } from '../../hooks/useProducts';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Package, ExternalLink } from 'lucide-react';

export const AntiqueDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();

  const { data: product, isLoading, isError, error, refetch } = useProductDetail(id);

  if (isLoading) {
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
          message={(error as any)?.message || 'Could not find product for antique inspection.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Antique Profile: ${product.name}`}
        description={`SKU: ${product.sku} • Price: ₹${Number(product.price).toLocaleString('en-IN')}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Antiques & Collectibles', path: '/admin/antiques' },
          { label: product.name },
        ]}
      >
        <div className="flex items-center gap-2">
          <Link to={`/admin/products/${product.id}`}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Package className="w-4 h-4" />}
            >
              View Full Product
            </Button>
          </Link>
          <Link to={`/admin/products/${product.id}/preview`}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Storefront Preview
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm">
        <ProductAntiqueProfile
          productId={product.id}
          productStock={product.stockQuantity}
          productAllowBackorder={product.allowBackorder}
        />
      </div>
    </PageContainer>
  );
};
