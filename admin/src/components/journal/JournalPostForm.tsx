import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { MediaPicker } from '../media/MediaPicker';
import { ProductPicker } from '../collections/ProductPicker';
import { CollectionPickerModal } from '../homepage/CollectionPickerModal';
import { ArtistPickerModal } from '../homepage/ArtistPickerModal';
import {
  JournalPost,
  JournalPostType,
  JournalPostStatus,
  CreateJournalPostPayload,
  UpdateJournalPostPayload,
} from '../../lib/api/journal';
import {
  useJournalAuthorsList,
  useJournalCategoriesList,
  useJournalTagsList,
  useJournalPostsList,
} from '../../hooks/useJournal';
import {
  FileText,
  User,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Star,
  Plus,
  Package,
  FolderArchive,
} from 'lucide-react';

interface JournalPostFormProps {
  initialData?: JournalPost | null;
  onSubmit: (payload: CreateJournalPostPayload | UpdateJournalPostPayload) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

const POST_TYPES: { value: JournalPostType; label: string }[] = [
  { value: 'ARTICLE', label: 'Article / Essay' },
  { value: 'STORY', label: 'Story / Heritage Tale' },
  { value: 'INTERVIEW', label: 'Artist Interview' },
  { value: 'CURATION', label: 'Curation / Lookbook' },
  { value: 'EDITORIAL', label: 'Editorial Note' },
];

export const JournalPostForm: React.FC<JournalPostFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const isEdit = Boolean(initialData);

  // Queries for lookups
  const { data: authorsData } = useJournalAuthorsList({ limit: 100 });
  const { data: categoriesData } = useJournalCategoriesList({ limit: 100 });
  const { data: tagsData } = useJournalTagsList({ limit: 100 });
  const { data: postsData } = useJournalPostsList({ limit: 50 });

  const authors = authorsData?.items || [];
  const categories = categoriesData?.items || [];
  const allTags = tagsData?.items || [];
  const availablePosts = (postsData?.items || []).filter((p) => p.id !== initialData?.id);

  // Form states
  const [activeTab, setActiveTab] = useState<'content' | 'taxonomy' | 'media' | 'relations' | 'seo'>('content');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<JournalPostType>('ARTICLE');
  const [readingTime, setReadingTime] = useState<number | ''>('');

  const [authorId, setAuthorId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [coverImageId, setCoverImageId] = useState<string | undefined>();
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>();
  const [ogImageId, setOgImageId] = useState<string | undefined>();
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string | undefined>();

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedRelatedPostIds, setSelectedRelatedPostIds] = useState<string[]>([]);

