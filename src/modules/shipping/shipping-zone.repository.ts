/**
 * Module 22: Shipping & Delivery — Shipping Zone Repository
 * Lagoree Arts Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  ShippingZoneRecord,
  ShippingZonePostalCodeRecord,
  CreateShippingZoneDto,
  UpdateShippingZoneDto
} from './shipping.types.ts';

export class ShippingZoneRepository {
  public static async findById(id: string, includeRelations: boolean = false): Promise<ShippingZoneRecord | null> {
    return prisma.shippingZone.findUnique({
      where: { id },
      include: includeRelations ? { postalCodes: true, rates: true } : undefined
    });
  }

  public static async findByCode(code: string): Promise<ShippingZoneRecord | null> {
    return prisma.shippingZone.findUnique({
      where: { code: code.toUpperCase() }
    });
  }

  public static async listZones(query?: { status?: string; search?: string }): Promise<ShippingZoneRecord[]> {
    return prisma.shippingZone.findMany({
      where: {
        status: query?.status,
        name: query?.search ? { contains: query.search } : undefined
      },
      include: { postalCodes: true },
      orderBy: { priority: 'desc' }
    });
  }

  public static async createZone(data: CreateShippingZoneDto): Promise<ShippingZoneRecord> {
    return prisma.shippingZone.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        status: data.status || 'ACTIVE',
        priority: data.priority !== undefined ? data.priority : 0
      }
    });
  }

  public static async updateZone(id: string, data: UpdateShippingZoneDto): Promise<ShippingZoneRecord | null> {
    return prisma.shippingZone.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        status: data.status,
        priority: data.priority
      }
    });
  }

  public static async deleteZone(id: string): Promise<ShippingZoneRecord | null> {
    return prisma.shippingZone.delete({
      where: { id }
    });
  }

  // Postal codes
  public static async findPostalCodeMapping(postalCode: string): Promise<ShippingZonePostalCodeRecord | null> {
    return prisma.shippingZonePostalCode.findFirst({
      where: {
        postalCode: postalCode.trim(),
        status: 'ACTIVE'
      },
      include: { zone: true }
    });
  }

  public static async findPostalCodeInZone(zoneId: string, postalCode: string): Promise<ShippingZonePostalCodeRecord | null> {
    return prisma.shippingZonePostalCode.findUnique({
      where: {
        zoneId_postalCode: {
          zoneId,
          postalCode: postalCode.trim()
        }
      }
    });
  }

  public static async addPostalCodes(
    zoneId: string,
    codes: Array<{ postalCode: string; city?: string; state?: string; status?: 'ACTIVE' | 'INACTIVE' }>
  ): Promise<number> {
    let count = 0;
    for (const c of codes) {
      const existing = await this.findPostalCodeInZone(zoneId, c.postalCode);
      if (!existing) {
        prisma.shippingZonePostalCode.create({
          data: {
            zoneId,
            postalCode: c.postalCode.trim(),
            city: c.city || null,
            state: c.state || null,
            status: c.status || 'ACTIVE'
          }
        });
        count++;
      }
    }
    return count;
  }

  public static async removePostalCode(zoneId: string, postalCode: string): Promise<boolean> {
    const existing = await this.findPostalCodeInZone(zoneId, postalCode);
    if (!existing) return false;
    prisma.shippingZonePostalCode.delete({
      where: { id: existing.id }
    });
    return true;
  }
}
