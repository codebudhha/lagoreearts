import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { JournalTagModal } from '../../components/journal/JournalTagModal';
import { useJournalTagsList, useDeleteJournalTag } from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import { JournalTag } from '../../lib/api/journal';
import { Tags, Plus, Edit2, Trash2, FileText } from 'lucide-react';

export const JournalTagsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('journal.create');
  const canUpdate = hasPermission('journal.update');
  const canDelete = hasPermission('journal.delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<JournalTag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<JournalTag | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useJournalTagsList({
    page,
    limit,
    search: search || undefined,
  });

  const deleteMutation = useDeleteJournalTag();

  const tags = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(tagToDelete.id);
      setTagToDelete(null);
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message || err?.message || 'Cannot delete tag with linked articles.'
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Editorial Tags"
        description="Manage granular cross-cutting keywords for filtering and discovering journal content."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: 'Tags' },
        ]}
      >
        {canCreate && (
          <Button
            onClick={() => {
              setEditingTag(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </Button>
        )}
      </PageHeader>

      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
          {deleteError}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search tag name..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load tags"
          message={(error as Error)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={<Tags className="w-7 h-7 text-charcoal-400" />}
          title="No editorial tags found"
          description={
            search
              ? 'No tags matched your search.'
              : 'Add editorial tags to classify articles with discoverable keywords.'
          }
          actionLabel={canCreate && !search ? 'Add First Tag' : undefined}
          onAction={canCreate && !search ? () => {
            setEditingTag(null);
            setIsModalOpen(true);
          } : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Tag Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Articles Tagged</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                        #{tag.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-neutral-500">
                      {tag.slug}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        {tag._count?.posts ?? 0} Posts
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTag(tag);
                              setIsModalOpen(true);
                            }}
                            title="Edit Tag"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTagToDelete(tag)}
                            title="Delete Tag"
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

      {/* Tag Modal */}
      <JournalTagModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(tagToDelete)}
        onClose={() => {
          setTagToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete "${tagToDelete?.name}"?`}
        confirmLabel="Delete Tag"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
