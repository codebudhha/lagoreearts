import React from 'react';
import { Badge } from '../ui/Badge';
import { HomepageSectionType } from '../../lib/api/homepage';
import {
  Sparkles,
  Package,
  Layers,
  Palette,
  FolderTree,
  Hourglass,
  BookOpen,
  Quote,
  Image as ImageIcon,
  Megaphone,
  MoveVertical,
} from 'lucide-react';

interface SectionTypeBadgeProps {
  type: HomepageSectionType;
  className?: string;
}

export const SectionTypeBadge: React.FC<SectionTypeBadgeProps> = ({ type, className = '' }) => {
  const getDetails = (): { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'champagne' | 'outline' } => {
    switch (type) {
      case 'HERO':
        return { label: 'Hero Banner', icon: <Sparkles className="w-3 h-3 text-gold-500" />, variant: 'champagne' };
      case 'FEATURED_PRODUCTS':
        return { label: 'Featured Artworks', icon: <Package className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'FEATURED_COLLECTIONS':
        return { label: 'Curated Collections', icon: <Layers className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'FEATURED_ARTISTS':
        return { label: 'Master Makers', icon: <Palette className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'CATEGORIES':
        return { label: 'Taxonomy Categories', icon: <FolderTree className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'ANTIQUES':
        return { label: 'Antiques & Collectibles', icon: <Hourglass className="w-3 h-3 text-amber-700" />, variant: 'outline' };
      case 'SANSKRIT_EDIT':
        return { label: 'The Sanskrit Edit', icon: <BookOpen className="w-3 h-3 text-champagne-600" />, variant: 'champagne' };
      case 'EDITORIAL':
        return { label: 'Editorial Narrative', icon: <Quote className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'IMAGE_BANNER':
        return { label: 'Image Banner', icon: <ImageIcon className="w-3 h-3 text-charcoal-700" />, variant: 'secondary' };
      case 'PROMOTIONAL_BANNER':
        return { label: 'Promotional Banner', icon: <Megaphone className="w-3 h-3 text-gold-600" />, variant: 'outline' };
      case 'SPACER':
        return { label: 'Layout Spacer', icon: <MoveVertical className="w-3 h-3 text-charcoal-400" />, variant: 'secondary' };
      default:
        return { label: type, icon: null, variant: 'secondary' };
    }
  };

  const { label, icon, variant } = getDetails();

  return (
    <Badge variant={variant} size="sm" className={`inline-flex items-center gap-1 font-mono tracking-tight ${className}`}>
      {icon}
      <span>{label}</span>
    </Badge>
  );
};
