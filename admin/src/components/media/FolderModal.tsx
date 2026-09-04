import React, { useState, useEffect } from 'react';
import { MediaFolder, CreateFolderPayload, UpdateFolderPayload } from '../../lib/api/media';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FolderPlus, Edit2 } from 'lucide-react';

export interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: MediaFolder | null;
  parentFolderId?: string | null;
  folders: MediaFolder[];
  onSubmit: (payload: CreateFolderPayload | UpdateFolderPayload) => Promise<void>;
  isLoading?: boolean;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderToEdit,
  parentFolderId,
  folders,
  onSubmit,
  isLoading = false,
}) => {
  const isEditing = Boolean(folderToEdit);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isCustomSlug, setIsCustomSlug] = useState(false);

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setSlug(folderToEdit.slug);
      setParentId(folderToEdit.parentId || null);
      setIsCustomSlug(true);
    } else {
      setName('');
      setSlug('');
      setParentId(parentFolderId || null);
      setIsCustomSlug(false);
    }
  }, [folderToEdit, parentFolderId, isOpen]);

  // Auto-generate slug
  useEffect(() => {
    if (!isCustomSlug && name) {
      const generated = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [name, isCustomSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentId: parentId || null,
    });
  };

  // Filter out self and descendant folders when editing to prevent circular hierarchy
  const availableParents = folders.filter((f) => {
    if (!folderToEdit) return true;
    if (f.id === folderToEdit.id) return false;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Rename Folder: ${folderToEdit?.name}` : 'Create Media Folder'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <Input
          label="Folder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sanskrit Yantras or Tanjore Paintings"
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Folder URL Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setIsCustomSlug(true);
              setSlug(e.target.value);
            }}
            placeholder="folder-slug"
            className="w-full px-3 py-2 text-sm font-mono border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
          />
          <p className="text-[11px] text-charcoal-500 mt-1">
            Must be unique within the parent folder level.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Parent Folder (Optional)
          </label>
          <select
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
          >
            <option value="">Root (No Parent / Top Level)</option>
            {availableParents.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (/{f.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            leftIcon={isEditing ? <Edit2 className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Save Changes' : 'Create Folder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