  const [status, setStatus] = useState<JournalPostStatus>('DRAFT');
  const [featured, setFeatured] = useState<boolean>(false);
  const [publishedAt, setPublishedAt] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // Modals state
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isOgPickerOpen, setIsOgPickerOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isArtistPickerOpen, setIsArtistPickerOpen] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setExcerpt(initialData.excerpt || '');
      setContent(initialData.content || '');
      setType(initialData.type || 'ARTICLE');
      setReadingTime(initialData.readingTime ?? '');

      setAuthorId(initialData.authorId || '');
      setCategoryId(initialData.categoryId || '');
      setSelectedTagIds(initialData.tags?.map((t) => t.tagId) || []);

      setCoverImageId(initialData.coverImageId || undefined);
      setCoverPreviewUrl(initialData.coverImage?.url || undefined);
      setOgImageId(initialData.ogImageId || undefined);
      setOgPreviewUrl(initialData.ogImage?.url || undefined);

      setSelectedProductIds(initialData.products?.map((p) => p.productId) || []);
      setSelectedCollectionIds(initialData.collections?.map((c) => c.collectionId) || []);
      setSelectedArtistIds(initialData.artists?.map((a) => a.artistId) || []);
      setSelectedRelatedPostIds(initialData.relatedPosts?.map((r) => r.relatedPostId) || []);

      setStatus(initialData.status || 'DRAFT');
      setFeatured(initialData.featured ?? false);
      setPublishedAt(
        initialData.publishedAt ? new Date(initialData.publishedAt).toISOString().slice(0, 16) : ''
      );
      setSeoTitle(initialData.seoTitle || '');
      setSeoDescription(initialData.seoDescription || '');
      setSeoKeywords(initialData.seoKeywords || '');
    }
  }, [initialData]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleToggleRelatedPost = (postId: string) => {
    setSelectedRelatedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Post title is required.');
      setActiveTab('content');
      return;
    }

    if (!content.trim()) {
      setFormError('Post content body is required.');
      setActiveTab('content');
      return;
    }

    // Invariant: Featured post must be published
    if (featured && status !== 'PUBLISHED') {
      setFormError('A featured journal post must have status PUBLISHED.');
      setActiveTab('seo');
      return;
    }

    const payload: CreateJournalPostPayload | UpdateJournalPostPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      type,
      readingTime: readingTime === '' ? undefined : Number(readingTime),
      status,
      featured,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      coverImageId: coverImageId || undefined,
      ogImageId: ogImageId || undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      products: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      collections: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
      artists: selectedArtistIds.length > 0 ? selectedArtistIds : undefined,
      relatedPosts: selectedRelatedPostIds.length > 0 ? selectedRelatedPostIds : undefined,
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save post.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
          {formError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'content'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Content & Body
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('taxonomy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'taxonomy'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <User className="w-4 h-4" />
          Author & Taxonomy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'media'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Media & Artwork
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'relations'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Related Entities
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'seo'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Globe className="w-4 h-4" />
          Publishing & SEO
        </button>
      </div>

      {/* Tab 1: Content */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                Post Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Sacred Geometry of Chola Bronze Idols"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  URL Slug (optional)
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. sacred-geometry-chola-bronzes"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Article Type
                </label>
                <select
                  aria-label="Article Type"
                  value={type}
                  onChange={(e) => setType(e.target.value as JournalPostType)}
                  className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  {POST_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Est. Reading Time (minutes)
                </label>
                <Input
                  type="number"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="e.g. 6"
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Excerpt / Summary
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Concise overview featured on blog index cards and metadata..."
                rows={2}
                className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Article Body (Markdown / Rich Text) *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write article content using markdown or formatted text..."
                rows={16}
                required
                className="w-full font-mono text-xs p-4 border rounded-md bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500 leading-relaxed"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Taxonomy */}
      {activeTab === 'taxonomy' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Editorial Author
                </label>
                <select
                  aria-label="Editorial Author"
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">No author assigned</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.role ? `(${a.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Editorial Category
                </label>
                <select
                  aria-label="Editorial Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Editorial Tags ({selectedTagIds.length} selected)
              </label>
              {allTags.length === 0 ? (
                <p className="text-xs text-neutral-400">No tags created yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-gold-100 border-gold-400 text-gold-800 dark:bg-gold-950/60 dark:border-gold-600 dark:text-gold-200'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Media */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                  <span>Cover / Hero Image</span>
                  {coverImageId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCoverImageId(undefined);
                        setCoverPreviewUrl(undefined);
                      }}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </Button>
                  )}
                </h4>

                <div className="aspect-video rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-hidden border flex items-center justify-center">
                  {coverPreviewUrl ? (
                    <img
                      src={coverPreviewUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">No cover image selected</p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCoverPickerOpen(true)}
                  className="w-full text-xs"
                >
                  {coverImageId ? 'Change Cover Image' : 'Select Cover Image'}
                </Button>
              </div>

              {/* OG / Social Image */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                  <span>Social Share (OpenGraph) Image</span>
                  {ogImageId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOgImageId(undefined);
                        setOgPreviewUrl(undefined);
                      }}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </Button>
                  )}
                </h4>

                <div className="aspect-video rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-hidden border flex items-center justify-center">
                  {ogPreviewUrl ? (
                    <img
                      src={ogPreviewUrl}
                      alt="OG Share"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Globe className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">Falls back to Cover image</p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOgPickerOpen(true)}
                  className="w-full text-xs"
                >
                  {ogImageId ? 'Change OG Image' : 'Select OG Image'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Relations */}
      {activeTab === 'relations' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-6">
            {/* Products */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Featured Products ({selectedProductIds.length})
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsProductPickerOpen(true)}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Select Products
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                Products referenced within or shoppable alongside this article.
              </p>
              {selectedProductIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedProductIds.map((pid) => (
                    <Badge key={pid} variant="secondary" className="gap-1.5 py-1 px-2.5">
                      <Package className="w-3 h-3 text-gold-600" />
                      <span className="font-mono text-xs">{pid.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProductIds((prev) => prev.filter((id) => id !== pid))
                        }
                        className="text-neutral-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800" />

            {/* Collections */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Featured Collections ({selectedCollectionIds.length})
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCollectionPickerOpen(true)}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Select Collections
                </Button>
              </div>
              {selectedCollectionIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedCollectionIds.map((cid) => (
                    <Badge key={cid} variant="secondary" className="gap-1.5 py-1 px-2.5">
                      <FolderArchive className="w-3 h-3 text-gold-600" />
                      <span className="font-mono text-xs">{cid.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCollectionIds((prev) => prev.filter((id) => id !== cid))
                        }
                        className="text-neutral-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800" />

            {/* Artists */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Featured Artists ({selectedArtistIds.length})
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsArtistPickerOpen(true)}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Select Artists
                </Button>
              </div>
              {selectedArtistIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedArtistIds.map((aid) => (
                    <Badge key={aid} variant="secondary" className="gap-1.5 py-1 px-2.5">
                      <User className="w-3 h-3 text-gold-600" />
                      <span className="font-mono text-xs">{aid.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedArtistIds((prev) => prev.filter((id) => id !== aid))
                        }
                        className="text-neutral-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800" />

            {/* Related Posts */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Related Journal Posts ({selectedRelatedPostIds.length} linked)
              </label>
              <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-200 dark:divide-neutral-800">
                {availablePosts.length === 0 ? (
                  <p className="p-3 text-xs text-neutral-400">No other posts available.</p>
                ) : (
                  availablePosts.map((p) => {
                    const isLinked = selectedRelatedPostIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleRelatedPost(p.id)}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                          isLinked ? 'bg-gold-50/50 dark:bg-gold-950/20' : ''
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {p.title}
                          </span>
                          <span className="ml-2 text-neutral-400">({p.status})</span>
                        </div>
                        <span
                          className={`font-medium ${
                            isLinked ? 'text-gold-600' : 'text-neutral-400'
                          }`}
                        >
                          {isLinked ? 'Linked' : '+ Link'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Publishing & SEO */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Lifecycle Status
                </label>
                <select
                  aria-label="Lifecycle Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JournalPostStatus)}
                  className="w-full text-sm px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Publication Date
                </label>
                <Input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-gold-600 rounded border-neutral-300 focus:ring-gold-500"
              />
              <label
                htmlFor="featuredCheck"
                className="text-xs text-neutral-800 dark:text-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                <span>
                  Feature this article prominently on the Journal index & Homepage (Requires <strong>PUBLISHED</strong> status).
                </span>
              </label>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Search Engine Optimization (SEO)
              </h4>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  SEO Title
                </label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Custom page title for search engines"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Brief synopsis for Google / search snippets (150-160 characters)"
                  rows={2}
                  className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  SEO Keywords
                </label>
                <Input
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="comma, separated, search, terms"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving Post...' : isEdit ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </div>

      {/* Pickers */}
      <MediaPicker
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={(media: any) => {
          const item = Array.isArray(media) ? media[0] : media;
          if (item) {
            setCoverImageId(item.id);
            setCoverPreviewUrl(item.thumbnailUrl || item.url);
          }
          setIsCoverPickerOpen(false);
        }}
        mode="single"
      />

      <MediaPicker
        isOpen={isOgPickerOpen}
        onClose={() => setIsOgPickerOpen(false)}
        onSelect={(media: any) => {
          const item = Array.isArray(media) ? media[0] : media;
          if (item) {
            setOgImageId(item.id);
            setOgPreviewUrl(item.thumbnailUrl || item.url);
          }
          setIsOgPickerOpen(false);
        }}
        mode="single"
      />

      <ProductPicker
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        onSelectProducts={(ids) => {
          setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
          setIsProductPickerOpen(false);
        }}
        alreadyAssignedProductIds={selectedProductIds}
      />

      <CollectionPickerModal
        isOpen={isCollectionPickerOpen}
        onClose={() => setIsCollectionPickerOpen(false)}
        onSelectCollections={(ids) => {
          setSelectedCollectionIds((prev) => Array.from(new Set([...prev, ...ids])));
          setIsCollectionPickerOpen(false);
        }}
        alreadyAssignedIds={selectedCollectionIds}
      />

      <ArtistPickerModal
        isOpen={isArtistPickerOpen}
        onClose={() => setIsArtistPickerOpen(false)}
        onSelectArtists={(ids) => {
          setSelectedArtistIds((prev) => Array.from(new Set([...prev, ...ids])));
          setIsArtistPickerOpen(false);
        }}
        alreadyAssignedIds={selectedArtistIds}
      />
    </form>
  );
};
