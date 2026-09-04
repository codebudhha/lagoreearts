/**
 * Module 22: Shipping & Delivery — Domain Types and DTO Interfaces
 * Lagoree Arts Backend
 */

export type ShippingZoneStatus = 'ACTIVE' | 'INACTIVE';
export type ShippingPostalCodeStatus = 'ACTIVE' | 'INACTIVE';
export type ShippingMethodStatus = 'ACTIVE' | 'INACTIVE';
export type ShippingRateStatus = 'ACTIVE' | 'INACTIVE';

export type ShipmentStatus =
  | 'PENDING'
  | 'READY'
  | 'LABEL_CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED';

export type ShipmentEventSource = 'ADMIN' | 'PROVIDER' | 'SYSTEM';

export interface ShippingZoneRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: ShippingZoneStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  postalCodes?: ShippingZonePostalCodeRecord[];
  rates?: ShippingRateRecord[];
}

export interface ShippingZonePostalCodeRecord {
  id: string;
  zoneId: string;
  postalCode: string;
  city: string | null;
  state: string | null;
  status: ShippingPostalCodeStatus;
  createdAt: Date;
  updatedAt: Date;
  zone?: ShippingZoneRecord;
}

export interface ShippingMethodRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  carrier: string | null;
  serviceLevel: string | null;
  status: ShippingMethodStatus;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  rates?: ShippingRateRecord[];
}

export interface ShippingRateRecord {
  id: string;
  shippingZoneId: string;
  shippingMethodId: string;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  amount: number;
  currency: string;
  status: ShippingRateStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  zone?: ShippingZoneRecord;
  method?: ShippingMethodRecord;
}

export interface OrderShippingSnapshotRecord {
  id: string;
  orderId: string;
  zoneCode: string;
  zoneName: string;
  methodCode: string;
  methodName: string;
  carrier: string | null;
  serviceLevel: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  shippingAmount: number;
  currency: string;
  postalCode: string;
  createdAt: Date;
}

export interface ShipmentItemRecord {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
  createdAt: Date;
  orderItem?: any;
}

export interface ShipmentEventRecord {
  id: string;
  shipmentId: string;
  status: string;
  eventCode: string | null;
  description: string | null;
  location: string | null;
  occurredAt: Date;
  source: ShipmentEventSource;
  createdAt: Date;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  shipmentNumber: string;
  carrier: string | null;
  serviceLevel: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  estimatedDeliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: ShipmentItemRecord[];
  events?: ShipmentEventRecord[];
  order?: any;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateShippingZoneDto {
  name: string;
  code: string;
  description?: string;
  status?: ShippingZoneStatus;
  priority?: number;
}

export interface UpdateShippingZoneDto {
  name?: string;
  code?: string;
  description?: string;
  status?: ShippingZoneStatus;
  priority?: number;
}

export interface AddPostalCodesDto {
  postalCodes: Array<{
    postalCode: string;
    city?: string;
    state?: string;
    status?: ShippingPostalCodeStatus;
  }>;
}

export interface CreateShippingMethodDto {
  name: string;
  code: string;
  description?: string;
  carrier?: string;
  serviceLevel?: string;
  status?: ShippingMethodStatus;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  sortOrder?: number;
}

export interface UpdateShippingMethodDto {
  name?: string;
  code?: string;
  description?: string;
  carrier?: string;
  serviceLevel?: string;
  status?: ShippingMethodStatus;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  sortOrder?: number;
}

export interface CreateShippingRateDto {
  shippingZoneId: string;
  shippingMethodId: string;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  amount: number;
  currency?: string;
  status?: ShippingRateStatus;
  priority?: number;
}

export interface UpdateShippingRateDto {
  shippingZoneId?: string;
  shippingMethodId?: string;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  amount?: number;
  currency?: string;
  status?: ShippingRateStatus;
  priority?: number;
}

export interface CreateShipmentItemDto {
  orderItemId: string;
  quantity: number;
}

export interface CreateShipmentDto {
  carrier?: string;
  serviceLevel?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string | Date;
  items: CreateShipmentItemDto[];
  notes?: string;
}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
  eventCode?: string;
  description?: string;
  location?: string;
  occurredAt?: string | Date;
  source?: ShipmentEventSource;
}

export interface UpdateShipmentTrackingDto {
  carrier?: string;
  serviceLevel?: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string | Date;
}

export interface ShippingQuoteRequestDto {
  postalCode: string;
  orderValue?: number;
  currency?: string;
  weight?: number;
  methodCode?: string;
}

export interface ShippingMethodQuote {
  methodId: string;
  methodCode: string;
  methodName: string;
  carrier: string | null;
  serviceLevel: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  amount: number;
  currency: string;
  isFree: boolean;
}

export interface ShippingQuoteResponse {
  serviceable: boolean;
  zone: {
    id: string;
    name: string;
    code: string;
  } | null;
  postalCode: string;
  methods: ShippingMethodQuote[];
}

export interface AdminShipmentListQuery {
  page?: number;
  limit?: number;
  orderId?: string;
  orderNumber?: string;
  shipmentNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  status?: ShipmentStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'shipmentNumber' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerShipmentView {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber?: string;
  carrier: string | null;
  serviceLevel: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  estimatedDeliveryDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    orderItemId: string;
    sku?: string;
    productName?: string;
    variantDescription?: string | null;
    quantity: number;
  }>;
  events: Array<{
    id: string;
    status: string;
    eventCode: string | null;
    description: string | null;
    location: string | null;
    occurredAt: string;
    source: string;
  }>;
}

export interface AdminShipmentView extends CustomerShipmentView {
  updatedAt: string;
  order?: any;
}
