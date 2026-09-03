export interface InventoryCheckContext {
  productId: string;
  variantId?: string | null;
  requestedQuantity: number;
}

export interface InventoryCheckResult {
  available: boolean;
  currentStock: number;
  allowBackorder: boolean;
  isOneOfAKind: boolean;
}

export interface InventoryAvailabilityProvider {
  checkAvailability(context: InventoryCheckContext): Promise<InventoryCheckResult>;
}
