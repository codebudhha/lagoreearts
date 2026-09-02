import { prisma } from '../../database/prisma.ts';

export class AdminUsersRepository {
  static async findById(id: string) {
    return prisma.adminUser.findUnique({
      where: { id },
      include: { role: true }
    });
  }

  static async findByEmail(email: string) {
    return prisma.adminUser.findUnique({
      where: { email }
    });
  }

  static async findRoleById(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId }
    });
  }

  static async listUsers(params: {
    status?: string;
    roleId?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.roleId) where.roleId = params.roleId;
    if (params.search) where.search = params.search;

    const [users, total] = [
      prisma.adminUser.findMany({
        where,
        include: { role: true },
        take: params.take,
        skip: params.skip
      }),
      prisma.adminUser.count({ where })
    ];

    return { users, total };
  }

  static async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    roleId: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }) {
    return prisma.adminUser.create({
      data,
      include: { role: true }
    });
  }

  static async update(id: string, data: any) {
    return prisma.adminUser.update({
      where: { id },
      data,
      include: { role: true }
    });
  }

  static async delete(id: string) {
    return prisma.adminUser.delete({
      where: { id }
    });
  }

  static async revokeAllSessions(adminUserId: string) {
    return prisma.adminSession.revokeAllForUser(adminUserId);
  }
}
