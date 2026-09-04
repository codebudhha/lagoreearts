import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
import { BreadcrumbItem } from '../../types/navigation';
import { cn } from '../../utils/cn';

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const defaultItems = useBreadcrumbs();
  const breadcrumbList = items || defaultItems;

  if (breadcrumbList.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1.5 text-xs', className)}>
      <Link
        to="/admin/dashboard"
        className="text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 rounded-md"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {breadcrumbList.map((item, index) => {
        const isLast = index === breadcrumbList.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" />
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-charcoal-500 hover:text-charcoal-900 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium truncate max-w-[200px]',
                  isLast ? 'text-charcoal-900 font-semibold' : 'text-charcoal-500'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
