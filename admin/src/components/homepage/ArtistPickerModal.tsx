import React, { useState } from 'react';
import { useArtists } from '../../hooks/useArtists';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { Pagination } from '../ui/Pagination';
import { Skeleton } from '../feedback/Skeleton';
import { Palette, Check } from 'lucide-react';

interface ArtistPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtists: (artistIds: string[]) => void;
  alreadyAssignedIds?: string[];
  title?: string;
  multiSelect?: boolean;
}

export const ArtistPickerModal: React.FC<ArtistPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectArtists,
  alreadyAssignedIds = [],
  title = 'Select Master Makers & Artists',
  multiSelect = true,
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useArtists({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: 'ACTIVE',
  });

  const artists = data?.data || [];
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
    onSelectArtists(Array.from(selectedIds));
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
          placeholder="Search artists by name, tradition, region..."
        />

        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-8 bg-sand-50 rounded-lg border border-sand-200">
            <Palette className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
            <p className="text-xs text-charcoal-500 font-sans">No active artists found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
            {artists.map((artist) => {
              const isAssigned = alreadyAssignedIds.includes(artist.id);
              const isSelected = selectedIds.has(artist.id);

              return (
                <div
                  key={artist.id}
                  onClick={() => handleToggle(artist.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isAssigned
                      ? 'bg-sand-100 border-sand-300 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-champagne-50 border-champagne-500 ring-2 ring-champagne-200'
                      : 'bg-white border-sand-200 hover:border-sand-300 hover:bg-sand-50/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-charcoal-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 font-serif truncate">{artist.name}</p>
                    <p className="text-[11px] text-charcoal-500 truncate font-mono">
                      {isAssigned ? 'Already added' : artist.tradition || artist.nationality || 'Artisan Guild'}
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
