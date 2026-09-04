import React from 'react';
import { Badge } from '../ui/Badge';
import { LookbookStatus } from '../../lib/api/lookbook';
import { Star } from 'lucide-react';

interface LookbookStatusBadgeProps {
  status: LookbookStatus;
  featured?: boolean;
  className?: string;
}

export const LookbookStatusBadge: React.FC<LookbookStatusBadgeProps> = ({
  status,
  featured = false,
  className = '',
}) => {
  const getBadgeVariant = () => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Badge variant={getBadgeVariant()} size="sm">{status}</Badge>
      {featured && (
        <Badge variant="champagne" size="sm" className="font-semibold flex items-center gap-1">
          <Star className="w-3 h-3 fill-gold-500 text-gold-600" />
          Featured
        </Badge>
      )}
    </div>
  );
};
