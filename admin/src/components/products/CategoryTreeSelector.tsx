import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, CategoryTreeNode } from '../../lib/api/categories';
import { queryKeys } from '../../lib/api/queryKeys';
import { FolderTree } from 'lucide-react';

export interface CategoryTreeSelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

interface FlattenedCategoryOption {
  id: string;
  name: string;
  depth: number;
  slug: string;
}

function flattenTree(nodes: CategoryTreeNode[], depth = 0): FlattenedCategoryOption[] {
  const result: FlattenedCategoryOption[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      depth,
      slug: node.slug,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export const CategoryTreeSelector: React.FC<CategoryTreeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  label = 'Primary Category',
  placeholder = 'Select a category...',
}) => {
  const { data: treeData, isLoading } = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: categoriesApi.getTree,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const options = useMemo(() => {
    if (!treeData) return [];
    return flattenTree(treeData);
  }, [treeData]);

  return (
    <div className="w-full">
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
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          aria-label={label || 'Select Category'}
          className={`block w-full pl-9 pr-8 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors font-serif focus:outline-none focus:ring-1 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 text-rose-900'
              : 'border-sand-300 focus:border-gold-500 focus:ring-gold-500 text-charcoal-900'
          } disabled:bg-sand-100 disabled:text-charcoal-400 disabled:cursor-not-allowed`}
        >
          <option value="">{isLoading ? 'Loading categories...' : placeholder}</option>
          {options.map((opt) => {
            const prefix = opt.depth > 0 ? '\u00A0'.repeat(opt.depth * 4) + '└─ ' : '';
            return (
              <option key={opt.id} value={opt.id}>
                {prefix}
                {opt.name}
              </option>
            );
          })}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-sans">{error}</p>}
    </div>
  );
};
