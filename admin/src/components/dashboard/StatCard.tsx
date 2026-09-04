import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../feedback/Skeleton';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  secondaryInfo?: string;
  isLoading?: boolean;
  href?: string;
  permission?: string;
  colorVariant?: 'champagne' | 'emerald' | 'amber' | 'indigo' | 'charcoal';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  secondaryInfo,
  isLoading = false,
  href,
  permission,
  colorVariant = 'champagne',
  className,
}) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  if (permission && !hasPermission(permission)) {
    return null;
  }

  const colorStyles = {
    champagne: 'bg-champagne-50 text-champagne-700 border-champagne-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    charcoal: 'bg-charcoal-100 text-charcoal-800 border-charcoal-200/60',
  }[colorVariant];

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <div
      onClick={href ? handleClick : undefined}
      className={cn(
        'group bg-white rounded-xl border border-ivory-200/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 flex flex-col justify-between',
        href && 'hover:border-champagne-400 hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                'p-2.5 rounded-xl border transition-colors flex items-center justify-center flex-shrink-0',
                colorStyles
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="mt-2.5">
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-md my-1" />
          ) : (
            <h3 className="text-2xl font-serif font-bold text-charcoal-900 tracking-tight">
              {value}
            </h3>
          )}
          {description && (
            <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-ivory-100 flex items-center justify-between text-xs">
        {secondaryInfo ? (
          <span className="text-charcoal-500 font-medium">{secondaryInfo}</span>
        ) : (
          <span className="text-charcoal-400">Lagoree Art Direct</span>
        )}

        {href && (
          <span className="inline-flex items-center gap-0.5 text-charcoal-400 group-hover:text-champagne-700 font-semibold transition-colors text-[11px]">
            <span>View</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        )}
      </div>
    </div>
  );
};
