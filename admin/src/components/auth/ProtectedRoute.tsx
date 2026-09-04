import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../feedback/Spinner';

export interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  permissions,
  requireAll = false,
  children,
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-ivory-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-champagne-300 flex items-center justify-center bg-white shadow-md">
            <Spinner size="md" variant="champagne" />
          </div>
          <p className="text-xs font-serif font-medium tracking-widest uppercase text-charcoal-600">
            Lagoree Arts
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Permission checks
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  if (permissions && permissions.length > 0) {
    const isAllowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!isAllowed) {
      return <Navigate to="/admin/unauthorized" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
