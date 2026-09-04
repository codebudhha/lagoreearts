import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { CategoryTreeSelector } from '../../components/products/CategoryTreeSelector';
import { CollectionMultiSelector } from '../../components/products/CollectionMultiSelector';
import { ProductAttributeEditor } from '../../components/products/ProductAttributeEditor';
import { ProductMediaManager } from '../../components/products/ProductMediaManager';
import { SeoEditor, SeoFormValues } from '../../components/products/SeoEditor';
import { UnsavedChangesDialog } from '../../components/products/UnsavedChangesDialog';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useCreateProduct } from '../../hooks/useProducts';
import { useAttachProductMedia } from '../../hooks/useProductMedia';
import { useUpsertProductSeo } from '../../hooks/useProductSeo';
import { ProductAttributeAssignment } from '../../lib/api/products';
import {
  Package,
  Image as ImageIcon,
  Globe,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface ProductCreateFormValues {
  name: string;
  sku: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  productType: 'SIMPLE' | 'VARIABLE';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
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

export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createProductMutation = useCreateProduct();
  const attachMediaMutation = useAttachProductMedia();
  const upsertSeoMutation = useUpsertProductSeo();

  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'media' | 'seo'>('general');
  const [attributes, setAttributes] = useState<ProductAttributeAssignment[]>([]);
  const [temporaryMedia, setTemporaryMedia] = useState<
    Array<{ id: string; url: string; isPrimary: boolean; altText?: string }>
  >([]);
  const [seoValues, setSeoValues] = useState<SeoFormValues>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty: isFormDirty },
  } = useForm<ProductCreateFormValues>({
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
      stockQuantity: 10,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: false,
      isNewArrival: true,
      isBestseller: false,
      sortOrder: 0,
      categoryId: '',
      collectionIds: [],
    },
  });

  const selectedCategoryId = watch('categoryId');
  const watchedName = watch('name');
  const watchedSlug = watch('slug');

  // Auto-generate slug from name if empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    setValue('name', nameVal, { shouldDirty: true });
    if (!watchedSlug || watchedSlug === nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, -1)) {
      const generatedSlug = nameVal
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setValue('slug', generatedSlug, { shouldDirty: true });
    }
  };

  const { setIsDirty, showDialog, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChanges(isFormDirty || temporaryMedia.length > 0 || attributes.length > 0);

  // Sync dirty flag
  React.useEffect(() => {
    if (isFormDirty || temporaryMedia.length > 0 || attributes.length > 0) {
      setIsDirty(true);
    }
  }, [isFormDirty, temporaryMedia, attributes, setIsDirty]);

  const onSubmit = async (values: ProductCreateFormValues) => {
    try {
      // 1. Create main product
      const newProduct = await createProductMutation.mutateAsync({
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
        attributes: attributes.length > 0 ? attributes : undefined,
      });

      // 2. Attach any pre-uploaded media assets
      if (temporaryMedia.length > 0) {
        for (const m of temporaryMedia) {
          try {
            await attachMediaMutation.mutateAsync({
              productId: newProduct.id,
              payload: {
                mediaId: m.id,
                isPrimary: m.isPrimary,
                altText: m.altText,
              },
            });
          } catch (err) {
            console.warn('Failed to attach media to newly created product:', err);
          }
        }
      }

      // 3. Save SEO metadata if populated
      if (seoValues.metaTitle || seoValues.metaDescription || seoValues.canonicalUrl) {
        try {
          await upsertSeoMutation.mutateAsync({
            productId: newProduct.id,
            payload: seoValues,
          });
        } catch (err) {
          console.warn('Failed to save initial SEO metadata:', err);
        }
      }

      setIsDirty(false);
      navigate(`/admin/products/${newProduct.id}`);
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create New Product"
        description="Add a new masterpiece or collectible to your luxury catalog"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Products', path: '/admin/products' },
          { label: 'New Product' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => guardedNavigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={createProductMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Save Product
          </Button>
        </div>
      </PageHeader>

      {/* Tab Navigation */}
      <div className="flex border-b border-sand-300 gap-6 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'general'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Package className="w-4 h-4" />
          General & Pricing
        </button>
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
          Attributes
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
          Media Gallery ({temporaryMedia.length})
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: General & Pricing */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details Card */}
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
                    {...register('name', { required: 'Product name is required' })}
                    onChange={handleNameChange}
                    placeholder="e.g. Tanjore Krishna with Yashoda in Teak Frame"
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-600 font-sans">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                      SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('sku', { required: 'SKU is required' })}
                      placeholder="e.g. LA-TAN-001"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-mono focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                    {errors.sku && (
                      <p className="mt-1 text-xs text-rose-600 font-sans">{errors.sku.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                      URL Slug (Auto-generated)
                    </label>
                    <input
                      type="text"
                      {...register('slug')}
                      placeholder="e.g. tanjore-krishna-yashoda"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-mono text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    {...register('shortDescription')}
                    placeholder="A brief luxury overview shown in product summaries..."
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Detailed Story & Description
                  </label>
                  <textarea
                    rows={6}
                    {...register('description')}
                    placeholder="Elaborate on provenance, artistic lineage, materials, and symbolic significance..."
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Pricing & Costing Card */}
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
                      {...register('price', {
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be greater than or equal to 0' },
                      })}
                      placeholder="e.g. 85000"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
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
                      {...register('compareAtPrice')}
                      placeholder="e.g. 95000"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                      Cost Price (₹) <span className="text-xs font-normal text-charcoal-400 font-sans">(Internal)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register('costPrice')}
                      placeholder="e.g. 45000"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
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
                      {...register('stockQuantity')}
                      placeholder="10"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('lowStockThreshold')}
                      placeholder="3"
                      className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-sand-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('trackInventory')}
                      className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-serif text-charcoal-800">
                      Track inventory for this product
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('allowBackorder')}
                      className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-serif text-charcoal-800">
                      Allow customers to purchase when out of stock (Backorder)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Category, Collections & Merchandising */}
            <div className="space-y-6">
              {/* Category & Taxonomy Card */}
              <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                  Taxonomy & Classification
                </h3>

                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Category selection is required' }}
                  render={({ field }) => (
                    <CategoryTreeSelector
                      value={field.value}
                      onChange={field.onChange}
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
                    />
                  )}
                />
              </div>

              {/* Status & Type Card */}
              <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                  Product Settings
                </h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Product Type
                  </label>
                  <select
                    {...register('productType')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
                  >
                    <option value="SIMPLE">Simple Product</option>
                    <option value="VARIABLE">Variable Product (Options & Matrix)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Initial Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active (Live)</option>
                    <option value="INACTIVE">Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    {...register('sortOrder')}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-sand-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isFeatured')}
                      className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-serif text-charcoal-800">Featured Product</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isNewArrival')}
                      className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-serif text-charcoal-800">New Arrival Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isBestseller')}
                      className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    <span className="text-sm font-serif text-charcoal-800">Bestseller Badge</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dynamic Attributes */}
        {activeTab === 'attributes' && (
          <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans">
                Dynamic Product Attributes
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">
                Attributes adapt dynamically to the selected primary category.
              </p>
            </div>

            <ProductAttributeEditor
              categoryId={selectedCategoryId}
              value={attributes}
              onChange={setAttributes}
            />
          </div>
        )}

        {/* Tab 3: Media Gallery */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm">
            <ProductMediaManager
              temporaryMedia={temporaryMedia}
              onTemporaryMediaChange={setTemporaryMedia}
            />
          </div>
        )}

        {/* Tab 4: SEO Metadata */}
        {activeTab === 'seo' && (
          <div className="bg-white rounded-xl border border-sand-200 p-6 shadow-sm">
            <SeoEditor
              values={seoValues}
              onChange={(updates) => setSeoValues({ ...seoValues, ...updates })}
              defaultTitle={watchedName}
              slug={watchedSlug}
            />
          </div>
        )}
      </form>

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onDiscard={confirmNavigation}
        onKeepEditing={cancelNavigation}
      />
    </PageContainer>
  );
};
