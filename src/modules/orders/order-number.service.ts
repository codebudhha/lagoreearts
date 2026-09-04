/**
 * Module 20: Orders — Order Number Generation Service
 * Lagoree Arts Backend
 * 
 * Provides collision-safe, concurrency-safe human-readable order numbers.
 * Format: LA-YYYY-NNNNNN (e.g., LA-2026-000001)
 */

import { prisma } from '../../database/prisma.ts';

export class OrderNumberService {
  /**
   * Generates a unique, sequential, human-readable order number for the current calendar year.
   */
  public static async generateOrderNumber(year: number = new Date().getFullYear()): Promise<string> {
    return prisma.$transaction(async (tx: any) => {
      // 1. Fetch or initialize the sequence counter for this year
      let seq = tx.orderSequence.findUnique({ where: { year } });
      
      let nextNumber = 1;
      if (!seq) {
        seq = tx.orderSequence.create({
          data: {
            id: `ORDER_SEQ_${year}`,
            year,
            currentNumber: 1
          }
        });
        nextNumber = 1;
      } else {
        nextNumber = Number(seq.currentNumber) + 1;
        tx.orderSequence.update({
          where: { year },
          data: { currentNumber: nextNumber }
        });
      }

      // 2. Format with zero padding (minimum 6 digits)
      const paddedNumber = String(nextNumber).padStart(6, '0');
      const orderNumber = `LA-${year}-${paddedNumber}`;

      return orderNumber;
    });
  }
}
