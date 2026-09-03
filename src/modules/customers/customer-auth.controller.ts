import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { CustomerService } from './customer.service.ts';
import { CustomerPasswordService } from './customer-password.service.ts';
import { CustomerEmailService } from './customer-email.service.ts';

export class CustomerAuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await CustomerService.register(req.body, { ipAddress, userAgent });

      // Set refresh token cookie if supported
      if (res.cookie) {
        res.cookie('lagoree_customer_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      const responsePayload: any = {
        customer: result.customer,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      };

      // In non-production environments, include verificationToken in response for test ergonomics
      if (process.env.NODE_ENV !== 'production') {
        responsePayload.verificationToken = result.verificationToken;
      }

      return ApiResponse.success(res, responsePayload, 201, 'Customer registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await CustomerService.login(req.body, { ipAddress, userAgent });

      if (res.cookie) {
        res.cookie('lagoree_customer_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      return ApiResponse.success(res, {
        customer: result.customer,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }, 200, 'Customer logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || (req as any).cookies?.lagoree_customer_refresh_token;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      await CustomerService.logout(refreshToken, { ipAddress, userAgent });

      if (res.clearCookie) {
        res.clearCookie('lagoree_customer_refresh_token');
        res.clearCookie('lagoree_customer_access_token');
      }

      return ApiResponse.success(res, null, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      await CustomerService.logoutAll(customerId, { ipAddress, userAgent });

      if (res.clearCookie) {
        res.clearCookie('lagoree_customer_refresh_token');
        res.clearCookie('lagoree_customer_access_token');
      }

      return ApiResponse.success(res, null, 200, 'All customer sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || (req as any).cookies?.lagoree_customer_refresh_token;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      if (!refreshToken) {
        return ApiResponse.unauthenticated(res, 'Refresh token is required');
      }

      const result = await CustomerService.refresh(refreshToken, { ipAddress, userAgent });

      if (res.cookie) {
        res.cookie('lagoree_customer_refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      return ApiResponse.success(res, result, 200, 'Access token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      const profile = await CustomerService.getProfile(customerId);
      return ApiResponse.success(res, profile, 200, 'Customer identity retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).customer?.id;
      await CustomerPasswordService.changePassword(
        customerId,
        req.body.currentPassword,
        req.body.newPassword
      );

      return ApiResponse.success(res, null, 200, 'Password changed successfully. Please log in again.');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CustomerPasswordService.requestPasswordReset(req.body.email);

      const responsePayload: any = {
        message: 'If an active account exists for this email, password reset instructions have been sent.'
      };

      if (process.env.NODE_ENV !== 'production' && result.rawToken) {
        responsePayload.resetToken = result.rawToken;
      }

      return ApiResponse.success(res, responsePayload, 200, 'Password reset request processed');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await CustomerPasswordService.resetPassword(req.body.token, req.body.newPassword);
      return ApiResponse.success(res, null, 200, 'Password has been reset successfully. Please log in with your new password.');
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CustomerEmailService.verifyEmail(req.body.token);
      return ApiResponse.success(res, result, 200, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CustomerEmailService.resendVerification(req.body.email);

      const responsePayload: any = {
        message: 'If the account exists and is unverified, a new verification link has been sent.'
      };

      if (result.alreadyVerified) {
        responsePayload.alreadyVerified = true;
      }
      if (process.env.NODE_ENV !== 'production' && result.rawToken) {
        responsePayload.verificationToken = result.rawToken;
      }

      return ApiResponse.success(res, responsePayload, 200, 'Verification email request processed');
    } catch (error) {
      next(error);
    }
  }
}
