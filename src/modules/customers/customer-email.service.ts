import crypto from 'node:crypto';
import { CustomerRepository } from './customer.repository.ts';
import { normalizeEmail } from './customer.validator.ts';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

export class CustomerEmailService {
  /**
   * Create and persist a new email verification token for a customer
   */
  static async createVerificationToken(customerId: string): Promise<string> {
    // Invalidate existing unused verification tokens
    await CustomerRepository.invalidateExistingEmailVerifications(customerId);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await CustomerRepository.createEmailVerification({
      customerId,
      tokenHash,
      expiresAt
    });

    return rawToken;
  }

  /**
   * Verify email address using verification token
   */
  static async verifyEmail(token: string): Promise<{ customerId: string; alreadyVerified?: boolean }> {
    if (!token || typeof token !== 'string') {
      const error: any = new Error('Verification token is required');
      error.statusCode = 400;
      error.code = 'INVALID_VERIFICATION_TOKEN';
      throw error;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const record = await CustomerRepository.findEmailVerificationByTokenHash(tokenHash);

    if (!record) {
      const error: any = new Error('Invalid or expired email verification token');
      error.statusCode = 400;
      error.code = 'INVALID_VERIFICATION_TOKEN';
      throw error;
    }

    if (record.verifiedAt) {
      return { customerId: record.customerId, alreadyVerified: true };
    }

    if (new Date(record.expiresAt) <= new Date()) {
      const error: any = new Error('Email verification token has expired. Please request a new verification email.');
      error.statusCode = 400;
      error.code = 'VERIFICATION_TOKEN_EXPIRED';
      throw error;
    }

    const customer = await CustomerRepository.findById(record.customerId);
    if (!customer) {
      const error: any = new Error('Customer account not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const now = new Date();
    await CustomerRepository.update(customer.id, { emailVerifiedAt: now });
    await CustomerRepository.markEmailVerified(record.id);

    return { customerId: customer.id };
  }

  /**
   * Resend email verification link/token
   */
  static async resendVerification(email: string): Promise<{ rawToken?: string; alreadyVerified?: boolean }> {
    const normEmail = normalizeEmail(email);
    const customer = await CustomerRepository.findByNormalizedEmail(normEmail);

    if (!customer || customer.status !== 'ACTIVE') {
      return {}; // Generic response to prevent account enumeration
    }

    if (customer.emailVerifiedAt) {
      return { alreadyVerified: true };
    }

    const rawToken = await this.createVerificationToken(customer.id);
    return { rawToken };
  }
}
