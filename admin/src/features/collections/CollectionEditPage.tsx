import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { CollectionMediaManager } from '../../components/collections/CollectionMediaManager';
import { SeoEditor, SeoFormValues } from '../../components/products/SeoEditor';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  useCollectionDetail,
  useUpdateCollection,
} from '../../hooks/useCollections';
import {
  UpdateCollectionPayload,
  CollectionStatus,
  CollectionType,
} from '../../lib/api/collections';
import {
  ArrowLeft,
  Save,
  Layers,
  Image as ImageIcon,
  Search,
  Sparkles,
  Sliders,
  Lock,
} from 'lucide-react';

export const CollectionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const {
    data: collection,
    isLoading,
    isError,
    error,
    refetch,
  } = useCollectionDetail(id || '');

  // Form State - General & Content
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');

  // Merchandising & Configuration
  const [status, setStatus] = useState<CollectionStatus>('ACTIVE');
  const [type, setType] = useState<CollectionType>('MANUAL');
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  // Media
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');

  // SEO
  const [seoValues, setSeoValues] = useState<SeoFormValues>({
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  const updateMutation = useUpdateCollection();

  // Populate form when collection data loads
  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setSlug(collection.slug || '');
      setShortDescription(collection.shortDescription || '');
      setDescription(collection.description || '');
      setHeroTitle(collection.heroTitle || '');
      setHeroDescription(collection.heroDescription || '');
      setStatus(collection.status || 'ACTIVE');
      setType(collection.type || 'MANUAL');
      setIsFeatured(Boolean(collection.isFeatured));
      setSortOrder(String(collection.sortOrder ?? 0));
      setCoverImage(collection.image || '');
      setBannerImage(collection.bannerImage || '');
      setSeoValues({
        metaTitle: collection.metaTitle || '',
        metaDescription: collection.metaDescription || '',
        canonicalUrl: collection.canonicalUrl || '',
        ogTitle: collection.ogTitle || '',
        ogDescription: collection.ogDescription || '',
        ogImage: collection.ogImage || '',
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    const payload: UpdateCollectionPayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      heroTitle: heroTitle.trim() || undefined,
      heroDescription: heroDescription.trim() || undefined,
      image: coverImage.trim() || undefined,
      bannerImage: bannerImage.trim() || undefined,
      status,
      // If system collection, keep type SYSTEM
      type: collection?.type === 'SYSTEM' ? 'SYSTEM' : type,
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
      navigate(`/admin/collections/${id}`);
    } catch {
      // Handled by toast in useUpdateCollection
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !collection) {
    return (
      <PageContainer>
        <ErrorState
          title="Collection Not Found"
          message={(error as any)?.message || 'The requested collection could not be found.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const isSystem = collection.type === 'SYSTEM';

  const tabs = [
    { id: 'general', label: 'General & Narrative', icon: Layers },
    { id: 'merchandising', label: 'Merchandising & Status', icon: Sliders },
    { id: 'media', label: 'Cover & Lookbook Media', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Search Engine Preview', icon: Search },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Collection: ${collection.name}`}
        description={`Update curatorial metadata, hero display, and SEO for /${collection.slug}`}
        breadcrumbs={[
          { label: 'Collections', path: '/admin/collections' },
          { label: collection.name, path: `/admin/collections/${collection.id}` },
          { label: 'Edit' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/collections/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </PageHeader>

      {/* System Collection Banner Alert */}
      {isSystem && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">System Collection Attributes Protected</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              This is a core system-level collection. You can update display titles, imagery, and SEO, but collection type cannot be converted.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="p-6">
            {/* Tab 1: General & Narrative */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-3xl font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Collection Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Masterpieces of Divine Devotion"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      URL Slug
                    </label>
                    <div className="flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-sand-300 bg-sand-50 text-charcoal-500 text-xs font-mono">
                        /collections/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="collection-slug"
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-sand-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Short Description (Excerpt)
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="A brief summary for previews, cards, and meta tags..."
                    className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Full Curatorial Narrative / Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide in-depth cultural, artistic, or historical context about this collection..."
                    className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div className="pt-4 border-t border-sand-200">
                  <h4 className="text-sm font-semibold text-charcoal-900 mb-1">
                    Storefront Landing Hero Customization
                  </h4>
                  <p className="text-xs text-charcoal-500 mb-4">
                    Customize the headline and subheading displayed in the hero banner on the collection landing page.
                  </p>

                  <div className="space-y-4">
                    <Input
                      label="Hero Headline Title"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder={name || 'Hero headline'}
                    />

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-1">
                        Hero Subtitle / Description
                      </label>
                      <textarea
                        rows={2}
                        value={heroDescription}
                        onChange={(e) => setHeroDescription(e.target.value)}
                        placeholder="Exquisite handmade artifacts capturing sacred traditions across centuries..."
                        className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Merchandising & Status */}
            {activeTab === 'merchandising' && (
              <div className="space-y-6 max-w-2xl font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CollectionStatus)}
                      className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                    >
                      <option value="ACTIVE">Active (Published & Visible)</option>
                      <option value="INACTIVE">Inactive (Hidden / Draft)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Collection Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as CollectionType)}
                      disabled={isSystem}
                      className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white disabled:bg-sand-100 disabled:cursor-not-allowed"
                    >
                      <option value="MANUAL">Manual Collection</option>
                      <option value="SYSTEM">System Collection</option>
                    </select>
                    {isSystem && (
                      <p className="mt-1 text-xs text-amber-700">
                        System collection type is locked.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-sand-200">
                  <Input
                    label="Sort Order Index"
                    type="number"
                    min="0"
                    max="9999"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    helperText="Lower numbers appear first in catalog listings."
                  />

                  <div className="flex flex-col justify-center">
                    <div className="flex items-center justify-between p-3 border border-sand-300 rounded-lg bg-sand-50/50">
                      <div>
                        <div className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-gold-600" />
                          Featured Collection
                        </div>
                        <p className="text-xs text-charcoal-500">
                          Highlight in homepage showcases and featured curations.
                        </p>
                      </div>
                      <Switch
                        checked={isFeatured}
                        onChange={setIsFeatured}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Imagery */}
            {activeTab === 'media' && (
              <CollectionMediaManager
                collectionId={collection.id}
                coverImage={coverImage}
                bannerImage={bannerImage}
                onCoverImageChange={setCoverImage}
                onBannerImageChange={setBannerImage}
              />
            )}

            {/* Tab 4: SEO */}
            {activeTab === 'seo' && (
              <SeoEditor
                values={seoValues}
                onChange={(updates) => setSeoValues((prev) => ({ ...prev, ...updates }))}
                defaultTitle={name ? `${name} — Curated Collection | Lagoree Arts` : ''}
                defaultDescription={shortDescription || description}
                slug={slug}
              />
            )}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-300">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/collections/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
