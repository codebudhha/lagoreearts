import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AdminUser, LoginCredentials } from '../types/auth';
import { authApi } from '../lib/api/auth';
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
} from '../lib/permissions/permissionHelpers';
import { setAccessToken } from '../lib/api/client';

export interface AuthContextType {
  admin: AdminUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // Attempt silent refresh via HttpOnly cookie
      const refreshResult = await authApi.refresh();
      if (refreshResult?.accessToken) {
        setAccessToken(refreshResult.accessToken);
        const meResult = await authApi.getMe();
        if (meResult?.admin) {
          setAdmin(meResult.admin);
          setPermissions(meResult.admin.permissions || []);
        }
      }
    } catch {
      // Not logged in or expired session
      setAccessToken(null);
      setAdmin(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setAccessToken(null);
      setAdmin(null);
      setPermissions([]);
    };

    window.addEventListener('lagoree:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('lagoree:auth:unauthorized', handleUnauthorized);
    };
  }, [initAuth]);

  const login = async (credentials: LoginCredentials): Promise<AdminUser> => {
    const res = await authApi.login(credentials);
    setAccessToken(res.accessToken);
    setAdmin(res.admin);
    setPermissions(res.admin.permissions || []);
    return res.admin;
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setAccessToken(null);
      setAdmin(null);
      setPermissions([]);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const meResult = await authApi.getMe();
      if (meResult?.admin) {
        setAdmin(meResult.admin);
        setPermissions(meResult.admin.permissions || []);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const hasPermission = useCallback(
    (permission: string) => checkPermission(admin, permission),
    [admin]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => checkAnyPermission(admin, perms),
    [admin]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => checkAllPermissions(admin, perms),
    [admin]
  );

  return (
    <AuthContext.Provider
      value={{
        admin,
        permissions,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        refreshUser,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
