import React from 'react';
import { Badge } from '../ui/Badge';
import { ArtistStatus } from '../../lib/api/artists';
import { Star } from 'lucide-react';

interface ArtistStatusBadgeProps {
  status: ArtistStatus;
  isFeatured?: boolean;
  className?: string;
}

export const ArtistStatusBadge: React.FC<ArtistStatusBadgeProps> = ({
  status,
  isFeatured = false,
  className,
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      <Badge
        variant={status === 'ACTIVE' ? 'success' : 'secondary'}
        size="sm"
      >
        {status}
      </Badge>

      {isFeatured && (
        <Badge variant="champagne" size="sm">
          <Star className="w-3 h-3 fill-gold-500 mr-1 text-gold-600" />
          Featured
        </Badge>
      )}
    </div>
  );
};
