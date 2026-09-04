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
import { AuthorModal } from '../../components/journal/AuthorModal';
import {
  useJournalAuthorsList,
  useDeleteAuthor,
} from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import { JournalAuthor } from '../../lib/api/journal';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  Instagram,
  Twitter,
  Globe,
  FileText,
} from 'lucide-react';

export const JournalAuthorsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('journal.create');
  const canUpdate = hasPermission('journal.update');
  const canDelete = hasPermission('journal.delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<JournalAuthor | null>(null);
  const [authorToDelete, setAuthorToDelete] = useState<JournalAuthor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useJournalAuthorsList({
    page,
    limit,
    search: search || undefined,
  });

  const deleteMutation = useDeleteAuthor();

  const authors = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const handleConfirmDelete = async () => {
    if (!authorToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(authorToDelete.id);
      setAuthorToDelete(null);
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message || err?.message || 'Cannot delete author with linked posts.'
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Journal Authors & Curators"
        description="Manage resident scholars, guest essayists, curator profiles, and biographies."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: 'Authors' },
        ]}
      >
        {canCreate && (
          <Button
            onClick={() => {
              setEditingAuthor(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Author
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
            placeholder="Search author by name..."
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
          title="Failed to load authors"
          message={(error as Error)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      ) : authors.length === 0 ? (
        <EmptyState
          icon={<User className="w-7 h-7 text-charcoal-400" />}
          title="No authors found"
          description={
            search
              ? 'No authors matched your search.'
              : 'Add your first author or curator to attribute editorial articles.'
          }
          actionLabel={canCreate && !search ? 'Add First Author' : undefined}
          onAction={canCreate && !search ? () => {
            setEditingAuthor(null);
            setIsModalOpen(true);
          } : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Author Profile</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Social Links</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {authors.map((author) => (
                  <tr
                    key={author.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border shrink-0">
                          {author.avatar?.url ? (
                            <img
                              src={author.avatar.thumbnailUrl || author.avatar.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {author.name}
                          </p>
                          {author.slug && (
                            <p className="text-xs text-neutral-400 font-mono">
                              /{author.slug}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">
                      {author.role || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-neutral-400">
                        {author.instagram && (
                          <span title={author.instagram}>
                            <Instagram className="w-4 h-4 text-pink-500" />
                          </span>
                        )}
                        {author.twitter && (
                          <span title={author.twitter}>
                            <Twitter className="w-4 h-4 text-sky-400" />
                          </span>
                        )}
                        {author.website && (
                          <a
                            href={author.website}
                            target="_blank"
                            rel="noreferrer"
                            title={author.website}
                            className="hover:text-gold-600"
                          >
                            <Globe className="w-4 h-4 text-emerald-500" />
                          </a>
                        )}
                        {!author.instagram && !author.twitter && !author.website && (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {author.isActive ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          Inactive
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        {author._count?.posts ?? 0} Posts
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAuthor(author);
                              setIsModalOpen(true);
                            }}
                            title="Edit Author"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAuthorToDelete(author)}
                            title="Delete Author"
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

      {/* Author Modal */}
      <AuthorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAuthor(null);
        }}
        author={editingAuthor}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(authorToDelete)}
        onClose={() => {
          setAuthorToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Author"
        message={`Are you sure you want to delete "${authorToDelete?.name}"?`}
        confirmLabel="Delete Author"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
