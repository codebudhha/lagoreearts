import crypto from 'node:crypto';

export class CartGuestService {
  /**
   * Generate a cryptographically secure 64-character hex guest cart token
   */
  static generateGuestToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Compute a deterministic SHA-256 hash of the guest cart token for database storage
   */
  static hashGuestToken(rawToken: string): string {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('Invalid guest cart token');
    }
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  /**
   * Validate token format (64-character hexadecimal string)
   */
  static isValidTokenFormat(rawToken: string): boolean {
    if (!rawToken || typeof rawToken !== 'string') return false;
    return /^[a-f0-9]{64}$/i.test(rawToken.trim());
  }
}
