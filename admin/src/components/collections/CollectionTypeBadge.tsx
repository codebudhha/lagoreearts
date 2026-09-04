import React from 'react';
import { CollectionType } from '../../lib/api/collections';
import { Badge } from '../ui/Badge';
import { Lock, Sparkles } from 'lucide-react';

export interface CollectionTypeBadgeProps {
  type: CollectionType | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CollectionTypeBadge: React.FC<CollectionTypeBadgeProps> = ({
  type,
  className = '',
  size = 'sm',
}) => {
  const isSystem = type?.toUpperCase() === 'SYSTEM';

  if (isSystem) {
    return (
      <Badge
        variant="warning"
        size={size}
        className={`inline-flex items-center gap-1 ${className}`}
        title="System collection: Essential store taxonomy managed by backend logic"
      >
        <Lock className="w-3 h-3 text-amber-700 mr-0.5" />
        System
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      size={size}
      className={`inline-flex items-center gap-1 ${className}`}
      title="Manual collection: Curated by store administrators"
    >
      <Sparkles className="w-3 h-3 text-charcoal-500 mr-0.5" />
      Manual
    </Badge>
  );
};
