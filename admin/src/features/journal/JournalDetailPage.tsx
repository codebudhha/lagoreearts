import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { JournalPostStatusBadge } from '../../components/journal/JournalPostStatusBadge';
import {
  useJournalPost,
  usePublishJournalPost,
  useUnpublishJournalPost,
  useArchiveJournalPost,
  useDeleteJournalPost,
} from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import {
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  Archive,
  RotateCcw,
  User,
  FolderArchive,
  Package,
  Calendar,
  Clock,
  Globe,
} from 'lucide-react';

export const JournalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('journal.update');
  const canDelete = hasPermission('journal.delete');

  const { data: post, isLoading, isError, error, refetch } = useJournalPost(id || '');

  const publishMutation = usePublishJournalPost();
  const unpublishMutation = useUnpublishJournalPost();
  const archiveMutation = useArchiveJournalPost();
  const deleteMutation = useDeleteJournalPost();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </PageContainer>
    );
  }

  if (isError || !post) {
    return (
      <PageContainer>
        <ErrorState
          title="Article Not Found"
          message={(error as Error)?.message || 'Unable to load journal article.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const handlePublish = async () => {
    await publishMutation.mutateAsync(post.id);
  };

  const handleUnpublish = async () => {
    await unpublishMutation.mutateAsync(post.id);
  };

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(post.id);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(post.id);
    navigate('/admin/journal');
  };

  return (
    <PageContainer>
      <PageHeader
        title={post.title}
        description={`Type: ${post.type} • Created ${new Date(post.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: post.title },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <JournalPostStatusBadge status={post.status} isFeatured={post.featured} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/journal/${post.id}/preview`)}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/journal/${post.id}/edit`)}
              className="gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}

          {canUpdate && post.status !== 'PUBLISHED' && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish
            </Button>
          )}

          {canUpdate && post.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={unpublishMutation.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Unpublish
            </Button>
          )}

          {canUpdate && post.status !== 'ARCHIVED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
              className="gap-1.5 text-neutral-600"
            >
              <Archive className="w-4 h-4" />
              Archive
            </Button>
          )}

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Content & Body */}
        <div className="lg:col-span-2 space-y-6">
          {post.coverImage?.url && (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <img
                src={post.coverImage.url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {post.excerpt && (
            <Card className="p-4 bg-gold-50/40 dark:bg-gold-950/20 border-gold-200 dark:border-gold-800">
              <p className="text-sm italic text-neutral-700 dark:text-neutral-300">
                "{post.excerpt}"
              </p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              Article Content
            </h3>
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {post.content}
            </div>
          </Card>

          {/* Linked Products / Collections / Artists */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Featured Associations
            </h3>

            <div className="space-y-3 text-xs">
              {post.products && post.products.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-500 block mb-1">
                    Products ({post.products.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {post.products.map((p) => (
                      <Badge key={p.productId} variant="secondary" className="gap-1">
                        <Package className="w-3 h-3 text-gold-600" />
                        {p.product?.title || p.productId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {post.collections && post.collections.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-500 block mb-1">
                    Collections ({post.collections.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {post.collections.map((c) => (
                      <Badge key={c.collectionId} variant="secondary" className="gap-1">
                        <FolderArchive className="w-3 h-3 text-gold-600" />
                        {c.collection?.title || c.collectionId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {post.artists && post.artists.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-500 block mb-1">
                    Artists ({post.artists.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {post.artists.map((a) => (
                      <Badge key={a.artistId} variant="secondary" className="gap-1">
                        <User className="w-3 h-3 text-gold-600" />
                        {a.artist?.name || a.artistId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Metadata & Author Sidebar */}
        <div className="space-y-6">
          {/* Author Card */}
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Author
            </h4>
            {post.author ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border">
                  {post.author.avatar?.url ? (
                    <img
                      src={post.author.avatar.url}
                      alt={post.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {post.author.name}
                  </p>
                  {post.author.role && (
                    <p className="text-xs text-neutral-500">{post.author.role}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No author assigned</p>
            )}
          </Card>

          {/* Taxonomy & Properties */}
          <Card className="p-5 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-500">
              Taxonomy & Details
            </h4>

            <div className="space-y-2 divide-y divide-neutral-200 dark:divide-neutral-800">
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Category:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {post.category?.name || 'Uncategorized'}
                </span>
              </div>

              {post.readingTime && (
                <div className="pt-2 flex justify-between">
                  <span className="text-neutral-500">Reading Time:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {post.readingTime} min
                  </span>
                </div>
              )}

              {post.publishedAt && (
                <div className="pt-2 flex justify-between">
                  <span className="text-neutral-500">Published:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="pt-2">
                  <span className="text-neutral-500 block mb-1.5">Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t.tagId}
                        className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs"
                      >
                        #{t.tag?.name || t.tagId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* SEO & URL */}
          <Card className="p-5 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              SEO & Social Card
            </h4>

            <div className="space-y-2">
              <div>
                <span className="text-neutral-500 block">Slug URL:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  /journal/{post.slug}
                </span>
              </div>
              {post.seoTitle && (
                <div>
                  <span className="text-neutral-500 block">SEO Title:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {post.seoTitle}
                  </span>
                </div>
              )}
              {post.seoDescription && (
                <div>
                  <span className="text-neutral-500 block">Meta Description:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {post.seoDescription}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Journal Article"
        message={`Are you sure you want to delete "${post.title}"?`}
        confirmLabel="Delete Article"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
