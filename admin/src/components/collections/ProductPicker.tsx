import React, { useState } from 'react';
import { useProductsList } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminProduct } from '../../lib/api/products';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../feedback/Skeleton';
import { Package, AlertCircle } from 'lucide-react';

export interface ProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducts: (productIds: string[]) => Promise<void> | void;
  alreadyAssignedProductIds?: Set<string> | string[];
  isLoadingAction?: boolean;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  isOpen,
  onClose,
  onSelectProducts,
  alreadyAssignedProductIds = new Set(),
  isLoadingAction = false,
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const assignedSet = React.useMemo(() => {
    if (alreadyAssignedProductIds instanceof Set) {
      return alreadyAssignedProductIds;
    }
    return new Set(alreadyAssignedProductIds);
  }, [alreadyAssignedProductIds]);

  const { data, isLoading, isError } = useProductsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const products = data?.products || [];
  const pagination = {
    page: data?.page || page,
    totalPages: data?.totalPages || 1,
    total: data?.total || 0,
    limit,
  };

  const toggleProduct = (id: string) => {
    if (assignedSet.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    const assignable = products.filter((p) => !assignedSet.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of assignable) {
        next.add(p.id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    await onSelectProducts(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Products to Collection"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-charcoal-600 font-sans">
            {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoadingAction}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || isLoadingAction}
              isLoading={isLoadingAction}
            >
              Add Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Bar & Quick Multi-select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchInput}
              onChange={(val) => {
                setSearchInput(val);
                setPage(1);
              }}
              placeholder="Search products by title, SKU..."
              size="sm"
            />
          </div>
          <div className="flex items-center space-x-2 text-xs font-sans flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllVisible}
              className="text-xs h-8 text-charcoal-700 hover:text-charcoal-900"
            >
              Select All Page
            </Button>
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-xs h-8 text-rose-600 hover:text-rose-700"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Product Items List */}
        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center bg-sand-50 rounded-lg text-charcoal-600">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm font-serif">Failed to load product catalog.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center bg-sand-50 rounded-lg text-charcoal-500">
            <Package className="w-8 h-8 mx-auto text-charcoal-400 mb-2 opacity-60" />
            <p className="text-sm font-serif">No assignable products found.</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-200 border border-sand-200 rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
            {products.map((prod: AdminProduct) => {
              const isAlreadyAssigned = assignedSet.has(prod.id);
              const isSelected = selectedIds.has(prod.id);
              const primaryImage =
                prod.media?.find((m) => m.isPrimary)?.url || prod.thumbnail || prod.image || (prod.media && prod.media[0]?.url);

              return (
                <div
                  key={prod.id}
                  onClick={() => !isAlreadyAssigned && toggleProduct(prod.id)}
                  className={`p-3 flex items-center justify-between transition-colors ${
                    isAlreadyAssigned
                      ? 'bg-sand-50/70 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-50/60 cursor-pointer'
                      : 'hover:bg-sand-50/80 cursor-pointer bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected || isAlreadyAssigned}
                      disabled={isAlreadyAssigned}
                      onChange={() => toggleProduct(prod.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-gold-600 rounded border-sand-300 focus:ring-gold-500 disabled:opacity-50 flex-shrink-0"
                    />

                    {/* Image Thumbnail */}
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

                    {/* Title & SKU */}
                    <div className="truncate">
                      <p className="text-sm font-serif font-medium text-charcoal-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-xs text-charcoal-500 font-mono">
                        SKU: {prod.sku || 'N/A'} • ₹{prod.price ? Number(prod.price).toLocaleString('en-IN') : '0'}
                      </p>
                    </div>
                  </div>

                  {/* Status / Assigned Badge */}
                  <div className="flex items-center space-x-2 flex-shrink-0 pl-3">
                    {isAlreadyAssigned ? (
                      <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-sand-200 text-charcoal-700">
                        Already in Collection
                      </span>
                    ) : (
                      <StatusBadge status={prod.status} size="sm" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pt-2">
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
    </Modal>
  );
};
