import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { MediaPicker } from '../../components/media/MediaPicker';
import { SeoEditor } from '../../components/products/SeoEditor';
import { useCreateLookbook } from '../../hooks/useLookbook';
import { useAuth } from '../../hooks/useAuth';
import { CreateLookbookPayload } from '../../lib/api/lookbook';
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Globe,
} from 'lucide-react';

export const LookbookCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('lookbook.create');

  const createMutation = useCreateLookbook();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverMediaUrl, setCoverMediaUrl] = useState<string | null>(null);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [seoValues, setSeoValues] = useState<{
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }>({});

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCoverSelected = (selected: any) => {
    const item = Array.isArray(selected) ? selected[0] : selected;
    if (item) {
      setCoverMediaId(item.id);
      setCoverMediaUrl(item.url || item.thumbnailUrl || null);
    }
    setIsCoverPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateLookbookPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      status: status as any,
      featured,
      displayOrder,
      coverMediaId: coverMediaId || undefined,
      seoTitle: seoValues.metaTitle || undefined,
      seoDescription: seoValues.metaDescription || undefined,
    };

    const created = await createMutation.mutateAsync(payload);
    navigate(`/admin/lookbook/${created.id}/edit`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create New Lookbook"
        description="Set up the foundation for your editorial lookbook."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lookbooks', path: '/admin/lookbook' },
          { label: 'Create' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/lookbook')}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-5 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Basic Information
              </h3>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. Sacred Tanjore: A Golden Legacy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="sacred-tanjore-a-golden-legacy"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Short Description
                </label>
                <Input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A brief tagline for the lookbook"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Full editorial description of this lookbook..."
                />
              </div>
            </Card>

            {/* SEO */}
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gold-600" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Search Engine Optimization
                </h3>
              </div>
              <SeoEditor
                values={seoValues}
                onChange={(updates) => setSeoValues((prev) => ({ ...prev, ...updates }))}
                defaultTitle={title}
                defaultDescription={shortDescription || description}
                slug={slug}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Settings
              </h3>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </div>

              <Switch
                checked={featured}
                onChange={setFeatured}
                label="Featured Lookbook"
                description="Mark this lookbook as featured on the storefront."
              />

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Display Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                />
              </div>
            </Card>

            {/* Cover Media */}
            <Card className="p-5 space-y-3 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Cover Media
              </h3>

              {coverMediaUrl ? (
                <div className="relative group">
                  <img
                    src={coverMediaUrl}
                    alt="Cover"
                    className="w-full aspect-video object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverMediaId(null);
                      setCoverMediaUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-neutral-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCoverPickerOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-gold-400 hover:text-gold-600 transition-colors"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-medium">Select Cover Image</span>
                </button>
              )}

              {!coverMediaUrl && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCoverPickerOpen(true)}
                    className="gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Choose from Library
                  </Button>
                </div>
              )}
            </Card>

            {/* Submit */}
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={!canCreate || !title.trim() || createMutation.isPending}
                  className="gap-2 w-full"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create & Edit Sections'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/lookbook')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>

      <MediaPicker
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={handleCoverSelected}
        mode="single"
        title="Select Cover Media"
      />
    </PageContainer>
  );
};
