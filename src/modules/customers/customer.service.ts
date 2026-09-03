import { CustomerRepository } from './customer.repository.ts';
import { CustomerSessionService } from './customer-session.service.ts';
import { CustomerEmailService } from './customer-email.service.ts';
import { CustomerPasswordService } from './customer-password.service.ts';
import { generateCustomerAccessToken } from '../../security/customer-jwt.ts';
import { hashPassword, verifyPassword } from '../../security/password.ts';
import { normalizeEmail, sanitizeText } from './customer.validator.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CustomerModel,
  CustomerRegisterDTO,
  CustomerLoginDTO,
  CustomerUpdateProfileDTO,
  AdminCustomerQueryFilter,
  AdminUpdateCustomerDTO,
  CustomerStatus,
  PublicCustomerDTO,
  AdminCustomerDTO
} from './customer.types.ts';

export function formatPublicCustomer(customer: CustomerModel): PublicCustomerDTO {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone || null,
    status: customer.status,
    emailVerifiedAt: customer.emailVerifiedAt ? new Date(customer.emailVerifiedAt) : null,
    createdAt: new Date(customer.createdAt)
  };
}

export function formatAdminCustomer(customer: CustomerModel): AdminCustomerDTO {
  return {
    id: customer.id,
    email: customer.email,
    normalizedEmail: customer.normalizedEmail,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone || null,
    status: customer.status,
    emailVerifiedAt: customer.emailVerifiedAt ? new Date(customer.emailVerifiedAt) : null,
    lastLoginAt: customer.lastLoginAt ? new Date(customer.lastLoginAt) : null,
    createdAt: new Date(customer.createdAt),
    updatedAt: new Date(customer.updatedAt),
    addressCount: customer.addresses?.length || 0,
    sessionCount: customer.sessions?.length || 0
  };
}

export class CustomerService {
  // ==========================================
  // Storefront Customer Auth Operations
  // ==========================================

