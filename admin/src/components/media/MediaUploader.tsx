import React, { useState, useRef } from 'react';
import { MediaFolder } from '../../lib/api/media';
import { useUploadMediaAsset } from '../../hooks/useMedia';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  X,
  Folder,
} from 'lucide-react';

export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface MediaUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  folders?: MediaFolder[];
  onUploadComplete?: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  isOpen,
  onClose,
  currentFolderId = null,
  folders = [],
  onUploadComplete,
}) => {
  const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId || null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadMediaAsset();

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: 'error',
          progress: 0,
          error: 'Unsupported image format (JPEG, PNG, WebP, AVIF only)',
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: 'error',
          progress: 0,
          error: 'File exceeds 20MB limit',
        });
        return;
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleStartUpload = async () => {
    const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'error');
    if (pendingItems.length === 0) return;

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 50 } : q))
      );

      try {
        await uploadMutation.mutateAsync({
          file: item.file,
          folderId: targetFolderId || undefined,
        });

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', progress: 0, error: err?.message || 'Upload failed' }
              : q
          )
        );
      }
    }

    onUploadComplete?.();
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearFinished = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'success'));
  };

  const hasPending = queue.some((q) => q.status === 'pending' || q.status === 'error');
  const isUploading = queue.some((q) => q.status === 'uploading');

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) {
          setQueue([]);
          onClose();
        }
      }}
      title="Upload Media Assets"
      size="lg"
    >
      <div className="space-y-4 font-sans">
        {/* Target Folder Selector */}
        <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg border border-sand-200 text-xs">
          <Folder className="w-4 h-4 text-gold-600 flex-shrink-0" />
          <label className="text-charcoal-700 font-medium">Destination Folder:</label>
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value || null)}
            className="flex-1 bg-white border border-sand-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            disabled={isUploading}
          >
            <option value="">Root / Uncategorized</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (/{f.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-gold-500 bg-amber-50/50'
              : 'border-sand-300 bg-sand-50/40 hover:bg-sand-50 hover:border-gold-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-gold-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-charcoal-800">
            Drag & drop images here or <span className="text-gold-700 underline">browse files</span>
          </p>
          <p className="text-xs text-charcoal-500 mt-1">
            Supports high-resolution JPEG, PNG, WebP, and AVIF up to 20MB per asset.
          </p>
        </div>

        {/* Upload Queue List */}
        {queue.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-y-auto border border-sand-200 rounded-lg p-2 bg-white divide-y divide-sand-100">
            {queue.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileImage className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
                  <span className="truncate font-medium text-charcoal-800">{item.file.name}</span>
                  <span className="text-[10px] text-charcoal-400 font-mono flex-shrink-0">
                    ({(item.file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <span className="text-gold-600 font-medium animate-pulse">Uploading...</span>
                  )}
                  {item.status === 'success' && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span
                      className="inline-flex items-center gap-1 text-rose-600 max-w-[140px] truncate"
                      title={item.error}
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {item.error}
                    </span>
                  )}

                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-charcoal-400 hover:text-charcoal-700"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-sand-200">
          <div>
            {queue.some((q) => q.status === 'success') && (
              <button
                type="button"
                onClick={handleClearFinished}
                className="text-xs text-charcoal-500 hover:text-charcoal-800 underline"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQueue([]);
                onClose();
              }}
              disabled={isUploading}
            >
              {queue.length > 0 && !hasPending ? 'Close' : 'Cancel'}
            </Button>

            {hasPending && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartUpload}
                isLoading={isUploading}
                leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Start Upload ({queue.filter((q) => q.status === 'pending' || q.status === 'error').length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
