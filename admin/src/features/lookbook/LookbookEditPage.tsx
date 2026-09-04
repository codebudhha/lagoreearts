import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { MediaPicker } from '../../components/media/MediaPicker';
import { SeoEditor } from '../../components/products/SeoEditor';
import { LookbookStatusBadge } from '../../components/lookbook/LookbookStatusBadge';
import { LookbookSectionCard } from '../../components/lookbook/LookbookSectionCard';
import { LookbookSectionEditorModal } from '../../components/lookbook/LookbookSectionEditorModal';
import { LookbookSectionEntityLinker } from '../../components/lookbook/LookbookSectionEntityLinker';
import { LookbookSectionMediaManager } from '../../components/lookbook/LookbookSectionMediaManager';
import {
  useLookbookDetail,
  useUpdateLookbook,
  usePublishLookbook,
  useUnpublishLookbook,
  useArchiveLookbook,
  useDuplicateLookbook,
  useCreateLookbookSection,
  useUpdateLookbookSection,
  useDeleteLookbookSection,
  useReorderLookbookSections,
} from '../../hooks/useLookbook';
import {
  AdminLookbookSection,
  CreateLookbookSectionPayload,
  UpdateLookbookSectionPayload,
} from '../../lib/api/lookbook';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Eye,
  Save,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Globe,
  Settings,
  Image as ImageIcon,
  X,
  Copy,
  ArrowLeft,
} from 'lucide-react';

