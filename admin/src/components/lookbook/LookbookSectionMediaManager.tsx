import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MediaPicker } from '../media/MediaPicker';
import {
  AdminLookbookSection,
  LookbookSectionMedia,
  LookbookSectionMediaRole,
} from '../../lib/api/lookbook';
import {
  useAttachSectionMedia,
  useDetachSectionMedia,
  useReorderSectionMedia,
} from '../../hooks/useLookbook';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Layers,
  Smartphone,
  Layout,
  Maximize2,
  FileImage,
  Monitor,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface LookbookSectionMediaManagerProps {
  section: AdminLookbookSection;
  onUpdate: (updated: AdminLookbookSection) => void;
}

const ROLE_OPTIONS: { role: LookbookSectionMediaRole; label: string; icon: React.FC<{ className?: string }> }[] = [
  { role: 'PRIMARY', label: 'Primary', icon: Layout },
  { role: 'BACKGROUND', label: 'Background', icon: Maximize2 },
  { role: 'GALLERY', label: 'Gallery', icon: Layers },
  { role: 'MOBILE', label: 'Mobile', icon: Smartphone },
  { role: 'DESKTOP', label: 'Desktop', icon: Monitor },
  { role: 'OG', label: 'Open Graph', icon: FileImage },
];

export const LookbookSectionMediaManager: React.FC<LookbookSectionMediaManagerProps> = ({
  section,
  onUpdate,
}) => {
  const [selectedRole, setSelectedRole] = useState<LookbookSectionMediaRole>('PRIMARY');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const attachMutation = useAttachSectionMedia();
  const detachMutation = useDetachSectionMedia();
  const reorderMutation = useReorderSectionMedia();

  const mediaList: LookbookSectionMedia[] = section.media || [];

  const handleMediaSelected = async (selected: any) => {
    if (!selected) return;
    const items = Array.isArray(selected) ? selected : [selected];
    if (items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await attachMutation.mutateAsync({
        sectionId: section.id,
        payload: {
          mediaId: item.id,
          role: selectedRole,
          sortOrder: mediaList.length + i,
          isPrimary: selectedRole === 'PRIMARY' && mediaList.length + i === 0,
        },
      });
    }

    setIsMediaPickerOpen(false);
  };

  const handleDetach = async (mediaId: string, role: LookbookSectionMediaRole) => {
    await detachMutation.mutateAsync({
      sectionId: section.id,
      mediaId,
      role,
    });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const list = [...mediaList];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await reorderMutation.mutateAsync({
      sectionId: section.id,
      items: list.map((m, i) => ({
        mediaId: m.mediaAssetId,
        role: m.role,
        sortOrder: i,
        isPrimary: m.isPrimary,
      })),
    });
  };

  const getRoleBadge = (role: LookbookSectionMediaRole) => {
    switch (role) {
      case 'PRIMARY':
        return <Badge variant="default">Primary</Badge>;
      case 'BACKGROUND':
        return <Badge variant="secondary">Background</Badge>;
      case 'GALLERY':
        return <Badge variant="champagne">Gallery</Badge>;
      case 'MOBILE':
        return <Badge variant="outline">Mobile</Badge>;
      case 'DESKTOP':
        return <Badge variant="outline">Desktop</Badge>;
      case 'OG':
        return <Badge variant="outline">OG</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const isAnyLoading =
    attachMutation.isPending || detachMutation.isPending || reorderMutation.isPending;

  return (
    <>
      <Modal
        isOpen={true}
        onClose={() => onUpdate(section)}
        title={`Section Media Assets — ${section.title || section.type}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Add media form row */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-4">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gold-600" />
              Attach New Media Asset
            </h4>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Role
              </label>
              <select
                aria-label="Target Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as LookbookSectionMediaRole)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.role} value={opt.role}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setIsMediaPickerOpen(true)}
                disabled={isAnyLoading}
                className="gap-1.5"
              >
                <ImageIcon className="w-4 h-4" />
                Select Media from Library
              </Button>
            </div>
          </div>

          {/* Current Media List */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Current Media ({mediaList.length})
            </h4>

            {mediaList.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                No media assets attached to this section yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {mediaList.map((m, idx) => (
                  <div
                    key={`${m.mediaAssetId}-${m.role}`}
                    className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center gap-3 bg-white dark:bg-neutral-800/60"
                  >
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 border border-neutral-200 dark:border-neutral-700">
                      {m.media?.url ? (
                        <img
                          src={m.media.thumbnailUrl || m.media.url}
                          alt={m.media.altText || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(m.role)}
                        <span className="text-xs text-neutral-400 font-mono">
                          #{m.sortOrder}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-900 dark:text-neutral-100 truncate font-medium">
                        {m.media?.filename || m.media?.originalFilename || m.mediaAssetId}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0 || isAnyLoading}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === mediaList.length - 1 || isAnyLoading}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDetach(m.mediaAssetId, m.role)}
                        disabled={isAnyLoading}
                        className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onUpdate(section)}>
            Done
          </Button>
        </div>
      </Modal>

      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        mode={selectedRole === 'GALLERY' ? 'multiple' : 'single'}
      />
    </>
  );
};
