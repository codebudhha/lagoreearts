import React from 'react';
import { Badge } from '../ui/Badge';

export interface CategoryStatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | string;
  isFeatured?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryStatusBadge: React.FC<CategoryStatusBadgeProps> = ({
  status,
  isFeatured = false,
  className = '',
  size = 'sm',
}) => {
  const isActive = status?.toUpperCase() === 'ACTIVE';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Badge
        variant={isActive ? 'success' : 'danger'}
        size={size}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
            isActive ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
        {isActive ? 'Active' : 'Inactive'}
      </Badge>

      {isFeatured && (
        <Badge variant="champagne" size={size}>
          Featured
        </Badge>
      )}
    </div>
  );
};
