import { prisma } from '../../database/prisma.ts';

export class AdminRolesRepository {
  static async listRoles() {
    return prisma.role.findMany({
      include: { permissions: true }
    });
  }

  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });
  }

  static async findBySlug(slug: string) {
    return prisma.role.findUnique({
      where: { slug },
      include: { permissions: true }
    });
  }

  static async countAdminsWithRole(roleId: string) {
    return prisma.adminUser.count({
      where: { roleId }
    });
  }

  static async createRole(data: {
    name: string;
    slug: string;
    description?: string;
  }) {
    return prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug.toUpperCase(),
        description: data.description,
        isSystem: false
      }
    });
  }

  static async updateRole(id: string, data: { name?: string; description?: string }) {
    return prisma.role.update({
      where: { id },
      data
    });
  }

  static async deleteRole(id: string) {
    return prisma.role.delete({
      where: { id }
    });
  }

  static async syncPermissions(roleId: string, permissionIds: string[]) {
    // 1. Delete existing
    prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // 2. Insert new relations
    if (permissionIds && permissionIds.length > 0) {
      prisma.rolePermission.createMany({
        data: permissionIds.map(pId => ({
          roleId,
          permissionId: pId
        }))
      });
    }

    return this.findById(roleId);
  }

  static async listPermissions(module?: string) {
    return prisma.permission.findMany({
      where: module ? { module } : undefined
    });
  }
}
