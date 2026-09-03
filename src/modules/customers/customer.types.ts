export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface CustomerModel {
  id: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: CustomerStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  addresses?: CustomerAddressModel[];
  sessions?: CustomerSessionModel[];
}

export interface CustomerSessionModel {
  id: string;
  customerId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  lastUsedAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CustomerPasswordResetModel {
  id: string;
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface CustomerEmailVerificationModel {
  id: string;
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
  verifiedAt?: Date | null;
  createdAt: Date;
}

export interface CustomerAddressModel {
  id: string;
  customerId: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// DTOs
// ==========================================

export interface CustomerRegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CustomerLoginDTO {
  email: string;
  password: string;
}

export interface CustomerChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface CustomerForgotPasswordDTO {
  email: string;
}

export interface CustomerResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface CustomerVerifyEmailDTO {
  token: string;
}

export interface CustomerResendVerificationDTO {
  email: string;
}

export interface CustomerUpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string;
}

export interface CustomerAddressDTO {
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
}

export interface CustomerUpdateAddressDTO {
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

export interface AdminCustomerQueryFilter {
  search?: string;
  status?: CustomerStatus;
  startDate?: string;
  endDate?: string;
  page?: number | string;
  limit?: number | string;
  sortBy?: 'createdAt' | 'firstName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUpdateCustomerDTO {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface AdminUpdateCustomerStatusDTO {
  status: CustomerStatus;
}

// ==========================================
// Response DTOs
// ==========================================

export interface PublicCustomerDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: CustomerStatus;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
}

export interface CustomerAuthResponseDTO {
  customer: PublicCustomerDTO;
  accessToken: string;
  refreshToken?: string;
}

export interface AdminCustomerDTO {
  id: string;
  email: string;
  normalizedEmail: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: CustomerStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  addressCount?: number;
  sessionCount?: number;
}
