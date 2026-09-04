import React, { useState, useEffect } from 'react';
import { MediaAsset, UpdateMediaPayload } from '../../lib/api/media';
import { Drawer } from '../ui/Drawer';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  Copy,
  Check,
  FolderInput,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Save,
} from 'lucide-react';

export interface MediaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onUpdateMetadata: (id: string, payload: UpdateMediaPayload) => Promise<void>;
  onMoveAsset?: (asset: MediaAsset) => void;
  onDeleteAsset?: (asset: MediaAsset) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  isUpdating?: boolean;
}

export const MediaDetailDrawer: React.FC<MediaDetailDrawerProps> = ({
  isOpen,
  onClose,
  asset,
  onUpdateMetadata,
  onMoveAsset,
  onDeleteAsset,
  canUpdate = true,
  canDelete = true,
  isUpdating = false,
}) => {
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setAltText(asset.altText || '');
      setCaption(asset.caption || '');
    }
  }, [asset]);

  if (!asset) return null;

  const handleCopyUrl = async () => {
    if (!asset.url) return;
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.id) return;
    await onUpdateMetadata(asset.id, {
      title: title.trim() || null,
      altText: altText.trim() || null,
      caption: caption.trim() || null,
    });
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Inspection & Details"
      size="md"
    >
      <div className="space-y-6 font-sans">
        {/* Large Preview */}
        <div className="rounded-xl border border-sand-300 bg-sand-100 overflow-hidden flex items-center justify-center relative group max-h-72">
          {asset.url ? (
            <img
              src={asset.url}
              alt={asset.altText || asset.title || asset.originalFilename}
              className="w-full h-full object-contain max-h-72"
            />
          ) : (
            <div className="p-12 text-center text-charcoal-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Preview unavailable</p>
            </div>
          )}

          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2 right-2 p-1.5 rounded-md bg-charcoal-900/80 text-white hover:bg-charcoal-900 transition-colors shadow"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Public URL Box */}
        <div className="p-3 bg-sand-50 rounded-lg border border-sand-200">
          <label className="block text-[11px] font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Public Asset CDN URL
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={asset.url}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-sand-300 rounded focus:outline-none select-all text-charcoal-800 truncate"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-sand-50/50 p-3.5 rounded-lg border border-sand-200">
          <div>
            <span className="text-charcoal-500 block">Dimensions</span>
            <span className="font-mono text-charcoal-800 font-medium">
              {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : '—'}
            </span>
          </div>

          <div>
            <span className="text-charcoal-500 block">File Size</span>
            <span className="font-mono text-charcoal-800 font-medium">
              {formatBytes(asset.fileSize || asset.sizeBytes || 0)}
            </span>
          </div>

          <div>
            <span className="text-charcoal-500 block">MIME Type</span>
            <span className="font-mono text-charcoal-800 font-medium">{asset.mimeType}</span>
          </div>

          <div>
            <span className="text-charcoal-500 block">Folder</span>
            <span className="text-charcoal-800 font-medium truncate block">
              {asset.folder ? asset.folder.name : 'Root Folder'}
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-sand-200/80">
            <span className="text-charcoal-500 block">Original Filename</span>
            <span className="font-mono text-charcoal-800 break-all select-all">
              {asset.originalFilename}
            </span>
          </div>
        </div>

        {/* Edit Metadata Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-900 border-b border-sand-200 pb-1.5">
            Asset Metadata (SEO & Accessibility)
          </h4>

          <Input
            label="Display Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mahameru Sacred Geometry Sculpture"
            disabled={!canUpdate || isUpdating}
          />

          <Input
            label="Alt Text (Screen Readers & SEO)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image content accurately..."
            disabled={!canUpdate || isUpdating}
          />

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">
              Curatorial Caption / Notes
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Editorial context or artisan attribution..."
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 disabled:bg-sand-50"
              disabled={!canUpdate || isUpdating}
            />
          </div>

          {canUpdate && (
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Metadata
              </Button>
            </div>
          )}
        </form>

        {/* Danger & Move Actions */}
        <div className="pt-4 border-t border-sand-200 flex items-center justify-between gap-2">
          {canUpdate && onMoveAsset && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveAsset(asset)}
              leftIcon={<FolderInput className="w-3.5 h-3.5" />}
            >
              Move to Folder
            </Button>
          )}

          {canDelete && onDeleteAsset && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDeleteAsset(asset)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Asset
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
