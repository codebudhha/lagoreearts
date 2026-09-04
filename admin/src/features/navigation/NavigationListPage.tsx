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
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  useNavigations,
  useCreateNavigation,
  useDeleteNavigation,
  useUpdateNavigation,
} from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import {
  AdminNavigation,
  NavigationLocation,
  NavigationStatus,
  navigationLocations,
} from '../../lib/api/navigation';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  LayoutList,
} from 'lucide-react';

export const NavigationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('navigation.create');
  const canUpdate = hasPermission('navigation.update');
  const canDelete = hasPermission('navigation.delete');

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState<NavigationLocation>('HEADER');
  const [navToDelete, setNavToDelete] = useState<AdminNavigation | null>(null);

  const { data, isLoading, isError, error, refetch } = useNavigations({
    page,
    limit,
    search: search || undefined,
    location: locationFilter !== 'ALL' ? (locationFilter as NavigationLocation) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as NavigationStatus) : undefined,
  });

  const createMutation = useCreateNavigation();
  const deleteMutation = useDeleteNavigation();
  const updateMutation = useUpdateNavigation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await createMutation.mutateAsync({
      name: newName.trim(),
      location: newLocation,
      status: 'ACTIVE',
    });
    setIsCreateModalOpen(false);
    setNewName('');
    setNewLocation('HEADER');
    navigate(`/admin/navigation/${created.id}/edit`);
  };

  const handleConfirmDelete = async () => {
    if (!navToDelete) return;
    await deleteMutation.mutateAsync(navToDelete.id);
    setNavToDelete(null);
  };

  const handleToggleStatus = async (nav: AdminNavigation) => {
    await updateMutation.mutateAsync({
      id: nav.id,
      payload: {
        status: nav.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    });
  };

  const navigations = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="Navigation Menus"
        description="Configure header, footer, mobile, and secondary navigation menus for the storefront."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Navigation' },
        ]}
      >
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Navigation
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search navigation by name..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            aria-label="Filter by Location"
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40 text-xs"
          >
            <option value="ALL">All Locations</option>
            {navigationLocations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-36 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load navigations"
          message={(error as Error)?.message || 'An unexpected error occurred'}
          onRetry={refetch}
        />
      ) : navigations.length === 0 ? (
        <EmptyState
          icon={<LayoutList className="w-7 h-7 text-charcoal-400" />}
          title="No navigations found"
          description={
            search || locationFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try refining your search terms or filter criteria.'
              : 'Create your first navigation menu to organize storefront links.'
          }
          actionLabel={canCreate && !search && locationFilter === 'ALL' && statusFilter === 'ALL' ? 'Create First Navigation' : undefined}
          onAction={canCreate && !search && locationFilter === 'ALL' && statusFilter === 'ALL' ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {navigations.map((nav) => (
                  <tr
                    key={nav.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {nav.name}
                          </span>
                          {nav.isDefault && (
                            <Badge variant="champagne" size="sm">Default</Badge>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">
                          {nav.slug}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" size="sm">
                        {navigationLocations.find((l) => l.value === nav.location)?.label || nav.location}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={nav.status === 'ACTIVE' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {nav.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-0.5" />
                        )}
                        {nav.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-neutral-500">
                        {nav._count?.items ?? 0} items
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500">
                      {nav.updatedAt ? new Date(nav.updatedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/navigation/${nav.id}`)}
                          title="View Navigation"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </Button>

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/navigation/${nav.id}/edit`)}
                            title="Edit Navigation"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(nav)}
                            title={nav.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            className={nav.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                          >
                            {nav.status === 'ACTIVE' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {canDelete && !nav.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNavToDelete(nav)}
                            title="Delete Navigation"
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Navigation"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Navigation Name *
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Main Header Navigation"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Location *
            </label>
            <Select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value as NavigationLocation)}
              options={navigationLocations.map((l) => ({ value: l.value, label: l.label }))}
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
            <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
              {createMutation.isPending ? 'Creating...' : 'Create & Edit'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(navToDelete)}
        onClose={() => setNavToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Navigation"
        message={
          <span>
            Are you sure you want to delete <strong>"{navToDelete?.name}"</strong>? All menu items inside this navigation will also be deleted. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete Navigation"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
