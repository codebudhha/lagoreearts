import React from 'react';
import { cn } from '../../utils/cn';
import type { CustomerStatus } from '../../lib/api/customers';

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-slate-50 text-slate-700 ring-slate-600/20',
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
  className?: string;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig.ACTIVE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
