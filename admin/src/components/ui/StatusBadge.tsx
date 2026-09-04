import React from 'react';
import { StatusVariant } from '../../types/ui';
import { Badge, BadgeVariant } from './Badge';

export interface StatusBadgeProps {
  status: string | StatusVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'sm' }) => {
  const normalized = status.toLowerCase();

  let variant: BadgeVariant = 'secondary';
  let label = status;

  switch (normalized) {
    case 'active':
    case 'published':
    case 'approved':
    case 'completed':
    case 'delivered':
    case 'paid':
      variant = 'success';
      break;

    case 'pending':
    case 'processing':
    case 'in_transit':
    case 'submitted':
    case 'draft':
      variant = 'warning';
      break;

    case 'inactive':
    case 'archived':
    case 'cancelled':
    case 'rejected':
    case 'failed':
    case 'refunded':
      variant = 'danger';
      break;

    case 'shipped':
    case 'info':
      variant = 'info';
      break;

    case 'featured':
    case 'super_admin':
      variant = 'champagne';
      break;

    default:
      variant = 'secondary';
      break;
  }

  // Format label nicely (e.g. IN_TRANSIT -> In Transit)
  label = normalized.replace(/_/g, ' ');

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};
