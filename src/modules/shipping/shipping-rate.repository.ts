/**
 * Module 22: Shipping & Delivery — Shipping Rate Repository
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  ShippingRateRecord,
  CreateShippingRateDto,
  UpdateShippingRateDto
} from './shipping.types.ts';

export class ShippingRateRepository {
  public static async findById(id: string, includeRelations: boolean = true): Promise<ShippingRateRecord | null> {
    return prisma.shippingRate.findUnique({
      where: { id },
      include: includeRelations ? { zone: true, method: true } : undefined
    });
  }

  public static async listRates(query?: {
    shippingZoneId?: string;
    shippingMethodId?: string;
    status?: string;
    currency?: string;
  }): Promise<ShippingRateRecord[]> {
    return prisma.shippingRate.findMany({
      where: {
        shippingZoneId: query?.shippingZoneId,
        shippingMethodId: query?.shippingMethodId,
        status: query?.status,
        currency: query?.currency
      },
      include: { zone: true, method: true },
      orderBy: { priority: 'desc' }
    });
  }

  public static async findApplicableRates(params: {
    shippingZoneId: string;
    currency?: string;
  }): Promise<ShippingRateRecord[]> {
    return prisma.shippingRate.findMany({
      where: {
        shippingZoneId: params.shippingZoneId,
        status: 'ACTIVE',
        currency: params.currency || 'INR'
      },
      include: { zone: true, method: true },
      orderBy: { priority: 'desc' }
    });
  }

  public static async createRate(data: CreateShippingRateDto): Promise<ShippingRateRecord> {
    return prisma.shippingRate.create({
      data: {
        shippingZoneId: data.shippingZoneId,
        shippingMethodId: data.shippingMethodId,
        minOrderValue: data.minOrderValue !== undefined ? data.minOrderValue : null,
        maxOrderValue: data.maxOrderValue !== undefined ? data.maxOrderValue : null,
        minWeight: data.minWeight !== undefined ? data.minWeight : null,
        maxWeight: data.maxWeight !== undefined ? data.maxWeight : null,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.status || 'ACTIVE',
        priority: data.priority !== undefined ? data.priority : 0
      },
      include: { zone: true, method: true }
    });
  }

  public static async updateRate(id: string, data: UpdateShippingRateDto): Promise<ShippingRateRecord | null> {
    return prisma.shippingRate.update({
      where: { id },
      data: {
        shippingZoneId: data.shippingZoneId,
        shippingMethodId: data.shippingMethodId,
        minOrderValue: data.minOrderValue,
        maxOrderValue: data.maxOrderValue,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        priority: data.priority
      },
      include: { zone: true, method: true }
    });
  }

  public static async deleteRate(id: string): Promise<ShippingRateRecord | null> {
    return prisma.shippingRate.delete({
      where: { id }
    });
  }
}
