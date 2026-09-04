import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCollectionProducts,
  useAssignProductToCollection,
  useRemoveProductFromCollection,
} from '../../hooks/useCollections';
import { AdminProduct } from '../../lib/api/products';
import { ProductPicker } from './ProductPicker';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Plus,
  Trash2,
  Package,
  Eye,
} from 'lucide-react';

export interface CollectionProductManagerProps {
  collectionId: string;
  collectionName?: string;
  readOnly?: boolean;
}

export const CollectionProductManager: React.FC<CollectionProductManagerProps> = ({
  collectionId,
  collectionName,
  readOnly = false,
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError, refetch } = useCollectionProducts(collectionId, {
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const assignMutation = useAssignProductToCollection();
  const removeMutation = useRemoveProductFromCollection();

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const assignedProductIds = React.useMemo(() => {
    return new Set(products.map((p) => p.id));
  }, [products]);

  const handleAddProducts = async (productIds: string[]) => {
    for (const pid of productIds) {
      await assignMutation.mutateAsync({
        collectionId,
        productId: pid,
      });
    }
  };

  const handleConfirmRemove = async () => {
    if (!productToRemove) return;
    try {
      await removeMutation.mutateAsync({
        collectionId,
        productId: productToRemove.id,
      });
      setProductToRemove(null);
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-serif font-semibold text-charcoal-900">
            Assigned Products ({total})
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Products curated and displayed within this storefront collection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!readOnly && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add Products</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search within Assigned */}
      <div className="max-w-md">
        <SearchInput
          value={searchInput}
          onChange={(val) => {
            setSearchInput(val);
            setPage(1);
          }}
          placeholder="Filter assigned products..."
          size="sm"
        />
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3 bg-white p-6 rounded-lg border border-sand-200">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-sand-50 rounded-lg text-charcoal-600">
          <p className="text-sm font-serif">Failed to load assigned products.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10 text-charcoal-400" />}
          title={searchInput ? 'No Matching Products' : 'No Products in Collection'}
          description={
            searchInput
              ? 'No products in this collection match your search query.'
              : 'Add products to this curated collection to display them together on the storefront.'
          }
          actionLabel={!readOnly && !searchInput ? 'Add Products' : undefined}
          onAction={!readOnly && !searchInput ? () => setIsPickerOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg border border-sand-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sand-200 text-left text-sm">
              <thead className="bg-sand-50 text-xs font-semibold text-charcoal-600 uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 font-serif">
                {products.map((prod: AdminProduct) => {
                  const primaryImage =
                    prod.media?.find((m) => m.isPrimary)?.url || prod.thumbnail || prod.image || (prod.media && prod.media[0]?.url);

                  return (
                    <tr key={prod.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded border border-sand-200 overflow-hidden bg-sand-100 flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="truncate max-w-xs">
                            <Link
                              to={`/admin/products/${prod.id}`}
                              className="font-medium text-charcoal-900 hover:text-gold-700 transition-colors truncate block"
                            >
                              {prod.name}
                            </Link>
                            {prod.category && (
                              <span className="text-xs text-charcoal-500 font-sans">
                                {prod.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                        {prod.sku || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-800">
                        ₹{prod.price ? Number(prod.price).toLocaleString('en-IN') : '0'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={prod.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link
                          to={`/admin/products/${prod.id}`}
                          className="inline-flex p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                          title="View Product"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => setProductToRemove(prod)}
                            className="inline-flex p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remove from Collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-sand-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Product Picker Modal */}
      <ProductPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectProducts={handleAddProducts}
        alreadyAssignedProductIds={assignedProductIds}
        isLoadingAction={assignMutation.isPending}
      />

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToRemove)}
        onClose={() => setProductToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Product from Collection"
        message={
          <div>
            <p>
              Are you sure you want to remove <strong>"{productToRemove?.name}"</strong> from{' '}
              {collectionName ? <strong>"{collectionName}"</strong> : 'this collection'}?
            </p>
            <p className="text-xs text-charcoal-500 mt-2">
              Note: This will only remove the curation assignment. The product entity and catalog inventory remain completely intact.
            </p>
          </div>
        }
        confirmLabel="Remove Product"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
};
