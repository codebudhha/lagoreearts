import { CustomerRepository } from './customer.repository.ts';
import { sanitizeText } from './customer.validator.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { CustomerAddressModel, CustomerAddressDTO, CustomerUpdateAddressDTO } from './customer.types.ts';

export class CustomerAddressService {
  /**
   * Get all addresses belonging to authenticated customer
   */
  static async listAddresses(customerId: string): Promise<CustomerAddressModel[]> {
    return CustomerRepository.findAddressesByCustomerId(customerId);
  }

  /**
   * Get specific address by ID with strict customer ownership verification
   */
  static async getAddressById(customerId: string, addressId: string): Promise<CustomerAddressModel> {
    const address = await CustomerRepository.findAddressById(addressId);
    if (!address || address.customerId !== customerId) {
      const error: any = new Error('Address not found');
      error.statusCode = 404;
      error.code = 'ADDRESS_NOT_FOUND';
      throw error;
    }
    return address;
  }

  /**
   * Create customer address with automatic default assignment if first address
   */
  static async createAddress(
    customerId: string,
    dto: CustomerAddressDTO,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<CustomerAddressModel> {
    const existingCount = await CustomerRepository.countAddressesByCustomerId(customerId);

    // If customer has no existing addresses, automatically set both defaults to true
    let isDefaultShipping = dto.isDefaultShipping || false;
    let isDefaultBilling = dto.isDefaultBilling || false;

    if (existingCount === 0) {
      isDefaultShipping = true;
      isDefaultBilling = true;
    }

    if (isDefaultShipping) {
      await CustomerRepository.clearDefaultShipping(customerId);
    }
    if (isDefaultBilling) {
      await CustomerRepository.clearDefaultBilling(customerId);
    }

    const created = await CustomerRepository.createAddress({
      customerId,
      type: dto.type || 'HOME',
      firstName: sanitizeText(dto.firstName),
      lastName: sanitizeText(dto.lastName),
      companyName: dto.companyName ? sanitizeText(dto.companyName) : null,
      addressLine1: sanitizeText(dto.addressLine1),
      addressLine2: dto.addressLine2 ? sanitizeText(dto.addressLine2) : null,
      landmark: dto.landmark ? sanitizeText(dto.landmark) : null,
      city: sanitizeText(dto.city),
      state: sanitizeText(dto.state),
      postalCode: sanitizeText(dto.postalCode),
      country: (dto.country || 'INDIA').trim().toUpperCase(),
      phone: sanitizeText(dto.phone),
      isDefaultShipping,
      isDefaultBilling
    });

    AuditService.log({
      action: 'CUSTOMER_ADDRESS_CREATED',
      module: 'CUSTOMER',
      entityType: 'CustomerAddress',
      entityId: created.id,
      newValues: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return created;
  }

  /**
   * Update customer address with strict ownership and default handling
   */
  static async updateAddress(
    customerId: string,
    addressId: string,
    dto: CustomerUpdateAddressDTO,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<CustomerAddressModel> {
    const existing = await this.getAddressById(customerId, addressId);

    if (dto.isDefaultShipping === true) {
      await CustomerRepository.clearDefaultShipping(customerId, addressId);
    }
    if (dto.isDefaultBilling === true) {
      await CustomerRepository.clearDefaultBilling(customerId, addressId);
    }

    const updated = await CustomerRepository.updateAddress(addressId, {
      type: dto.type,
      firstName: dto.firstName ? sanitizeText(dto.firstName) : undefined,
      lastName: dto.lastName ? sanitizeText(dto.lastName) : undefined,
      companyName: dto.companyName !== undefined ? (dto.companyName ? sanitizeText(dto.companyName) : null) : undefined,
      addressLine1: dto.addressLine1 ? sanitizeText(dto.addressLine1) : undefined,
      addressLine2: dto.addressLine2 !== undefined ? (dto.addressLine2 ? sanitizeText(dto.addressLine2) : null) : undefined,
      landmark: dto.landmark !== undefined ? (dto.landmark ? sanitizeText(dto.landmark) : null) : undefined,
      city: dto.city ? sanitizeText(dto.city) : undefined,
      state: dto.state ? sanitizeText(dto.state) : undefined,
      postalCode: dto.postalCode ? sanitizeText(dto.postalCode) : undefined,
      country: dto.country ? dto.country.trim().toUpperCase() : undefined,
      phone: dto.phone ? sanitizeText(dto.phone) : undefined,
      isDefaultShipping: dto.isDefaultShipping,
      isDefaultBilling: dto.isDefaultBilling
    });

    AuditService.log({
      action: 'CUSTOMER_ADDRESS_UPDATED',
      module: 'CUSTOMER',
      entityType: 'CustomerAddress',
      entityId: addressId,
      oldValues: existing,
      newValues: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return updated;
  }

  /**
   * Delete customer address and automatically promote remaining address to default if needed
   */
  static async deleteAddress(
    customerId: string,
    addressId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<CustomerAddressModel | null> {
    const existing = await this.getAddressById(customerId, addressId);

    const deleted = await CustomerRepository.deleteAddress(addressId);

    // If deleted address was default shipping or billing, promote next remaining address
    const remainingAddresses = await CustomerRepository.findAddressesByCustomerId(customerId);
    if (remainingAddresses.length > 0) {
      if (existing.isDefaultShipping) {
        await CustomerRepository.updateAddress(remainingAddresses[0].id, { isDefaultShipping: true });
      }
      if (existing.isDefaultBilling) {
        await CustomerRepository.updateAddress(remainingAddresses[0].id, { isDefaultBilling: true });
      }
    }

    AuditService.log({
      action: 'CUSTOMER_ADDRESS_DELETED',
      module: 'CUSTOMER',
      entityType: 'CustomerAddress',
      entityId: addressId,
      oldValues: existing,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return deleted;
  }

  /**
   * Explicitly set default shipping address
   */
  static async setDefaultShipping(
    customerId: string,
    addressId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<CustomerAddressModel> {
    await this.getAddressById(customerId, addressId);

    await CustomerRepository.clearDefaultShipping(customerId, addressId);
    const updated = await CustomerRepository.updateAddress(addressId, { isDefaultShipping: true });

    AuditService.log({
      action: 'CUSTOMER_DEFAULT_SHIPPING_CHANGED',
      module: 'CUSTOMER',
      entityType: 'CustomerAddress',
      entityId: addressId,
      newValues: { isDefaultShipping: true },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return updated;
  }

  /**
   * Explicitly set default billing address
   */
  static async setDefaultBilling(
    customerId: string,
    addressId: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<CustomerAddressModel> {
    await this.getAddressById(customerId, addressId);

    await CustomerRepository.clearDefaultBilling(customerId, addressId);
    const updated = await CustomerRepository.updateAddress(addressId, { isDefaultBilling: true });

    AuditService.log({
      action: 'CUSTOMER_DEFAULT_BILLING_CHANGED',
      module: 'CUSTOMER',
      entityType: 'CustomerAddress',
      entityId: addressId,
      newValues: { isDefaultBilling: true },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return updated;
  }
}
