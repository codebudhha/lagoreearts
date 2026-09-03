import { ApiError } from '../../utils/error.ts';
import type { CheckoutAddressPayload } from './checkout.types.ts';

export class CheckoutPolicyService {
  /**
   * Default active checkout session expiration (30 minutes)
   */
  public static readonly SESSION_TTL_MINUTES = 30;

  /**
   * Indian 6-digit postal code pattern (does not start with 0)
   */
  public static readonly INDIAN_PIN_REGEX = /^([1-9][0-9]{5})$/;

  /**
   * Phone number pattern (10 to 15 digits, optional leading +)
   */
  public static readonly PHONE_REGEX = /^\+?[0-9]{10,15}$/;

  /**
   * Basic email format validation
   */
  public static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Calculate future expiration date for checkout session
   */
  public static getCheckoutExpirationDate(ttlMinutes: number = CheckoutPolicyService.SESSION_TTL_MINUTES): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
    return expiresAt;
  }

  /**
   * Check if checkout session has expired
   */
  public static isExpired(expiresAt: Date | string): boolean {
    const expiry = new Date(expiresAt).getTime();
    return Date.now() > expiry;
  }

  /**
   * Validate checkout customer email
   */
  public static validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new ApiError(400, 'INVALID_EMAIL', 'A valid contact email is required for checkout');
    }
    const clean = email.trim().toLowerCase();
    if (!this.EMAIL_REGEX.test(clean)) {
      throw new ApiError(400, 'INVALID_EMAIL', 'Email format is invalid');
    }
    return clean;
  }

  /**
   * Validate and sanitize address payload
   */
  public static validateAddress(payload: any, type: 'SHIPPING' | 'BILLING' = 'SHIPPING'): CheckoutAddressPayload {
    if (!payload || typeof payload !== 'object') {
      throw new ApiError(400, 'INVALID_ADDRESS', `${type} address object is required`);
    }

    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const addressLine1 = String(payload.addressLine1 || '').trim();
    const city = String(payload.city || '').trim();
    const state = String(payload.state || '').trim();
    const postalCode = String(payload.postalCode || '').trim();
    const country = String(payload.country || 'INDIA').trim().toUpperCase();
    const phone = String(payload.phone || '').trim().replace(/[\s\-]/g, '');

    if (!firstName || firstName.length < 1 || firstName.length > 100) {
      throw new ApiError(400, 'INVALID_ADDRESS_FIRST_NAME', 'First name is required and must be between 1 and 100 characters');
    }

    if (!lastName || lastName.length < 1 || lastName.length > 100) {
      throw new ApiError(400, 'INVALID_ADDRESS_LAST_NAME', 'Last name is required and must be between 1 and 100 characters');
    }

    if (!addressLine1 || addressLine1.length < 3 || addressLine1.length > 255) {
      throw new ApiError(400, 'INVALID_ADDRESS_LINE1', 'Address line 1 is required and must be between 3 and 255 characters');
    }

    if (!city || city.length < 2 || city.length > 100) {
      throw new ApiError(400, 'INVALID_ADDRESS_CITY', 'City is required and must be between 2 and 100 characters');
    }

    if (!state || state.length < 2 || state.length > 100) {
      throw new ApiError(400, 'INVALID_ADDRESS_STATE', 'State is required and must be between 2 and 100 characters');
    }

    if (!country) {
      throw new ApiError(400, 'INVALID_ADDRESS_COUNTRY', 'Country is required');
    }

    if (country === 'INDIA' || country === 'IN') {
      if (!this.INDIAN_PIN_REGEX.test(postalCode)) {
        throw new ApiError(400, 'INVALID_POSTAL_CODE', 'Indian postal code must be a valid 6-digit PIN code (e.g. 110001)');
      }
    } else {
      if (!postalCode || postalCode.length < 3 || postalCode.length > 20) {
        throw new ApiError(400, 'INVALID_POSTAL_CODE', 'Postal code is required');
      }
    }

    if (!phone || !this.PHONE_REGEX.test(phone)) {
      throw new ApiError(400, 'INVALID_PHONE_NUMBER', 'A valid contact phone number is required (10-15 digits)');
    }

    return {
      firstName,
      lastName,
      companyName: payload.companyName ? String(payload.companyName).trim() : null,
      addressLine1,
      addressLine2: payload.addressLine2 ? String(payload.addressLine2).trim() : null,
      landmark: payload.landmark ? String(payload.landmark).trim() : null,
      city,
      state,
      postalCode,
      country: country === 'IN' ? 'INDIA' : country,
      phone
    };
  }
}
