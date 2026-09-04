import React from 'react';
import { Badge, BadgeVariant } from './Badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'sm' }) => {
  if (!status) return null;

  const normalized = status.toUpperCase().trim();

  let variant: BadgeVariant = 'secondary';
  let label = status;

  switch (normalized) {
    // Success / Completed / Active
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'APPROVED':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'PAID':
    case 'CONFIRMED':
      variant = 'success';
      break;

    // In-Progress / Pending / Warning
    case 'PENDING':
    case 'PROCESSING':
    case 'IN_TRANSIT':
    case 'SUBMITTED':
    case 'DRAFT':
    case 'AUTHORIZED':
    case 'PICKED_UP':
    case 'LABEL_CREATED':
    case 'OUT_FOR_DELIVERY':
      variant = 'warning';
      break;

    // Danger / Negative / Terminal Failure
    case 'INACTIVE':
    case 'ARCHIVED':
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
    case 'REFUNDED':
    case 'SUSPENDED':
    case 'EXCEPTION':
    case 'RETURNED':
    case 'HIDDEN':
      variant = 'danger';
      break;

    // Informational
    case 'SHIPPED':
    case 'INFO':
      variant = 'info';
      break;

    // Highlight / Champagne
    case 'FEATURED':
    case 'SUPER_ADMIN':
    case 'BESTSELLER':
    case 'NEW_ARRIVAL':
      variant = 'champagne';
      break;

    default:
      variant = 'secondary';
      break;
  }

  // Format label: ORDER_STATUS -> Order Status
  label = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};
