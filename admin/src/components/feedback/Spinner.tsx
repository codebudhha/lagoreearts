import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'champagne' | 'white' | 'charcoal';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  variant = 'champagne',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const variantClasses = {
    champagne: 'border-champagne-300 border-t-champagne-600',
    white: 'border-white/30 border-t-white',
    charcoal: 'border-charcoal-300 border-t-charcoal-800',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
};
