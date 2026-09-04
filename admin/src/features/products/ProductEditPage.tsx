import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { CategoryTreeSelector } from '../../components/products/CategoryTreeSelector';
import { CollectionMultiSelector } from '../../components/products/CollectionMultiSelector';
import { UnsavedChangesDialog } from '../../components/products/UnsavedChangesDialog';
import { useAuth } from '../../hooks/useAuth';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useProductDetail, useUpdateProduct } from '../../hooks/useProducts';
import { AlertCircle, Lock } from 'lucide-react';

interface ProductEditFormValues {
  name: string;
  sku: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  productType: 'SIMPLE' | 'VARIABLE';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  sortOrder: number;
  categoryId: string;
  collectionIds: string[];
}

export const ProductEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('product.update');

  const { data: product, isLoading, isError, error, refetch } = useProductDetail(id);
  const updateProductMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty: isFormDirty },
  } = useForm<ProductEditFormValues>({
    defaultValues: {
      name: '',
      sku: '',
      slug: '',
      shortDescription: '',
      description: '',
      price: 0,
      compareAtPrice: null,
      costPrice: null,
      productType: 'SIMPLE',
      status: 'DRAFT',
      stockQuantity: 0,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: false,
      isNewArrival: false,
      isBestseller: false,
      sortOrder: 0,
      categoryId: '',
      collectionIds: [],
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || product.title || '',
        sku: product.sku || '',
        slug: product.slug || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: Number(product.price) || 0,
        compareAtPrice: product.compareAtPrice !== null && product.compareAtPrice !== undefined ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice !== null && product.costPrice !== undefined ? Number(product.costPrice) : null,
        productType: product.productType || 'SIMPLE',
        status: product.status || 'DRAFT',
        stockQuantity: product.stockQuantity ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 3,
        trackInventory: product.trackInventory ?? (product.inventoryTracking ?? true),
        allowBackorder: product.allowBackorder ?? false,
        isFeatured: product.isFeatured ?? false,
        isNewArrival: product.isNewArrival ?? false,
        isBestseller: product.isBestseller ?? false,
        sortOrder: product.sortOrder ?? 0,
        categoryId: product.categoryId || '',
        collectionIds: (product.collections || []).map((c) => c.id),
      });
    }
  }, [product, reset]);

  const { setIsDirty, showDialog, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChanges(isFormDirty);

  useEffect(() => {
    setIsDirty(isFormDirty);
  }, [isFormDirty, setIsDirty]);

  const onSubmit = async (values: ProductEditFormValues) => {
    if (!canUpdate) return;

    try {
      await updateProductMutation.mutateAsync({
        id,
        payload: {
          name: values.name.trim(),
          sku: values.sku.trim(),
          slug: values.slug.trim() || undefined,
          shortDescription: values.shortDescription?.trim() || undefined,
          description: values.description?.trim() || undefined,
          price: Number(values.price),
          compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : null,
          costPrice: values.costPrice ? Number(values.costPrice) : null,
          productType: values.productType,
          status: values.status,
          stockQuantity: Number(values.stockQuantity) || 0,
          lowStockThreshold: Number(values.lowStockThreshold) || 3,
          trackInventory: values.trackInventory,
          allowBackorder: values.allowBackorder,
          isFeatured: values.isFeatured,
          isNewArrival: values.isNewArrival,
          isBestseller: values.isBestseller,
          sortOrder: Number(values.sortOrder) || 0,
          categoryId: values.categoryId,
          collectionIds: values.collectionIds,
        },
      });

      setIsDirty(false);
      navigate(`/admin/products/${id}`);
    } catch {
      // Handled by toast
    }
  };

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
          message={(error as any)?.message || 'Could not load product for editing.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit: ${product.name || product.title}`}
        description={`SKU: ${product.sku}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Products', path: '/admin/products' },
          { label: product.name || product.title || 'Product', path: `/admin/products/${product.id}` },
          { label: 'Edit' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => guardedNavigate(`/admin/products/${product.id}`)}
          >
            Cancel
          </Button>
          {canUpdate && (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={updateProductMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              Save Changes
            </Button>
          )}
        </div>
      </PageHeader>

      {!canUpdate && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800 font-sans mb-4">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>You have read-only permissions for product management. Editing is disabled.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Basic Information
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                  Product Title / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!canUpdate}
                  {...register('name', { required: 'Product name is required' })}
                  className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-sans">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!canUpdate}
                    {...register('sku', { required: 'SKU is required' })}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-mono focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-xs text-rose-600 font-sans">{errors.sku.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    disabled={!canUpdate}
                    {...register('slug')}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-mono text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  disabled={!canUpdate}
                  {...register('shortDescription')}
                  className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none disabled:bg-sand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                  Detailed Description & Story
                </label>
                <textarea
                  rows={6}
                  disabled={!canUpdate}
                  {...register('description')}
                  className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                />
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Pricing & Financials (INR ₹)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Regular Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={!canUpdate}
                    {...register('price', {
                      required: 'Price is required',
                      min: { value: 0, message: 'Price must be >= 0' },
                    })}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-rose-600 font-sans">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Compare At Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={!canUpdate}
                    {...register('compareAtPrice')}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Cost Price (₹) <span className="text-xs font-normal text-charcoal-400 font-sans">(Internal)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={!canUpdate}
                    {...register('costPrice')}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                </div>
              </div>

              <div className="bg-sand-50 rounded-lg p-3 text-xs text-charcoal-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                <span>
                  Cost Price is strictly confidential and is never displayed on storefronts or in customer-facing APIs.
                </span>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Inventory & Stock
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canUpdate}
                    {...register('stockQuantity')}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canUpdate}
                    {...register('lowStockThreshold')}
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-sand-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    {...register('trackInventory')}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 disabled:opacity-60"
                  />
                  <span className="text-sm font-serif text-charcoal-800">
                    Track inventory for this product
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    {...register('allowBackorder')}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 disabled:opacity-60"
                  />
                  <span className="text-sm font-serif text-charcoal-800">
                    Allow backorders when out of stock
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Taxonomy & Merchandising */}
          <div className="space-y-6">
            {/* Taxonomy */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Taxonomy & Classification
              </h3>

              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <CategoryTreeSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!canUpdate}
                    required
                    error={errors.categoryId?.message}
                  />
                )}
              />

              <Controller
                name="collectionIds"
                control={control}
                render={({ field }) => (
                  <CollectionMultiSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!canUpdate}
                  />
                )}
              />
            </div>

            {/* Status & Merchandising */}
            <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Status & Merchandising
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                  Status
                </label>
                <select
                  disabled={!canUpdate}
                  {...register('status')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none disabled:bg-sand-100"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active (Live)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  disabled={!canUpdate}
                  {...register('sortOrder')}
                  className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none disabled:bg-sand-100"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-sand-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    {...register('isFeatured')}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 disabled:opacity-60"
                  />
                  <span className="text-sm font-serif text-charcoal-800">Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    {...register('isNewArrival')}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 disabled:opacity-60"
                  />
                  <span className="text-sm font-serif text-charcoal-800">New Arrival Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canUpdate}
                    {...register('isBestseller')}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 disabled:opacity-60"
                  />
                  <span className="text-sm font-serif text-charcoal-800">Bestseller Badge</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Confirmation */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onDiscard={confirmNavigation}
        onKeepEditing={cancelNavigation}
      />
    </PageContainer>
  );
};
