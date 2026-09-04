import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SectionTypeBadge } from './SectionTypeBadge';
import { AdminHomepageSection } from '../../lib/api/homepage';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface SectionCardProps {
  section: AdminHomepageSection;
  index: number;
  totalSections: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit: (section: AdminHomepageSection) => void;
  onDelete: (section: AdminHomepageSection) => void;
  onToggleActive: (section: AdminHomepageSection) => void;
  onManageEntities: (section: AdminHomepageSection) => void;
  onManageMedia: (section: AdminHomepageSection) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  index,
  totalSections,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onToggleActive,
  onManageEntities,
  onManageMedia,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalSections - 1;

  const productCount = section.products?.length ?? 0;
  const collectionCount = section.collections?.length ?? 0;
  const artistCount = section.artists?.length ?? 0;
  const categoryCount = section.categories?.length ?? 0;
  const mediaCount = section.media?.length ?? 0;

  const hasEntities =
    section.type === 'FEATURED_PRODUCTS' ||
    section.type === 'FEATURED_COLLECTIONS' ||
    section.type === 'FEATURED_ARTISTS' ||
    section.type === 'CATEGORIES' ||
    productCount > 0 ||
    collectionCount > 0 ||
    artistCount > 0 ||
    categoryCount > 0;

  return (
    <Card
      className={`p-4 border transition-all ${
        section.isActive
          ? 'border-neutral-200 hover:border-gold-300 dark:border-neutral-800 dark:hover:border-gold-800'
          : 'border-neutral-200 bg-neutral-50/60 opacity-75 dark:border-neutral-800 dark:bg-neutral-900/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Reorder controls + Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex flex-col gap-1 items-center justify-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Move section up"
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-neutral-600 dark:text-neutral-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-neutral-500">
              {section.displayOrder}
            </span>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Move section down"
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-neutral-600 dark:text-neutral-300"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SectionTypeBadge type={section.type} />
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {section.title || <span className="italic text-neutral-400">Untitled Section</span>}
              </h3>
              {!section.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>

            {section.subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                {section.subtitle}
              </p>
            )}

            {/* Junction / Media stats */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap pt-1">
              {productCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" />
                  {productCount} Products
                </span>
              )}
              {collectionCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" />
                  {collectionCount} Collections
                </span>
              )}
              {artistCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" />
                  {artistCount} Artists
                </span>
              )}
              {categoryCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" />
                  {categoryCount} Categories
                </span>
              )}
              {mediaCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  <ImageIcon className="w-3 h-3 text-blue-500" />
                  {mediaCount} Media
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {hasEntities && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageEntities(section)}
              className="text-xs gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5 text-gold-600" />
              Entities
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageMedia(section)}
            className="text-xs gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            Media ({mediaCount})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(section)}
            title={section.isActive ? 'Hide section' : 'Show section'}
            className="text-neutral-600 dark:text-neutral-300"
          >
            {section.isActive ? (
              <Eye className="w-4 h-4 text-emerald-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-neutral-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(section)}
            title="Edit Section Settings"
          >
            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(section)}
            title="Delete Section"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
