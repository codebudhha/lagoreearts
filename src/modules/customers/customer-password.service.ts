import crypto from 'node:crypto';
import { CustomerRepository } from './customer.repository.ts';
import { CustomerSessionService } from './customer-session.service.ts';
import { hashPassword, verifyPassword } from '../../security/password.ts';
import { normalizeEmail } from './customer.validator.ts';

const RESET_TOKEN_EXPIRY_HOURS = 1;

export class CustomerPasswordService {
  /**
   * Request password reset token.
   * Always returns a generic success response to prevent account enumeration attacks.
   */
  static async requestPasswordReset(email: string): Promise<{ rawToken?: string; customerId?: string }> {
    const normEmail = normalizeEmail(email);
    const customer = await CustomerRepository.findByNormalizedEmail(normEmail);

    if (!customer || customer.status !== 'ACTIVE') {
      return {}; // Generic response, do not reveal account non-existence or suspension
    }

    // Invalidate existing unused reset tokens
    await CustomerRepository.invalidateExistingPasswordResets(customer.id);

    // Generate cryptographically secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await CustomerRepository.createPasswordReset({
      customerId: customer.id,
      tokenHash,
      expiresAt
    });

    return { rawToken, customerId: customer.id };
  }

  /**
   * Execute password reset with verification of token, expiration, and one-time use
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ customerId: string }> {
    if (!token || typeof token !== 'string') {
      const error: any = new Error('Reset token is required');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const resetRecord = await CustomerRepository.findPasswordResetByTokenHash(tokenHash);

    if (!resetRecord) {
      const error: any = new Error('Invalid or expired password reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    if (resetRecord.usedAt) {
      const error: any = new Error('This password reset token has already been used');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_ALREADY_USED';
      throw error;
    }

    if (new Date(resetRecord.expiresAt) <= new Date()) {
      const error: any = new Error('Password reset token has expired. Please request a new one.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_EXPIRED';
      throw error;
    }

    const customer = await CustomerRepository.findById(resetRecord.customerId);
    if (!customer || customer.status !== 'ACTIVE') {
      const error: any = new Error('Customer account not found or is inactive');
      error.statusCode = 400;
      error.code = 'CUSTOMER_INACTIVE';
      throw error;
    }

    const newPasswordHash = await hashPassword(newPassword);

    // 1. Update customer password
    await CustomerRepository.update(customer.id, { passwordHash: newPasswordHash });

    // 2. Mark reset token used
    await CustomerRepository.markPasswordResetUsed(resetRecord.id);

    // 3. Invalidate all active customer sessions for security
    await CustomerSessionService.revokeAllSessions(customer.id);

    return { customerId: customer.id };
  }

  /**
   * Authenticated password change
   */
  static async changePassword(customerId: string, currentPassword: string, newPassword: string): Promise<void> {
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) {
      const error: any = new Error('Customer account not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const isValidCurrent = await verifyPassword(currentPassword, customer.passwordHash);
    if (!isValidCurrent) {
      const error: any = new Error('Current password is incorrect');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    const newPasswordHash = await hashPassword(newPassword);

    // 1. Update customer password
    await CustomerRepository.update(customerId, { passwordHash: newPasswordHash });

    // 2. Invalidate all active customer sessions
    await CustomerSessionService.revokeAllSessions(customerId);
  }
}
