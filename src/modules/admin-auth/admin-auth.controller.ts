import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { AdminAuthService } from './admin-auth.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { getRefreshCookieOptions, REFRESH_COOKIE_NAME } from '../../security/cookies.ts';
import { resetLoginAttempts, recordFailedLogin } from '../../middleware/rateLimiter.ts';

export class AdminAuthController {
  /**
   * POST /api/v1/admin/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminAuthService.login(req.body, meta);

      // Reset login rate limit attempts on success
      resetLoginAttempts(req);

      // Set Refresh Token as Secure HTTP-Only Cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      return ApiResponse.success(res, {
        admin: result.admin,
        accessToken: result.accessToken
      }, 200, 'Login successful');
    } catch (err: any) {
      recordFailedLogin(req);
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const refreshToken = (req as any).cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      const result = await AdminAuthService.refreshToken(refreshToken, meta);

      // Set rotated refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      return ApiResponse.success(res, {
        accessToken: result.accessToken
      }, 200, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const refreshToken = (req as any).cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      await AdminAuthService.logout(refreshToken, meta);

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/api/v1/admin/auth'
      });

      return ApiResponse.success(res, undefined, 200, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/logout-all
   */
  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      await AdminAuthService.logoutAll(req.admin!.id, meta);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/api/v1/admin/auth'
      });

      return ApiResponse.success(res, undefined, 200, 'All sessions revoked successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.getMe(req.admin!.id);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/change-password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminAuthService.changePassword(req.admin!.id, req.body, meta);

      // Clear refresh cookie since sessions were revoked
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/api/v1/admin/auth'
      });

      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminAuthService.forgotPassword(req.body, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const result = await AdminAuthService.resetPassword(req.body, meta);
      return ApiResponse.success(res, undefined, 200, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const updated = await AdminAuthService.updateProfile(req.admin!.id, req.body, meta);
      return ApiResponse.success(res, updated, 200, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
