import React, { useState } from 'react';
import {
  useCollectionMedia,
  useAttachCollectionMedia,
  useDetachCollectionMedia,
  useReorderCollectionMedia,
} from '../../hooks/useCollections';
import { useUploadMedia, useMediaLibrary } from '../../hooks/useProductMedia';
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
  Search,
  ImageIcon,
  LayoutTemplate,
} from 'lucide-react';

export interface CollectionMediaManagerProps {
  collectionId?: string;
  coverImage?: string;
  bannerImage?: string;
  onCoverImageChange?: (url: string) => void;
  onBannerImageChange?: (url: string) => void;
  disabled?: boolean;
}

export const CollectionMediaManager: React.FC<CollectionMediaManagerProps> = ({
  collectionId,
  coverImage = '',
  bannerImage = '',
  onCoverImageChange,
  onBannerImageChange,
  disabled = false,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<'cover' | 'banner' | 'gallery'>('cover');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Queries & Mutations for collection gallery
  const { data: serverMedia = [], isLoading: isLoadingMedia } = useCollectionMedia(
    collectionId || '',
    Boolean(collectionId)
  );

  const attachMutation = useAttachCollectionMedia();
  const detachMutation = useDetachCollectionMedia();
  const reorderMutation = useReorderCollectionMedia();
  const uploadMutation = useUploadMedia();

  const { data: libraryData, isLoading: isLoadingLibrary } = useMediaLibrary({
    search: searchQuery || undefined,
  });

  const handleOpenLibrary = (target: 'cover' | 'banner' | 'gallery') => {
    if (disabled) return;
    setLibraryTarget(target);
    setIsLibraryOpen(true);
  };

  const handleSelectFromLibrary = async (asset: MediaAsset) => {
    if (libraryTarget === 'cover') {
      onCoverImageChange?.(asset.url);
    } else if (libraryTarget === 'banner') {
      onBannerImageChange?.(asset.url);
    } else if (libraryTarget === 'gallery' && collectionId) {
      await attachMutation.mutateAsync({
        collectionId,
        payload: {
          mediaId: asset.id,
          isPrimary: serverMedia.length === 0,
        },
      });
    }
    setIsLibraryOpen(false);
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'banner' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    try {
      setUploading(true);
      const asset = await uploadMutation.mutateAsync({ file });
      if (target === 'cover') {
        onCoverImageChange?.(asset.url);
      } else if (target === 'banner') {
        onBannerImageChange?.(asset.url);
      } else if (target === 'gallery' && collectionId) {
        await attachMutation.mutateAsync({
          collectionId,
          payload: {
            mediaId: asset.id,
            isPrimary: serverMedia.length === 0,
          },
        });
      }
    } finally {
      setUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (item: AttachedMedia) => {
    if (disabled || !collectionId) return;
    await attachMutation.mutateAsync({
      collectionId,
      payload: { mediaId: item.mediaId, isPrimary: true },
    });
    if (onCoverImageChange) {
      onCoverImageChange(item.url);
    }
  };

  const handleMove = async (index: number, direction: 'left' | 'right') => {
    if (disabled || !collectionId) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= serverMedia.length) return;

    const newList = [...serverMedia];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const mediaOrders = newList.map((m, idx) => ({ mediaId: m.mediaId, sortOrder: idx + 1 }));
    await reorderMutation.mutateAsync({ collectionId, mediaOrders });
  };

  const handleDetach = async (mediaId: string) => {
    if (disabled || !collectionId) return;
    await detachMutation.mutateAsync({ collectionId, mediaId });
    setMediaToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Primary Visual Assets (Cover & Banner) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cover Image */}
        <div className="p-4 border border-sand-300 rounded-lg bg-sand-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-gold-600" />
                Cover Thumbnail (Card Image)
              </label>
              {coverImage && (
                <Badge variant="champagne" size="sm">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-charcoal-500 mb-3">
              Used on listing cards, homepage feature grids, and navigation cards. Recommended: 800x800px (1:1).
            </p>

            {coverImage ? (
              <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg border border-sand-300 overflow-hidden bg-white shadow-sm group">
                <img
                  src={coverImage}
                  alt="Collection Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {!disabled && (
                  <div className="absolute inset-0 bg-charcoal-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onCoverImageChange?.('')}
                      className="!p-1.5"
                      title="Remove Cover Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg border-2 border-dashed border-sand-300 flex flex-col items-center justify-center p-4 text-center bg-white">
                <ImageIcon className="w-8 h-8 text-charcoal-300 mb-2" />
                <span className="text-xs text-charcoal-500">No cover image chosen</span>
              </div>
            )}
          </div>

          {!disabled && (
            <div className="mt-4 pt-3 border-t border-sand-200 flex items-center justify-between gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-sand-300 bg-white text-charcoal-700 hover:bg-sand-50 transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-gold-600" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDirectUpload(e, 'cover')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenLibrary('cover')}
                leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
              >
                Media Library
              </Button>
            </div>
          )}
        </div>

        {/* Hero Banner Image */}
        <div className="p-4 border border-sand-300 rounded-lg bg-sand-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-gold-600" />
                Hero Banner Image
              </label>
              {bannerImage && (
                <Badge variant="champagne" size="sm">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-charcoal-500 mb-3">
              Displayed at the top of the collection landing page behind hero headlines. Recommended: 1920x640px (16:5).
            </p>

            {bannerImage ? (
              <div className="relative aspect-[16/6] w-full rounded-lg border border-sand-300 overflow-hidden bg-white shadow-sm group">
                <img
                  src={bannerImage}
                  alt="Collection Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {!disabled && (
                  <div className="absolute inset-0 bg-charcoal-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onBannerImageChange?.('')}
                      className="!p-1.5"
                      title="Remove Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/6] w-full rounded-lg border-2 border-dashed border-sand-300 flex flex-col items-center justify-center p-4 text-center bg-white">
                <LayoutTemplate className="w-8 h-8 text-charcoal-300 mb-2" />
                <span className="text-xs text-charcoal-500">No banner image chosen</span>
              </div>
            )}
          </div>

          {!disabled && (
            <div className="mt-4 pt-3 border-t border-sand-200 flex items-center justify-between gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-sand-300 bg-white text-charcoal-700 hover:bg-sand-50 transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-gold-600" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDirectUpload(e, 'banner')}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenLibrary('banner')}
                leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
              >
                Media Library
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Collection Gallery Assets (if collection is saved) */}
      {collectionId && (
        <div className="pt-4 border-t border-sand-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-charcoal-900">Collection Media Gallery</h4>
              <p className="text-xs text-charcoal-500">
                Additional lookbook photos, craft stories, or editorial media attached to this collection.
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
                    onChange={(e) => handleDirectUpload(e, 'gallery')}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenLibrary('gallery')}
                  leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
                >
                  Browse Library
                </Button>
              </div>
            )}
          </div>

          {isLoadingMedia ? (
            <div className="py-8 text-center text-sm text-charcoal-500">Loading gallery assets...</div>
          ) : serverMedia.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-sand-300 p-6 text-center bg-sand-50/50">
              <ImagePlus className="mx-auto w-8 h-8 text-charcoal-400 mb-2" />
              <p className="text-sm font-medium text-charcoal-700">No auxiliary media attached</p>
              <p className="text-xs text-charcoal-500 mt-1">
                Attach editorial artwork or lookbook imagery to enhance the collection presentation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {serverMedia.map((item, index) => (
                <div
                  key={item.id || item.mediaId}
                  className={`group relative rounded-lg border bg-white overflow-hidden shadow-sm transition-all hover:shadow-md ${
                    item.isPrimary ? 'border-gold-500 ring-2 ring-gold-400/30' : 'border-sand-200'
                  }`}
                >
                  <div className="aspect-square w-full bg-sand-100 relative overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.altText || 'Collection media'}
                      className="w-full h-full object-cover"
                    />
                    {item.isPrimary && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="champagne" size="sm">
                          Primary
                        </Badge>
                      </div>
                    )}
                  </div>

                  {!disabled && (
                    <div className="p-2 bg-white flex items-center justify-between border-t border-sand-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'left')}
                          disabled={index === 0}
                          className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'right')}
                          disabled={index === serverMedia.length - 1}
                          className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {!item.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(item)}
                            className="p-1 rounded text-charcoal-400 hover:text-gold-600 hover:bg-sand-100"
                            title="Set as Primary"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaToDelete(item.mediaId)}
                          className="p-1 rounded text-charcoal-400 hover:text-terracotta-600 hover:bg-sand-100"
                          title="Detach Image"
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
        </div>
      )}

      {/* Media Library Selector Modal */}
      <Modal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        title={
          libraryTarget === 'cover'
            ? 'Select Collection Cover Thumbnail'
            : libraryTarget === 'banner'
            ? 'Select Hero Banner Image'
            : 'Select Media for Collection Gallery'
        }
        size="xl"
      >
        <div className="space-y-4 font-sans">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media by title or filename..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
            />
          </div>

          {isLoadingLibrary ? (
            <div className="py-12 text-center text-sm text-charcoal-500">Loading media library...</div>
          ) : !libraryData?.media || libraryData.media.length === 0 ? (
            <div className="py-12 text-center text-sm text-charcoal-500">
              No media found in the library matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
              {libraryData.media.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectFromLibrary(asset)}
                  className="group relative aspect-square rounded-lg border border-sand-200 overflow-hidden bg-sand-50 hover:border-gold-500 hover:ring-2 hover:ring-gold-400/30 transition-all text-left"
                >
                  <img
                    src={asset.url}
                    alt={asset.altText || asset.title || 'Media asset'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-charcoal-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-semibold text-white bg-gold-600 px-2 py-1 rounded shadow">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-sand-200">
            <Button variant="outline" size="sm" onClick={() => setIsLibraryOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Detach Dialog */}
      <ConfirmDialog
        isOpen={Boolean(mediaToDelete)}
        title="Detach Collection Media"
        message="Are you sure you want to remove this image from the collection? The original asset remains in your Media Library."
        confirmLabel="Detach Media"
        variant="danger"
        onConfirm={() => {
          if (mediaToDelete) handleDetach(mediaToDelete);
        }}
        onClose={() => setMediaToDelete(null)}
      />
    </div>
  );
};
