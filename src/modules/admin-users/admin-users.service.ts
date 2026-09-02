import { AdminUsersRepository } from './admin-users.repository.ts';
import { hashPassword } from '../../security/password.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { CreateAdminUserInput, UpdateAdminUserInput, UpdateAdminStatusInput, ListAdminUsersQuery  } from './admin-users.types.ts';

export class AdminUsersService {
  /**
   * List Admin Users with pagination & filtering
   */
  static async listUsers(query: ListAdminUsersQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const { users, total } = await AdminUsersRepository.listUsers({
      status: query.status,
      roleId: query.roleId,
      search: query.search,
      skip,
      take: limit
    });

    return {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        role: {
          id: u.role?.id,
          name: u.role?.name,
          slug: u.role?.slug
        },
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single Admin User by ID
   */
  static async getUserById(id: string) {
    const user = await AdminUsersRepository.findById(id);
    if (!user) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        slug: user.role?.slug,
        permissions: user.role?.permissions?.map((p: any) => p.slug) || []
      },
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Create New Admin User
   */
  static async createUser(input: CreateAdminUserInput, actorAdminId: string, meta: any = {}) {
    const email = input.email.toLowerCase().trim();

    // 1. Check duplicate email
    const existing = await AdminUsersRepository.findByEmail(email);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_EMAIL', message: 'An admin user with this email already exists' };
    }

    // 2. Validate Role Existence
    const role = await AdminUsersRepository.findRoleById(input.roleId);
    if (!role) {
      throw { status: 400, code: 'INVALID_ROLE', message: 'Specified role does not exist' };
    }

    // 3. Hash password
    const passwordHash = await hashPassword(input.password);

    // 4. Create User
    const newUser = await AdminUsersRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
      roleId: input.roleId,
      status: input.status || 'ACTIVE'
    });

    // 5. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ADMIN_CREATED',
      module: 'ADMIN_USERS',
      entityType: 'AdminUser',
      entityId: newUser?.id,
      newValues: { name: newUser?.name, email: newUser?.email, roleId: newUser?.roleId, status: newUser?.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      id: newUser?.id,
      name: newUser?.name,
      email: newUser?.email,
      status: newUser?.status,
      role: {
        id: newUser?.role?.id,
        name: newUser?.role?.name,
        slug: newUser?.role?.slug
      },
      createdAt: newUser?.createdAt
    };
  }

  /**
   * Update Admin User
   */
  static async updateUser(id: string, input: UpdateAdminUserInput, actorAdminId: string, meta: any = {}) {
    const user = await AdminUsersRepository.findById(id);
    if (!user) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    if (input.email) {
      const email = input.email.toLowerCase().trim();
      const existing = await AdminUsersRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw { status: 400, code: 'DUPLICATE_EMAIL', message: 'Email already in use' };
      }
    }

    if (input.roleId) {
      const role = await AdminUsersRepository.findRoleById(input.roleId);
      if (!role) {
        throw { status: 400, code: 'INVALID_ROLE', message: 'Specified role does not exist' };
      }
    }

    const updated = await AdminUsersRepository.update(id, input);

    // If status changed to INACTIVE / SUSPENDED, revoke active sessions
    if (input.status && input.status !== 'ACTIVE') {
      await AdminUsersRepository.revokeAllSessions(id);
    }

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ADMIN_UPDATED',
      module: 'ADMIN_USERS',
      entityType: 'AdminUser',
      entityId: id,
      oldValues: { name: user.name, email: user.email, roleId: user.roleId, status: user.status },
      newValues: input,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      id: updated?.id,
      name: updated?.name,
      email: updated?.email,
      status: updated?.status,
      role: {
        id: updated?.role?.id,
        name: updated?.role?.name,
        slug: updated?.role?.slug
      },
      updatedAt: updated?.updatedAt
    };
  }

  /**
   * Update Admin Status (Activate, Deactivate, Suspend)
   */
  static async updateStatus(id: string, input: UpdateAdminStatusInput, actorAdminId: string, meta: any = {}) {
    const user = await AdminUsersRepository.findById(id);
    if (!user) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    // Prevent deactivating oneself
    if (id === actorAdminId && input.status !== 'ACTIVE') {
      throw { status: 400, code: 'CANNOT_DEACTIVATE_SELF', message: 'You cannot deactivate your own account' };
    }

    const updated = await AdminUsersRepository.update(id, { status: input.status });

    // Revoke all sessions immediately on deactivation or suspension
    if (input.status !== 'ACTIVE') {
      await AdminUsersRepository.revokeAllSessions(id);
    }

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'STATUS_CHANGED',
      module: 'ADMIN_USERS',
      entityType: 'AdminUser',
      entityId: id,
      oldValues: { status: user.status },
      newValues: { status: input.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      id: updated?.id,
      name: updated?.name,
      email: updated?.email,
      status: updated?.status,
      message: `Admin account status changed to ${input.status}`
    };
  }

  /**
   * Delete Admin User
   */
  static async deleteUser(id: string, actorAdminId: string, meta: any = {}) {
    const user = await AdminUsersRepository.findById(id);
    if (!user) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Admin user not found' };
    }

    if (id === actorAdminId) {
      throw { status: 400, code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' };
    }

    await AdminUsersRepository.revokeAllSessions(id);
    await AdminUsersRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'ADMIN_DELETED',
      module: 'ADMIN_USERS',
      entityType: 'AdminUser',
      entityId: id,
      oldValues: { name: user.name, email: user.email, roleId: user.roleId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Admin user deleted successfully' };
  }
}
