import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { CategorySelector } from '../../components/categories/CategorySelector';
import { SeoEditor, SeoFormValues } from '../../components/products/SeoEditor';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useCategoryDetail, useUpdateCategory } from '../../hooks/useCategories';
import { UpdateCategoryPayload } from '../../lib/api/categories';
import { ArrowLeft, Save, FolderEdit, Image as ImageIcon, Search } from 'lucide-react';

export const CategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');

  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useCategoryDetail(id || '');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  // Merchandising
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  // Media
  const [image, setImage] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerImageAlt, setBannerImageAlt] = useState('');

  // SEO
  const [seoValues, setSeoValues] = useState<SeoFormValues>({
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  const updateMutation = useUpdateCategory();

  // Populate form values when category data arrives
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setParentId(category.parentId || category.parent?.id || null);
      setShortDescription(category.shortDescription || '');
      setDescription(category.description || '');
      setStatus((category.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
      setIsFeatured(Boolean(category.isFeatured));
      setSortOrder(String(category.sortOrder ?? 0));
      setImage(category.image || '');
      setImageAlt(category.imageAlt || '');
      setBannerImage(category.bannerImage || '');
      setBannerImageAlt(category.bannerImageAlt || '');
      setSeoValues({
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        canonicalUrl: category.canonicalUrl || '',
        ogTitle: category.ogTitle || '',
        ogDescription: category.ogDescription || '',
        ogImage: category.ogImage || '',
      });
    }
  }, [category]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !category) {
    return (
      <PageContainer>
        <ErrorState
          title="Category Not Found"
          message={(error as any)?.message || 'The requested category does not exist.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;

    const payload: UpdateCategoryPayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentId: parentId || null,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      bannerImage: bannerImage.trim() || undefined,
      bannerImageAlt: bannerImageAlt.trim() || undefined,
      status,
      isFeatured,
      sortOrder: parseInt(sortOrder, 10) || 0,
      metaTitle: seoValues.metaTitle?.trim() || undefined,
      metaDescription: seoValues.metaDescription?.trim() || undefined,
      canonicalUrl: seoValues.canonicalUrl?.trim() || undefined,
      ogTitle: seoValues.ogTitle?.trim() || undefined,
      ogDescription: seoValues.ogDescription?.trim() || undefined,
      ogImage: seoValues.ogImage?.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync({ id, payload });
      navigate(`/admin/categories/${id}`);
    } catch {
      // Handled by mutation toast
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Hierarchy', icon: FolderEdit },
    { id: 'media', label: 'Media & Imagery', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Social Preview', icon: Search },
  ];

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title={`Edit: ${category.name}`}
          description={`Editing category taxonomy and properties (ID: ${category.id})`}
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Categories', path: '/admin/categories' },
            { label: category.name, path: `/admin/categories/${category.id}` },
            { label: 'Edit' },
          ]}
        >
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/categories/${id}`)}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              className="flex items-center space-x-1"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </PageHeader>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: General & Hierarchy */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Category Identity
                </h3>

                <Input
                  label="Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="URL Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  helperText="Public path: /categories/[slug]"
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full text-sm bg-white border border-sand-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                    Full Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm bg-white border border-sand-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                  />
                </div>
              </div>

              {/* Hierarchy with Cycle Protection */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Taxonomy Hierarchy
                </h3>

                <CategorySelector
                  value={parentId}
                  onChange={(newParentId) => setParentId(newParentId)}
                  excludeCategoryId={category.id}
                  label="Parent Category"
                  allowRoot={true}
                  rootLabel="None (Top-Level Root Category)"
                />
              </div>
            </div>

            {/* Right 1 Col: Merchandising */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Status & Merchandising
                </h3>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                    Publishing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                  >
                    <option value="ACTIVE">ACTIVE (Visible on Storefront)</option>
                    <option value="INACTIVE">INACTIVE (Hidden from Storefront)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-sand-100">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Switch
                      checked={isFeatured}
                      onChange={(checked) => setIsFeatured(checked)}
                    />
                    <div>
                      <span className="text-sm font-medium text-charcoal-900 font-serif">
                        Featured Category
                      </span>
                      <p className="text-xs text-charcoal-500 font-sans">
                        Showcase in curated areas
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-sand-100">
                  <Input
                    label="Display Sort Order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Media */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm max-w-4xl space-y-6">
            <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
              Category Media & Imagery
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                  Thumbnail / Icon
                </h4>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Image Alt Text"
                />
                {image && (
                  <div className="w-32 h-32 rounded-lg border border-sand-200 overflow-hidden bg-sand-50">
                    <img
                      src={image}
                      alt={imageAlt || name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                  Banner Image
                </h4>
                <Input
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  value={bannerImageAlt}
                  onChange={(e) => setBannerImageAlt(e.target.value)}
                  placeholder="Banner Alt Text"
                />
                {bannerImage && (
                  <div className="w-full h-24 rounded-lg border border-sand-200 overflow-hidden bg-sand-50">
                    <img
                      src={bannerImage}
                      alt={bannerImageAlt || name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SEO */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm max-w-4xl">
            <SeoEditor
              values={seoValues}
              onChange={(updates) => setSeoValues((prev) => ({ ...prev, ...updates }))}
              defaultTitle={name ? `${name} | Lagoree Arts` : ''}
              defaultDescription={shortDescription || description}
              slug={slug}
            />
          </div>
        )}
      </form>
    </PageContainer>
  );
};
