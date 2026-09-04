/**
 * Lagoree Arts Admin Authentication API Endpoints
 */

import { apiClient, setAccessToken } from './client';
import type {
  AdminUser,
  LoginResponseData,
  LoginCredentials,
  ChangePasswordData,
  UpdateProfileData,
} from '../../types/auth';

export const authApi = {
  /**
   * Log in administrative user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const res = await apiClient<LoginResponseData>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  /**
   * Fetch current authenticated admin user and permissions
   */
  async getMe(): Promise<{ admin: AdminUser }> {
    const res = await apiClient<{ admin: AdminUser }>('/admin/auth/me');
    return res.data;
  },

  /**
   * Refresh session and retrieve new access token
   */
  async refresh(): Promise<{ accessToken: string }> {
    const res = await apiClient<{ accessToken: string }>('/admin/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  /**
   * Log out current session
   */
  async logout(): Promise<void> {
    try {
      await apiClient('/admin/auth/logout', {
        method: 'POST',
        skipAuth: true,
      });
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Log out all active sessions
   */
  async logoutAll(): Promise<void> {
    try {
      await apiClient('/admin/auth/logout-all', {
        method: 'POST',
      });
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Change current admin password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient('/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update admin profile info
   */
  async updateProfile(data: UpdateProfileData): Promise<{ admin: AdminUser }> {
    const res = await apiClient<{ admin: AdminUser }>('/admin/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