  static async register(
    dto: CustomerRegisterDTO,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ customer: PublicCustomerDTO; accessToken: string; refreshToken: string; verificationToken: string }> {
    const normEmail = normalizeEmail(dto.email);

    const existing = await CustomerRepository.findByNormalizedEmail(normEmail);
    if (existing) {
      const error: any = new Error(`An account with email "${dto.email}" already exists`);
      error.statusCode = 409;
      error.code = 'CUSTOMER_EMAIL_EXISTS';
      throw error;
    }

    const passwordHash = await hashPassword(dto.password);

    const customer = await CustomerRepository.create({
      email: dto.email.trim(),
      normalizedEmail: normEmail,
      passwordHash,
      firstName: sanitizeText(dto.firstName),
      lastName: sanitizeText(dto.lastName),
      phone: dto.phone ? sanitizeText(dto.phone) : null,
      status: 'ACTIVE'
    });

    // Create verification token
    const verificationToken = await CustomerEmailService.createVerificationToken(customer.id);

    // Create login session
    const { rawRefreshToken } = await CustomerSessionService.createSession(
      customer.id,
      meta?.userAgent,
      meta?.ipAddress
    );

    const accessToken = generateCustomerAccessToken({
      sub: customer.id,
      email: customer.email
    });

    AuditService.log({
      action: 'CUSTOMER_CREATED',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: { email: customer.email, firstName: customer.firstName, lastName: customer.lastName },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return {
      customer: formatPublicCustomer(customer),
      accessToken,
      refreshToken: rawRefreshToken,
      verificationToken
    };
  }

  static async login(
    dto: CustomerLoginDTO,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ customer: PublicCustomerDTO; accessToken: string; refreshToken: string }> {
    const normEmail = normalizeEmail(dto.email);
    const customer = await CustomerRepository.findByNormalizedEmail(normEmail);

    if (!customer) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isPasswordValid = await verifyPassword(dto.password, customer.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (customer.status !== 'ACTIVE') {
      const error: any = new Error(`Your account is ${customer.status.toLowerCase()}. Access denied.`);
      error.statusCode = 403;
      error.code = `CUSTOMER_ACCOUNT_${customer.status}`;
      throw error;
    }

    // Update lastLoginAt
    await CustomerRepository.update(customer.id, { lastLoginAt: new Date() });

    // Issue rotating refresh session and access token
    const { rawRefreshToken } = await CustomerSessionService.createSession(
      customer.id,
      meta?.userAgent,
      meta?.ipAddress
    );

    const accessToken = generateCustomerAccessToken({
      sub: customer.id,
      email: customer.email
    });

    AuditService.log({
      action: 'CUSTOMER_LOGIN',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customer.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return {
      customer: formatPublicCustomer(customer),
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  static async refresh(
    rawRefreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { newRawRefreshToken, customerId } = await CustomerSessionService.rotateRefreshToken(
      rawRefreshToken,
      meta?.userAgent,
      meta?.ipAddress
    );

    const customer = await CustomerRepository.findById(customerId);
    if (!customer || customer.status !== 'ACTIVE') {
      const error: any = new Error('Customer account not found or is inactive');
      error.statusCode = 403;
      error.code = 'CUSTOMER_INACTIVE';
      throw error;
    }

    const accessToken = generateCustomerAccessToken({
      sub: customer.id,
      email: customer.email
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken
    };
  }

  static async logout(
    rawRefreshToken?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    if (rawRefreshToken) {
      await CustomerSessionService.revokeSessionByToken(rawRefreshToken);
    }
  }

  static async logoutAll(
    customerId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await CustomerSessionService.revokeAllSessions(customerId);

    AuditService.log({
      action: 'CUSTOMER_LOGOUT_ALL',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customerId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });
  }

  // ==========================================
  // Storefront Profile Operations
  // ==========================================

  static async getProfile(customerId: string): Promise<PublicCustomerDTO> {
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) {
      const error: any = new Error('Customer account not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }
    return formatPublicCustomer(customer);
  }

  static async updateProfile(
    customerId: string,
    dto: CustomerUpdateProfileDTO,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ customer: PublicCustomerDTO; verificationToken?: string }> {
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) {
      const error: any = new Error('Customer account not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    let verificationToken: string | undefined;
    let isEmailChanged = false;
    let nextEmail = customer.email;
    let nextNormEmail = customer.normalizedEmail;
    let nextEmailVerifiedAt = customer.emailVerifiedAt;

    if (dto.email && dto.email.trim().toLowerCase() !== customer.normalizedEmail) {
      const candidateNorm = normalizeEmail(dto.email);
      const duplicate = await CustomerRepository.findByNormalizedEmail(candidateNorm);
      if (duplicate && duplicate.id !== customerId) {
        const error: any = new Error(`An account with email "${dto.email}" already exists`);
        error.statusCode = 409;
        error.code = 'CUSTOMER_EMAIL_EXISTS';
        throw error;
      }

      nextEmail = dto.email.trim();
      nextNormEmail = candidateNorm;
      nextEmailVerifiedAt = null; // Invalidate verification on email change
      isEmailChanged = true;

      verificationToken = await CustomerEmailService.createVerificationToken(customerId);

      AuditService.log({
        action: 'CUSTOMER_EMAIL_CHANGED',
        module: 'CUSTOMER',
        entityType: 'Customer',
        entityId: customerId,
        oldValues: { email: customer.email },
        newValues: { email: nextEmail },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    const updated = await CustomerRepository.update(customerId, {
      firstName: dto.firstName ? sanitizeText(dto.firstName) : undefined,
      lastName: dto.lastName ? sanitizeText(dto.lastName) : undefined,
      phone: dto.phone !== undefined ? (dto.phone ? sanitizeText(dto.phone) : null) : undefined,
      email: isEmailChanged ? nextEmail : undefined,
      normalizedEmail: isEmailChanged ? nextNormEmail : undefined,
      emailVerifiedAt: isEmailChanged ? null : undefined
    });

    AuditService.log({
      action: 'CUSTOMER_UPDATED',
      module: 'CUSTOMER',
      entityType: 'Customer',
      entityId: customerId,
      oldValues: { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone },
      newValues: { firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return {
      customer: formatPublicCustomer(updated),
      verificationToken
    };
  }

  // ==========================================
  // Admin Customer Management Operations
  // ==========================================

  static async listAdminCustomers(filter: AdminCustomerQueryFilter = {}) {
    const result = await CustomerRepository.list(filter);
    return {
      items: result.items.map(formatAdminCustomer),
      pagination: result.pagination
    };
  }

  static async getAdminCustomerById(id: string): Promise<AdminCustomerDTO> {
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }
    return formatAdminCustomer(customer);
  }

  static async updateAdminCustomer(
    id: string,
    dto: AdminUpdateCustomerDTO,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<AdminCustomerDTO> {
    const existing = await CustomerRepository.findById(id);
    if (!existing) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const updated = await CustomerRepository.update(id, {
      firstName: dto.firstName ? sanitizeText(dto.firstName) : undefined,
      lastName: dto.lastName ? sanitizeText(dto.lastName) : undefined,
      phone: dto.phone !== undefined ? (dto.phone ? sanitizeText(dto.phone) : null) : undefined
    });

    if (adminUserId) {
      AuditService.log({
        adminUserId,
        action: 'CUSTOMER_UPDATED',
        module: 'CUSTOMER',
        entityType: 'Customer',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return formatAdminCustomer(updated);
  }

  static async updateCustomerStatus(
    id: string,
    status: CustomerStatus,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<AdminCustomerDTO> {
    const existing = await CustomerRepository.findById(id);
    if (!existing) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const updated = await CustomerRepository.update(id, { status });

    // If customer is deactivated or suspended, revoke active sessions
    if (status !== 'ACTIVE') {
      await CustomerSessionService.revokeAllSessions(id);
    }

    if (adminUserId) {
      AuditService.log({
        adminUserId,
        action: 'CUSTOMER_STATUS_CHANGED',
        module: 'CUSTOMER',
        entityType: 'Customer',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: updated.status },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return formatAdminCustomer(updated);
  }

  static async getCustomerAddressesByAdmin(customerId: string) {
    await this.getAdminCustomerById(customerId);
    return CustomerRepository.findAddressesByCustomerId(customerId);
  }

  static async getCustomerSessionsByAdmin(customerId: string) {
    await this.getAdminCustomerById(customerId);
    const sessions = await CustomerRepository.findAllSessionsByCustomerId(customerId);
    // Sanitize session hashes from admin response
    return sessions.map(s => ({
      id: s.id,
      customerId: s.customerId,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isActive: !s.revokedAt && new Date(s.expiresAt) > new Date()
    }));
  }

  static async revokeCustomerSessionsByAdmin(
    customerId: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ revokedCount: number }> {
    await this.getAdminCustomerById(customerId);
    const count = await CustomerSessionService.revokeAllSessions(customerId);

    if (adminUserId) {
      AuditService.log({
        adminUserId,
        action: 'CUSTOMER_SESSIONS_REVOKED',
        module: 'CUSTOMER',
        entityType: 'Customer',
        entityId: customerId,
        newValues: { revokedCount: count },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return { revokedCount: count };
  }
}
