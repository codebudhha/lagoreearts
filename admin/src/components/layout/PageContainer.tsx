import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { BreadcrumbItem } from '../../types/navigation';
import { cn } from '../../utils/cn';

export interface PageContainerProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ivory-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">{actions}</div>
        )}
      </div>

      {/* Page Main Content Area */}
      <div>{children}</div>
    </div>
  );
};
