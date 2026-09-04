import React from 'react';
import { MediaAsset } from '../../lib/api/media';
import {
  Eye,
  FolderInput,
  Copy,
  Trash2,
  Folder,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface MediaTableProps {
  assets: MediaAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (assetId: string) => void;
  onToggleSelectAll: () => void;
  onOpenDetail: (asset: MediaAsset) => void;
  onMoveAsset?: (asset: MediaAsset) => void;
  onDeleteAsset?: (asset: MediaAsset) => void;
  onCopyUrl?: (url: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const MediaTable: React.FC<MediaTableProps> = ({
  assets = [],
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onMoveAsset,
  onDeleteAsset,
  onCopyUrl,
  canUpdate = true,
  canDelete = true,
}) => {
  const isAllSelected = assets.length > 0 && assets.every((a) => selectedIds.has(a.id));

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sand-50/80 border-b border-sand-300 text-xs font-semibold text-charcoal-600 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-sand-300 text-gold-600 focus:ring-gold-500/20 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">Asset</th>
              <th className="py-3 px-3">Dimensions</th>
              <th className="py-3 px-3">Size</th>
              <th className="py-3 px-3">Folder</th>
              <th className="py-3 px-3">Date Added</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200 text-xs">
            {assets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              const sizeStr = formatBytes(asset.fileSize || asset.sizeBytes || 0);

              return (
                <tr
                  key={asset.id}
                  className={`hover:bg-sand-50/50 transition-colors ${
                    isSelected ? 'bg-amber-50/50' : ''
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(asset.id)}
                      className="rounded border-sand-300 text-gold-600 focus:ring-gold-500/20 cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail & Title/Filename */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onOpenDetail(asset)}
                        className="w-10 h-10 rounded-lg border border-sand-200 bg-sand-100 flex-shrink-0 overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        {asset.url ? (
                          <img
                            src={asset.thumbnailUrl || asset.url}
                            alt={asset.originalFilename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-charcoal-400" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <span
                          onClick={() => onOpenDetail(asset)}
                          className="font-medium text-charcoal-900 hover:text-gold-700 cursor-pointer transition-colors block truncate text-xs"
                          title={asset.title || asset.originalFilename}
                        >
                          {asset.title || asset.originalFilename}
                        </span>
                        <span className="text-[11px] text-charcoal-400 font-mono block truncate">
                          {asset.filename || asset.originalFilename}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Dimensions */}
                  <td className="py-2.5 px-3 font-mono text-charcoal-600">
                    {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : '—'}
                  </td>

                  {/* File Size */}
                  <td className="py-2.5 px-3 font-mono text-charcoal-600">{sizeStr}</td>

                  {/* Folder */}
                  <td className="py-2.5 px-3">
                    {asset.folder ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sand-100 text-charcoal-700 font-mono text-[11px]">
                        <Folder className="w-3 h-3 text-gold-600" />
                        {asset.folder.name}
                      </span>
                    ) : (
                      <span className="text-charcoal-400 italic">Root</span>
                    )}
                  </td>

                  {/* Upload Date */}
                  <td className="py-2.5 px-3 text-charcoal-500">
                    {new Date(asset.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetail(asset)}
                        className="!p-1 text-charcoal-500 hover:text-charcoal-900"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {onCopyUrl && asset.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyUrl(asset.url)}
                          className="!p-1 text-charcoal-500 hover:text-gold-700"
                          title="Copy Public URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canUpdate && onMoveAsset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMoveAsset(asset)}
                          className="!p-1 text-charcoal-500 hover:text-gold-700"
                          title="Move to Folder"
                        >
                          <FolderInput className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canDelete && onDeleteAsset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAsset(asset)}
                          className="!p-1 text-charcoal-400 hover:text-terracotta-600"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
