import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LookbookStatusBadge } from '../../components/lookbook/LookbookStatusBadge';
import { LookbookSectionTypeBadge } from '../../components/lookbook/LookbookSectionTypeBadge';
import {
  useLookbookDetail,
  usePublishLookbook,
  useUnpublishLookbook,
  useArchiveLookbook,
} from '../../hooks/useLookbook';
import { useAuth } from '../../hooks/useAuth';
import {
  Edit2,
  Eye,
  CheckCircle2,
  Archive,
  Clock,
  Layers,
  Globe,
  Star,
} from 'lucide-react';

export const LookbookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('lookbook.update');

  const { data: lookbook, isLoading, isError, error, refetch } = useLookbookDetail(id || '');
  const publishMutation = usePublishLookbook();
  const unpublishMutation = useUnpublishLookbook();
  const archiveMutation = useArchiveLookbook();

  if (isLoading) {
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

  return (
    <PageContainer>
      <PageHeader
        title={lookbook.title}
        description={lookbook.shortDescription || 'Lookbook detail view'}
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lookbooks', path: '/admin/lookbook' },
          { label: lookbook.title },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <LookbookStatusBadge status={lookbook.status} featured={lookbook.featured} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/lookbook/${lookbook.id}/preview`)}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/lookbook/${lookbook.id}/edit`)}
              className="gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}

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
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Media */}
          {lookbook.coverMedia?.url && (
            <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={lookbook.coverMedia.url}
                  alt={lookbook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          )}

          {/* Description */}
          {(lookbook.description || lookbook.shortDescription) && (
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Description
              </h3>
              {lookbook.shortDescription && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 italic">
                  {lookbook.shortDescription}
                </p>
              )}
              {lookbook.description && (
                <div
                  className="text-sm text-neutral-700 dark:text-neutral-300 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lookbook.description }}
                />
              )}
            </Card>
          )}

          {/* Sections */}
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-gold-600" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Sections ({sections.length})
              </h3>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                No sections added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`p-3 border rounded-lg ${
                      section.isVisible
                        ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <LookbookSectionTypeBadge type={section.type} />
                        <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                          {section.title || (
                            <span className="italic text-neutral-400">Untitled</span>
                          )}
                        </span>
                        {!section.isVisible && (
                          <Badge variant="secondary" className="text-xs">Hidden</Badge>
                        )}
                      </div>
                      <span className="text-xs font-mono text-neutral-400">
                        #{section.displayOrder}
                      </span>
                    </div>
                    {section.subtitle && (
                      <p className="text-xs text-neutral-500 ml-0.5">{section.subtitle}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lookbook Info */}
          <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Lookbook Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Slug</span>
                <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  /{lookbook.slug}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <Badge variant={lookbook.status === 'PUBLISHED' ? 'success' : lookbook.status === 'DRAFT' ? 'warning' : 'secondary'}>
                  {lookbook.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Featured</span>
                <span className="flex items-center gap-1">
                  {lookbook.featured ? (
                    <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-600" />
                  ) : null}
                  <span className="text-xs">{lookbook.featured ? 'Yes' : 'No'}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Sections</span>
                <span className="text-xs">{sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Display Order</span>
                <span className="text-xs">{lookbook.displayOrder}</span>
              </div>
              {lookbook.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Published</span>
                  <span className="text-xs">
                    {new Date(lookbook.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Created</span>
                <span className="text-xs">
                  {new Date(lookbook.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Updated</span>
                <span className="text-xs">
                  {new Date(lookbook.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* SEO */}
          {(lookbook.seoTitle || lookbook.seoDescription || lookbook.seoKeywords) && (
            <Card className="p-5 space-y-3 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold-600" />
                SEO
              </h3>
              <div className="space-y-2 text-sm">
                {lookbook.seoTitle && (
                  <div>
                    <span className="text-xs text-neutral-500 block mb-0.5">Meta Title</span>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs">{lookbook.seoTitle}</p>
                  </div>
                )}
                {lookbook.seoDescription && (
                  <div>
                    <span className="text-xs text-neutral-500 block mb-0.5">Meta Description</span>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs line-clamp-3">
                      {lookbook.seoDescription}
                    </p>
                  </div>
                )}
                {lookbook.seoKeywords && (
                  <div>
                    <span className="text-xs text-neutral-500 block mb-0.5">Keywords</span>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs">
                      {lookbook.seoKeywords}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
