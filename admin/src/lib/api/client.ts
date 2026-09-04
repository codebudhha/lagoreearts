/**
 * Lagoree Arts Admin API Client Foundation
 * Centralized fetch-based client with in-memory token state,
 * automatic HttpOnly cookie inclusion, and 401 retry interceptor.
 */

import type { ApiSuccessResponse, ApiClientError } from './types.ts';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiSuccessResponse<T>> {
  const { params, skipAuth = false, headers = {}, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>)
  };

  if (!skipAuth && inMemoryAccessToken) {
    reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'include' // Mandatory for HttpOnly refresh cookie
  };

  try {
    const response = await fetch(url, config);

    // 401 Unauthenticated Handling & Token Refresh
    if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (newToken) {
            reqHeaders['Authorization'] = `Bearer ${newToken}`;
          }
          return apiClient<T>(endpoint, { ...options, headers: reqHeaders });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${BASE_URL}/admin/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh failed');
        }

        const refreshData = await refreshRes.json();
        const newToken = refreshData?.data?.accessToken || null;
        setAccessToken(newToken);
        processQueue(null, newToken);

        if (newToken) {
          reqHeaders['Authorization'] = `Bearer ${newToken}`;
        }
        return apiClient<T>(endpoint, { ...options, headers: reqHeaders });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('lagoree:auth:unauthorized'));
        const error: ApiClientError = new Error('Session expired. Please log in again.') as ApiClientError;
        error.status = 401;
        error.code = 'UNAUTHENTICATED';
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiClientError = new Error(
        data?.error?.message || response.statusText || 'An error occurred with the request'
      ) as ApiClientError;
      error.status = response.status;
      error.code = data?.error?.code || `HTTP_${response.status}`;
      error.details = data?.error?.details || null;
      throw error;
    }

    return data;
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    const netErr: ApiClientError = new Error(err.message || 'Network connection failed. Please check your internet.') as ApiClientError;
    netErr.status = 0;
    netErr.code = 'NETWORK_ERROR';
    netErr.isNetworkError = true;
    throw netErr;
  }
}
