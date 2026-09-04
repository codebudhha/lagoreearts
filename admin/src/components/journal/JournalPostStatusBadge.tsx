import React from 'react';
import { Badge } from '../ui/Badge';
import { JournalPostStatus } from '../../lib/api/journal';
import { Star, FileText, CheckCircle2, Archive } from 'lucide-react';

interface JournalPostStatusBadgeProps {
  status: JournalPostStatus;
  isFeatured?: boolean;
  className?: string;
}

export const JournalPostStatusBadge: React.FC<JournalPostStatusBadgeProps> = ({
  status,
  isFeatured = false,
  className,
}) => {
  const getBadge = () => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="secondary" size="sm" className="gap-1">
            <Archive className="w-3 h-3" />
            Archived
          </Badge>
        );
      case 'DRAFT':
      default:
        return (
          <Badge variant="outline" size="sm" className="gap-1">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      {getBadge()}

      {isFeatured && (
        <Badge variant="champagne" size="sm">
          <Star className="w-3 h-3 fill-gold-500 mr-1 text-gold-600" />
          Featured
        </Badge>
      )}
    </div>
  );
};
