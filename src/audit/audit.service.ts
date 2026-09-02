import { prisma } from '../database/prisma.ts';

export interface CreateAuditLogParams {
  adminUserId?: string | null;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Record an audit event without storing sensitive secrets/tokens
   */
  static log(params: CreateAuditLogParams): void {
    try {
      const sanitizedOld = this.sanitize(params.oldValues);
      const sanitizedNew = this.sanitize(params.newValues);

      prisma.adminAuditLog.create({
        data: {
          adminUserId: params.adminUserId || null,
          action: params.action,
          module: params.module,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: sanitizedOld,
          newValues: sanitizedNew,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent
        }
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  /**
   * Filter out sensitive credentials/hashes from audit logs
   */
  private static sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clone = Array.isArray(data) ? [...data] : { ...data };

    const forbiddenFields = [
      'password',
      'passwordHash',
      'password_hash',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'refreshTokenHash',
      'tokenHash',
      'secret'
    ];

    for (const key of Object.keys(clone)) {
      if (forbiddenFields.includes(key)) {
        delete clone[key];
      } else if (typeof clone[key] === 'object') {
        clone[key] = this.sanitize(clone[key]);
      }
    }

    return clone;
  }
}
