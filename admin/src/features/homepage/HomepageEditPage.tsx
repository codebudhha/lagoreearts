import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { HomepageStatusBadge } from '../../components/homepage/HomepageStatusBadge';
import { SectionCard } from '../../components/homepage/SectionCard';
import { SectionEditorModal } from '../../components/homepage/SectionEditorModal';
import { SectionEntityLinker } from '../../components/homepage/SectionEntityLinker';
import { SectionMediaManager } from '../../components/homepage/SectionMediaManager';
import {
  useHomepage,
  useHomepagesList,
  useUpdateHomepage,
  useUpdateHomepageStatus,
  useSetDefaultHomepage,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
} from '../../hooks/useHomepage';
import {
  AdminHomepageSection,
  CreateHomepageSectionPayload,
  UpdateHomepageSectionPayload,
} from '../../lib/api/homepage';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Eye,
  Star,
  Layers,
  Save,
  CheckCircle2,
  Globe,
  Settings,
} from 'lucide-react';

export const HomepageEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('homepage.update');

  // If no ID is passed, we can query the default or first homepage
  const { data: listData } = useHomepagesList({ limit: 1 });
  const targetId = id || listData?.items?.[0]?.id;

  const { data: homepage, isLoading, isError, error, refetch } = useHomepage(targetId || '', {
    enabled: Boolean(targetId),
  });

  // Mutations
  const updateHomepageMutation = useUpdateHomepage();
  const updateStatusMutation = useUpdateHomepageStatus();
  const setDefaultMutation = useSetDefaultHomepage();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();
  const reorderSectionsMutation = useReorderSections();

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AdminHomepageSection | null>(null);

  const [entityLinkerSection, setEntityLinkerSection] = useState<AdminHomepageSection | null>(null);
  const [mediaManagerSection, setMediaManagerSection] = useState<AdminHomepageSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<AdminHomepageSection | null>(null);

  // Layout metadata state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [isMetaDirty, setIsMetaDirty] = useState(false);

  React.useEffect(() => {
    if (homepage) {
      setName(homepage.name || '');
      setSlug(homepage.slug || '');
      setSeoTitle(homepage.seoTitle || '');
      setSeoDescription(homepage.seoDescription || '');
      setSeoKeywords(homepage.seoKeywords || '');
      setIsMetaDirty(false);
    }
  }, [homepage]);

  if (isLoading || !targetId) {
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

  if (isError || !homepage) {
    return (
      <PageContainer>
        <ErrorState
          title="Homepage not found"
          message={(error as Error)?.message || 'Unable to load homepage layout.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const sections = [...(homepage.sections || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHomepageMutation.mutateAsync({
      id: homepage.id,
      payload: {
        name: name.trim(),
        slug: slug.trim() || undefined,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        seoKeywords: seoKeywords.trim() || undefined,
      },
    });
    setIsMetaDirty(false);
  };

  const handleSaveSection = async (payload: CreateHomepageSectionPayload | UpdateHomepageSectionPayload) => {
    if (editingSection) {
      await updateSectionMutation.mutateAsync({
        homepageId: homepage.id,
        sectionId: editingSection.id,
        payload,
      });
    } else {
      await createSectionMutation.mutateAsync({
        homepageId: homepage.id,
        payload: {
          ...payload,
          displayOrder: sections.length,
        } as CreateHomepageSectionPayload,
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
      homepageId: homepage.id,
      items: reorderedItems,
    });
  };

  const handleToggleActive = async (section: AdminHomepageSection) => {
    await updateSectionMutation.mutateAsync({
      homepageId: homepage.id,
      sectionId: section.id,
      payload: {
        isActive: !section.isActive,
      },
    });
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    await deleteSectionMutation.mutateAsync({
      homepageId: homepage.id,
      sectionId: sectionToDelete.id,
    });
    setSectionToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Layout: ${homepage.name}`}
        description="Curate sections, banner media, promotional copy, and product showcases."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Homepage CMS', path: '/admin/homepage' },
          { label: homepage.name },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <HomepageStatusBadge status={homepage.status} isDefault={homepage.isDefault} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/homepage/${homepage.id}/preview`)}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </Button>

          {homepage.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: homepage.id,
                  status: 'PUBLISHED',
                })
              }
              disabled={!canUpdate || updateStatusMutation.isPending}
              className="gap-1.5 text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish
            </Button>
          )}

          {!homepage.isDefault && homepage.status === 'PUBLISHED' && (
            <Button
              size="sm"
              onClick={() => setDefaultMutation.mutate(homepage.id)}
              disabled={!canUpdate || setDefaultMutation.isPending}
              className="gap-1.5 bg-gold-600 hover:bg-gold-700 text-white"
            >
              <Star className="w-4 h-4" />
              Set As Default Storefront
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
                Layout Sections ({sections.length})
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
                Add your first Hero banner, Featured Products carousel, or Editorial spotlight.
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
                <SectionCard
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
                  onToggleActive={(s) => handleToggleActive(s)}
                  onManageEntities={(s) => setEntityLinkerSection(s)}
                  onManageMedia={(s) => setMediaManagerSection(s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Layout Settings & SEO */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold-600" />
              Layout Details & SEO
            </h3>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Layout Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsMetaDirty(true);
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
                    setIsMetaDirty(true);
                  }}
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <Globe className="w-3.5 h-3.5 text-gold-600" />
                  <span>Search Engine Optimization</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    SEO Meta Title
                  </label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      setIsMetaDirty(true);
                    }}
                    placeholder="e.g. Lagoree Arts | Sacred Indian Artifacts"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => {
                      setSeoDescription(e.target.value);
                      setIsMetaDirty(true);
                    }}
                    rows={3}
                    placeholder="Short description for search results"
                    className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    SEO Keywords
                  </label>
                  <Input
                    value={seoKeywords}
                    onChange={(e) => {
                      setSeoKeywords(e.target.value);
                      setIsMetaDirty(true);
                    }}
                    placeholder="art, antiques, chola bronze"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canUpdate || !isMetaDirty || updateHomepageMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {updateHomepageMutation.isPending ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Section Editor Modal */}
      <SectionEditorModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setEditingSection(null);
        }}
        section={editingSection}
        onSubmit={handleSaveSection}
        isLoading={createSectionMutation.isPending || updateSectionMutation.isPending}
      />

      {/* Section Entity Linker Modal */}
      <SectionEntityLinker
        isOpen={Boolean(entityLinkerSection)}
        onClose={() => setEntityLinkerSection(null)}
        homepageId={homepage.id}
        section={entityLinkerSection}
      />

      {/* Section Media Manager Modal */}
      <SectionMediaManager
        isOpen={Boolean(mediaManagerSection)}
        onClose={() => setMediaManagerSection(null)}
        homepageId={homepage.id}
        section={mediaManagerSection}
      />

      {/* Confirm Delete Section Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={handleDeleteSection}
        title="Delete Homepage Section"
        message={`Are you sure you want to delete this "${sectionToDelete?.title || sectionToDelete?.type}" section?`}
        confirmLabel="Delete Section"
        variant="danger"
        isLoading={deleteSectionMutation.isPending}
      />
    </PageContainer>
  );
};
