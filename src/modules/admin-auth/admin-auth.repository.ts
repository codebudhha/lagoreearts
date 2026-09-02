import { prisma } from '../../database/prisma.ts';

export class AdminAuthRepository {
  static async findByEmail(email: string) {
    return prisma.adminUser.findUnique({
      where: { email },
      include: { role: true }
    });
  }

  static async findById(id: string) {
    return prisma.adminUser.findUnique({
      where: { id },
      include: { role: true }
    });
  }

  static async updateLastLogin(id: string) {
    return prisma.adminUser.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }

  static async updatePassword(id: string, passwordHash: string) {
    return prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date()
      }
    });
  }

  static async updateProfile(id: string, data: { name?: string; email?: string }) {
    return prisma.adminUser.update({
      where: { id },
      data,
      include: { role: true }
    });
  }

  static async createSession(data: {
    adminUserId: string;
    refreshTokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return prisma.adminSession.create({ data });
  }

  static async findSessionByHash(refreshTokenHash: string) {
    return prisma.adminSession.findFirst({
      where: { refreshTokenHash }
    });
  }

  static async updateSession(id: string, data: {
    refreshTokenHash?: string;
    expiresAt?: Date;
    revokedAt?: Date | null;
    lastUsedAt?: Date;
  }) {
    return prisma.adminSession.update({
      where: { id },
      data
    });
  }

  static async revokeAllSessions(adminUserId: string) {
    return prisma.adminSession.revokeAllForUser(adminUserId);
  }

  static async createPasswordReset(data: {
    adminUserId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.adminPasswordReset.create({ data });
  }

  static async findPasswordResetByHash(tokenHash: string) {
    return prisma.adminPasswordReset.findFirst({
      where: { tokenHash }
    });
  }

  static async markPasswordResetUsed(id: string) {
    return prisma.adminPasswordReset.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }
}
