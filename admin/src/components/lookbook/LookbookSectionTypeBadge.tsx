import React from 'react';
import { Badge, BadgeVariant } from '../ui/Badge';
import { LookbookSectionType } from '../../lib/api/lookbook';
import {
  Zap, FileText, Package, Sparkles, Palette, Layers,
  BookOpen, BookMarked, Image, LayoutGrid,
} from 'lucide-react';

const SECTION_TYPE_CONFIG: Record<LookbookSectionType, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  HERO: { label: 'Hero', variant: 'champagne', icon: <Zap className="w-3 h-3" /> },
  EDITORIAL: { label: 'Editorial', variant: 'info', icon: <FileText className="w-3 h-3" /> },
  PRODUCTS: { label: 'Products', variant: 'success', icon: <Package className="w-3 h-3" /> },
  COLLECTIONS: { label: 'Collections', variant: 'champagne', icon: <Sparkles className="w-3 h-3" /> },
  ARTISTS: { label: 'Artists', variant: 'default', icon: <Palette className="w-3 h-3" /> },
  CATEGORIES: { label: 'Categories', variant: 'secondary', icon: <Layers className="w-3 h-3" /> },
  JOURNAL: { label: 'Journal', variant: 'info', icon: <BookOpen className="w-3 h-3" /> },
  SANSKRIT_EDIT: { label: 'Sanskrit Edit', variant: 'warning', icon: <BookMarked className="w-3 h-3" /> },
  GALLERY: { label: 'Gallery', variant: 'secondary', icon: <Image className="w-3 h-3" /> },
  MIXED: { label: 'Mixed', variant: 'outline', icon: <LayoutGrid className="w-3 h-3" /> },
};

interface LookbookSectionTypeBadgeProps {
  type: LookbookSectionType;
  className?: string;
}

export const LookbookSectionTypeBadge: React.FC<LookbookSectionTypeBadgeProps> = ({ type, className }) => {
  const config = SECTION_TYPE_CONFIG[type] || { label: type, variant: 'secondary' as BadgeVariant, icon: null };
  return (
    <Badge variant={config.variant} size="sm" className={`flex items-center gap-1 ${className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};
