import React, { createContext, useCallback, useState } from 'react';
import { ToastMessage, ToastType } from '../types/ui';
import { Toast } from '../components/feedback/Toast';

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? 4500;

      const newToast: ToastMessage = {
        id,
        type,
        message,
        title: options?.title,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => showToast(message, 'success', options),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => showToast(message, 'error', options),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => showToast(message, 'info', options),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
