import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-champagne-700 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />,
  };

  const variantStyles = {
    info: 'bg-champagne-50/70 border-champagne-200 text-champagne-900',
    success: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/70 border-amber-200 text-amber-900',
    error: 'bg-rose-50/70 border-rose-200 text-rose-900',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        variantStyles[variant],
        className
      )}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-xs tracking-wide uppercase mb-1">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
