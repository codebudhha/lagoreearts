import { AdminAuthRepository } from './admin-auth.repository.ts';
import { verifyPassword, hashPassword } from '../../security/password.ts';
import { generateAccessToken } from '../../security/jwt.ts';
import { generateRandomToken, hashToken } from '../../security/tokens.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput, UpdateProfileInput, RequestMetadata  } from './admin-auth.types.ts';

export class AdminAuthService {
  /**
   * 1. Admin Login with Session Creation
   */
  static async login(input: LoginInput, meta: RequestMetadata = {}) {
    const email = input.email.toLowerCase().trim();
    const admin = await AdminAuthRepository.findByEmail(email);

    if (!admin) {
      AuditService.log({
        action: 'LOGIN_FAILED',
        module: 'ADMIN_AUTH',
        newValues: { email, reason: 'USER_NOT_FOUND' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Invalid email or password' };
    }

    // Check account status
    if (admin.status !== 'ACTIVE') {
      AuditService.log({
        adminUserId: admin.id,
        action: 'LOGIN_FAILED',
        module: 'ADMIN_AUTH',
        newValues: { email, reason: `STATUS_${admin.status}` },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      throw { status: 403, code: 'FORBIDDEN', message: `Account is ${admin.status.toLowerCase()}. Access denied.` };
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(input.password, admin.passwordHash);
    if (!isPasswordValid) {
      AuditService.log({
        adminUserId: admin.id,
        action: 'LOGIN_FAILED',
        module: 'ADMIN_AUTH',
        newValues: { email, reason: 'INVALID_PASSWORD' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Invalid email or password' };
    }

    // Issue Access Token
    const accessToken = generateAccessToken({
      sub: admin.id,
      roleId: admin.roleId
    });

    // Issue & Store Hashed Refresh Token
    const rawRefreshToken = generateRandomToken(40);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await AdminAuthRepository.createSession({
      adminUserId: admin.id,
      refreshTokenHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt
    });

    // Update last login
    await AdminAuthRepository.updateLastLogin(admin.id);

    // Audit Success
    AuditService.log({
      adminUserId: admin.id,
      action: 'LOGIN_SUCCESS',
      module: 'ADMIN_AUTH',
      entityType: 'AdminUser',
      entityId: admin.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: {
          id: admin.role.id,
          name: admin.role.name,
          slug: admin.role.slug
        }
      },
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * 2. Refresh Token Rotation
   */
  static async refreshToken(rawRefreshToken: string, meta: RequestMetadata = {}) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Refresh token required' };
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await AdminAuthRepository.findSessionByHash(tokenHash);

    if (!session) {
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Invalid refresh session' };
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Refresh token expired' };
    }

    // Check if session was already revoked
    if (session.revokedAt) {
      // Possible token reuse / breach! Revoke all sessions for safety
      await AdminAuthRepository.revokeAllSessions(session.adminUserId);
      AuditService.log({
        adminUserId: session.adminUserId,
        action: 'SECURITY_ALERT_TOKEN_REUSE',
        module: 'ADMIN_AUTH',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      throw { status: 401, code: 'UNAUTHENTICATED', message: 'Session revoked' };
    }

    // Fetch user and check active status
    const admin = await AdminAuthRepository.findById(session.adminUserId);
    if (!admin || admin.status !== 'ACTIVE') {
      throw { status: 403, code: 'FORBIDDEN', message: 'Account is inactive' };
    }

    // Rotate refresh token
    const newRawRefreshToken = generateRandomToken(40);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update existing session record (replace old hash & update last used)
    await AdminAuthRepository.updateSession(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date()
    });

    // Issue new Access Token
    const accessToken = generateAccessToken({
      sub: admin.id,
      roleId: admin.roleId
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken
    };
  }

  /**
   * 3. Logout (Revoke current session)
   */
  static async logout(rawRefreshToken: string, meta: RequestMetadata = {}) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const session = await AdminAuthRepository.findSessionByHash(tokenHash);
      if (session) {
        await AdminAuthRepository.updateSession(session.id, { revokedAt: new Date() });
        AuditService.log({
          adminUserId: session.adminUserId,
          action: 'LOGOUT',
          module: 'ADMIN_AUTH',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent
        });
      }
    }
    return { success: true };
  }

  /**
   * 4. Logout All Sessions
   */
  static async logoutAll(adminUserId: string, meta: RequestMetadata = {}) {
    await AdminAuthRepository.revokeAllSessions(adminUserId);
    AuditService.log({
      adminUserId,
      action: 'LOGOUT_ALL_SESSIONS',
      module: 'ADMIN_AUTH',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });
    return { success: true };
  }

  /**
   * 5. Current Admin Profile (Me)
   */
  static async getMe(adminUserId: string) {
    const admin = await AdminAuthRepository.findById(adminUserId);
    if (!admin) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    const permissions = admin.role?.permissions?.map((p: any) => p.slug) || [];

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: {
          id: admin.role.id,
          name: admin.role.name,
          slug: admin.role.slug
        },
        permissions
      }
    };
  }

  /**
   * 6. Change Password
   */
  static async changePassword(adminUserId: string, input: ChangePasswordInput, meta: RequestMetadata = {}) {
    const admin = await AdminAuthRepository.findById(adminUserId);
    if (!admin) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(input.currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      AuditService.log({
        adminUserId,
        action: 'PASSWORD_CHANGE_FAILED',
        module: 'ADMIN_AUTH',
        newValues: { reason: 'INVALID_CURRENT_PASSWORD' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      throw { status: 400, code: 'INVALID_PASSWORD', message: 'Current password is incorrect' };
    }

    // Hash new password
    const newHash = await hashPassword(input.newPassword);
    await AdminAuthRepository.updatePassword(adminUserId, newHash);

    // Revoke all existing sessions so admin must log in again
    await AdminAuthRepository.revokeAllSessions(adminUserId);

    AuditService.log({
      adminUserId,
      action: 'PASSWORD_CHANGED',
      module: 'ADMIN_AUTH',
      entityType: 'AdminUser',
      entityId: adminUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Password changed successfully. Please log in with your new password.' };
  }

  /**
   * 7. Forgot Password (Generic safe response)
   */
  static async forgotPassword(input: ForgotPasswordInput, meta: RequestMetadata = {}) {
    const email = input.email.toLowerCase().trim();
    const admin = await AdminAuthRepository.findByEmail(email);

    if (admin && admin.status === 'ACTIVE') {
      const rawResetToken = generateRandomToken(32);
      const tokenHash = hashToken(rawResetToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await AdminAuthRepository.createPasswordReset({
        adminUserId: admin.id,
        tokenHash,
        expiresAt
      });

      AuditService.log({
        adminUserId: admin.id,
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'ADMIN_AUTH',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });

      // (In production email dispatcher would send rawResetToken to admin.email)
    }

    // Always return identical generic message to prevent account enumeration
    return {
      success: true,
      message: 'If the account exists, password reset instructions have been sent.'
    };
  }

  /**
   * 8. Reset Password
   */
  static async resetPassword(input: ResetPasswordInput, meta: RequestMetadata = {}) {
    const tokenHash = hashToken(input.token);
    const resetRecord = await AdminAuthRepository.findPasswordResetByHash(tokenHash);

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw { status: 400, code: 'INVALID_TOKEN', message: 'Password reset token is invalid or has expired' };
    }

    const newHash = await hashPassword(input.password);

    // Update password
    await AdminAuthRepository.updatePassword(resetRecord.adminUserId, newHash);

    // Mark reset token used
    await AdminAuthRepository.markPasswordResetUsed(resetRecord.id);

    // Invalidate all active sessions for this admin
    await AdminAuthRepository.revokeAllSessions(resetRecord.adminUserId);

    AuditService.log({
      adminUserId: resetRecord.adminUserId,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'ADMIN_AUTH',
      entityType: 'AdminUser',
      entityId: resetRecord.adminUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new credentials.'
    };
  }

  /**
   * 9. Update Profile (Name, Email only)
   */
  static async updateProfile(adminUserId: string, input: UpdateProfileInput, meta: RequestMetadata = {}) {
    if (input.email) {
      const email = input.email.toLowerCase().trim();
      const existing = await AdminAuthRepository.findByEmail(email);
      if (existing && existing.id !== adminUserId) {
        throw { status: 400, code: 'DUPLICATE_EMAIL', message: 'Email is already in use by another account' };
      }
    }

    const updated = await AdminAuthRepository.updateProfile(adminUserId, {
      name: input.name,
      email: input.email ? input.email.toLowerCase().trim() : undefined
    });

    AuditService.log({
      adminUserId,
      action: 'ADMIN_PROFILE_UPDATED',
      module: 'ADMIN_AUTH',
      entityType: 'AdminUser',
      entityId: adminUserId,
      newValues: { name: updated?.name, email: updated?.email },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      id: updated?.id,
      name: updated?.name,
      email: updated?.email
    };
  }
}
