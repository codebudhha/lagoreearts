import React, { useState } from 'react';
import { useCollectionsList } from '../../hooks/useCollections';
import { AdminCollection } from '../../lib/api/collections';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { Pagination } from '../ui/Pagination';
import { Skeleton } from '../feedback/Skeleton';
import { Layers, Check } from 'lucide-react';

interface CollectionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCollections: (collectionIds: string[]) => void;
  alreadyAssignedIds?: string[];
  title?: string;
  multiSelect?: boolean;
}

export const CollectionPickerModal: React.FC<CollectionPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCollections,
  alreadyAssignedIds = [],
  title = 'Select Curated Collections',
  multiSelect = true,
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useCollectionsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: 'ACTIVE',
  });

  const collections: AdminCollection[] = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 };

  const handleToggle = (id: string) => {
    if (alreadyAssignedIds.includes(id)) return;

    if (!multiSelect) {
      setSelectedIds(new Set([id]));
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    onSelectCollections(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search collections by title, editorial theme..."
        />

        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8 bg-sand-50 rounded-lg border border-sand-200">
            <Layers className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
            <p className="text-xs text-charcoal-500 font-sans">No active collections found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
            {collections.map((col) => {
              const isAssigned = alreadyAssignedIds.includes(col.id);
              const isSelected = selectedIds.has(col.id);

              return (
                <div
                  key={col.id}
                  onClick={() => handleToggle(col.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isAssigned
                      ? 'bg-sand-100 border-sand-300 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-champagne-50 border-champagne-500 ring-2 ring-champagne-200'
                      : 'bg-white border-sand-200 hover:border-sand-300 hover:bg-sand-50/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {col.image ? (
                      <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-5 h-5 text-charcoal-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 font-serif truncate">{col.name}</p>
                    <p className="text-[11px] text-charcoal-500 truncate font-mono">
                      {isAssigned ? 'Already added' : `${col.productCount || 0} artworks`}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isAssigned
                        ? 'bg-sand-300 border-sand-400 text-charcoal-500'
                        : isSelected
                        ? 'bg-champagne-600 border-champagne-600 text-white'
                        : 'border-sand-300 bg-white'
                    }`}
                  >
                    {(isAssigned || isSelected) && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            Assign Selected ({selectedIds.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
