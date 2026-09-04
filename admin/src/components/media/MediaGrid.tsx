import React from 'react';
import { MediaAsset } from '../../lib/api/media';
import {
  Eye,
  FolderInput,
  Copy,
  Trash2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

export interface MediaGridProps {
  assets: MediaAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (assetId: string) => void;
  onOpenDetail: (asset: MediaAsset) => void;
  onMoveAsset?: (asset: MediaAsset) => void;
  onDeleteAsset?: (asset: MediaAsset) => void;
  onCopyUrl?: (url: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  isSelectionMode?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  assets = [],
  selectedIds = new Set(),
  onToggleSelect,
  onOpenDetail,
  onMoveAsset,
  onDeleteAsset,
  onCopyUrl,
  canUpdate = true,
  canDelete = true,
  isSelectionMode = false,
}) => {
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatExtension = (mimeType: string, filename: string): string => {
    if (filename.includes('.')) {
      return filename.split('.').pop()?.toUpperCase() || 'IMG';
    }
    return mimeType.split('/')[1]?.toUpperCase() || 'IMG';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 font-sans">
      {assets.map((asset) => {
        const isSelected = selectedIds.has(asset.id);
        const ext = formatExtension(asset.mimeType, asset.filename || asset.originalFilename);
        const sizeStr = formatBytes(asset.fileSize || asset.sizeBytes || 0);

        return (
          <div
            key={asset.id}
            className={`group relative bg-white rounded-xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col justify-between ${
              isSelected
                ? 'border-gold-500 ring-2 ring-gold-400/40 shadow-sm'
                : 'border-sand-200 hover:border-sand-300 hover:shadow-md'
            }`}
          >
            {/* Thumbnail Preview Area */}
            <div
              onClick={() => {
                if (isSelectionMode) {
                  onToggleSelect(asset.id);
                } else {
                  onOpenDetail(asset);
                }
              }}
              className="aspect-square bg-sand-100 relative cursor-pointer overflow-hidden flex items-center justify-center select-none"
            >
              {asset.url ? (
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.altText || asset.title || asset.originalFilename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-charcoal-300" />
              )}

              {/* Selection Checkbox Pill */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(asset.id);
                }}
                className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold-600 border-gold-600 text-white shadow-xs'
                    : 'bg-white/90 border-sand-300 text-transparent opacity-0 group-hover:opacity-100 hover:border-gold-500'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              {/* Format Badge */}
              <div className="absolute top-2 right-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal-900/80 text-sand-100 backdrop-blur-xs">
                  {ext}
                </span>
              </div>
            </div>

            {/* Asset Details & Quick Footer */}
            <div className="p-2.5 bg-white border-t border-sand-100 flex flex-col justify-between">
              <div>
                <h4
                  onClick={() => onOpenDetail(asset)}
                  className="text-xs font-medium text-charcoal-900 truncate hover:text-gold-700 cursor-pointer transition-colors leading-snug"
                  title={asset.title || asset.originalFilename}
                >
                  {asset.title || asset.originalFilename}
                </h4>

                <div className="mt-1 flex items-center justify-between text-[11px] text-charcoal-500 font-mono">
                  <span>{sizeStr}</span>
                  {asset.width && asset.height ? (
                    <span>
                      {asset.width}×{asset.height}
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              {/* Quick Card Action Buttons */}
              <div className="mt-2 pt-2 border-t border-sand-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenDetail(asset)}
                  className="p-1 rounded text-charcoal-500 hover:text-charcoal-900 hover:bg-sand-100 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {onCopyUrl && asset.url && (
                  <button
                    type="button"
                    onClick={() => onCopyUrl(asset.url)}
                    className="p-1 rounded text-charcoal-500 hover:text-gold-700 hover:bg-sand-100 transition-colors"
                    title="Copy Public URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}

                {canUpdate && onMoveAsset && (
                  <button
                    type="button"
                    onClick={() => onMoveAsset(asset)}
                    className="p-1 rounded text-charcoal-500 hover:text-gold-700 hover:bg-sand-100 transition-colors"
                    title="Move to Folder"
                  >
                    <FolderInput className="w-3.5 h-3.5" />
                  </button>
                )}

                {canDelete && onDeleteAsset && (
                  <button
                    type="button"
                    onClick={() => onDeleteAsset(asset)}
                    className="p-1 rounded text-charcoal-400 hover:text-terracotta-600 hover:bg-sand-100 transition-colors"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