export const LookbookEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('lookbook.update');

  const { data: lookbook, isLoading, isError, error, refetch } = useLookbookDetail(id || '');

  const updateLookbookMutation = useUpdateLookbook();
  const publishMutation = usePublishLookbook();
  const unpublishMutation = useUnpublishLookbook();
  const archiveMutation = useArchiveLookbook();
  const duplicateMutation = useDuplicateLookbook();
  const createSectionMutation = useCreateLookbookSection();
  const updateSectionMutation = useUpdateLookbookSection();
  const deleteSectionMutation = useDeleteLookbookSection();
  const reorderSectionsMutation = useReorderLookbookSections();

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AdminLookbookSection | null>(null);
  const [entityLinkerSection, setEntityLinkerSection] = useState<AdminLookbookSection | null>(null);
  const [mediaManagerSection, setMediaManagerSection] = useState<AdminLookbookSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<AdminLookbookSection | null>(null);

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
  const {
    isDirty,
    setIsDirty,
    showDialog,
    confirmNavigation,
    cancelNavigation,
    guardedNavigate,
  } = useUnsavedChanges(false);
  const [seoValues, setSeoValues] = useState<{
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }>({});

  useEffect(() => {
    if (lookbook) {
      setTitle(lookbook.title || '');
      setSlug(lookbook.slug || '');
      setShortDescription(lookbook.shortDescription || '');
      setDescription(lookbook.description || '');
      setStatus(lookbook.status || 'DRAFT');
      setFeatured(lookbook.featured || false);
      setDisplayOrder(lookbook.displayOrder || 0);
      setCoverMediaId(lookbook.coverMediaId || null);
      setCoverMediaUrl(lookbook.coverMedia?.url || null);
      setSeoValues({
        metaTitle: lookbook.seoTitle || '',
        metaDescription: lookbook.seoDescription || '',
        canonicalUrl: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      });
      setIsDirty(false);
    }
  }, [lookbook]);

  if (isLoading || !id) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !lookbook) {
    return (
      <PageContainer>
        <ErrorState
          title="Lookbook not found"
          message={(error as Error)?.message || 'Unable to load lookbook.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const sections = [...(lookbook.sections || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleCoverSelected = (selected: any) => {
    const item = Array.isArray(selected) ? selected[0] : selected;
    if (item) {
      setCoverMediaId(item.id);
      setCoverMediaUrl(item.url || item.thumbnailUrl || null);
      setIsDirty(true);
    }
    setIsCoverPickerOpen(false);
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateLookbookMutation.mutateAsync({
      id: lookbook.id,
      payload: {
        title: title.trim(),
        slug: slug.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        status: status as any,
        featured,
        displayOrder,
        coverMediaId: coverMediaId || null,
        seoTitle: seoValues.metaTitle || undefined,
        seoDescription: seoValues.metaDescription || undefined,
        seoKeywords: seoValues.canonicalUrl || undefined,
      },
    });
    setIsDirty(false);
  };

  const handleSaveSection = async (payload: CreateLookbookSectionPayload | UpdateLookbookSectionPayload) => {
    if (editingSection) {
      await updateSectionMutation.mutateAsync({
        lookbookId: lookbook.id,
        sectionId: editingSection.id,
        payload,
      });
    } else {
      await createSectionMutation.mutateAsync({
        lookbookId: lookbook.id,
        payload: {
          ...payload,
          displayOrder: sections.length,
        } as CreateLookbookSectionPayload,
      });
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const list = [...sections];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reorderedItems = list.map((sec, i) => ({
      id: sec.id,
      displayOrder: i,
    }));

    await reorderSectionsMutation.mutateAsync({
      lookbookId: lookbook.id,
      items: reorderedItems,
    });
  };

  const handleToggleVisible = async (section: AdminLookbookSection) => {
    await updateSectionMutation.mutateAsync({
      lookbookId: lookbook.id,
      sectionId: section.id,
      payload: {
        isVisible: !section.isVisible,
      },
    });
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    await deleteSectionMutation.mutateAsync({
      lookbookId: lookbook.id,
      sectionId: sectionToDelete.id,
    });
    setSectionToDelete(null);
  };

  const handleDuplicate = async () => {
    const dup = await duplicateMutation.mutateAsync(lookbook.id);
    if (dup?.id) {
      navigate(`/admin/lookbook/${dup.id}/edit`);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Lookbook: ${lookbook.title}`}
        description="Curate sections, manage media, and configure editorial content."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lookbooks', path: '/admin/lookbook' },
          { label: lookbook.title },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => guardedNavigate('/admin/lookbook')}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <LookbookStatusBadge status={lookbook.status} featured={lookbook.featured} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => guardedNavigate(`/admin/lookbook/${lookbook.id}/preview`)}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          {lookbook.status === 'DRAFT' && canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => publishMutation.mutate({ id: lookbook.id })}
              disabled={publishMutation.isPending}
              className="gap-1.5 text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish
            </Button>
          )}

          {lookbook.status === 'PUBLISHED' && canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unpublishMutation.mutate(lookbook.id)}
              disabled={unpublishMutation.isPending}
              className="gap-1.5"
            >
              <Clock className="w-4 h-4" />
              Unpublish
            </Button>
          )}

          {lookbook.status !== 'ARCHIVED' && canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => archiveMutation.mutate(lookbook.id)}
              disabled={archiveMutation.isPending}
              className="gap-1.5 text-neutral-600 hover:text-neutral-700"
            >
              <Archive className="w-4 h-4" />
              Archive
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              className="gap-1.5"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sections Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold-600" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Lookbook Sections ({sections.length})
              </h2>
            </div>

            <Button
              onClick={() => {
                setEditingSection(null);
                setIsSectionModalOpen(true);
              }}
              disabled={!canUpdate}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30">
              <Layers className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                No sections added yet
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Add your first Hero banner, Editorial narrative, Products showcase, or Gallery.
              </p>
              <Button
                onClick={() => {
                  setEditingSection(null);
                  setIsSectionModalOpen(true);
                }}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <LookbookSectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  totalSections={sections.length}
                  onMoveUp={() => handleMoveSection(idx, 'up')}
                  onMoveDown={() => handleMoveSection(idx, 'down')}
                  onEdit={(s) => {
                    setEditingSection(s);
                    setIsSectionModalOpen(true);
                  }}
                  onDelete={(s) => setSectionToDelete(s)}
                  onToggleVisible={(s) => handleToggleVisible(s)}
                  onManageEntities={(s) => setEntityLinkerSection(s)}
                  onManageMedia={(s) => setMediaManagerSection(s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Metadata & Settings */}
        <div className="space-y-6">
          {/* Cover Media */}
          <Card className="p-5 space-y-3 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold-600" />
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
                    setIsDirty(true);
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

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCoverPickerOpen(true)}
                className="gap-1.5"
              >
                <ImageIcon className="w-4 h-4" />
                {coverMediaUrl ? 'Change' : 'Choose from Library'}
              </Button>
            </div>
          </Card>

          {/* Metadata Settings */}
          <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold-600" />
              Lookbook Details
            </h3>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Short Description
                </label>
                <Input
                  value={shortDescription}
                  onChange={(e) => {
                    setShortDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Brief tagline"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  rows={4}
                  placeholder="Full editorial description"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Status
                  </label>
                  <Select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </div>

                <Switch
                  checked={featured}
                  onChange={(val) => {
                    setFeatured(val);
                    setIsDirty(true);
                  }}
                  label="Featured Lookbook"
                />

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Display Order
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={displayOrder}
                    onChange={(e) => {
                      setDisplayOrder(Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canUpdate || !isDirty || updateLookbookMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {updateLookbookMutation.isPending ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </form>
          </Card>

          {/* SEO */}
          <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold-600" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                SEO
              </h3>
            </div>
            <SeoEditor
              values={seoValues}
              onChange={(updates) => {
                setSeoValues((prev) => ({ ...prev, ...updates }));
                setIsDirty(true);
              }}
              defaultTitle={title}
              defaultDescription={shortDescription || description}
              slug={slug}
            />
          </Card>
        </div>
      </div>

      {/* Section Editor Modal */}
      <LookbookSectionEditorModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setEditingSection(null);
        }}
        section={editingSection}
        onSubmit={handleSaveSection}
        isLoading={createSectionMutation.isPending || updateSectionMutation.isPending}
      />

      {/* Section Entity Linker */}
      {entityLinkerSection && (
        <LookbookSectionEntityLinker
          section={entityLinkerSection}
          onUpdate={() => {
            setEntityLinkerSection(null);
          }}
        />
      )}

      {/* Section Media Manager */}
      {mediaManagerSection && (
        <LookbookSectionMediaManager
          section={mediaManagerSection}
          onUpdate={() => {
            setMediaManagerSection(null);
          }}
        />
      )}

      {/* Confirm Delete Section Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={handleDeleteSection}
        title="Delete Lookbook Section"
        message={`Are you sure you want to delete "${sectionToDelete?.title || sectionToDelete?.type}" section?`}
        confirmLabel="Delete Section"
        variant="danger"
        isLoading={deleteSectionMutation.isPending}
      />

      {/* Media Picker */}
      <MediaPicker
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={handleCoverSelected}
        mode="single"
        title="Select Cover Media"
      />

      {/* Unsaved Changes Warning */}
      <ConfirmDialog
        isOpen={showDialog}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave this page?"
        confirmLabel="Leave Page"
        variant="danger"
      />
    </PageContainer>
  );
};
