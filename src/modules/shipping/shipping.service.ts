/**
 * Module 22: Shipping & Delivery — Configuration Orchestration Service
 * Lagoree Arts Backend
 */

import { ShippingZoneRepository } from './shipping-zone.repository.ts';
import { ShippingMethodRepository } from './shipping-method.repository.ts';
import { ShippingRateRepository } from './shipping-rate.repository.ts';
import { ShippingValidator } from './shipping.validator.ts';
import { ShippingSerializer } from './shipping.serializer.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { prisma } from '../../database/prisma.ts';
import type {
  CreateShippingZoneDto,
  UpdateShippingZoneDto,
  AddPostalCodesDto,
  CreateShippingMethodDto,
  UpdateShippingMethodDto,
  CreateShippingRateDto,
  UpdateShippingRateDto
} from './shipping.types.ts';

export class ShippingService {
  // ==========================================
  // ZONES
  // ==========================================

  public static async listZones(query?: { status?: string; search?: string }) {
    const zones = await ShippingZoneRepository.listZones(query);
    return zones.map(z => ShippingSerializer.toZoneView(z));
  }

  public static async getZoneById(id: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid zone ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const zone = await ShippingZoneRepository.findById(id, true);
    if (!zone) {
      const err: any = new Error('Shipping zone not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_ZONE_NOT_FOUND';
      throw err;
    }

    return ShippingSerializer.toZoneView(zone);
  }

  public static async createZone(dto: CreateShippingZoneDto, adminUserId?: string) {
    const validated = ShippingValidator.validateZonePayload(dto);

    const existing = await ShippingZoneRepository.findByCode(validated.code);
    if (existing) {
      const err: any = new Error(`Shipping zone with code '${validated.code}' already exists`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_ZONE_CODE';
      throw err;
    }

    const created = await ShippingZoneRepository.createZone(validated);

    AuditService.log({
      action: 'SHIPPING_ZONE_CREATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_ZONE',
      entityId: created.id,
      adminUserId,
      newValues: validated
    });

    return ShippingSerializer.toZoneView(created);
  }

  public static async updateZone(id: string, dto: UpdateShippingZoneDto, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid zone ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingZoneRepository.findById(id);
    if (!existing) {
      const err: any = new Error('Shipping zone not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_ZONE_NOT_FOUND';
      throw err;
    }

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      const duplicate = await ShippingZoneRepository.findByCode(dto.code);
      if (duplicate && duplicate.id !== id) {
        const err: any = new Error(`Shipping zone with code '${dto.code}' already exists`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_ZONE_CODE';
        throw err;
      }
    }

    const updated = await ShippingZoneRepository.updateZone(id, {
      name: dto.name ? ShippingValidator.sanitizeText(dto.name) : undefined,
      code: dto.code ? dto.code.toUpperCase().trim() : undefined,
      description: dto.description !== undefined ? ShippingValidator.sanitizeText(dto.description) : undefined,
      status: dto.status,
      priority: dto.priority !== undefined ? Number(dto.priority) : undefined
    });

    AuditService.log({
      action: 'SHIPPING_ZONE_UPDATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_ZONE',
      entityId: id,
      adminUserId,
      oldValues: { name: existing.name, code: existing.code, status: existing.status },
      newValues: dto
    });

    return ShippingSerializer.toZoneView(updated!);
  }

  public static async deleteZone(id: string, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid zone ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingZoneRepository.findById(id, true);
    if (!existing) {
      const err: any = new Error('Shipping zone not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_ZONE_NOT_FOUND';
      throw err;
    }

    // Delete Safety: Check if active rates reference it
    const ratesCount = await prisma.shippingRate.count({
      where: { shippingZoneId: id }
    });
    if (ratesCount > 0) {
      const err: any = new Error(`Cannot delete shipping zone because ${ratesCount} active rate(s) reference it. Deactivate the zone instead.`);
      err.statusCode = 409;
      err.code = 'SHIPPING_ZONE_IN_USE';
      throw err;
    }

    // Delete Safety: Check if historical snapshots reference this zone code
    const snapshotCount = await prisma.orderShippingSnapshot.findUnique({
      where: { zoneCode: existing.code } as any
    });
    if (snapshotCount) {
      const err: any = new Error(`Cannot delete shipping zone because historical orders reference it. Deactivate the zone instead.`);
      err.statusCode = 409;
      err.code = 'SHIPPING_ZONE_IN_USE';
      throw err;
    }

    await ShippingZoneRepository.deleteZone(id);

    AuditService.log({
      action: 'SHIPPING_ZONE_DELETED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_ZONE',
      entityId: id,
      adminUserId,
      oldValues: { name: existing.name, code: existing.code }
    });

    return { success: true, message: 'Shipping zone deleted successfully' };
  }

  public static async addPostalCodesToZone(zoneId: string, dto: AddPostalCodesDto, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(zoneId)) {
      const err: any = new Error('Invalid zone ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const zone = await ShippingZoneRepository.findById(zoneId);
    if (!zone) {
      const err: any = new Error('Shipping zone not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_ZONE_NOT_FOUND';
      throw err;
    }

    if (!Array.isArray(dto.postalCodes) || dto.postalCodes.length === 0) {
      const err: any = new Error('At least one postal code is required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    for (const c of dto.postalCodes) {
      if (!ShippingValidator.isValidPostalCode(c.postalCode)) {
        const err: any = new Error(`Invalid Indian 6-digit PIN code: '${c.postalCode}'`);
        err.statusCode = 400;
        err.code = 'INVALID_POSTAL_CODE';
        throw err;
      }
    }

    const count = await ShippingZoneRepository.addPostalCodes(zoneId, dto.postalCodes);

    AuditService.log({
      action: 'SHIPPING_SERVICEABILITY_CHANGED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_ZONE',
      entityId: zoneId,
      adminUserId,
      newValues: { addedCount: count, totalSubmitted: dto.postalCodes.length }
    });

    return { success: true, addedCount: count };
  }

  // ==========================================
  // METHODS
  // ==========================================

  public static async listMethods(query?: { status?: string }) {
    const methods = await ShippingMethodRepository.listMethods(query);
    return methods.map(m => ShippingSerializer.toMethodView(m));
  }

  public static async getMethodById(id: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid method ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const method = await ShippingMethodRepository.findById(id, true);
    if (!method) {
      const err: any = new Error('Shipping method not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_METHOD_NOT_FOUND';
      throw err;
    }

    return ShippingSerializer.toMethodView(method);
  }

  public static async createMethod(dto: CreateShippingMethodDto, adminUserId?: string) {
    const validated = ShippingValidator.validateMethodPayload(dto);

    const existing = await ShippingMethodRepository.findByCode(validated.code);
    if (existing) {
      const err: any = new Error(`Shipping method with code '${validated.code}' already exists`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_METHOD_CODE';
      throw err;
    }

    const created = await ShippingMethodRepository.createMethod(validated);

    AuditService.log({
      action: 'SHIPPING_METHOD_CREATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_METHOD',
      entityId: created.id,
      adminUserId,
      newValues: validated
    });

    return ShippingSerializer.toMethodView(created);
  }

  public static async updateMethod(id: string, dto: UpdateShippingMethodDto, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid method ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingMethodRepository.findById(id);
    if (!existing) {
      const err: any = new Error('Shipping method not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_METHOD_NOT_FOUND';
      throw err;
    }

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      const duplicate = await ShippingMethodRepository.findByCode(dto.code);
      if (duplicate && duplicate.id !== id) {
        const err: any = new Error(`Shipping method with code '${dto.code}' already exists`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_METHOD_CODE';
        throw err;
      }
    }

    const updated = await ShippingMethodRepository.updateMethod(id, {
      name: dto.name ? ShippingValidator.sanitizeText(dto.name) : undefined,
      code: dto.code ? dto.code.toUpperCase().trim() : undefined,
      description: dto.description !== undefined ? ShippingValidator.sanitizeText(dto.description) : undefined,
      carrier: dto.carrier !== undefined ? ShippingValidator.sanitizeText(dto.carrier) : undefined,
      serviceLevel: dto.serviceLevel !== undefined ? ShippingValidator.sanitizeText(dto.serviceLevel) : undefined,
      status: dto.status,
      estimatedMinDays: dto.estimatedMinDays,
      estimatedMaxDays: dto.estimatedMaxDays,
      sortOrder: dto.sortOrder
    });

    AuditService.log({
      action: 'SHIPPING_METHOD_UPDATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_METHOD',
      entityId: id,
      adminUserId,
      oldValues: { name: existing.name, code: existing.code },
      newValues: dto
    });

    return ShippingSerializer.toMethodView(updated!);
  }

  public static async deleteMethod(id: string, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid method ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingMethodRepository.findById(id);
    if (!existing) {
      const err: any = new Error('Shipping method not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_METHOD_NOT_FOUND';
      throw err;
    }

    const ratesCount = await prisma.shippingRate.count({
      where: { shippingMethodId: id }
    });
    if (ratesCount > 0) {
      const err: any = new Error(`Cannot delete shipping method because ${ratesCount} rate(s) reference it. Deactivate the method instead.`);
      err.statusCode = 409;
      err.code = 'SHIPPING_METHOD_IN_USE';
      throw err;
    }

    await ShippingMethodRepository.deleteMethod(id);

    AuditService.log({
      action: 'SHIPPING_METHOD_DELETED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_METHOD',
      entityId: id,
      adminUserId,
      oldValues: { name: existing.name, code: existing.code }
    });

    return { success: true, message: 'Shipping method deleted successfully' };
  }

  // ==========================================
  // RATES
  // ==========================================

  public static async listRates(query?: {
    shippingZoneId?: string;
    shippingMethodId?: string;
    status?: string;
    currency?: string;
  }) {
    const rates = await ShippingRateRepository.listRates(query);
    return rates.map(r => ShippingSerializer.toRateView(r));
  }

  public static async getRateById(id: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid rate ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const rate = await ShippingRateRepository.findById(id, true);
    if (!rate) {
      const err: any = new Error('Shipping rate not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_RATE_NOT_FOUND';
      throw err;
    }

    return ShippingSerializer.toRateView(rate);
  }

  public static async createRate(dto: CreateShippingRateDto, adminUserId?: string) {
    const validated = ShippingValidator.validateRatePayload(dto);

    // Verify Zone and Method exist
    const zone = await ShippingZoneRepository.findById(validated.shippingZoneId);
    if (!zone) {
      const err: any = new Error('Referenced shipping zone does not exist');
      err.statusCode = 404;
      err.code = 'SHIPPING_ZONE_NOT_FOUND';
      throw err;
    }

    const method = await ShippingMethodRepository.findById(validated.shippingMethodId);
    if (!method) {
      const err: any = new Error('Referenced shipping method does not exist');
      err.statusCode = 404;
      err.code = 'SHIPPING_METHOD_NOT_FOUND';
      throw err;
    }

    const created = await ShippingRateRepository.createRate(validated);

    AuditService.log({
      action: 'SHIPPING_RATE_CREATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_RATE',
      entityId: created.id,
      adminUserId,
      newValues: validated
    });

    return ShippingSerializer.toRateView(created);
  }

  public static async updateRate(id: string, dto: UpdateShippingRateDto, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid rate ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingRateRepository.findById(id);
    if (!existing) {
      const err: any = new Error('Shipping rate not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_RATE_NOT_FOUND';
      throw err;
    }

    const updated = await ShippingRateRepository.updateRate(id, {
      shippingZoneId: dto.shippingZoneId,
      shippingMethodId: dto.shippingMethodId,
      minOrderValue: dto.minOrderValue,
      maxOrderValue: dto.maxOrderValue,
      minWeight: dto.minWeight,
      maxWeight: dto.maxWeight,
      amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
      currency: dto.currency,
      status: dto.status,
      priority: dto.priority !== undefined ? Number(dto.priority) : undefined
    });

    AuditService.log({
      action: 'SHIPPING_RATE_UPDATED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_RATE',
      entityId: id,
      adminUserId,
      oldValues: { amount: existing.amount, status: existing.status },
      newValues: dto
    });

    return ShippingSerializer.toRateView(updated!);
  }

  public static async deleteRate(id: string, adminUserId?: string) {
    if (!ShippingValidator.isValidUuid(id)) {
      const err: any = new Error('Invalid rate ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const existing = await ShippingRateRepository.findById(id);
    if (!existing) {
      const err: any = new Error('Shipping rate not found');
      err.statusCode = 404;
      err.code = 'SHIPPING_RATE_NOT_FOUND';
      throw err;
    }

    await ShippingRateRepository.deleteRate(id);

    AuditService.log({
      action: 'SHIPPING_RATE_DELETED',
      module: 'SHIPPING',
      entityType: 'SHIPPING_RATE',
      entityId: id,
      adminUserId,
      oldValues: { amount: existing.amount, status: existing.status }
    });

    return { success: true, message: 'Shipping rate deleted successfully' };
  }
}
