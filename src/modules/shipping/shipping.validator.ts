/**
 * Module 22: Shipping & Delivery — Input Validation & Sanitization
 * Lagoree Arts Backend
 */

import type { ShipmentStatus } from './shipping.types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
const CODE_REGEX = /^[a-zA-Z0-9_-]{2,50}$/;

export class ShippingValidator {
  public static isValidUuid(val: string | null | undefined): boolean {
    if (!val || typeof val !== 'string') return false;
    return UUID_REGEX.test(val.trim());
  }

  public static isValidPostalCode(val: string | null | undefined): boolean {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    return PIN_CODE_REGEX.test(trimmed);
  }

  public static normalizePostalCode(val: string): string {
    return val ? val.trim() : '';
  }

  public static isValidCode(val: string | null | undefined): boolean {
    if (!val || typeof val !== 'string') return false;
    return CODE_REGEX.test(val.trim());
  }

  public static sanitizeText(val: string | null | undefined): string {
    if (!val || typeof val !== 'string') return '';
    return val
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

  public static isValidTrackingUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') return true; // optional
    const trimmed = url.trim();
    if (trimmed.length === 0) return true;

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('//') || // protocol-relative
      lower.includes('<') ||
      lower.includes('>') ||
      lower.includes('\0') ||
      lower.includes('\r') ||
      lower.includes('\n')
    ) {
      return false;
    }

    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  public static validateZonePayload(dto: any): { name: string; code: string; description?: string; status?: 'ACTIVE' | 'INACTIVE'; priority?: number } {
    if (!dto || typeof dto !== 'object') {
      const err: any = new Error('Invalid zone payload');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const name = this.sanitizeText(dto.name);
    if (!name || name.length < 2 || name.length > 100) {
      const err: any = new Error('Zone name is required (2-100 characters)');
      err.statusCode = 400;
      err.code = 'INVALID_ZONE_NAME';
      throw err;
    }

    const code = (dto.code || '').trim().toUpperCase();
    if (!this.isValidCode(code)) {
      const err: any = new Error('Zone code must be 2-50 alphanumeric characters');
      err.statusCode = 400;
      err.code = 'INVALID_ZONE_CODE';
      throw err;
    }

    let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    if (dto.status) {
      const s = String(dto.status).toUpperCase();
      if (s === 'ACTIVE' || s === 'INACTIVE') status = s;
      else {
        const err: any = new Error('Zone status must be ACTIVE or INACTIVE');
        err.statusCode = 400;
        err.code = 'INVALID_ZONE_STATUS';
        throw err;
      }
    }

    const priority = dto.priority !== undefined ? Number(dto.priority) : 0;
    if (isNaN(priority)) {
      const err: any = new Error('Priority must be a valid number');
      err.statusCode = 400;
      err.code = 'INVALID_PRIORITY';
      throw err;
    }

    return {
      name,
      code,
      description: dto.description ? this.sanitizeText(dto.description) : undefined,
      status,
      priority
    };
  }

  public static validateMethodPayload(dto: any): any {
    if (!dto || typeof dto !== 'object') {
      const err: any = new Error('Invalid method payload');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const name = this.sanitizeText(dto.name);
    if (!name || name.length < 2 || name.length > 100) {
      const err: any = new Error('Method name is required (2-100 characters)');
      err.statusCode = 400;
      err.code = 'INVALID_METHOD_NAME';
      throw err;
    }

    const code = (dto.code || '').trim().toUpperCase();
    if (!this.isValidCode(code)) {
      const err: any = new Error('Method code must be 2-50 alphanumeric characters');
      err.statusCode = 400;
      err.code = 'INVALID_METHOD_CODE';
      throw err;
    }

    let minDays: number | null = null;
    let maxDays: number | null = null;
    if (dto.estimatedMinDays !== undefined && dto.estimatedMinDays !== null) {
      minDays = Number(dto.estimatedMinDays);
      if (isNaN(minDays) || minDays < 0) {
        const err: any = new Error('estimatedMinDays must be a non-negative integer');
        err.statusCode = 400;
        err.code = 'INVALID_ESTIMATED_DAYS';
        throw err;
      }
    }

    if (dto.estimatedMaxDays !== undefined && dto.estimatedMaxDays !== null) {
      maxDays = Number(dto.estimatedMaxDays);
      if (isNaN(maxDays) || maxDays < 0) {
        const err: any = new Error('estimatedMaxDays must be a non-negative integer');
        err.statusCode = 400;
        err.code = 'INVALID_ESTIMATED_DAYS';
        throw err;
      }
    }

    if (minDays !== null && maxDays !== null && maxDays < minDays) {
      const err: any = new Error('estimatedMaxDays cannot be less than estimatedMinDays');
      err.statusCode = 400;
      err.code = 'INVALID_ESTIMATED_DAYS';
      throw err;
    }

    let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    if (dto.status) {
      const s = String(dto.status).toUpperCase();
      if (s === 'ACTIVE' || s === 'INACTIVE') status = s;
      else {
        const err: any = new Error('Method status must be ACTIVE or INACTIVE');
        err.statusCode = 400;
        err.code = 'INVALID_METHOD_STATUS';
        throw err;
      }
    }

    return {
      name,
      code,
      description: dto.description ? this.sanitizeText(dto.description) : undefined,
      carrier: dto.carrier ? this.sanitizeText(dto.carrier) : undefined,
      serviceLevel: dto.serviceLevel ? this.sanitizeText(dto.serviceLevel) : undefined,
      status,
      estimatedMinDays: minDays,
      estimatedMaxDays: maxDays,
      sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0
    };
  }

  public static validateRatePayload(dto: any): any {
    if (!dto || typeof dto !== 'object') {
      const err: any = new Error('Invalid rate payload');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!this.isValidUuid(dto.shippingZoneId)) {
      const err: any = new Error('Valid shippingZoneId is required');
      err.statusCode = 400;
      err.code = 'INVALID_ZONE_ID';
      throw err;
    }

    if (!this.isValidUuid(dto.shippingMethodId)) {
      const err: any = new Error('Valid shippingMethodId is required');
      err.statusCode = 400;
      err.code = 'INVALID_METHOD_ID';
      throw err;
    }

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount < 0) {
      const err: any = new Error('Shipping rate amount must be a non-negative number');
      err.statusCode = 400;
      err.code = 'INVALID_RATE_AMOUNT';
      throw err;
    }

    let minOrderValue: number | null = null;
    let maxOrderValue: number | null = null;
    if (dto.minOrderValue !== undefined && dto.minOrderValue !== null) {
      minOrderValue = Number(dto.minOrderValue);
      if (isNaN(minOrderValue) || minOrderValue < 0) {
        const err: any = new Error('minOrderValue must be non-negative');
        err.statusCode = 400;
        err.code = 'INVALID_ORDER_VALUE_RANGE';
        throw err;
      }
    }
    if (dto.maxOrderValue !== undefined && dto.maxOrderValue !== null) {
      maxOrderValue = Number(dto.maxOrderValue);
      if (isNaN(maxOrderValue) || maxOrderValue < 0) {
        const err: any = new Error('maxOrderValue must be non-negative');
        err.statusCode = 400;
        err.code = 'INVALID_ORDER_VALUE_RANGE';
        throw err;
      }
    }
    if (minOrderValue !== null && maxOrderValue !== null && maxOrderValue < minOrderValue) {
      const err: any = new Error('maxOrderValue cannot be less than minOrderValue');
      err.statusCode = 400;
      err.code = 'INVALID_ORDER_VALUE_RANGE';
      throw err;
    }

    let minWeight: number | null = null;
    let maxWeight: number | null = null;
    if (dto.minWeight !== undefined && dto.minWeight !== null) {
      minWeight = Number(dto.minWeight);
      if (isNaN(minWeight) || minWeight < 0) {
        const err: any = new Error('minWeight must be non-negative');
        err.statusCode = 400;
        err.code = 'INVALID_WEIGHT_RANGE';
        throw err;
      }
    }
    if (dto.maxWeight !== undefined && dto.maxWeight !== null) {
      maxWeight = Number(dto.maxWeight);
      if (isNaN(maxWeight) || maxWeight < 0) {
        const err: any = new Error('maxWeight must be non-negative');
        err.statusCode = 400;
        err.code = 'INVALID_WEIGHT_RANGE';
        throw err;
      }
    }
    if (minWeight !== null && maxWeight !== null && maxWeight < minWeight) {
      const err: any = new Error('maxWeight cannot be less than minWeight');
      err.statusCode = 400;
      err.code = 'INVALID_WEIGHT_RANGE';
      throw err;
    }

    return {
      shippingZoneId: dto.shippingZoneId,
      shippingMethodId: dto.shippingMethodId,
      amount,
      currency: dto.currency ? String(dto.currency).toUpperCase().trim() : 'INR',
      minOrderValue,
      maxOrderValue,
      minWeight,
      maxWeight,
      status: dto.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      priority: dto.priority !== undefined ? Number(dto.priority) : 0
    };
  }

  public static validateCreateShipmentPayload(dto: any): any {
    if (!dto || typeof dto !== 'object') {
      const err: any = new Error('Invalid shipment payload');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      const err: any = new Error('Shipment must contain at least one item');
      err.statusCode = 400;
      err.code = 'SHIPMENT_ITEM_INVALID';
      throw err;
    }

    const validatedItems = dto.items.map((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        const err: any = new Error(`Item at index ${idx} is invalid`);
        err.statusCode = 400;
        err.code = 'SHIPMENT_ITEM_INVALID';
        throw err;
      }

      if (!this.isValidUuid(item.orderItemId)) {
        const err: any = new Error(`Item at index ${idx} has invalid orderItemId`);
        err.statusCode = 400;
        err.code = 'SHIPMENT_ITEM_INVALID';
        throw err;
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        const err: any = new Error(`Item at index ${idx} has invalid quantity (must be positive integer)`);
        err.statusCode = 400;
        err.code = 'SHIPMENT_ITEM_INVALID';
        throw err;
      }

      return {
        orderItemId: item.orderItemId,
        quantity
      };
    });

    if (dto.trackingUrl && !this.isValidTrackingUrl(dto.trackingUrl)) {
      const err: any = new Error('Invalid tracking URL provided');
      err.statusCode = 400;
      err.code = 'TRACKING_URL_INVALID';
      throw err;
    }

    return {
      carrier: dto.carrier ? this.sanitizeText(dto.carrier) : undefined,
      serviceLevel: dto.serviceLevel ? this.sanitizeText(dto.serviceLevel) : undefined,
      trackingNumber: dto.trackingNumber ? this.sanitizeText(dto.trackingNumber) : undefined,
      trackingUrl: dto.trackingUrl ? dto.trackingUrl.trim() : undefined,
      estimatedDeliveryDate: dto.estimatedDeliveryDate ? new Date(dto.estimatedDeliveryDate) : undefined,
      items: validatedItems,
      notes: dto.notes ? this.sanitizeText(dto.notes) : undefined
    };
  }
}
