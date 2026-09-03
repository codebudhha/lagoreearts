import { ApiError } from '../../utils/error.ts';
import type { CreateCheckoutDto, UpdateCheckoutAddressesDto } from './checkout.types.ts';
import { CheckoutPolicyService } from './checkout-policy.service.ts';

export class CheckoutValidator {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public static isValidUuid(val: string): boolean {
    return typeof val === 'string' && this.UUID_REGEX.test(val);
  }

  public static parseCreateCheckout(body: any, isGuest: boolean): CreateCheckoutDto {
    if (!body || typeof body !== 'object') {
      body = {};
    }

    const dto: CreateCheckoutDto = {};

    if (isGuest) {
      if (!body.email) {
        throw new ApiError(400, 'GUEST_EMAIL_REQUIRED', 'A contact email is required for guest checkout');
      }
      dto.email = CheckoutPolicyService.validateEmail(body.email);

      if (!body.shippingAddress) {
        throw new ApiError(400, 'SHIPPING_ADDRESS_REQUIRED', 'A valid shipping address is required for guest checkout');
      }
      dto.shippingAddress = CheckoutPolicyService.validateAddress(body.shippingAddress, 'SHIPPING');

      if (body.billingAddress) {
        dto.billingAddress = CheckoutPolicyService.validateAddress(body.billingAddress, 'BILLING');
      } else {
        // Default billing to shipping for guest
        dto.billingAddress = { ...dto.shippingAddress };
      }
    } else {
      // Authenticated customer
      if (body.shippingAddressId) {
        if (!this.isValidUuid(body.shippingAddressId)) {
          throw new ApiError(400, 'INVALID_ADDRESS_ID', 'Invalid shipping address ID format');
        }
        dto.shippingAddressId = body.shippingAddressId;
      }

      if (body.billingAddressId) {
        if (!this.isValidUuid(body.billingAddressId)) {
          throw new ApiError(400, 'INVALID_ADDRESS_ID', 'Invalid billing address ID format');
        }
        dto.billingAddressId = body.billingAddressId;
      }

      // Customer may also supply direct address object
      if (body.shippingAddress) {
        dto.shippingAddress = CheckoutPolicyService.validateAddress(body.shippingAddress, 'SHIPPING');
      }
      if (body.billingAddress) {
        dto.billingAddress = CheckoutPolicyService.validateAddress(body.billingAddress, 'BILLING');
      }
    }

    return dto;
  }

  public static parseUpdateAddresses(body: any, isGuest: boolean): UpdateCheckoutAddressesDto {
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_REQUEST', 'Request body must contain address information');
    }

    const dto: UpdateCheckoutAddressesDto = {};

    if (isGuest) {
      if (!body.shippingAddress && !body.billingAddress) {
        throw new ApiError(400, 'INVALID_REQUEST', 'Please provide either a shipping or billing address object');
      }
      if (body.shippingAddress) {
        dto.shippingAddress = CheckoutPolicyService.validateAddress(body.shippingAddress, 'SHIPPING');
      }
      if (body.billingAddress) {
        dto.billingAddress = CheckoutPolicyService.validateAddress(body.billingAddress, 'BILLING');
      }
    } else {
      if (body.shippingAddressId) {
        if (!this.isValidUuid(body.shippingAddressId)) {
          throw new ApiError(400, 'INVALID_ADDRESS_ID', 'Invalid shipping address ID format');
        }
        dto.shippingAddressId = body.shippingAddressId;
      }
      if (body.billingAddressId) {
        if (!this.isValidUuid(body.billingAddressId)) {
          throw new ApiError(400, 'INVALID_ADDRESS_ID', 'Invalid billing address ID format');
        }
        dto.billingAddressId = body.billingAddressId;
      }
      if (body.shippingAddress) {
        dto.shippingAddress = CheckoutPolicyService.validateAddress(body.shippingAddress, 'SHIPPING');
      }
      if (body.billingAddress) {
        dto.billingAddress = CheckoutPolicyService.validateAddress(body.billingAddress, 'BILLING');
      }
    }

    return dto;
  }
}
