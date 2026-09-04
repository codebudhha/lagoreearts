import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MediaPicker } from '../media/MediaPicker';
import { JournalAuthor, CreateAuthorPayload, UpdateAuthorPayload } from '../../lib/api/journal';
import { useCreateAuthor, useUpdateAuthor } from '../../hooks/useJournal';
import { User } from 'lucide-react';

interface AuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  author?: JournalAuthor | null;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
  isOpen,
  onClose,
  author,
}) => {
  const isEdit = Boolean(author);
  const createMutation = useCreateAuthor();
  const updateMutation = useUpdateAuthor();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [avatarMediaId, setAvatarMediaId] = useState<string | undefined>();
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>();
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (author) {
      setName(author.name || '');
      setSlug(author.slug || '');
      setBio(author.bio || '');
      setRole(author.role || '');
      setAvatarMediaId(author.avatarMediaId || undefined);
      setAvatarPreviewUrl(author.avatar?.url || undefined);
      setInstagram(author.instagram || '');
      setTwitter(author.twitter || '');
      setWebsite(author.website || '');
      setIsActive(author.isActive ?? true);
    } else {
      setName('');
      setSlug('');
      setBio('');
      setRole('');
      setAvatarMediaId(undefined);
      setAvatarPreviewUrl(undefined);
      setInstagram('');
      setTwitter('');
      setWebsite('');
      setIsActive(true);
    }
    setError(null);
  }, [author, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Author name is required');
      return;
    }

    try {
      if (isEdit && author) {
        const payload: UpdateAuthorPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          bio: bio.trim() || undefined,
          role: role.trim() || undefined,
          avatarMediaId: avatarMediaId || undefined,
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          website: website.trim() || undefined,
          isActive,
        };
        await updateMutation.mutateAsync({ id: author.id, payload });
      } else {
        const payload: CreateAuthorPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          bio: bio.trim() || undefined,
          role: role.trim() || undefined,
          avatarMediaId: avatarMediaId || undefined,
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          website: website.trim() || undefined,
          isActive,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save author');
    }
  };

  const handleMediaSelect = (media: any) => {
    const item = Array.isArray(media) ? media[0] : media;
    if (item) {
      setAvatarMediaId(item.id);
      setAvatarPreviewUrl(item.thumbnailUrl || item.url);
    }
    setIsMediaPickerOpen(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Editorial Author' : 'Create Editorial Author'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-neutral-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="mt-2 text-xs text-gold-600 hover:text-gold-700 font-medium block text-center w-full"
              >
                Change Avatar
              </button>
              {avatarMediaId && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMediaId(undefined);
                    setAvatarPreviewUrl(undefined);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 block text-center w-full mt-0.5"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Author Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Priya Ramanathan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title / Role
                </label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Resident Vedic Scholar & Curator"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Slug (optional)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. priya-ramanathan"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="authorActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-gold-600 rounded border-neutral-300 focus:ring-gold-500"
              />
              <label
                htmlFor="authorActive"
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Active Author
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Biography
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio about background, scholarly focus, and curation expertise..."
              rows={3}
              className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Instagram Handle
              </label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Twitter / X Handle
              </label>
              <Input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEdit ? 'Update Author' : 'Create Author'}
            </Button>
          </div>
        </form>
      </Modal>

      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        mode="single"
      />
    </>
  );
};
