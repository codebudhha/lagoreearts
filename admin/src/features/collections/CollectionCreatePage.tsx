import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { CollectionMediaManager } from '../../components/collections/CollectionMediaManager';
import { SeoEditor, SeoFormValues } from '../../components/products/SeoEditor';
import { useCreateCollection } from '../../hooks/useCollections';
import { CreateCollectionPayload, CollectionStatus, CollectionType } from '../../lib/api/collections';
import {
  ArrowLeft,
  Save,
  Layers,
  Image as ImageIcon,
  Search,
  Sparkles,
  Sliders,
} from 'lucide-react';

export const CollectionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  // Form State - General & Content
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
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

  const createMutation = useCreateCollection();

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

    const payload: CreateCollectionPayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      heroTitle: heroTitle.trim() || undefined,
      heroDescription: heroDescription.trim() || undefined,
      image: coverImage.trim() || undefined,
      bannerImage: bannerImage.trim() || undefined,
      status,
      type,
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
      navigate(`/admin/collections/${created.id}`);
    } catch {
      // Handled by toast in useCreateCollection
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Content', icon: Layers },
    { id: 'merchandising', label: 'Merchandising & Status', icon: Sliders },
    { id: 'media', label: 'Cover & Banner Imagery', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Search Preview', icon: Search },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Create Collection"
        description="Establish a new curated grouping, seasonal exhibition, or heritage catalog."
        breadcrumbs={[
          { label: 'Collections', path: '/admin/collections' },
          { label: 'New Collection' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/collections')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Collection
          </Button>
        </div>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="p-6">
            {/* Tab 1: General & Content */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Collection Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sanskrit Sacred Geometry"
                    required
                    helperText="Primary display title shown in navigation and catalogs."
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
                        onChange={(e) => {
                          setIsCustomSlug(true);
                          setSlug(e.target.value);
                        }}
                        placeholder="sanskrit-sacred-geometry"
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-sand-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 font-mono"
                      />
                    </div>
                    <p className="mt-1 text-xs text-charcoal-500">
                      Auto-generated from collection name.
                    </p>
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
                    Optional headline and subheading displayed prominently in the hero banner on the collection landing page.
                  </p>

                  <div className="space-y-4">
                    <Input
                      label="Hero Headline Title (Optional)"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder={name ? `Curated: ${name}` : 'e.g. Masterpieces of Divine Devotion'}
                      helperText="Defaults to the collection name if left blank."
                    />

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-1">
                        Hero Subtitle / Description (Optional)
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
              <div className="space-y-6 max-w-2xl">
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
                    <p className="mt-1 text-xs text-charcoal-500">
                      Inactive collections are hidden from customers on the public storefront.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Collection Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as CollectionType)}
                      className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                    >
                      <option value="MANUAL">Manual Collection (Standard Curated)</option>
                      <option value="SYSTEM">System Collection (Core / Automated)</option>
                    </select>
                    <p className="mt-1 text-xs text-charcoal-500">
                      Manual collections allow arbitrary product assignment. System collections are protected.
                    </p>
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
                    helperText="Lower numbers appear first in lists and navigation."
                  />

                  <div className="flex flex-col justify-center">
                    <div className="flex items-center justify-between p-3 border border-sand-300 rounded-lg bg-sand-50/50">
                      <div>
                        <div className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-gold-600" />
                          Featured Collection
                        </div>
                        <p className="text-xs text-charcoal-500">
                          Highlight on homepage showcases and curatorial highlights.
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
            onClick={() => navigate('/admin/collections')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Collection
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
