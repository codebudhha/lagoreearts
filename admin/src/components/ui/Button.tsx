import React from 'react';
import { ButtonVariant, ButtonSize } from '../../types/ui';
import { cn } from '../../utils/cn';
import { Spinner } from '../feedback/Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none active:scale-[0.98]';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-charcoal-900 text-ivory-50 hover:bg-charcoal-800 focus:ring-champagne-500 shadow-sm border border-charcoal-900',
      secondary:
        'bg-ivory-100 text-charcoal-800 hover:bg-ivory-200 focus:ring-champagne-400 border border-ivory-300',
      outline:
        'bg-transparent text-charcoal-800 border border-charcoal-300 hover:border-charcoal-900 hover:bg-ivory-50 focus:ring-champagne-400',
      ghost:
        'bg-transparent text-charcoal-700 hover:bg-ivory-100 hover:text-charcoal-900 focus:ring-champagne-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner
            size={size === 'sm' ? 'sm' : 'sm'}
            variant={variant === 'primary' || variant === 'danger' ? 'white' : 'charcoal'}
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
