import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { MediaPicker } from '../media/MediaPicker';
import {
  AdminHomepageSection,
  HomepageSectionMedia,
  HomepageSectionMediaRole,
} from '../../lib/api/homepage';
import {
  useAddSectionMedia,
  useRemoveSectionMedia,
} from '../../hooks/useHomepage';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Smartphone,
  Layout,
  Maximize2,
} from 'lucide-react';

interface SectionMediaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  homepageId: string;
  section: AdminHomepageSection | null;
}

const ROLE_OPTIONS: { role: HomepageSectionMediaRole; label: string; icon: React.FC<{ className?: string }> }[] = [
  { role: 'PRIMARY', label: 'Primary (Desktop)', icon: Layout },
  { role: 'MOBILE', label: 'Mobile Banner', icon: Smartphone },
  { role: 'BACKGROUND', label: 'Background Image', icon: Maximize2 },
  { role: 'GALLERY', label: 'Gallery Item', icon: Layers },
];

export const SectionMediaManager: React.FC<SectionMediaManagerProps> = ({
  isOpen,
  onClose,
  homepageId,
  section,
}) => {
  if (!section) return null;

  const [selectedRole, setSelectedRole] = useState<HomepageSectionMediaRole>('PRIMARY');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [altText, setAltText] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const addMediaMutation = useAddSectionMedia();
  const removeMediaMutation = useRemoveSectionMedia();

  const mediaList: HomepageSectionMedia[] = section.media || [];

  const handleMediaSelected = async (selected: any) => {
    if (!selected) return;
    const items = Array.isArray(selected) ? selected : [selected];
    if (items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await addMediaMutation.mutateAsync({
        homepageId,
        sectionId: section.id,
        payload: {
          mediaId: item.id,
          role: selectedRole,
          displayOrder: mediaList.length + i,
          altText: altText || item.altText || undefined,
          customUrl: customUrl || undefined,
        },
      });
    }

    setIsMediaPickerOpen(false);
    setAltText('');
    setCustomUrl('');
  };

  const handleRemove = async (mediaId: string) => {
    await removeMediaMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      mediaId,
    });
  };

  const getRoleBadge = (role: HomepageSectionMediaRole) => {
    switch (role) {
      case 'PRIMARY':
        return <Badge variant="default">Primary</Badge>;
      case 'MOBILE':
        return <Badge variant="secondary">Mobile</Badge>;
      case 'BACKGROUND':
        return <Badge variant="outline">Background</Badge>;
      case 'GALLERY':
        return <Badge variant="champagne">Gallery</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Target Role
                </label>
                <select
                  aria-label="Target Role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as HomepageSectionMediaRole)}
                  className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Custom Link URL (optional)
                </label>
                <Input
                  placeholder="e.g. /collections/brass"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Alt Text (optional)
                </label>
                <Input
                  placeholder="e.g. Vintage temple idol"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setIsMediaPickerOpen(true)}
                disabled={addMediaMutation.isPending}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {mediaList.map((m) => (
                  <div
                    key={m.mediaId}
                    className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center gap-3 bg-white dark:bg-neutral-800/60"
                  >
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 border border-neutral-200 dark:border-neutral-700">
                      {m.media?.url ? (
                        <img
                          src={m.media.thumbnailUrl || m.media.url}
                          alt={m.altText || m.media.altText || ''}
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
                          #{m.displayOrder}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-900 dark:text-neutral-100 truncate font-medium">
                        {m.media?.filename || m.altText || m.mediaId}
                      </p>

                      {m.customUrl && (
                        <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-gold-600" />
                          {m.customUrl}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(m.mediaId)}
                      disabled={removeMediaMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
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
