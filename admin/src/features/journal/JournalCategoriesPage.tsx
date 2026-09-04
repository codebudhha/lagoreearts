import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { JournalCategoryModal } from '../../components/journal/JournalCategoryModal';
import {
  useJournalCategoriesList,
  useDeleteJournalCategory,
} from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import { JournalCategory } from '../../lib/api/journal';
import {
  FolderArchive,
  Plus,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react';

export const JournalCategoriesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('journal.create');
  const canUpdate = hasPermission('journal.update');
  const canDelete = hasPermission('journal.delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JournalCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<JournalCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useJournalCategoriesList({
    page,
    limit,
    search: search || undefined,
  });

  const deleteMutation = useDeleteJournalCategory();

  const categories = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message || err?.message || 'Cannot delete category with linked articles.'
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Editorial Categories"
        description="Organize journal posts into cultural pillars such as Vedic Iconography, Temple Architecture, and Curators Notes."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: 'Categories' },
        ]}
      >
        {canCreate && (
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
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
            placeholder="Search category..."
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
          title="Failed to load categories"
          message={(error as Error)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FolderArchive className="w-7 h-7 text-charcoal-400" />}
          title="No editorial categories found"
          description={
            search
              ? 'No categories matched your search.'
              : 'Add editorial categories to organize essays and lookbooks.'
          }
          actionLabel={canCreate && !search ? 'Add First Category' : undefined}
          onAction={canCreate && !search ? () => {
            setEditingCategory(null);
            setIsModalOpen(true);
          } : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Display Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {cat.name}
                        </span>
                        {cat.slug && (
                          <p className="text-xs text-neutral-400 font-mono">
                            /{cat.slug}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                      {cat.displayOrder ?? 0}
                    </td>

                    <td className="py-3.5 px-4">
                      {cat.isActive ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          Hidden
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        {cat._count?.posts ?? 0} Posts
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsModalOpen(true);
                            }}
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCategoryToDelete(cat)}
                            title="Delete Category"
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

      {/* Category Modal */}
      <JournalCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => {
          setCategoryToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
