import React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  AdminNavigationItem,
  NavigationItemTargetType,
} from '../../lib/api/navigation';
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Star,
  ExternalLink,
  Link,
  FolderTree,
  LayoutGrid,
} from 'lucide-react';

export interface NavigationItemCardProps {
  item: AdminNavigationItem;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (item: AdminNavigationItem) => void;
  onDelete: (item: AdminNavigationItem) => void;
  onAddChild: (parentId: string) => void;
  totalSiblings: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const targetTypeBadgeVariant: Record<NavigationItemTargetType, 'default' | 'secondary' | 'outline' | 'champagne' | 'info' | 'success'> = {
  NONE: 'secondary',
  CATEGORY: 'champagne',
  COLLECTION: 'info',
  PRODUCT: 'success',
  ARTIST: 'outline',
  JOURNAL: 'info',
  LOOKBOOK: 'champagne',
  SANSKRIT_EDIT: 'default',
  INTERNAL_URL: 'secondary',
  EXTERNAL_URL: 'outline',
};

const targetTypeLabel: Record<NavigationItemTargetType, string> = {
  NONE: 'Group',
  CATEGORY: 'Category',
  COLLECTION: 'Collection',
  PRODUCT: 'Product',
  ARTIST: 'Artist',
  JOURNAL: 'Journal',
  LOOKBOOK: 'Lookbook',
  SANSKRIT_EDIT: 'Sanskrit',
  INTERNAL_URL: 'Internal',
  EXTERNAL_URL: 'External',
};

const displayTypeIcons = {
  LINK: Link,
  GROUP: FolderTree,
  MEGA_MENU: LayoutGrid,
};

export const NavigationItemCard: React.FC<NavigationItemCardProps> = ({
  item,
  depth,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  totalSiblings,
  onMoveUp,
  onMoveDown,
}) => {
  const isContainer = item.displayType === 'GROUP' || item.displayType === 'MEGA_MENU';
  const DisplayIcon = displayTypeIcons[item.displayType];

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 hover:border-champagne-300 transition-colors',
        !item.isVisible && 'opacity-60',
        depth > 0 && 'ml-6 border-l-2 border-l-champagne-300'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1 text-charcoal-400 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {isContainer && (
          <button
            onClick={() => onToggleExpand(item.id)}
            className="flex items-center justify-center w-5 h-5 text-charcoal-500 hover:text-charcoal-700 rounded hover:bg-ivory-100 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!isContainer && <div className="w-5" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-charcoal-900 dark:text-charcoal-100 truncate">
              {item.label}
            </span>

            <Badge variant={targetTypeBadgeVariant[item.targetType]} size="sm">
              {targetTypeLabel[item.targetType]}
            </Badge>

            {item.displayType !== 'LINK' && (
              <Badge variant="outline" size="sm" className="gap-0.5">
                <DisplayIcon className="w-3 h-3" />
                {item.displayType === 'GROUP' ? 'Group' : 'Mega'}
              </Badge>
            )}

            {!item.isVisible && (
              <Badge variant="danger" size="sm">
                <EyeOff className="w-3 h-3 mr-0.5" />
                Hidden
              </Badge>
            )}

            {item.isFeatured && (
              <Badge variant="warning" size="sm" className="gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          {(item.url || item.targetId) && (
            <div className="flex items-center gap-1 mt-0.5">
              {item.url && (
                <span className="text-xs text-charcoal-400 font-mono truncate max-w-xs flex items-center gap-1">
                  {item.targetType === 'EXTERNAL_URL' ? (
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <Link className="w-3 h-3 flex-shrink-0" />
                  )}
                  {item.url}
                </span>
              )}
              {item.targetId && !item.url && (
                <span className="text-xs text-charcoal-400 truncate">
                  ID: {item.targetId.slice(0, 8)}...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isContainer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(item.id)}
            title="Add child item"
            className="text-charcoal-500 hover:text-charcoal-700 h-7 px-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={item.sortOrder === 0}
          title="Move up"
          className="text-charcoal-500 hover:text-charcoal-700 h-7 px-1.5"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          disabled={item.sortOrder >= totalSiblings - 1}
          title="Move down"
          className="text-charcoal-500 hover:text-charcoal-700 h-7 px-1.5"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          title="Edit item"
          className="text-charcoal-500 hover:text-charcoal-700 h-7 px-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item)}
          title="Delete item"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
