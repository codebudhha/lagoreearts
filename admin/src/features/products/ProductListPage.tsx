import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterBar, FilterSelectConfig } from '../../components/ui/FilterBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { ProductStatusControl } from '../../components/products/ProductStatusControl';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useProductsList,
  useUpdateProductStatus,
  useUpdateProductFeatured,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { useCategoriesList } from '../../hooks/useCategories';
import { AdminProduct } from '../../lib/api/products';
import {
  Plus,
  Eye,
  Edit2,
  ExternalLink,
  Trash2,
  Star,
  Package,
} from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('product.create');
  const canUpdate = hasPermission('product.update');
  const canDelete = hasPermission('product.delete');

  // Filters & Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Row selection & delete modal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);

  // Queries
  const { data, isLoading, isError, error, refetch } = useProductsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    productType: typeFilter || undefined,
    categoryId: categoryFilter || undefined,
    isFeatured: featuredFilter === 'featured' ? true : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: categoriesData } = useCategoriesList({ limit: 100 });
  const categoriesList = categoriesData?.items || [];

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const updateFeaturedMutation = useUpdateProductFeatured();
  const deleteMutation = useDeleteProduct();

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const hasActiveFilters = Boolean(
    searchInput || statusFilter || typeFilter || categoryFilter || featuredFilter
  );

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setTypeFilter('');
    setCategoryFilter('');
    setFeaturedFilter('');
    setPage(1);
  };

  const selectFilters: FilterSelectConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'All Statuses',
        value: statusFilter,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Archived', value: 'ARCHIVED' },
        ],
        onChange: (val) => {
          setStatusFilter(val);
          setPage(1);
        },
      },
      {
        key: 'type',
        label: 'All Types',
        value: typeFilter,
        options: [
          { label: 'All Types', value: '' },
          { label: 'Simple Product', value: 'SIMPLE' },
          { label: 'Variable Product', value: 'VARIABLE' },
        ],
        onChange: (val) => {
          setTypeFilter(val);
          setPage(1);
        },
      },
      {
        key: 'category',
        label: 'All Categories',
        value: categoryFilter,
        options: [
          { label: 'All Categories', value: '' },
          ...categoriesList.map((c) => ({ label: c.name, value: c.id })),
        ],
        onChange: (val) => {
          setCategoryFilter(val);
          setPage(1);
        },
      },
      {
        key: 'featured',
        label: 'Merchandising',
        value: featuredFilter,
        options: [
          { label: 'All Merchandising', value: '' },
          { label: 'Featured Only', value: 'featured' },
        ],
        onChange: (val) => {
          setFeaturedFilter(val);
          setPage(1);
        },
      },
    ],
    [statusFilter, typeFilter, categoryFilter, featuredFilter, categoriesList]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    await deleteMutation.mutateAsync(productToDelete.id);
    setProductToDelete(null);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Products"
        description={`Manage your luxury catalog (${total} total products)`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Products' },
        ]}
      >
        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/products/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        )}
      </PageHeader>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        searchPlaceholder="Search by product name, SKU..."
        selectFilters={selectFilters}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
      />

      {/* Bulk Action Bar if items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-charcoal-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-sm animate-fade-in shadow-md">
          <span className="font-serif">
            <strong className="text-gold-400">{selectedIds.length}</strong> product
            {selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-charcoal-800"
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Main Table / Content */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8">
            <ErrorState
              title="Failed to load products"
              message={(error as any)?.message || 'An error occurred while fetching the catalog.'}
              onRetry={() => refetch()}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No products found"
              description={
                hasActiveFilters
                  ? 'No products matched your search filters. Try clearing some filters.'
                  : 'Start by creating your first luxury artwork or antique product.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : canCreate ? 'Add First Product' : undefined}
              onAction={
                hasActiveFilters
                  ? handleResetFilters
                  : canCreate
                  ? () => navigate('/admin/products/new')
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-serif text-sm">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50/60 text-xs font-semibold uppercase tracking-wider text-charcoal-600 font-sans">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === products.length && products.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        aria-label="Select all products"
                        className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                      />
                    </th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Inventory</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Featured</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {products.map((p) => {
                    const primaryImage =
                      p.media?.find((m) => m.isPrimary)?.url ||
                      p.media?.[0]?.url ||
                      p.image ||
                      p.thumbnail;

                    const isLowStock =
                      p.inventoryTracking !== false &&
                      p.stockQuantity <= (p.lowStockThreshold || 5);
                    const isOutOfStock = p.inventoryTracking !== false && p.stockQuantity === 0;

                    return (
                      <tr key={p.id} className="hover:bg-sand-50/50 transition-colors group">
                        {/* Selection checkbox */}
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                            aria-label={`Select ${p.name || p.title}`}
                            className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                          />
                        </td>

                        {/* Product info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-sand-100 border border-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {primaryImage ? (
                                <img
                                  src={primaryImage}
                                  alt={p.name || p.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-charcoal-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/products/${p.id}`}
                                className="font-semibold text-charcoal-900 hover:text-gold-700 transition-colors truncate block"
                              >
                                {p.name || p.title}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-charcoal-500 font-sans mt-0.5">
                                <span className="font-mono">{p.sku}</span>
                                {p.category && (
                                  <>
                                    <span>•</span>
                                    <span>{p.category.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Product Type */}
                        <td className="py-3.5 px-4">
                          <Badge variant={p.productType === 'VARIABLE' ? 'champagne' : 'secondary'} size="sm">
                            {p.productType}
                          </Badge>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-charcoal-900">
                            ₹{Number(p.price).toLocaleString('en-IN')}
                          </span>
                          {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                            <span className="block text-xs text-charcoal-400 line-through">
                              ₹{Number(p.compareAtPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>

                        {/* Inventory */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockQuantity} in stock
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <ProductStatusControl
                            status={p.status}
                            onChange={async (nextStatus) => {
                              await updateStatusMutation.mutateAsync({ id: p.id, status: nextStatus });
                            }}
                            size="sm"
                          />
                        </td>

                        {/* Merchandising Featured Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            disabled={!canUpdate}
                            onClick={() =>
                              updateFeaturedMutation.mutateAsync({
                                id: p.id,
                                isFeatured: !p.isFeatured,
                              })
                            }
                            aria-label={p.isFeatured ? 'Unmark featured' : 'Mark featured'}
                            className="p-1 rounded hover:bg-sand-100 transition-colors disabled:cursor-not-allowed"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                p.isFeatured
                                  ? 'fill-gold-500 text-gold-500'
                                  : 'text-charcoal-300 hover:text-gold-400'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/products/${p.id}`}
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canUpdate && (
                              <Link
                                to={`/admin/products/${p.id}/edit`}
                                className="p-1.5 text-charcoal-500 hover:text-gold-700 rounded hover:bg-sand-100 transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            )}
                            <Link
                              to={`/admin/products/${p.id}/preview`}
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-100 transition-colors"
                              title="Storefront Preview"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-charcoal-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden divide-y divide-sand-200">
              {products.map((p) => {
                const primaryImage =
                  p.media?.find((m) => m.isPrimary)?.url ||
                  p.media?.[0]?.url ||
                  p.image ||
                  p.thumbnail;

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-sand-100 border border-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={p.name || p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-charcoal-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="font-semibold text-charcoal-900 hover:text-gold-700 transition-colors text-sm truncate block"
                        >
                          {p.name || p.title}
                        </Link>
                        <p className="text-xs font-mono text-charcoal-500 mt-0.5">{p.sku}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-semibold text-charcoal-900 text-sm">
                            ₹{Number(p.price).toLocaleString('en-IN')}
                          </span>
                          <Badge variant={p.productType === 'VARIABLE' ? 'champagne' : 'secondary'} size="sm">
                            {p.productType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sand-100 text-xs">
                      <StatusBadge status={p.status} size="sm" />
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="px-2.5 py-1 text-xs border border-sand-300 rounded font-sans text-charcoal-700"
                        >
                          View
                        </Link>
                        {canUpdate && (
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="px-2.5 py-1 text-xs bg-charcoal-900 text-gold-400 rounded font-sans"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-sand-200 bg-sand-50/40">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={total}
                  pageSize={limit}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${productToDelete?.name || productToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
