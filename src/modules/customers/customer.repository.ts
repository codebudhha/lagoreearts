import { prisma } from '../../database/prisma.ts';
import type {
  CustomerModel,
  CustomerSessionModel,
  CustomerPasswordResetModel,
  CustomerEmailVerificationModel,
  CustomerAddressModel,
  AdminCustomerQueryFilter,
  CustomerStatus,
  AddressType
} from './customer.types.ts';

export class CustomerRepository {
  // ==========================================
  // Customer Methods
  // ==========================================

  static async findById(id: string): Promise<CustomerModel | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: { addresses: true, sessions: true }
    });
  }

  static async findByNormalizedEmail(email: string): Promise<CustomerModel | null> {
    return prisma.customer.findUnique({
      where: { normalizedEmail: email.toLowerCase().trim() },
      include: { addresses: true, sessions: true }
    });
  }

  static async list(filter: AdminCustomerQueryFilter = {}) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.search) where.search = filter.search.trim();
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const orderBy: any = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { addresses: true, sessions: true },
        orderBy,
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ]);

    return {
      items: items || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async create(data: {
    email: string;
    normalizedEmail: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    status?: CustomerStatus;
  }): Promise<CustomerModel> {
    return prisma.customer.create({
      data: {
        email: data.email,
        normalizedEmail: data.normalizedEmail,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        status: data.status || 'ACTIVE'
      },
      include: { addresses: true }
    });
  }

  static async update(
    id: string,
    data: {
      email?: string;
      normalizedEmail?: string;
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      status?: CustomerStatus;
      emailVerifiedAt?: Date | null;
      lastLoginAt?: Date | null;
    }
  ): Promise<CustomerModel> {
    return prisma.customer.update({
      where: { id },
      data,
      include: { addresses: true, sessions: true }
    });
  }

  static async delete(id: string): Promise<CustomerModel | null> {
    return prisma.customer.delete({
      where: { id }
    });
  }

  // ==========================================
  // Session Methods
  // ==========================================

  static async findSessionById(id: string): Promise<CustomerSessionModel | null> {
    return prisma.customerSession.findUnique({
      where: { id }
    });
  }

  static async findSessionByTokenHash(hash: string): Promise<CustomerSessionModel | null> {
    return prisma.customerSession.findUnique({
      where: { refreshTokenHash: hash }
    });
  }

  static async findActiveSessionsByCustomerId(customerId: string): Promise<CustomerSessionModel[]> {
    return prisma.customerSession.findMany({
      where: {
        customerId,
        revokedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findAllSessionsByCustomerId(customerId: string): Promise<CustomerSessionModel[]> {
    return prisma.customerSession.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createSession(data: {
    customerId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<CustomerSessionModel> {
    return prisma.customerSession.create({
      data
    });
  }

  static async updateSession(id: string, data: {
    refreshTokenHash?: string;
    expiresAt?: Date;
    revokedAt?: Date | null;
    lastUsedAt?: Date;
  }): Promise<CustomerSessionModel> {
    return prisma.customerSession.update({
      where: { id },
      data
    });
  }

  static async revokeSession(id: string): Promise<CustomerSessionModel> {
    return prisma.customerSession.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  static async revokeAllSessionsByCustomerId(customerId: string): Promise<number> {
    const result = await prisma.customerSession.updateMany({
      where: {
        customerId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
    return result.count;
  }

  // ==========================================
  // Password Reset Methods
  // ==========================================

  static async findPasswordResetByTokenHash(tokenHash: string): Promise<CustomerPasswordResetModel | null> {
    return prisma.customerPasswordReset.findUnique({
      where: { tokenHash }
    });
  }

  static async createPasswordReset(data: {
    customerId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CustomerPasswordResetModel> {
    return prisma.customerPasswordReset.create({
      data
    });
  }

  static async markPasswordResetUsed(id: string): Promise<CustomerPasswordResetModel> {
    return prisma.customerPasswordReset.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  static async invalidateExistingPasswordResets(customerId: string): Promise<void> {
    await prisma.customerPasswordReset.updateMany({
      where: {
        customerId,
        usedAt: null
      },
      data: { usedAt: new Date() }
    });
  }

  // ==========================================
  // Email Verification Methods
  // ==========================================

  static async findEmailVerificationByTokenHash(tokenHash: string): Promise<CustomerEmailVerificationModel | null> {
    return prisma.customerEmailVerification.findUnique({
      where: { tokenHash }
    });
  }

  static async createEmailVerification(data: {
    customerId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CustomerEmailVerificationModel> {
    return prisma.customerEmailVerification.create({
      data
    });
  }

  static async markEmailVerified(id: string): Promise<CustomerEmailVerificationModel> {
    return prisma.customerEmailVerification.update({
      where: { id },
      data: { verifiedAt: new Date() }
    });
  }

  static async invalidateExistingEmailVerifications(customerId: string): Promise<void> {
    await prisma.customerEmailVerification.updateMany({
      where: {
        customerId,
        verifiedAt: null
      },
      data: { verifiedAt: new Date() }
    });
  }

  // ==========================================
  // Address Methods
  // ==========================================

  static async findAddressById(id: string): Promise<CustomerAddressModel | null> {
    return prisma.customerAddress.findUnique({
      where: { id }
    });
  }

  static async findAddressesByCustomerId(customerId: string): Promise<CustomerAddressModel[]> {
    return prisma.customerAddress.findMany({
      where: { customerId }
    });
  }

  static async countAddressesByCustomerId(customerId: string): Promise<number> {
    return prisma.customerAddress.count({
      where: { customerId }
    });
  }

  static async findDefaultShipping(customerId: string): Promise<CustomerAddressModel | null> {
    return prisma.customerAddress.findFirst({
      where: { customerId, isDefaultShipping: true }
    });
  }

  static async findDefaultBilling(customerId: string): Promise<CustomerAddressModel | null> {
    return prisma.customerAddress.findFirst({
      where: { customerId, isDefaultBilling: true }
    });
  }

  static async createAddress(data: {
    customerId: string;
    type?: AddressType;
    firstName: string;
    lastName: string;
    companyName?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone: string;
    isDefaultShipping?: boolean;
    isDefaultBilling?: boolean;
  }): Promise<CustomerAddressModel> {
    return prisma.customerAddress.create({
      data
    });
  }

  static async updateAddress(
    id: string,
    data: {
      type?: AddressType;
      firstName?: string;
      lastName?: string;
      companyName?: string | null;
      addressLine1?: string;
      addressLine2?: string | null;
      landmark?: string | null;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      isDefaultShipping?: boolean;
      isDefaultBilling?: boolean;
    }
  ): Promise<CustomerAddressModel> {
    return prisma.customerAddress.update({
      where: { id },
      data
    });
  }

  static async deleteAddress(id: string): Promise<CustomerAddressModel | null> {
    return prisma.customerAddress.delete({
      where: { id }
    });
  }

  static async clearDefaultShipping(customerId: string, excludeId?: string): Promise<void> {
    const where: any = { customerId };
    if (excludeId) where.NOT = { id: excludeId };
    await prisma.customerAddress.updateMany({
      where,
      data: { isDefaultShipping: false }
    });
  }

  static async clearDefaultBilling(customerId: string, excludeId?: string): Promise<void> {
    const where: any = { customerId };
    if (excludeId) where.NOT = { id: excludeId };
    await prisma.customerAddress.updateMany({
      where,
      data: { isDefaultBilling: false }
    });
  }
}
