import type { Request, Response, NextFunction } from '../utils/express.ts';
import { ApiResponse } from '../utils/apiResponse.ts';
import { ENV } from '../config/env.ts';

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

/**
 * IP and Email-aware Login Rate Limiter
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();

  const record = loginAttempts.get(key);

  if (record) {
    if (now > record.resetAt) {
      loginAttempts.delete(key);
    } else if (record.attempts >= ENV.RATE_LIMIT_MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      return ApiResponse.tooManyRequests(
        res,
        `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`
      );
    }
  }

  next();
}

/**
 * Register a failed login attempt
 */
export function recordFailedLogin(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();

  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, {
      attempts: 1,
      resetAt: now + ENV.RATE_LIMIT_WINDOW_MS
    });
  } else {
    record.attempts += 1;
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetLoginAttempts(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  loginAttempts.delete(key);
}
