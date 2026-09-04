import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LookbookStatusBadge } from '../../components/lookbook/LookbookStatusBadge';
import {
  useLookbooks,
  useCreateLookbook,
  useDeleteLookbook,
  useDuplicateLookbook,
} from '../../hooks/useLookbook';
import { useAuth } from '../../hooks/useAuth';
import { AdminLookbook, LookbookStatus } from '../../lib/api/lookbook';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

export const LookbookListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('lookbook.create');
  const canUpdate = hasPermission('lookbook.update');
  const canDelete = hasPermission('lookbook.delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [lookbookToDelete, setLookbookToDelete] = useState<AdminLookbook | null>(null);

  const { data, isLoading, isError, error, refetch } = useLookbooks({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as LookbookStatus) : undefined,
    featured: featuredFilter === 'YES' ? true : featuredFilter === 'NO' ? false : undefined,
  });

  const createMutation = useCreateLookbook();
  const deleteMutation = useDeleteLookbook();
  const duplicateMutation = useDuplicateLookbook();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await createMutation.mutateAsync({
      title: newTitle.trim(),
      slug: newSlug.trim() || undefined,
      status: 'DRAFT',
    });
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewSlug('');
    navigate(`/admin/lookbook/${created.id}/edit`);
  };

  const handleConfirmDelete = async () => {
    if (!lookbookToDelete) return;
    await deleteMutation.mutateAsync(lookbookToDelete.id);
    setLookbookToDelete(null);
  };

  const handleDuplicate = async (lb: AdminLookbook) => {
    await duplicateMutation.mutateAsync(lb.id);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const lookbooks = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="Lookbooks"
        description="Curate and manage editorial lookbooks with rich section layouts for the storefront."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lookbooks' },
        ]}
      >
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Lookbook
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search lookbooks by title..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Select
            aria-label="Filter by Featured"
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40 text-xs"
          >
            <option value="ALL">All</option>
            <option value="YES">Featured</option>
            <option value="NO">Not Featured</option>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load lookbooks"
          message={(error as Error)?.message || 'An unexpected error occurred'}
          onRetry={refetch}
        />
      ) : lookbooks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-7 h-7 text-charcoal-400" />}
          title="No lookbooks found"
          description={
            search || statusFilter !== 'ALL' || featuredFilter !== 'ALL'
              ? 'Try refining your search terms or filter criteria.'
              : 'Create your first lookbook to curate editorial stories, hero banners, and product showcases.'
          }
          actionLabel={
            canCreate && !search && statusFilter === 'ALL' && featuredFilter === 'ALL'
              ? 'Create First Lookbook'
              : undefined
          }
          onAction={
            canCreate && !search && statusFilter === 'ALL' && featuredFilter === 'ALL'
              ? () => setIsCreateModalOpen(true)
              : undefined
          }
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status & Featured</th>
                  <th className="py-3 px-4">Cover</th>
                  <th className="py-3 px-4">Sections</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {lookbooks.map((lb) => (
                  <tr
                    key={lb.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {lb.title}
                        </span>
                        {lb.slug && (
                          <span className="text-xs text-neutral-400 font-mono">
                            /{lb.slug}
                          </span>
                        )}
                        {lb.shortDescription && (
                          <span className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-xs">
                            {lb.shortDescription}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <LookbookStatusBadge status={lb.status} featured={lb.featured} />
                    </td>

                    <td className="py-3.5 px-4">
                      {lb.coverMedia?.url ? (
                        <img
                          src={lb.coverMedia.thumbnailUrl || lb.coverMedia.url}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover border border-neutral-200 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700">
                          <ImageIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                        {lb._count?.sections ?? lb.sections?.length ?? 0} Sections
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500">
                      {lb.publishedAt
                        ? new Date(lb.publishedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500">
                      {lb.updatedAt
                        ? new Date(lb.updatedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/lookbook/${lb.id}/preview`)}
                          title="Preview Lookbook"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </Button>

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/lookbook/${lb.id}/edit`)}
                            title="Edit Lookbook"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(lb)}
                            title="Duplicate Lookbook"
                            disabled={duplicateMutation.isPending}
                            className="text-champagne-700 hover:text-champagne-800"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLookbookToDelete(lb)}
                            title="Delete Lookbook"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Lookbook"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Lookbook Title *
            </label>
            <Input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  setNewSlug(generateSlug(e.target.value));
                }
              }}
              placeholder="e.g. Diwali Festive Collection 2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Slug (auto-generated from title)
            </label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="e.g. diwali-festive-collection-2026"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create & Edit Sections'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(lookbookToDelete)}
        onClose={() => setLookbookToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Lookbook"
        message={`Are you sure you want to delete "${lookbookToDelete?.title}"? All sections and media associations will be removed.`}
        confirmLabel="Delete Lookbook"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
