import React from 'react';
import { AttributeType } from '../../lib/api/attributes';
import { Badge, BadgeVariant } from '../ui/Badge';

export interface AttributeTypeBadgeProps {
  type: AttributeType | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const AttributeTypeBadge: React.FC<AttributeTypeBadgeProps> = ({
  type,
  className = '',
  size = 'sm',
}) => {
  const norm = (type || '').toUpperCase() as AttributeType;

  let variant: BadgeVariant = 'secondary';
  let label = type || 'UNKNOWN';

  switch (norm) {
    case 'TEXT':
      variant = 'secondary';
      label = 'Text';
      break;
    case 'SELECT':
      variant = 'champagne';
      label = 'Select';
      break;
    case 'MULTI_SELECT':
      variant = 'info';
      label = 'Multi-Select';
      break;
    case 'BOOLEAN':
      variant = 'success';
      label = 'Boolean';
      break;
    case 'NUMBER':
      variant = 'warning';
      label = 'Number';
      break;
    case 'RANGE':
      variant = 'default';
      label = 'Range';
      break;
  }

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};
