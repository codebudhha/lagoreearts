import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              className={cn(
                'peer h-4 w-4 rounded border appearance-none transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-champagne-400',
                checked
                  ? 'bg-charcoal-900 border-charcoal-900'
                  : 'bg-white border-ivory-300 hover:border-ivory-400',
                error && 'border-rose-400 focus:ring-rose-200',
                'disabled:bg-ivory-100 disabled:border-ivory-300 disabled:cursor-not-allowed',
                className
              )}
              {...props}
            />
            <Check
              className={cn(
                'absolute pointer-events-none w-3 h-3 text-white transition-opacity duration-150',
                checked ? 'opacity-100' : 'opacity-0'
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={inputId}
                className="font-medium text-charcoal-900 cursor-pointer select-none"
              >
                {label}
              </label>
            )}
            {description && <p className="text-charcoal-500 text-xs mt-0.5">{description}</p>}
            {error && <p className="text-xs text-rose-600 font-medium mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
