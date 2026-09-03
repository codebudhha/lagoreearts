import crypto from 'node:crypto';
import { CustomerRepository } from './customer.repository.ts';
import type { CustomerSessionModel } from './customer.types.ts';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export class CustomerSessionService {
  /**
   * Generate a cryptographically secure random token (64 hex characters)
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Compute SHA-256 hash of raw token for safe database persistence
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new authenticated customer session with hashed refresh token
   */
  static async createSession(
    customerId: string,
    userAgent?: string | null,
    ipAddress?: string | null
  ): Promise<{ session: CustomerSessionModel; rawRefreshToken: string }> {
    const rawRefreshToken = this.generateSecureToken();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const session = await CustomerRepository.createSession({
      customerId,
      refreshTokenHash,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null
    });

    return { session, rawRefreshToken };
  }

  /**
   * Rotate refresh token: verifies old token, invalidates it, and issues a new refresh token
   */
  static async rotateRefreshToken(
    rawRefreshToken: string,
    userAgent?: string | null,
    ipAddress?: string | null
  ): Promise<{ session: CustomerSessionModel; newRawRefreshToken: string; customerId: string }> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      const error: any = new Error('Invalid refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await CustomerRepository.findSessionByTokenHash(tokenHash);

    if (!session) {
      const error: any = new Error('Session not found or refresh token invalid');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    if (session.revokedAt) {
      const error: any = new Error('Session has been revoked');
      error.statusCode = 401;
      error.code = 'SESSION_REVOKED';
      throw error;
    }

    if (new Date(session.expiresAt) <= new Date()) {
      const error: any = new Error('Refresh token has expired. Please log in again.');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_EXPIRED';
      throw error;
    }

    // Generate new rotated token and update session
    const newRawRefreshToken = this.generateSecureToken();
    const newRefreshTokenHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const updatedSession = await CustomerRepository.updateSession(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date()
    });

    return {
      session: updatedSession,
      newRawRefreshToken,
      customerId: session.customerId
    };
  }

  /**
   * Revoke session by raw refresh token
   */
  static async revokeSessionByToken(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') return;
    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await CustomerRepository.findSessionByTokenHash(tokenHash);
    if (session && !session.revokedAt) {
      await CustomerRepository.revokeSession(session.id);
    }
  }

  /**
   * Revoke session by ID
   */
  static async revokeSessionById(sessionId: string): Promise<CustomerSessionModel> {
    const session = await CustomerRepository.findSessionById(sessionId);
    if (!session) {
      const error: any = new Error('Session not found');
      error.statusCode = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }
    return CustomerRepository.revokeSession(sessionId);
  }

  /**
   * Revoke all active sessions for a customer
   */
  static async revokeAllSessions(customerId: string): Promise<number> {
    return CustomerRepository.revokeAllSessionsByCustomerId(customerId);
  }
}
