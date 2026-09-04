import React, { useState } from 'react';
import { useCategoryTree } from '../../hooks/useCategories';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Skeleton } from '../feedback/Skeleton';
import { CategoryTreeNode } from '../../lib/api/categories';
import { FolderTree, Check, ChevronRight } from 'lucide-react';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategories: (categoryIds: string[]) => void;
  alreadyAssignedIds?: string[];
  title?: string;
  multiSelect?: boolean;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategories,
  alreadyAssignedIds = [],
  title = 'Select Taxonomy Categories',
  multiSelect = true,
}) => {
  const { data: tree, isLoading } = useCategoryTree();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    if (alreadyAssignedIds.includes(id)) return;

    if (!multiSelect) {
      setSelectedIds(new Set([id]));
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    onSelectCategories(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  const renderCategoryItem = (node: CategoryTreeNode, depth = 0): React.ReactNode => {
    const isAssigned = alreadyAssignedIds.includes(node.id);
    const isSelected = selectedIds.has(node.id);

    return (
      <React.Fragment key={node.id}>
        <div
          onClick={() => handleToggle(node.id)}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          className={`p-2.5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 transition-colors cursor-pointer ${
            isAssigned
              ? 'opacity-40 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900'
              : isSelected
              ? 'bg-gold-50/70 dark:bg-gold-950/30'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {depth > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
            <FolderTree className="w-4 h-4 text-gold-600 shrink-0" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {node.name}
            </span>
            <span className="text-xs text-neutral-400 font-mono">/{node.slug}</span>
          </div>

          <div>
            {isAssigned ? (
              <span className="text-xs text-neutral-400 italic">Already added</span>
            ) : (
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-gold-600 border-gold-600 text-white'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            )}
          </div>
        </div>

        {node.children &&
          node.children.length > 0 &&
          node.children.map((child: CategoryTreeNode) => renderCategoryItem(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            Add Selected ({selectedIds.size})
          </Button>
        </>
      }
    >
      <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded" />
            ))}
          </div>
        ) : !tree || tree.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">
            No categories available in hierarchy.
          </div>
        ) : (
          tree.map((rootNode: CategoryTreeNode) => renderCategoryItem(rootNode, 0))
        )}
      </div>
    </Modal>
  );
};
