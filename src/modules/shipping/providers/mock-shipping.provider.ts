/**
 * Module 22: Shipping & Delivery — Mock Shipping Provider
 * Lagoree Arts Backend
 * 
 * Provides deterministic simulation of courier carrier interactions for local development
 * and automated testing without external network dependencies.
 */

import crypto from 'node:crypto';
import type {
  ShippingProvider,
  CreateShipmentProviderRequest,
  CreateShipmentProviderResult,
  TrackShipmentProviderResult
} from './shipping-provider.interface.ts';

export class MockShippingProvider implements ShippingProvider {
  public name = 'MOCK';

  public async createShipment(request: CreateShipmentProviderRequest): Promise<CreateShipmentProviderResult> {
    const carrier = request.carrier || 'LAGOREE_WHITE_GLOVE';
    const serviceLevel = request.serviceLevel || 'EXPRESS_SECURE';
    const trackingNumber = await this.generateTrackingNumber(carrier);
    const trackingUrl = `https://track.lagoreearts.com/shipments/${trackingNumber}`;

    const estDays = serviceLevel === 'EXPRESS_SECURE' ? 3 : 5;
    const estimatedDeliveryDate = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000);

    return {
      success: true,
      providerShipmentId: `MOCK_SHIP_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      trackingNumber,
      trackingUrl,
      carrier,
      serviceLevel,
      estimatedDeliveryDate,
      rawResponse: {
        status: 'MANIFEST_GENERATED',
        carrier,
        serviceLevel,
        packageCount: 1
      }
    };
  }

  public async generateTrackingNumber(carrier: string = 'MOCK'): Promise<string> {
    const prefix = carrier.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TRK-${prefix}-${Date.now().toString().slice(-4)}${randomHex}`;
  }

  public async trackShipment(trackingNumber: string): Promise<TrackShipmentProviderResult> {
    return {
      status: 'IN_TRANSIT',
      location: 'Lagoree Atelier Central Logistics Facility, Jaipur',
      description: 'Artwork carefully packed in custom wooden crate and dispatched.',
      occurredAt: new Date(),
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };
  }

  public async cancelShipment(trackingNumber: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: true,
      message: `Shipment with tracking ${trackingNumber} successfully cancelled with carrier.`
    };
  }
}
