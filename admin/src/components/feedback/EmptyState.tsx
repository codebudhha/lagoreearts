import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-ivory-200 bg-ivory-50/40',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-ivory-100 flex items-center justify-center text-charcoal-400 mb-4 shadow-xs">
        {icon || <PackageOpen className="w-7 h-7 text-charcoal-400" />}
      </div>
      <h4 className="text-base font-serif font-semibold text-charcoal-900">{title}</h4>
      {description && (
        <p className="text-xs text-charcoal-500 max-w-sm mt-1 mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
