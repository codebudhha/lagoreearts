/**
 * Module 22: Shipping & Delivery — Shipping Method Repository
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  ShippingMethodRecord,
  CreateShippingMethodDto,
  UpdateShippingMethodDto
} from './shipping.types.ts';

export class ShippingMethodRepository {
  public static async findById(id: string, includeRates: boolean = false): Promise<ShippingMethodRecord | null> {
    return prisma.shippingMethod.findUnique({
      where: { id },
      include: includeRates ? { rates: true } : undefined
    });
  }

  public static async findByCode(code: string): Promise<ShippingMethodRecord | null> {
    return prisma.shippingMethod.findUnique({
      where: { code: code.toUpperCase() }
    });
  }

  public static async listMethods(query?: { status?: string }): Promise<ShippingMethodRecord[]> {
    return prisma.shippingMethod.findMany({
      where: { status: query?.status },
      orderBy: { sortOrder: 'asc' }
    });
  }

  public static async createMethod(data: CreateShippingMethodDto): Promise<ShippingMethodRecord> {
    return prisma.shippingMethod.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        carrier: data.carrier,
        serviceLevel: data.serviceLevel,
        status: data.status || 'ACTIVE',
        estimatedMinDays: data.estimatedMinDays,
        estimatedMaxDays: data.estimatedMaxDays,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : 0
      }
    });
  }

  public static async updateMethod(id: string, data: UpdateShippingMethodDto): Promise<ShippingMethodRecord | null> {
    return prisma.shippingMethod.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        carrier: data.carrier,
        serviceLevel: data.serviceLevel,
        status: data.status,
        estimatedMinDays: data.estimatedMinDays,
        estimatedMaxDays: data.estimatedMaxDays,
        sortOrder: data.sortOrder
      }
    });
  }

  public static async deleteMethod(id: string): Promise<ShippingMethodRecord | null> {
    return prisma.shippingMethod.delete({
      where: { id }
    });
  }
}
