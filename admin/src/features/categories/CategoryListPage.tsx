import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { FilterBar, FilterSelectConfig } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { CategoryStatusBadge } from '../../components/categories/CategoryStatusBadge';
import { CategoryTree } from '../../components/categories/CategoryTree';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Skeleton } from '../../components/feedback/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCategoryTree,
  useCategoriesList,
  useDeleteCategory,
} from '../../hooks/useCategories';
import { AdminCategory } from '../../lib/api/categories';
import {
  Plus,
  FolderTree,
  List,
  Eye,
  Edit2,
  Trash2,
  Folder,
  Star,
} from 'lucide-react';

export const CategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('category.create');
  const canUpdate = hasPermission('category.update');
  const canDelete = hasPermission('category.delete');

  // View mode: 'tree' | 'table'
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  // Table state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [statusFilter, setStatusFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Queries
  const {
    data: treeData = [],
    isLoading: isLoadingTree,
    isError: isErrorTree,
    error: errorTree,
    refetch: refetchTree,
  } = useCategoryTree(viewMode === 'tree');

  const {
    data: listData,
    isLoading: isLoadingList,
    isError: isErrorList,
    error: errorList,
    refetch: refetchList,
  } = useCategoriesList(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      featured: featuredFilter === 'featured' ? true : undefined,
    },
    viewMode === 'table'
  );

  const deleteMutation = useDeleteCategory();

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch {
      // Handled by mutation hook toast
    }
  };

  const filterSelects: FilterSelectConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
    },
    {
      key: 'featured',
      label: 'Featured',
      value: featuredFilter,
      options: [
        { label: 'All Categories', value: '' },
        { label: 'Featured Only', value: 'featured' },
      ],
      onChange: (val) => {
        setFeaturedFilter(val);
        setPage(1);
      },
    },
  ];

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setFeaturedFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchInput || statusFilter || featuredFilter);

  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        description="Manage hierarchical taxonomy, catalog structure, and storefront merchandising."
      >
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-sand-200 p-0.5 rounded-lg border border-sand-300">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-charcoal-900 shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Hierarchy Tree View"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-charcoal-900 shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Flat Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/categories/new')}
              className="flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add Category</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Search categories by name, slug..."
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        selectFilters={filterSelects}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main View Area */}
      {viewMode === 'tree' ? (
        <div className="bg-sand-50/50 p-4 rounded-xl border border-sand-200">
          {isLoadingTree ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isErrorTree ? (
            <ErrorState
              title="Failed to load category hierarchy"
              message={(errorTree as any)?.message || 'Could not fetch category tree.'}
              onRetry={refetchTree}
            />
          ) : (
            <CategoryTree
              nodes={treeData}
              searchTerm={debouncedSearch}
              canEdit={canUpdate}
              canDelete={canDelete}
              canCreate={canCreate}
              onDeleteNode={(node) =>
                setCategoryToDelete({ id: node.id, name: node.name })
              }
            />
          )}
        </div>
      ) : (
        /* Table View */
        <div className="space-y-4">
          {isLoadingList ? (
            <div className="space-y-3 bg-white p-6 rounded-lg border border-sand-200">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isErrorList ? (
            <ErrorState
              title="Failed to load categories"
              message={(errorList as any)?.message || 'Could not fetch categories list.'}
              onRetry={refetchList}
            />
          ) : !listData?.items?.length ? (
            <EmptyState
              icon={<Folder className="w-10 h-10 text-charcoal-400" />}
              title="No Categories Found"
              description={
                hasActiveFilters
                  ? 'No categories match your filter criteria. Try clearing search filters.'
                  : 'Start building your store taxonomy by adding your first category.'
              }
              actionLabel={canCreate && !hasActiveFilters ? 'Add Category' : undefined}
              onAction={canCreate && !hasActiveFilters ? () => navigate('/admin/categories/new') : undefined}
            />
          ) : (
            <div className="bg-white rounded-lg border border-sand-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sand-200 text-left text-sm">
                  <thead className="bg-sand-50 text-xs font-semibold text-charcoal-600 uppercase tracking-wider font-sans">
                    <tr>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Parent</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sort Order</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 font-serif">
                    {listData.items.map((cat: AdminCategory) => (
                      <tr key={cat.id} className="hover:bg-sand-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Folder className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
                            <Link
                              to={`/admin/categories/${cat.id}`}
                              className="font-medium text-charcoal-900 hover:text-gold-700 transition-colors"
                            >
                              {cat.name}
                            </Link>
                            {cat.isFeatured && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-charcoal-500">
                          {cat.slug}
                        </td>
                        <td className="py-3 px-4 text-xs text-charcoal-600 font-sans">
                          {cat.parent ? (
                            <Link
                              to={`/admin/categories/${cat.parent.id}`}
                              className="hover:text-gold-600 underline decoration-sand-300"
                            >
                              {cat.parent.name}
                            </Link>
                          ) : (
                            <span className="text-charcoal-400 italic">Root Level</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <CategoryStatusBadge
                            status={cat.status}
                            isFeatured={cat.isFeatured}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                          {cat.sortOrder ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Link
                            to={`/admin/categories/${cat.id}`}
                            className="inline-flex p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canUpdate && (
                            <Link
                              to={`/admin/categories/${cat.id}/edit`}
                              className="inline-flex p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setCategoryToDelete({ id: cat.id, name: cat.name })
                              }
                              className="inline-flex p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {listData.pagination && (
                <div className="p-4 border-t border-sand-200">
                  <Pagination
                    currentPage={listData.pagination.page}
                    totalPages={listData.pagination.totalPages}
                    totalItems={listData.pagination.total}
                    pageSize={listData.pagination.limit}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? You cannot delete a category if it has subcategories or assigned products.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
