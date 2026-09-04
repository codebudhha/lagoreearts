import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  JournalTag,
  CreateJournalTagPayload,
  UpdateJournalTagPayload,
} from '../../lib/api/journal';
import { useCreateJournalTag, useUpdateJournalTag } from '../../hooks/useJournal';

interface JournalTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: JournalTag | null;
}

export const JournalTagModal: React.FC<JournalTagModalProps> = ({
  isOpen,
  onClose,
  tag,
}) => {
  const isEdit = Boolean(tag);
  const createMutation = useCreateJournalTag();
  const updateMutation = useUpdateJournalTag();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tag) {
      setName(tag.name || '');
      setSlug(tag.slug || '');
    } else {
      setName('');
      setSlug('');
    }
    setError(null);
  }, [tag, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      if (isEdit && tag) {
        const payload: UpdateJournalTagPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
        };
        await updateMutation.mutateAsync({ id: tag.id, payload });
      } else {
        const payload: CreateJournalTagPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save tag');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Editorial Tag' : 'Create Editorial Tag'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Tag Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LostWaxBronze"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Slug (optional)
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. lost-wax-bronze"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Update Tag' : 'Create Tag'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
