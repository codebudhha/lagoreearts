import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { FilterBar, FilterSelectConfig } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { CollectionStatusBadge } from '../../components/collections/CollectionStatusBadge';
import { CollectionTypeBadge } from '../../components/collections/CollectionTypeBadge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Skeleton } from '../../components/feedback/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCollectionsList,
  useDeleteCollection,
  useUpdateCollectionSort,
} from '../../hooks/useCollections';
import { AdminCollection } from '../../lib/api/collections';
import {
  Plus,
  Layers,
  Eye,
  Edit2,
  Trash2,
  Package,
  Sparkles,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

export const CollectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('collections.create') || hasPermission('collection.create');
  const canUpdate = hasPermission('collections.update') || hasPermission('collection.update');
  const canDelete = hasPermission('collections.delete') || hasPermission('collection.delete');

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'createdAt' | 'updatedAt'>('sortOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal / Action State
  const [collectionToDelete, setCollectionToDelete] = useState<AdminCollection | null>(null);
  const [editingSortCollection, setEditingSortCollection] = useState<{ id: string; name: string; sortOrder: number } | null>(null);

  // Queries
  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCollectionsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    featured: featuredFilter === 'featured' ? true : featuredFilter === 'standard' ? false : undefined,
    sort: sortBy,
    order: sortOrder,
  });

  const deleteMutation = useDeleteCollection();
  const updateSortMutation = useUpdateCollectionSort();

  const selectFilters: FilterSelectConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      value: typeFilter,
      onChange: (val) => {
        setTypeFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Types', value: '' },
        { label: 'Manual Collections', value: 'MANUAL' },
        { label: 'System Collections', value: 'SYSTEM' },
      ],
    },
    {
      key: 'featured',
      label: 'Curation',
      value: featuredFilter,
      onChange: (val) => {
        setFeaturedFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Curation', value: '' },
        { label: 'Featured Collections', value: 'featured' },
        { label: 'Standard Collections', value: 'standard' },
      ],
    },
  ];

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setTypeFilter('');
    setFeaturedFilter('');
    setSortBy('sortOrder');
    setSortOrder('asc');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    if (collectionToDelete.type === 'SYSTEM') return;

    try {
      await deleteMutation.mutateAsync(collectionToDelete.id);
      setCollectionToDelete(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleSaveSort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSortCollection) return;

    try {
      await updateSortMutation.mutateAsync({
        id: editingSortCollection.id,
        sortOrder: Number(editingSortCollection.sortOrder),
      });
      setEditingSortCollection(null);
    } catch {
      // Handled by hook toast
    }
  };

  const collections = listData?.items || [];
  const pagination = listData?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="Collections"
        description="Curate and manage thematic product groupings, featured showcases, and heritage catalogs."
        breadcrumbs={[{ label: 'Collections' }]}
      >
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => navigate('/admin/collections/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Collection
          </Button>
        )}
      </PageHeader>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          searchPlaceholder="Search collections by name, slug or description..."
          searchValue={searchInput}
          onSearchChange={(val) => {
            setSearchInput(val);
            setPage(1);
          }}
          selectFilters={selectFilters}
          onReset={handleResetFilters}
        />
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-sand-300 p-6 space-y-4">
          <div className="h-6 w-48 bg-sand-200 rounded animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load collections"
          message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
          onRetry={refetch}
        />
      ) : collections.length === 0 ? (
        <EmptyState
          title="No collections found"
          description={
            searchInput || statusFilter || typeFilter || featuredFilter
              ? 'No collections match your current filter criteria. Try adjusting your search or filters.'
              : 'Create your first collection to group and showcase artworks on your storefront.'
          }
          actionLabel={canCreate ? 'Create Collection' : undefined}
          onAction={canCreate ? () => navigate('/admin/collections/new') : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sand-50/80 border-b border-sand-300 text-xs font-semibold text-charcoal-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Collection</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === 'sortOrder') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('sortOrder');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-charcoal-900 transition-colors uppercase"
                    >
                      <span>Sort Order</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === 'updatedAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('updatedAt');
                          setSortOrder('desc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-charcoal-900 transition-colors uppercase"
                    >
                      <span>Updated</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-sm">
                {collections.map((col) => (
                  <tr
                    key={col.id}
                    className="hover:bg-sand-50/50 transition-colors group font-sans"
                  >
                    {/* Collection Name & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-sand-300 bg-sand-100 flex-shrink-0 overflow-hidden relative">
                          {col.image || col.bannerImage ? (
                            <img
                              src={col.image || col.bannerImage || ''}
                              alt={col.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/admin/collections/${col.id}`}
                            className="font-medium text-charcoal-900 hover:text-gold-700 transition-colors line-clamp-1"
                          >
                            {col.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-500 font-mono">
                            <span>/{col.slug}</span>
                            {col.isFeatured && (
                              <span className="inline-flex items-center gap-0.5 text-gold-600 font-sans font-semibold">
                                • <Sparkles className="w-3 h-3 inline" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <CollectionTypeBadge type={col.type} />
                    </td>

                    {/* Assigned Products Count */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/collections/${col.id}`}
                        className="inline-flex items-center gap-1.5 text-charcoal-700 hover:text-gold-700 font-medium font-mono text-xs"
                      >
                        <Package className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{col.productCount ?? 0}</span>
                      </Link>
                    </td>

                    {/* Sort Order */}
                    <td className="py-3.5 px-4">
                      {canUpdate ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSortCollection({
                              id: col.id,
                              name: col.name,
                              sortOrder: col.sortOrder || 0,
                            })
                          }
                          className="font-mono text-xs text-charcoal-700 hover:text-gold-700 hover:underline px-1.5 py-0.5 rounded border border-transparent hover:border-sand-300"
                          title="Click to edit sort position"
                        >
                          #{col.sortOrder ?? 0}
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-charcoal-600">
                          #{col.sortOrder ?? 0}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <CollectionStatusBadge
                        status={col.status}
                        isFeatured={col.isFeatured}
                      />
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-xs text-charcoal-500">
                      {new Date(col.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/collections/${col.id}`)}
                          className="!p-1.5 text-charcoal-500 hover:text-charcoal-900"
                          title="View Collection Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/collections/${col.id}/edit`)}
                            className="!p-1.5 text-charcoal-500 hover:text-gold-700"
                            title="Edit Collection"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}

                        {canDelete && (
                          col.type === 'SYSTEM' ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 text-sand-400 cursor-not-allowed"
                              title="System collections cannot be deleted"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCollectionToDelete(col)}
                              className="!p-1.5 text-charcoal-500 hover:text-terracotta-600"
                              title="Delete Collection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-sand-300">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(collectionToDelete)}
        title={`Delete "${collectionToDelete?.name}"?`}
        message="Are you sure you want to delete this collection? Assigned products will NOT be deleted, but they will no longer be linked to this collection curation."
        confirmLabel="Delete Collection"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setCollectionToDelete(null)}
      />

      {/* Quick Edit Sort Order Modal */}
      {editingSortCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-sand-300 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-semibold text-charcoal-900 mb-1">
              Update Merchandising Sort Position
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              Set display sequence for <strong>{editingSortCollection.name}</strong>. Lower numbers appear first in catalog listings.
            </p>

            <form onSubmit={handleSaveSort} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Sort Order Number
                </label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={editingSortCollection.sortOrder}
                  onChange={(e) =>
                    setEditingSortCollection({
                      ...editingSortCollection,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSortCollection(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateSortMutation.isPending}
                >
                  Save Sort Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
