/**
 * Module 22: Shipping & Delivery — Carrier Gateway Provider Interface
 * Lagoree Arts Backend
 */

export interface CreateShipmentProviderRequest {
  shipmentNumber: string;
  orderNumber: string;
  carrier?: string;
  serviceLevel?: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalWeight?: number;
}

export interface CreateShipmentProviderResult {
  success: boolean;
  providerShipmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  serviceLevel: string;
  estimatedDeliveryDate?: Date;
  rawResponse?: any;
}

export interface TrackShipmentProviderResult {
  status: string;
  location?: string;
  description?: string;
  occurredAt: Date;
  estimatedDeliveryDate?: Date;
}

export interface ShippingProvider {
  name: string;
  createShipment(request: CreateShipmentProviderRequest): Promise<CreateShipmentProviderResult>;
  generateTrackingNumber(carrier?: string): Promise<string>;
  trackShipment(trackingNumber: string): Promise<TrackShipmentProviderResult>;
  cancelShipment(trackingNumber: string): Promise<{ success: boolean; message?: string }>;
}
