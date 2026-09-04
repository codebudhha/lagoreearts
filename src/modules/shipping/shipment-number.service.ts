/**
 * Module 22: Shipping & Delivery — Shipment Number Generator
 * Lagoree Arts Backend
 * 
 * Generates unique, collision-safe, human-readable shipment numbers
 * using annual sequences (e.g., LAS-2026-000001).
 */

import { prisma } from '../../database/prisma.ts';

export class ShipmentNumberService {
  private static readonly PREFIX = 'LAS';

  public static async generateShipmentNumber(year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    const seqId = `SHIPMENT_SEQ_${currentYear}`;

    let seq = await prisma.shipmentSequence.findUnique({
      where: { year: currentYear }
    });

    let nextNumber = 1;
    if (!seq) {
      await prisma.shipmentSequence.create({
        data: {
          id: seqId,
          year: currentYear,
          currentNumber: 1
        }
      });
      nextNumber = 1;
    } else {
      nextNumber = seq.currentNumber + 1;
      await prisma.shipmentSequence.update({
        where: { year: currentYear },
        data: { currentNumber: nextNumber }
      });
    }

    const paddedNumber = String(nextNumber).padStart(6, '0');
    return `${this.PREFIX}-${currentYear}-${paddedNumber}`;
  }
}
