import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { ProductStatusControl } from '../../components/products/ProductStatusControl';
import { ProductMediaManager } from '../../components/products/ProductMediaManager';
import { ProductVariantManager } from '../../components/products/ProductVariantManager';
import { ProductAttributeEditor } from '../../components/products/ProductAttributeEditor';
import { SeoEditor } from '../../components/products/SeoEditor';
import { useAuth } from '../../hooks/useAuth';
import {
  useProductDetail,
  useUpdateProductStatus,
  useDeleteProduct,
  useUpdateProductAttributes,
} from '../../hooks/useProducts';
import { useProductSeo, useUpsertProductSeo } from '../../hooks/useProductSeo';
import { ProductAttributeAssignment } from '../../lib/api/products';
import {
  Package,
  Sparkles,
  Image as ImageIcon,
  Globe,
  Sliders,
  Edit2,
  ExternalLink,
  Trash2,
  FolderTree,
  Tag,
  Star,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('product.update');
  const canDelete = hasPermission('product.delete');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'media' | 'variants' | 'attributes' | 'seo'
  >('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Queries
  const { data: product, isLoading, isError, error, refetch } = useProductDetail(id);
  const { data: seoData } = useProductSeo(id);

  // Attribute editing state
  const [editedAttributes, setEditedAttributes] = useState<ProductAttributeAssignment[] | null>(
    null
  );
  const [seoForm, setSeoForm] = useState<{
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }>({});

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const deleteMutation = useDeleteProduct();
  const updateAttributesMutation = useUpdateProductAttributes();
  const upsertSeoMutation = useUpsertProductSeo();

  React.useEffect(() => {
    if (product?.attributes) {
      setEditedAttributes(product.attributes);
    }
  }, [product?.attributes]);

  React.useEffect(() => {
    if (seoData) {
      setSeoForm({
        metaTitle: seoData.metaTitle || '',
        metaDescription: seoData.metaDescription || '',
        canonicalUrl: seoData.canonicalUrl || '',
        ogTitle: seoData.ogTitle || '',
        ogDescription: seoData.ogDescription || '',
        ogImage: seoData.ogImage || '',
      });
    }
  }, [seoData]);

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
          title="Product not found"
          message={(error as any)?.message || 'Could not locate the requested product.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const primaryImage =
    product.media?.find((m) => m.isPrimary)?.url ||
    product.media?.[0]?.url ||
    product.image ||
    product.thumbnail;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(product.id);
    navigate('/admin/products');
  };

  const handleSaveAttributes = async () => {
    if (!editedAttributes) return;
    await updateAttributesMutation.mutateAsync({
      id: product.id,
      attributes: editedAttributes,
    });
  };

  const handleSaveSeo = async () => {
    await upsertSeoMutation.mutateAsync({
      productId: product.id,
      payload: seoForm,
    });
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={product.name || product.title}
        description={`SKU: ${product.sku} • Category: ${product.category?.name || 'Uncategorized'}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Products', path: '/admin/products' },
          { label: product.name || product.title || 'Product' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Link to={`/admin/products/${product.id}/preview`}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Storefront Preview
            </Button>
          </Link>
          {canUpdate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Product
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Top Banner Quick Controls */}
      <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProductStatusControl
            status={product.status}
            onChange={async (status) => {
              await updateStatusMutation.mutateAsync({ id: product.id, status });
            }}
          />
          <Badge variant={product.productType === 'VARIABLE' ? 'champagne' : 'secondary'}>
            {product.productType}
          </Badge>
          {product.isFeatured && (
            <Badge variant="champagne">
              <Star className="w-3 h-3 fill-gold-500 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-sans text-charcoal-600">
          <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-sand-300 gap-6 mt-6 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Overview & Inventory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'media'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Media Gallery ({product.media?.length || 0})
        </button>
        {product.productType === 'VARIABLE' && (
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'variants'
                ? 'border-gold-600 text-charcoal-900'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Variants Matrix
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('attributes')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'attributes'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Dynamic Attributes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'seo'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story & Description */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Artwork Description & Lineage
              </h3>
              {product.shortDescription && (
                <p className="text-sm font-serif italic text-charcoal-700 bg-sand-50/60 p-3.5 rounded-lg border border-sand-200">
                  {product.shortDescription}
                </p>
              )}
              <div className="text-sm font-serif text-charcoal-800 leading-relaxed whitespace-pre-line">
                {product.description || (
                  <span className="text-charcoal-400 italic">No detailed description provided.</span>
                )}
              </div>
            </div>

            {/* Financials & Stock */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2 mb-4">
                Financials & Inventory Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-xs text-charcoal-500 block uppercase font-sans">Price</span>
                  <span className="text-lg font-bold text-charcoal-900 font-serif">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                </div>
                {product.compareAtPrice && (
                  <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                    <span className="text-xs text-charcoal-500 block uppercase font-sans">
                      Compare At
                    </span>
                    <span className="text-lg font-medium text-charcoal-400 line-through font-serif">
                      ₹{Number(product.compareAtPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {product.costPrice !== undefined && product.costPrice !== null && (
                  <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                    <span className="text-xs text-charcoal-500 block uppercase font-sans">
                      Cost Price (Internal)
                    </span>
                    <span className="text-lg font-medium text-charcoal-700 font-serif">
                      ₹{Number(product.costPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-xs text-charcoal-500 block uppercase font-sans">
                    Inventory
                  </span>
                  <span className="text-lg font-bold text-emerald-800 font-serif">
                    {product.stockQuantity} in stock
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Primary Visual */}
            <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans mb-3">
                Cover Imagery
              </h3>
              <div className="aspect-square bg-sand-100 rounded-lg overflow-hidden border border-sand-200 flex items-center justify-center">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={product.name || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-charcoal-400" />
                )}
              </div>
            </div>

            {/* Taxonomy */}
            <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans border-b border-sand-200 pb-2">
                Taxonomy & Collections
              </h3>

              <div>
                <span className="text-xs text-charcoal-500 block font-sans">Category</span>
                <span className="text-sm font-semibold text-charcoal-900 font-serif flex items-center gap-1.5 mt-0.5">
                  <FolderTree className="w-4 h-4 text-gold-600" />
                  {product.category?.name || 'Uncategorized'}
                </span>
              </div>

              <div>
                <span className="text-xs text-charcoal-500 block font-sans mb-1">
                  Assigned Collections
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(product.collections || []).length > 0 ? (
                    product.collections?.map((col) => (
                      <Badge key={col.id} variant="secondary" size="sm">
                        <Tag className="w-3 h-3 mr-1 text-gold-600" />
                        {col.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-charcoal-400 italic">No collections assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Media Gallery */}
      {activeTab === 'media' && (
        <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm">
          <ProductMediaManager productId={product.id} disabled={!canUpdate} />
        </div>
      )}

      {/* Tab: Variants */}
      {activeTab === 'variants' && product.productType === 'VARIABLE' && (
        <ProductVariantManager
          productId={product.id}
          basePrice={Number(product.price)}
          baseSku={product.sku}
          disabled={!canUpdate}
        />
      )}

      {/* Tab: Dynamic Attributes */}
      {activeTab === 'attributes' && (
        <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans">
                Dynamic Product Attributes
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">
                Custom specification attributes for category "{product.category?.name || 'Category'}".
              </p>
            </div>
            {canUpdate && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAttributes}
                isLoading={updateAttributesMutation.isPending}
              >
                Save Attributes
              </Button>
            )}
          </div>

          <ProductAttributeEditor
            categoryId={product.categoryId}
            value={editedAttributes || []}
            onChange={setEditedAttributes}
            disabled={!canUpdate}
          />
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans">
                Search Engine Optimization (SEO)
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">
                Manage metadata, canonical URLs, and OpenGraph tags for search engines.
              </p>
            </div>
            {canUpdate && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSeo}
                isLoading={upsertSeoMutation.isPending}
              >
                Save SEO Settings
              </Button>
            )}
          </div>

          <SeoEditor
            values={seoForm}
            onChange={(updates) => setSeoForm({ ...seoForm, ...updates })}
            defaultTitle={product.name || product.title}
            defaultDescription={product.shortDescription || ''}
            slug={product.slug}
            disabled={!canUpdate}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name || product.title}"? This cannot be undone.`}
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
