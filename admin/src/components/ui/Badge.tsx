import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'champagne' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-charcoal-900 text-ivory-50 border-transparent',
    secondary: 'bg-ivory-200 text-charcoal-800 border-transparent',
    outline: 'bg-transparent text-charcoal-700 border-charcoal-300',
    champagne: 'bg-champagne-100 text-champagne-800 border-champagne-300',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium leading-none tracking-wide',
    md: 'px-2.5 py-1 text-xs font-semibold leading-none tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border uppercase font-medium select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
