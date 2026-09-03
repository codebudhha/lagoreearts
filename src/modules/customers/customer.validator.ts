import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { CustomerStatus, AddressType } from './customer.types.ts';

const VALID_STATUSES: CustomerStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const VALID_ADDRESS_TYPES: AddressType[] = ['HOME', 'WORK', 'OTHER'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

/**
 * Normalize email by trimming and converting to lowercase
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Password strength: at least 8 characters, with letters and numbers
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Sanitize plain text string
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export class CustomerValidator {
  static validateRegister(req: Request, res: Response, next: NextFunction) {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !isValidEmail(email)) {
      return ApiResponse.badRequest(res, 'A valid email address is required');
    }

    if (!password || !isStrongPassword(password)) {
      return ApiResponse.badRequest(res, 'Password must be at least 8 characters long and contain both letters and numbers');
    }

    if (!firstName || typeof firstName !== 'string' || sanitizeText(firstName).length === 0) {
      return ApiResponse.badRequest(res, 'First name is required and cannot be empty');
    }
    if (firstName.length > 100) {
      return ApiResponse.badRequest(res, 'First name cannot exceed 100 characters');
    }

    if (!lastName || typeof lastName !== 'string' || sanitizeText(lastName).length === 0) {
      return ApiResponse.badRequest(res, 'Last name is required and cannot be empty');
    }
    if (lastName.length > 100) {
      return ApiResponse.badRequest(res, 'Last name cannot exceed 100 characters');
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
        return ApiResponse.badRequest(res, 'Please provide a valid phone number');
      }
    }

    next();
  }

  static validateLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return ApiResponse.badRequest(res, 'A valid email address is required');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return ApiResponse.badRequest(res, 'Password is required');
    }

    next();
  }

  static validateChangePassword(req: Request, res: Response, next: NextFunction) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return ApiResponse.badRequest(res, 'Current password is required');
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      return ApiResponse.badRequest(res, 'New password must be at least 8 characters long and contain both letters and numbers');
    }

    if (currentPassword === newPassword) {
      return ApiResponse.badRequest(res, 'New password must be different from current password');
    }

    next();
  }

  static validateForgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return ApiResponse.badRequest(res, 'A valid email address is required');
    }

    next();
  }

  static validateResetPassword(req: Request, res: Response, next: NextFunction) {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Reset token is required');
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      return ApiResponse.badRequest(res, 'New password must be at least 8 characters long and contain both letters and numbers');
    }

    next();
  }

  static validateVerifyEmail(req: Request, res: Response, next: NextFunction) {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Verification token is required');
    }

    next();
  }

  static validateResendVerification(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return ApiResponse.badRequest(res, 'A valid email address is required');
    }

    next();
  }

  static validateUpdateProfile(req: Request, res: Response, next: NextFunction) {
    const { firstName, lastName, phone, email } = req.body;

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || sanitizeText(firstName).length === 0) {
        return ApiResponse.badRequest(res, 'First name cannot be empty');
      }
      if (firstName.length > 100) {
        return ApiResponse.badRequest(res, 'First name cannot exceed 100 characters');
      }
    }

    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || sanitizeText(lastName).length === 0) {
        return ApiResponse.badRequest(res, 'Last name cannot be empty');
      }
      if (lastName.length > 100) {
        return ApiResponse.badRequest(res, 'Last name cannot exceed 100 characters');
      }
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return ApiResponse.badRequest(res, 'Please provide a valid email address');
      }
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
        return ApiResponse.badRequest(res, 'Please provide a valid phone number');
      }
    }

    next();
  }

  static validateAddress(req: Request, res: Response, next: NextFunction) {
    const {
      type,
      firstName,
      lastName,
      companyName,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefaultShipping,
      isDefaultBilling
    } = req.body;

    if (type !== undefined && !VALID_ADDRESS_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Invalid address type. Allowed: ${VALID_ADDRESS_TYPES.join(', ')}`);
    }

    if (!firstName || typeof firstName !== 'string' || sanitizeText(firstName).length === 0) {
      return ApiResponse.badRequest(res, 'First name is required');
    }

    if (!lastName || typeof lastName !== 'string' || sanitizeText(lastName).length === 0) {
      return ApiResponse.badRequest(res, 'Last name is required');
    }

    if (!addressLine1 || typeof addressLine1 !== 'string' || sanitizeText(addressLine1).length === 0) {
      return ApiResponse.badRequest(res, 'Address line 1 is required');
    }

    if (!city || typeof city !== 'string' || sanitizeText(city).length === 0) {
      return ApiResponse.badRequest(res, 'City is required');
    }

    if (!state || typeof state !== 'string' || sanitizeText(state).length === 0) {
      return ApiResponse.badRequest(res, 'State is required');
    }

    if (!postalCode || typeof postalCode !== 'string' || sanitizeText(postalCode).length === 0) {
      return ApiResponse.badRequest(res, 'Postal code is required');
    }

    const effectiveCountry = (country || 'INDIA').trim().toUpperCase();
    if (effectiveCountry === 'INDIA' && !INDIAN_PINCODE_REGEX.test(postalCode.trim())) {
      return ApiResponse.badRequest(res, 'Invalid Indian PIN code. Must be exactly 6 digits.');
    }

    if (!phone || typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
      return ApiResponse.badRequest(res, 'A valid contact phone number is required');
    }

    if (isDefaultShipping !== undefined && typeof isDefaultShipping !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefaultShipping must be a boolean');
    }

    if (isDefaultBilling !== undefined && typeof isDefaultBilling !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefaultBilling must be a boolean');
    }

    next();
  }

  static validateUpdateAddress(req: Request, res: Response, next: NextFunction) {
    const {
      type,
      firstName,
      lastName,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefaultShipping,
      isDefaultBilling
    } = req.body;

    if (type !== undefined && !VALID_ADDRESS_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Invalid address type. Allowed: ${VALID_ADDRESS_TYPES.join(', ')}`);
    }

    if (firstName !== undefined && (typeof firstName !== 'string' || sanitizeText(firstName).length === 0)) {
      return ApiResponse.badRequest(res, 'First name cannot be empty');
    }

    if (lastName !== undefined && (typeof lastName !== 'string' || sanitizeText(lastName).length === 0)) {
      return ApiResponse.badRequest(res, 'Last name cannot be empty');
    }

    if (addressLine1 !== undefined && (typeof addressLine1 !== 'string' || sanitizeText(addressLine1).length === 0)) {
      return ApiResponse.badRequest(res, 'Address line 1 cannot be empty');
    }

    if (city !== undefined && (typeof city !== 'string' || sanitizeText(city).length === 0)) {
      return ApiResponse.badRequest(res, 'City cannot be empty');
    }

    if (state !== undefined && (typeof state !== 'string' || sanitizeText(state).length === 0)) {
      return ApiResponse.badRequest(res, 'State cannot be empty');
    }

    if (postalCode !== undefined) {
      if (typeof postalCode !== 'string' || sanitizeText(postalCode).length === 0) {
        return ApiResponse.badRequest(res, 'Postal code cannot be empty');
      }
      const effectiveCountry = (country || 'INDIA').trim().toUpperCase();
      if (effectiveCountry === 'INDIA' && !INDIAN_PINCODE_REGEX.test(postalCode.trim())) {
        return ApiResponse.badRequest(res, 'Invalid Indian PIN code. Must be exactly 6 digits.');
      }
    }

    if (phone !== undefined && (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()))) {
      return ApiResponse.badRequest(res, 'A valid contact phone number is required');
    }

    if (isDefaultShipping !== undefined && typeof isDefaultShipping !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefaultShipping must be a boolean');
    }

    if (isDefaultBilling !== undefined && typeof isDefaultBilling !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefaultBilling must be a boolean');
    }

    next();
  }

  static validateAdminUpdateCustomer(req: Request, res: Response, next: NextFunction) {
    const { firstName, lastName, phone } = req.body;

    if (firstName !== undefined && (typeof firstName !== 'string' || sanitizeText(firstName).length === 0)) {
      return ApiResponse.badRequest(res, 'First name cannot be empty');
    }

    if (lastName !== undefined && (typeof lastName !== 'string' || sanitizeText(lastName).length === 0)) {
      return ApiResponse.badRequest(res, 'Last name cannot be empty');
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
        return ApiResponse.badRequest(res, 'Please provide a valid phone number');
      }
    }

    next();
  }

  static validateAdminUpdateStatus(req: Request, res: Response, next: NextFunction) {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid customer status. Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    next();
  }
}
