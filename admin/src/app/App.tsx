import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '../providers/QueryProvider';
import { AuthProvider } from '../providers/AuthProvider';
import { ToastProvider } from '../providers/ToastProvider';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
};
