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
import { HomepageStatusBadge } from '../../components/homepage/HomepageStatusBadge';
import {
  useHomepagesList,
  useCreateHomepage,
  useDeleteHomepage,
  useSetDefaultHomepage,
} from '../../hooks/useHomepage';
import { useAuth } from '../../hooks/useAuth';
import { AdminHomepage, HomepageStatus } from '../../lib/api/homepage';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Star,
  Layers,
  Layout,
} from 'lucide-react';

export const HomepageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('homepage.create');
  const canUpdate = hasPermission('homepage.update');
  const canDelete = hasPermission('homepage.delete');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [homepageToDelete, setHomepageToDelete] = useState<AdminHomepage | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, error, refetch } = useHomepagesList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as HomepageStatus) : undefined,
  });

  const createMutation = useCreateHomepage();
  const deleteMutation = useDeleteHomepage();
  const setDefaultMutation = useSetDefaultHomepage();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await createMutation.mutateAsync({
      name: newName.trim(),
      slug: newSlug.trim() || undefined,
      status: 'DRAFT',
    });
    setIsCreateModalOpen(false);
    setNewName('');
    setNewSlug('');
    navigate(`/admin/homepage/${created.id}/edit`);
  };

  const handleSetDefault = async (homepage: AdminHomepage) => {
    await setDefaultMutation.mutateAsync(homepage.id);
  };

  const handleConfirmDelete = async () => {
    if (!homepageToDelete) return;
    await deleteMutation.mutateAsync(homepageToDelete.id);
    setHomepageToDelete(null);
  };

  const homepages = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="Homepage Layouts & CMS"
        description="Design and orchestrate storefront hero banners, product carousels, editorial sections, and active storefront versions."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Homepage CMS' },
        ]}
      >
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Layout
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search layout by name..."
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
          title="Failed to load homepage layouts"
          message={(error as Error)?.message || 'An unexpected error occurred'}
          onRetry={refetch}
        />
      ) : homepages.length === 0 ? (
        <EmptyState
          icon={<Layout className="w-7 h-7 text-charcoal-400" />}
          title="No homepage layouts found"
          description={
            search || statusFilter !== 'ALL'
              ? 'Try refining your search terms or filter criteria.'
              : 'Create your first homepage layout to curate hero banners, collections, and featured sections.'
          }
          actionLabel={canCreate && !search && statusFilter === 'ALL' ? 'Create First Homepage' : undefined}
          onAction={canCreate && !search && statusFilter === 'ALL' ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Layout Name</th>
                  <th className="py-3 px-4">Status & Flag</th>
                  <th className="py-3 px-4">Sections</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {homepages.map((hp) => (
                  <tr
                    key={hp.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {hp.name}
                        </span>
                        {hp.slug && (
                          <span className="text-xs text-neutral-400 font-mono">
                            /{hp.slug}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <HomepageStatusBadge
                        status={hp.status}
                        isDefault={hp.isDefault}
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                        {hp.sections?.length ?? 0} Sections
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500">
                      {hp.updatedAt ? new Date(hp.updatedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && !hp.isDefault && hp.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(hp)}
                            title="Set as Default Storefront"
                            className="text-xs text-gold-600 hover:text-gold-700"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Set Default
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/homepage/${hp.id}/preview`)}
                          title="Preview Layout"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </Button>

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/homepage/${hp.id}/edit`)}
                            title="Edit Layout Sections"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canDelete && !hp.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHomepageToDelete(hp)}
                            title="Delete Layout"
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
        title="Create New Homepage Layout"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Layout Name *
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Diwali Festive Storefront 2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Slug (optional)
            </label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="e.g. diwali-festive-2026"
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
              {createMutation.isPending ? 'Creating...' : 'Create & Design Sections'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(homepageToDelete)}
        onClose={() => setHomepageToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Homepage Layout"
        message={`Are you sure you want to delete "${homepageToDelete?.name}"? All configured sections and media associations inside this layout will be deleted.`}
        confirmLabel="Delete Layout"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
