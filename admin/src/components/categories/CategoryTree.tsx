import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Star,
  Layers,
} from 'lucide-react';
import { CategoryTreeNode } from '../../lib/api/categories';
import { CategoryStatusBadge } from './CategoryStatusBadge';
import { Button } from '../ui/Button';

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onDeleteNode?: (node: CategoryTreeNode) => void;
  selectedId?: string;
  onSelectNode?: (node: CategoryTreeNode) => void;
  searchTerm?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

interface TreeNodeItemProps {
  node: CategoryTreeNode;
  depth: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  selectedId?: string;
  onSelectNode?: (node: CategoryTreeNode) => void;
  onDeleteNode?: (node: CategoryTreeNode) => void;
  searchTerm?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  expandedIds,
  toggleExpand,
  selectedId,
  onSelectNode,
  onDeleteNode,
  searchTerm,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}) => {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const matchesSearch =
    searchTerm && searchTerm.trim() !== ''
      ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.slug.toLowerCase().includes(searchTerm.toLowerCase())
      : false;

  return (
    <div className="flex flex-col">
      <div
        className={`group flex items-center justify-between py-2 px-3 my-0.5 rounded-lg border transition-all text-sm ${
          isSelected
            ? 'bg-gold-50/80 border-gold-300 ring-1 ring-gold-400'
            : matchesSearch
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-sand-200 hover:border-sand-300 hover:bg-sand-50/50'
        }`}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {/* Left Side: Expand toggle, Icon, Name, Slug, Status */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-1 rounded text-charcoal-500 hover:text-charcoal-800 hover:bg-sand-100 transition-colors focus:outline-none"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center text-sand-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sand-300" />
            </div>
          )}

          <div
            onClick={() => onSelectNode?.(node)}
            className="flex items-center space-x-2.5 cursor-pointer truncate flex-1"
          >
            {isExpanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 text-gold-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
            )}

            <span
              className={`font-serif font-medium truncate ${
                isSelected ? 'text-gold-900 font-semibold' : 'text-charcoal-900'
              }`}
            >
              {node.name}
            </span>

            <span className="text-xs text-charcoal-400 font-mono hidden sm:inline">
              /{node.slug}
            </span>

            {node.isFeatured && (
              <span title="Featured Category">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <CategoryStatusBadge status={node.status} size="sm" />
            {hasChildren && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sand-100 text-charcoal-600 font-mono">
                {node.children!.length} {node.children!.length === 1 ? 'child' : 'children'}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100">
          <Link
            to={`/admin/categories/${node.id}`}
            className="p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          {canCreate && (
            <Link
              to={`/admin/categories/new?parentId=${node.id}`}
              className="p-1.5 text-charcoal-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors hidden sm:inline-flex"
              title="Add Subcategory"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          )}

          {canEdit && (
            <Link
              to={`/admin/categories/${node.id}/edit`}
              className="p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-gold-50 rounded transition-colors"
              title="Edit Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode?.(node);
              }}
              className="p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Render children recursively if expanded */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              selectedId={selectedId}
              onSelectNode={onSelectNode}
              onDeleteNode={onDeleteNode}
              searchTerm={searchTerm}
              canEdit={canEdit}
              canDelete={canDelete}
              canCreate={canCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  nodes,
  onDeleteNode,
  selectedId,
  onSelectNode,
  searchTerm,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}) => {
  // Collect all IDs by default for expandable control
  const collectIds = (items: CategoryTreeNode[]): string[] => {
    let ids: string[] = [];
    for (const item of items) {
      ids.push(item.id);
      if (item.children && item.children.length > 0) {
        ids = ids.concat(collectIds(item.children));
      }
    }
    return ids;
  };

  const allIds = React.useMemo(() => collectIds(nodes), [nodes]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(allIds));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(allIds));
  const collapseAll = () => setExpandedIds(new Set());

  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-sand-200 text-charcoal-500">
        <Layers className="w-8 h-8 mx-auto text-charcoal-400 mb-2" />
        <p className="font-serif text-sm">No categories found in hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs text-charcoal-500 font-sans">
          Total Root Branches: {nodes.length}
        </span>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7">
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7">
            Collapse All
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {nodes.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            selectedId={selectedId}
            onSelectNode={onSelectNode}
            onDeleteNode={onDeleteNode}
            searchTerm={searchTerm}
            canEdit={canEdit}
            canDelete={canDelete}
            canCreate={canCreate}
          />
        ))}
      </div>
    </div>
  );
};
