import { ENV } from '../config/env.ts';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  domain?: string;
  path: string;
  maxAge: number;
}

export const REFRESH_COOKIE_NAME = 'lagoree_admin_refresh_token';

/**
 * Get Secure Refresh Cookie Settings
 */
export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: ENV.IS_PROD,
    sameSite: 'lax',
    domain: ENV.COOKIE_DOMAIN,
    path: '/api/v1/admin/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
}
