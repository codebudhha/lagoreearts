import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/ui';
import { cn } from '../../utils/cn';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-champagne-600 flex-shrink-0" />,
};

const borderStyles = {
  success: 'border-emerald-200 bg-white shadow-lg shadow-emerald-500/5',
  error: 'border-rose-200 bg-white shadow-lg shadow-rose-500/5',
  warning: 'border-amber-200 bg-white shadow-lg shadow-amber-500/5',
  info: 'border-champagne-200 bg-white shadow-lg shadow-champagne-500/5',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border transition-all duration-300 transform translate-y-0',
        borderStyles[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-semibold text-charcoal-900 tracking-wide uppercase mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-sm text-charcoal-700 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-charcoal-400 hover:text-charcoal-700 transition-colors p-0.5 rounded-lg hover:bg-ivory-100"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
