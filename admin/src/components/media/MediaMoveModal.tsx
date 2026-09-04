import React, { useState } from 'react';
import { MediaFolder, MediaAsset } from '../../lib/api/media';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Folder, FolderInput, Check } from 'lucide-react';

export interface MediaMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetsToMove: MediaAsset[];
  folders: MediaFolder[];
  onConfirmMove: (destinationFolderId: string | null) => Promise<void>;
  isLoading?: boolean;
}

export const MediaMoveModal: React.FC<MediaMoveModalProps> = ({
  isOpen,
  onClose,
  assetsToMove = [],
  folders = [],
  onConfirmMove,
  isLoading = false,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleConfirm = async () => {
    await onConfirmMove(selectedFolderId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Move ${assetsToMove.length} Media Asset${assetsToMove.length > 1 ? 's' : ''}`}
      size="md"
    >
      <div className="space-y-4 font-sans">
        <p className="text-xs text-charcoal-600">
          Select a destination folder to reorganize{' '}
          <strong>{assetsToMove.length} asset{assetsToMove.length > 1 ? 's' : ''}</strong>:
        </p>

        {/* Destination folder picker */}
        <div className="border border-sand-300 rounded-lg max-h-64 overflow-y-auto divide-y divide-sand-200 bg-white">
          {/* Root Level Option */}
          <div
            onClick={() => setSelectedFolderId(null)}
            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
              selectedFolderId === null ? 'bg-amber-50/80 font-medium text-charcoal-900' : 'hover:bg-sand-50 text-charcoal-700'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <Folder className={`w-4 h-4 ${selectedFolderId === null ? 'text-gold-600' : 'text-charcoal-400'}`} />
              <span>Root (No Folder / Unorganized)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4 text-gold-600" />}
          </div>

          {/* Folder List */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-amber-50/80 font-medium text-charcoal-900' : 'hover:bg-sand-50 text-charcoal-700'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <Folder className={`w-4 h-4 ${isSelected ? 'text-gold-600' : 'text-charcoal-400'}`} />
                  <span>{folder.name}</span>
                  <span className="text-[10px] text-charcoal-400 font-mono">/{folder.slug}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-gold-600" />}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
            leftIcon={<FolderInput className="w-3.5 h-3.5" />}
          >
            Move Assets
          </Button>
        </div>
      </div>
    </Modal>
  );
};
