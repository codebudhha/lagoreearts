import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, CategoryTreeNode } from '../../lib/api/categories';
import { queryKeys } from '../../lib/api/queryKeys';
import { FolderTree } from 'lucide-react';

export interface CategorySelectorProps {
  value?: string | null;
  onChange: (categoryId: string | null) => void;
  excludeCategoryId?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  allowRoot?: boolean;
  rootLabel?: string;
  placeholder?: string;
  className?: string;
}

interface FlattenedCategoryOption {
  id: string;
  name: string;
  depth: number;
  slug: string;
  disabled?: boolean;
}

/**
 * Recursively collects all descendant IDs for a given node ID.
 */
function getDescendantIds(nodes: CategoryTreeNode[], targetId: string): Set<string> {
  const descendantIds = new Set<string>();

  function findAndCollect(current: CategoryTreeNode, isUnderTarget: boolean) {
    const under = isUnderTarget || current.id === targetId;
    if (under) {
      descendantIds.add(current.id);
    }
    if (current.children) {
      for (const child of current.children) {
        findAndCollect(child, under);
      }
    }
  }

  for (const node of nodes) {
    findAndCollect(node, false);
  }

  return descendantIds;
}

function flattenTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  excludedIds: Set<string> = new Set()
): FlattenedCategoryOption[] {
  const result: FlattenedCategoryOption[] = [];
  for (const node of nodes) {
    const isExcluded = excludedIds.has(node.id);
    result.push({
      id: node.id,
      name: node.name,
      depth,
      slug: node.slug,
      disabled: isExcluded,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1, excludedIds));
    }
  }
  return result;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  excludeCategoryId,
  disabled = false,
  required = false,
  error,
  label = 'Parent Category',
  allowRoot = true,
  rootLabel = 'None (Root Category)',
  placeholder = 'Select a parent category...',
  className = '',
}) => {
  const { data: treeData, isLoading } = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: categoriesApi.getTree,
    staleTime: 1000 * 60 * 5,
  });

  const excludedIds = useMemo(() => {
    if (!excludeCategoryId || !treeData) return new Set<string>();
    return getDescendantIds(treeData, excludeCategoryId);
  }, [treeData, excludeCategoryId]);

  const options = useMemo(() => {
    if (!treeData) return [];
    return flattenTree(treeData, 0, excludedIds);
  }, [treeData, excludedIds]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
          <FolderTree className="w-4 h-4" />
        </div>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          disabled={disabled || isLoading}
          aria-label={label || 'Select Category'}
          className={`block w-full pl-9 pr-8 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors font-serif focus:outline-none focus:ring-1 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 text-rose-900'
              : 'border-sand-300 focus:border-gold-500 focus:ring-gold-500 text-charcoal-900'
          } disabled:bg-sand-100 disabled:text-charcoal-400 disabled:cursor-not-allowed`}
        >
          {allowRoot ? (
            <option value="">{rootLabel}</option>
          ) : (
            <option value="" disabled>
              {isLoading ? 'Loading categories...' : placeholder}
            </option>
          )}

          {options.map((opt) => {
            const prefix = opt.depth > 0 ? '\u00A0'.repeat(opt.depth * 4) + '└─ ' : '';
            return (
              <option
                key={opt.id}
                value={opt.id}
                disabled={opt.disabled}
                className={opt.disabled ? 'text-charcoal-400 italic bg-sand-50' : ''}
              >
                {prefix}
                {opt.name}
                {opt.disabled ? ' (Cannot assign - cycle detected)' : ''}
              </option>
            );
          })}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-sans">{error}</p>}
      {excludeCategoryId && (
        <p className="mt-1 text-xs text-charcoal-500 font-sans">
          Note: This category and its subcategories cannot be selected to prevent circular hierarchy loops.
        </p>
      )}
    </div>
  );
};
