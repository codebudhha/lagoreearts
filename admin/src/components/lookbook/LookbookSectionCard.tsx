import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LookbookSectionTypeBadge } from './LookbookSectionTypeBadge';
import { AdminLookbookSection } from '../../lib/api/lookbook';
import {
  ChevronUp, ChevronDown, Edit2, Trash2, Eye, EyeOff,
  Link as LinkIcon, Image as ImageIcon, Layers,
} from 'lucide-react';

interface LookbookSectionCardProps {
  section: AdminLookbookSection;
  index: number;
  totalSections: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit: (section: AdminLookbookSection) => void;
  onDelete: (section: AdminLookbookSection) => void;
  onToggleVisible: (section: AdminLookbookSection) => void;
  onManageEntities: (section: AdminLookbookSection) => void;
  onManageMedia: (section: AdminLookbookSection) => void;
}

const ENTITY_TYPES = ['PRODUCTS', 'COLLECTIONS', 'ARTISTS', 'CATEGORIES', 'JOURNAL', 'SANSKRIT_EDIT'];

export const LookbookSectionCard: React.FC<LookbookSectionCardProps> = ({
  section, index, totalSections, onMoveUp, onMoveDown,
  onEdit, onDelete, onToggleVisible, onManageEntities, onManageMedia,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalSections - 1;

  const productCount = section.products?.length ?? 0;
  const collectionCount = section.collections?.length ?? 0;
  const artistCount = section.artists?.length ?? 0;
  const categoryCount = section.categories?.length ?? 0;
  const journalCount = section.journals?.length ?? 0;
  const sanskritCount = section.sanskritEdits?.length ?? 0;
  const mediaCount = section.media?.length ?? 0;

  const hasEntities = ENTITY_TYPES.includes(section.type) ||
    productCount > 0 || collectionCount > 0 || artistCount > 0 ||
    categoryCount > 0 || journalCount > 0 || sanskritCount > 0;

  return (
    <Card className={`p-4 border transition-all ${
      section.isVisible
        ? 'border-ivory-200 hover:border-champagne-300'
        : 'border-ivory-200 bg-ivory-50/60 opacity-75'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex flex-col gap-1 items-center justify-center p-1 bg-ivory-100 rounded">
            <button type="button" onClick={onMoveUp} disabled={isFirst}
              aria-label="Move section up"
              className="p-1 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-charcoal-600">
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-charcoal-500">{section.displayOrder}</span>
            <button type="button" onClick={onMoveDown} disabled={isLast}
              aria-label="Move section down"
              className="p-1 hover:bg-ivory-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-charcoal-600">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <LookbookSectionTypeBadge type={section.type} />
              <h3 className="font-semibold text-charcoal-900 text-sm">
                {section.title || <span className="italic text-charcoal-400">Untitled Section</span>}
              </h3>
              {!section.isVisible && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
            </div>
            {section.subtitle && (
              <p className="text-xs text-charcoal-500 line-clamp-1">{section.subtitle}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-charcoal-500 flex-wrap pt-1">
              {productCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {productCount} Products
                </span>
              )}
              {collectionCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {collectionCount} Collections
                </span>
              )}
              {artistCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {artistCount} Artists
                </span>
              )}
              {categoryCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {categoryCount} Categories
                </span>
              )}
              {journalCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {journalCount} Journal
                </span>
              )}
              {sanskritCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <Layers className="w-3 h-3 text-gold-600" /> {sanskritCount} Sanskrit
                </span>
              )}
              {mediaCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-ivory-100 px-2 py-0.5 rounded">
                  <ImageIcon className="w-3 h-3 text-blue-500" /> {mediaCount} Media
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {hasEntities && (
            <Button variant="outline" size="sm" onClick={() => onManageEntities(section)} className="text-xs gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-gold-600" /> Entities
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onManageMedia(section)} className="text-xs gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Media ({mediaCount})
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleVisible(section)}
            title={section.isVisible ? 'Hide section' : 'Show section'}>
            {section.isVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-charcoal-400" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)} title="Edit Section">
            <Edit2 className="w-4 h-4 text-charcoal-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(section)} title="Delete Section"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
