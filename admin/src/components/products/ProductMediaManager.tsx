import React, { useState } from 'react';
import {
  useProductMedia,
  useAttachProductMedia,
  useDetachProductMedia,
  useReorderProductMedia,
  useUploadMedia,
  useMediaLibrary,
} from '../../hooks/useProductMedia';
import { AttachedMedia, MediaAsset } from '../../lib/api/media';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import {
  ImagePlus,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Check,
  Search,
} from 'lucide-react';

export interface ProductMediaManagerProps {
  productId?: string;
  temporaryMedia?: Array<{ id: string; url: string; isPrimary: boolean; altText?: string }>;
  onTemporaryMediaChange?: (
    media: Array<{ id: string; url: string; isPrimary: boolean; altText?: string }>
  ) => void;
  disabled?: boolean;
}

export const ProductMediaManager: React.FC<ProductMediaManagerProps> = ({
  productId,
  temporaryMedia,
  onTemporaryMediaChange,
  disabled = false,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Queries & Mutations for saved product
  const { data: serverMedia = [], isLoading: isLoadingMedia } = useProductMedia(
    productId || '',
    Boolean(productId)
  );

  const attachMutation = useAttachProductMedia();
  const detachMutation = useDetachProductMedia();
  const reorderMutation = useReorderProductMedia();
  const uploadMutation = useUploadMedia();

  const { data: libraryData, isLoading: isLoadingLibrary } = useMediaLibrary({
    search: searchQuery || undefined,
  });

  const mediaList: AttachedMedia[] = productId
    ? serverMedia
    : (temporaryMedia || []).map((m, idx) => ({
        id: m.id,
        mediaId: m.id,
        url: m.url,
        isPrimary: m.isPrimary,
        altText: m.altText,
        sortOrder: idx + 1,
      }));

  const handleSetPrimary = async (item: AttachedMedia) => {
    if (disabled) return;
    if (productId) {
      // Re-order so primary is first and attach as primary
      await attachMutation.mutateAsync({
        productId,
        payload: { mediaId: item.mediaId, isPrimary: true },
      });
    } else if (onTemporaryMediaChange && temporaryMedia) {
      const updated = temporaryMedia.map((m) => ({
        ...m,
        isPrimary: m.id === item.id,
      }));
      onTemporaryMediaChange(updated);
    }
  };

  const handleMove = async (index: number, direction: 'left' | 'right') => {
    if (disabled) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const newList = [...mediaList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    if (productId) {
      const mediaIds = newList.map((m) => m.mediaId);
      await reorderMutation.mutateAsync({ productId, mediaIds });
    } else if (onTemporaryMediaChange) {
      onTemporaryMediaChange(
        newList.map((m) => ({
          id: m.id,
          url: m.url,
          isPrimary: m.isPrimary,
          altText: m.altText || undefined,
        }))
      );
    }
  };

  const handleDetach = async (mediaId: string) => {
    if (disabled) return;
    if (productId) {
      await detachMutation.mutateAsync({ productId, mediaId });
    } else if (onTemporaryMediaChange && temporaryMedia) {
      const filtered = temporaryMedia.filter((m) => m.id !== mediaId);
      if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      onTemporaryMediaChange(filtered);
    }
    setMediaToDelete(null);
  };

  const handleSelectFromLibrary = async (asset: MediaAsset) => {
    if (productId) {
      await attachMutation.mutateAsync({
        productId,
        payload: {
          mediaId: asset.id,
          isPrimary: mediaList.length === 0,
        },
      });
    } else if (onTemporaryMediaChange) {
      const current = temporaryMedia || [];
      const isFirst = current.length === 0;
      onTemporaryMediaChange([
        ...current,
        {
          id: asset.id,
          url: asset.url,
          isPrimary: isFirst,
          altText: asset.altText || undefined,
        },
      ]);
    }
    setIsLibraryOpen(false);
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const asset = await uploadMutation.mutateAsync({ file });
      if (productId) {
        await attachMutation.mutateAsync({
          productId,
          payload: {
            mediaId: asset.id,
            isPrimary: mediaList.length === 0,
          },
        });
      } else if (onTemporaryMediaChange) {
        const current = temporaryMedia || [];
        onTemporaryMediaChange([
          ...current,
          {
            id: asset.id,
            url: asset.url,
            isPrimary: current.length === 0,
          },
        ]);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-charcoal-900 font-sans">Product Gallery & Imagery</h4>
          <p className="text-xs text-charcoal-500 font-sans">
            Add high-resolution product photos. The primary image is shown in catalogs and search.
          </p>
        </div>
        {!disabled && (
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-sand-300 bg-white text-charcoal-700 hover:bg-sand-50 transition-colors shadow-sm">
              <UploadCloud className="w-3.5 h-3.5 text-gold-600" />
              <span>{uploading ? 'Uploading...' : 'Direct Upload'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleDirectUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLibraryOpen(true)}
              leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
            >
              Media Library
            </Button>
          </div>
        )}
      </div>

      {/* Grid of attached media */}
      {isLoadingMedia ? (
        <div className="py-8 text-center text-sm text-charcoal-500 font-sans">Loading media...</div>
      ) : mediaList.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-sand-300 p-8 text-center bg-sand-50/50">
          <ImagePlus className="mx-auto w-10 h-10 text-charcoal-400 mb-2" />
          <p className="text-sm font-medium text-charcoal-700">No images attached yet</p>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
            Upload product imagery or select from existing assets in your Media Library.
          </p>
          {!disabled && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsLibraryOpen(true)}
                leftIcon={<ImagePlus className="w-4 h-4" />}
              >
                Browse Media Library
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaList.map((item, index) => (
            <div
              key={item.id || item.mediaId}
              className={`group relative rounded-lg border bg-white overflow-hidden shadow-sm transition-all hover:shadow-md ${
                item.isPrimary ? 'border-gold-500 ring-2 ring-gold-400/30' : 'border-sand-200'
              }`}
            >
              {/* Image preview */}
              <div className="aspect-square bg-sand-100 relative overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.altText || `Product Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {item.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="champagne" size="sm" className="shadow-sm">
                      <Star className="w-3 h-3 mr-1 fill-gold-500" />
                      Primary
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action bar */}
              {!disabled && (
                <div className="p-2 bg-sand-50/80 border-t border-sand-200 flex items-center justify-between text-xs">
                  {/* Reordering */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'left')}
                      aria-label="Move left"
                      className="p-1 text-charcoal-500 hover:text-charcoal-900 disabled:opacity-30 rounded hover:bg-sand-200"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === mediaList.length - 1}
                      onClick={() => handleMove(index, 'right')}
                      aria-label="Move right"
                      className="p-1 text-charcoal-500 hover:text-charcoal-900 disabled:opacity-30 rounded hover:bg-sand-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary & Delete */}
                  <div className="flex items-center gap-1">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(item)}
                        aria-label="Set as primary image"
                        className="px-1.5 py-0.5 text-[10px] font-medium text-charcoal-600 hover:text-gold-700 bg-white border border-sand-300 rounded hover:border-gold-400"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaToDelete(item.mediaId)}
                      aria-label="Remove image"
                      className="p-1 text-charcoal-400 hover:text-rose-600 rounded hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media Library Picker Modal */}
      <Modal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        size="lg"
        title="Select Media Asset"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library assets..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingLibrary ? (
              <div className="py-12 text-center text-sm text-charcoal-500 font-sans">
                Loading library assets...
              </div>
            ) : (libraryData?.media || []).length === 0 ? (
              <div className="py-12 text-center text-sm text-charcoal-500 font-sans">
                No media assets found in library.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
                {(libraryData?.media || []).map((asset) => {
                  const isAttached = mediaList.some((m) => m.mediaId === asset.id || m.id === asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => !isAttached && handleSelectFromLibrary(asset)}
                      className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer group transition-all ${
                        isAttached
                          ? 'border-gold-500 opacity-60 cursor-default'
                          : 'border-sand-200 hover:border-gold-500 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.altText || asset.originalFilename}
                        className="w-full h-full object-cover"
                      />
                      {isAttached && (
                        <div className="absolute inset-0 bg-charcoal-900/40 flex items-center justify-center text-white">
                          <Check className="w-6 h-6 text-gold-400" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{asset.originalFilename}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete / Detach Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(mediaToDelete)}
        onClose={() => setMediaToDelete(null)}
        onConfirm={() => {
          if (mediaToDelete) handleDetach(mediaToDelete);
        }}
        title="Detach Product Image"
        message="Are you sure you want to remove this image from the product? The asset will remain in your Media Library."
        confirmLabel="Remove Image"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
