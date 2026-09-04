import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  JournalCategory,
  CreateJournalCategoryPayload,
  UpdateJournalCategoryPayload,
} from '../../lib/api/journal';
import {
  useCreateJournalCategory,
  useUpdateJournalCategory,
} from '../../hooks/useJournal';

interface JournalCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: JournalCategory | null;
}

export const JournalCategoryModal: React.FC<JournalCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const isEdit = Boolean(category);
  const createMutation = useCreateJournalCategory();
  const updateMutation = useUpdateJournalCategory();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setDescription(category.description || '');
      setDisplayOrder(category.displayOrder ?? 0);
      setIsActive(category.isActive ?? true);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setDisplayOrder(0);
      setIsActive(true);
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (isEdit && category) {
        const payload: UpdateJournalCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          displayOrder: Number(displayOrder),
          isActive,
        };
        await updateMutation.mutateAsync({ id: category.id, payload });
      } else {
        const payload: CreateJournalCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          displayOrder: Number(displayOrder),
          isActive,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save category');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Editorial Category' : 'Create Editorial Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Category Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vedic Iconography & Art History"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Slug (optional)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. vedic-iconography"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Display Order
            </label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope of articles falling under this editorial pillar..."
            rows={3}
            className="w-full text-xs px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="categoryActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-gold-600 rounded border-neutral-300 focus:ring-gold-500"
          />
          <label
            htmlFor="categoryActive"
            className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            Active (visible in public category filters)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
