import React, { useState } from 'react';
import { MediaAsset } from '../../lib/api/media';
import { useMediaList, useMediaFolders } from '../../hooks/useMedia';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { MediaUploader } from './MediaUploader';
import {
  Search,
  UploadCloud,
  Check,
  Folder,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

export interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'single' | 'multiple';
  value?: string | string[];
  onSelect: (selected: MediaAsset[] | MediaAsset) => void;
  title?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  mode = 'single',
  value,
  onSelect,
  title,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(18);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  // Initialize selected set from value
  const initialSet = new Set<string>();
  if (value) {
    if (Array.isArray(value)) {
      value.forEach((v) => initialSet.add(v));
    } else {
      initialSet.add(value);
    }
  }

  const [selectedMap, setSelectedMap] = useState<Map<string, MediaAsset>>(new Map());

  // Queries
  const { data: folders = [] } = useMediaFolders(undefined, isOpen);
  const { data: mediaData, isLoading, refetch } = useMediaList(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      folderId: selectedFolderId || undefined,
    },
    isOpen
  );

  const assets = mediaData?.media || [];
  const total = mediaData?.total || 0;
  const totalPages = mediaData?.totalPages || 1;

  const handleToggleAsset = (asset: MediaAsset) => {
    if (mode === 'single') {
      const newMap = new Map<string, MediaAsset>();
      newMap.set(asset.id, asset);
      setSelectedMap(newMap);
    } else {
      const newMap = new Map(selectedMap);
      if (newMap.has(asset.id)) {
        newMap.delete(asset.id);
      } else {
        newMap.set(asset.id, asset);
      }
      setSelectedMap(newMap);
    }
  };

  const handleConfirm = () => {
    const selectedList = Array.from(selectedMap.values());
    if (mode === 'single') {
      if (selectedList[0]) {
        onSelect(selectedList[0]);
      }
    } else {
      onSelect(selectedList);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (mode === 'single' ? 'Select Media Asset' : 'Select Media Assets')}
      size="xl"
    >
      <div className="flex flex-col h-[600px] font-sans -m-4">
        {/* Top Control Bar */}
        <div className="p-3 border-b border-sand-200 bg-sand-50/70 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search media by title or filename..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsUploaderOpen(true)}
            leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Upload New
          </Button>
        </div>

        {/* Main Body with Folders Sidebar + Assets Grid */}
        <div className="flex flex-1 min-h-0">
          {/* Folders Navigation */}
          <div className="w-48 border-r border-sand-200 p-2.5 bg-sand-50/40 overflow-y-auto space-y-1 text-xs select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 px-2 block mb-1">
              Folders
            </span>

            <div
              onClick={() => {
                setSelectedFolderId(null);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                selectedFolderId === null
                  ? 'bg-charcoal-900 text-white font-medium'
                  : 'text-charcoal-700 hover:bg-sand-100'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedFolderId === null ? 'text-gold-400' : 'text-gold-600'}`} />
              <span className="truncate">All Media</span>
            </div>

            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFolderId(f.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                  selectedFolderId === f.id
                    ? 'bg-charcoal-900 text-white font-medium'
                    : 'text-charcoal-700 hover:bg-sand-100'
                }`}
              >
                <Folder className={`w-3.5 h-3.5 ${selectedFolderId === f.id ? 'text-gold-400' : 'text-gold-600'}`} />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>

          {/* Media Grid Viewport */}
          <div className="flex-1 flex flex-col min-w-0 p-4 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-charcoal-500">
                Loading assets...
              </div>
            ) : assets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <ImageIcon className="w-10 h-10 text-charcoal-300 mb-2" />
                <p className="text-sm font-medium text-charcoal-700">No media found</p>
                <p className="text-xs text-charcoal-400 mt-1">
                  Upload images or select a different folder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {assets.map((asset) => {
                  const isSelected = selectedMap.has(asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleToggleAsset(asset)}
                      className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'border-gold-500 ring-2 ring-gold-400/40 shadow-sm'
                          : 'border-sand-200 hover:border-sand-400 hover:shadow-xs'
                      }`}
                    >
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.originalFilename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />

                      {/* Selection Badge */}
                      <div
                        className={`absolute top-1.5 left-1.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-gold-600 border-gold-600 text-white shadow-xs'
                            : 'bg-white/80 border-sand-300 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Title Bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-charcoal-950/70 p-1 backdrop-blur-xs">
                        <p className="text-[10px] text-sand-100 truncate text-center">
                          {asset.title || asset.originalFilename}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-sand-200">
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
        </div>

        {/* Bottom Confirm Bar */}
        <div className="p-3 border-t border-sand-200 bg-sand-50 flex items-center justify-between">
          <div className="text-xs text-charcoal-600">
            {selectedMap.size > 0 ? (
              <span className="font-medium text-charcoal-900">
                {selectedMap.size} asset{selectedMap.size > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>No asset selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={selectedMap.size === 0}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>

      {/* Embedded Uploader Modal */}
      <MediaUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        currentFolderId={selectedFolderId}
        folders={folders}
        onUploadComplete={() => {
          setIsUploaderOpen(false);
          refetch();
        }}
      />
    </Modal>
  );
};
