import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { CategorySelector } from '../../components/categories/CategorySelector';
import { SeoEditor, SeoFormValues } from '../../components/products/SeoEditor';
import { useCreateCategory } from '../../hooks/useCategories';
import { CreateCategoryPayload } from '../../lib/api/categories';
import { ArrowLeft, Save, FolderPlus, Image as ImageIcon, Search } from 'lucide-react';

export const CategoryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialParentId = searchParams.get('parentId') || null;

  const [activeTab, setActiveTab] = useState('general');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [parentId, setParentId] = useState<string | null>(initialParentId);
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

  const createMutation = useCreateCategory();

  // Auto-generate slug from name unless custom
  useEffect(() => {
    if (!isCustomSlug && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [name, isCustomSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: CreateCategoryPayload = {
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
      const created = await createMutation.mutateAsync(payload);
      navigate(`/admin/categories/${created.id}`);
    } catch {
      // Handled by toast in useCreateCategory
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Hierarchy', icon: FolderPlus },
    { id: 'media', label: 'Media & Imagery', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Social Preview', icon: Search },
  ];

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title="Create New Category"
          description="Define a new category in your store's taxonomy tree."
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Categories', path: '/admin/categories' },
            { label: 'New Category' },
          ]}
        >
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/categories')}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              className="flex items-center space-x-1"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Save Category</span>
            </Button>
          </div>
        </PageHeader>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: General & Hierarchy */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Basic Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Category Identity
                </h3>

                <Input
                  label="Category Name"
                  placeholder="e.g. Tanjore Paintings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                      URL Slug
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSlug(!isCustomSlug)}
                      className="text-xs text-gold-600 hover:text-gold-700 font-sans underline"
                    >
                      {isCustomSlug ? 'Auto-generate from Name' : 'Custom Slug'}
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. tanjore-paintings"
                    value={slug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      setSlug(e.target.value);
                    }}
                    helperText="Used in public URLs: /categories/[slug]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                    Short Description / Excerpt
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description for category cards and previews..."
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
                    placeholder="Detailed category narrative, historical background, craftsmanship details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm bg-white border border-sand-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                  />
                </div>
              </div>

              {/* Hierarchy */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Taxonomy & Tree Placement
                </h3>

                <CategorySelector
                  value={parentId}
                  onChange={(id) => setParentId(id)}
                  label="Parent Category"
                  allowRoot={true}
                  rootLabel="None (Top-Level Root Category)"
                />
              </div>
            </div>

            {/* Right 1 Col: Status & Merchandising */}
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
                        Highlight on homepage and curated collection sections
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
                    helperText="Lower numbers appear first in menus and listings (e.g. 0, 10, 20)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Media & Imagery */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm max-w-4xl space-y-6">
            <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
              Category Media & Banners
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Image */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                  Primary Thumbnail / Icon Image
                </h4>
                <Input
                  placeholder="https://.../thumbnail.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
                <Input
                  placeholder="Image Alt Text (e.g. Bronze Statues Collection)"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
                {image && (
                  <div className="w-32 h-32 rounded-lg border border-sand-200 overflow-hidden bg-sand-50">
                    <img
                      src={image}
                      alt={imageAlt || 'Category thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Banner Image */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                  Header Banner Image
                </h4>
                <Input
                  placeholder="https://.../banner.jpg"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                />
                <Input
                  placeholder="Banner Alt Text"
                  value={bannerImageAlt}
                  onChange={(e) => setBannerImageAlt(e.target.value)}
                />
                {bannerImage && (
                  <div className="w-full h-24 rounded-lg border border-sand-200 overflow-hidden bg-sand-50">
                    <img
                      src={bannerImage}
                      alt={bannerImageAlt || 'Category banner'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SEO & Social Preview */}
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
