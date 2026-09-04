import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { BreadcrumbItem } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

export interface PageHeaderAction {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  permission?: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageHeaderAction[];
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}) => {
  const { hasPermission } = useAuth();

  const filteredActions = actions?.filter((action) => {
    if (!action.permission) return true;
    return hasPermission(action.permission);
  });

  return (
    <div className={cn('space-y-4 pb-4 border-b border-ivory-200/80', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1">{description}</p>
          )}
        </div>

        {(filteredActions && filteredActions.length > 0) || children ? (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {filteredActions?.map((act) => {
              const variantStyles = {
                primary: 'bg-charcoal-900 text-ivory-50 hover:bg-charcoal-800 focus:ring-champagne-400',
                secondary: 'bg-ivory-100 text-charcoal-800 hover:bg-ivory-200 border border-ivory-300',
                outline: 'border border-charcoal-300 text-charcoal-800 hover:bg-ivory-50',
                ghost: 'text-charcoal-700 hover:bg-ivory-100',
                danger: 'bg-rose-600 text-white hover:bg-rose-700',
              }[act.variant || 'primary'];

              return (
                <button
                  key={act.id}
                  type="button"
                  disabled={act.disabled}
                  onClick={act.onClick}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs',
                    variantStyles
                  )}
                >
                  {act.icon && <span className="w-3.5 h-3.5 flex-shrink-0">{act.icon}</span>}
                  <span>{act.label}</span>
                </button>
              );
            })}
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
};
