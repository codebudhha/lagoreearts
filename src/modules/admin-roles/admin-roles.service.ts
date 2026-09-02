import { AdminRolesRepository } from './admin-roles.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { CreateRoleInput, UpdateRoleInput  } from './admin-roles.types.ts';

export class AdminRolesService {
  /**
   * List all roles with permission slugs
   */
  static async listRoles() {
    const roles = await AdminRolesRepository.listRoles();
    return roles.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissionCount: r.permissions?.length || 0,
      permissions: r.permissions?.map((p: any) => p.slug) || []
    }));
  }

  /**
   * Get single role by ID
   */
  static async getRoleById(id: string) {
    const role = await AdminRolesRepository.findById(id);
    if (!role) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Role not found' };
    }
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions || []
    };
  }

  /**
   * Create custom role
   */
  static async createRole(input: CreateRoleInput, actorAdminId: string, meta: any = {}) {
    const slug = input.slug.toUpperCase().trim();
    const existing = await AdminRolesRepository.findBySlug(slug);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_ROLE', message: 'Role with this slug already exists' };
    }

    const newRole = await AdminRolesRepository.createRole({
      name: input.name.trim(),
      slug,
      description: input.description
    });

    if (input.permissionIds && input.permissionIds.length > 0) {
      await AdminRolesRepository.syncPermissions(newRole.id, input.permissionIds);
    }

    const fullRole = await AdminRolesRepository.findById(newRole.id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ROLE_CREATED',
      module: 'ADMIN_ROLES',
      entityType: 'Role',
      entityId: newRole.id,
      newValues: { name: input.name, slug, permissionCount: input.permissionIds?.length || 0 },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return fullRole;
  }

  /**
   * Update role
   */
  static async updateRole(id: string, input: UpdateRoleInput, actorAdminId: string, meta: any = {}) {
    const role = await AdminRolesRepository.findById(id);
    if (!role) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Role not found' };
    }

    if (input.name || input.description !== undefined) {
      await AdminRolesRepository.updateRole(id, {
        name: input.name?.trim(),
        description: input.description
      });
    }

    if (input.permissionIds !== undefined) {
      await AdminRolesRepository.syncPermissions(id, input.permissionIds);
    }

    const updated = await AdminRolesRepository.findById(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ROLE_UPDATED',
      module: 'ADMIN_ROLES',
      entityType: 'Role',
      entityId: id,
      newValues: input,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  /**
   * Delete role with safety checks
   */
  static async deleteRole(id: string, actorAdminId: string, meta: any = {}) {
    const role = await AdminRolesRepository.findById(id);
    if (!role) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Role not found' };
    }

    // System roles cannot be deleted
    if (role.isSystem) {
      throw { status: 400, code: 'SYSTEM_ROLE_PROTECTED', message: 'System default roles cannot be deleted' };
    }

    // Check if any admin users are assigned to this role
    const adminCount = await AdminRolesRepository.countAdminsWithRole(id);
    if (adminCount > 0) {
      throw {
        status: 400,
        code: 'ROLE_IN_USE',
        message: `Cannot delete role: ${adminCount} admin user(s) currently assigned to it. Please reassign them first.`
      };
    }

    await AdminRolesRepository.deleteRole(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ROLE_DELETED',
      module: 'ADMIN_ROLES',
      entityType: 'Role',
      entityId: id,
      oldValues: { name: role.name, slug: role.slug },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Role deleted successfully' };
  }

  /**
   * List available system permissions grouped by module
   */
  static async listPermissions(module?: string) {
    const permissions = await AdminRolesRepository.listPermissions(module);

    const grouped: Record<string, any[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return {
      total: permissions.length,
      modules: grouped,
      permissions
    };
  }
}
