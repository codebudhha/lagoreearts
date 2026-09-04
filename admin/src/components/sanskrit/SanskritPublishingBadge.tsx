import React from 'react';
import { Badge } from '../ui/Badge';
import { BookOpen, Star, FileText } from 'lucide-react';

interface SanskritPublishingBadgeProps {
  isPublished: boolean;
  isFeatured?: boolean;
  className?: string;
}

export const SanskritPublishingBadge: React.FC<SanskritPublishingBadgeProps> = ({
  isPublished,
  isFeatured = false,
  className,
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      <Badge
        variant={isPublished ? 'success' : 'secondary'}
        size="sm"
      >
        {isPublished ? (
          <>
            <BookOpen className="w-3 h-3 mr-1 text-emerald-600" />
            Published
          </>
        ) : (
          <>
            <FileText className="w-3 h-3 mr-1 text-charcoal-400" />
            Draft
          </>
        )}
      </Badge>

      {isFeatured && (
        <Badge variant="champagne" size="sm">
          <Star className="w-3 h-3 fill-gold-500 mr-1 text-gold-600" />
          Featured Verse
        </Badge>
      )}
    </div>
  );
};
