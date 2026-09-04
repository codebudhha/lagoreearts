/**
 * Module 22: Shipping & Delivery — Routes Definition
 * Lagoree Arts Backend
 */

import { Router } from '../../utils/express.ts';
import { CustomerShippingController } from './customer-shipping.controller.ts';
import { AdminShippingController } from './admin-shipping.controller.ts';
import { ShippingQuoteController } from './shipping-quote.controller.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';

// 1. Customer Shipping Router (Mounted under /api/v1/customer)
export const customerShippingRouter = Router();
customerShippingRouter.get('/orders/:orderId/shipping', requireCustomerAuth, CustomerShippingController.getOrderShipping);
customerShippingRouter.get('/orders/:orderId/shipments', requireCustomerAuth, CustomerShippingController.getOrderShipments);
customerShippingRouter.get('/shipments/:shipmentId', requireCustomerAuth, CustomerShippingController.getShipmentById);

// 2. Admin Shipping Configuration Router (Mounted under /api/v1/admin/shipping)
export const adminShippingRouter = Router();

// Zones
adminShippingRouter.get('/zones', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-zones'), AdminShippingController.listZones);
adminShippingRouter.post('/zones', requireAdminAuth, requirePermission('shipping.create', 'shipping.manage-zones'), AdminShippingController.createZone);
adminShippingRouter.get('/zones/:id', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-zones'), AdminShippingController.getZoneById);
adminShippingRouter.patch('/zones/:id', requireAdminAuth, requirePermission('shipping.update', 'shipping.manage-zones'), AdminShippingController.updateZone);
adminShippingRouter.delete('/zones/:id', requireAdminAuth, requirePermission('shipping.delete', 'shipping.manage-zones'), AdminShippingController.deleteZone);
adminShippingRouter.post('/zones/:id/postal-codes', requireAdminAuth, requirePermission('shipping.update', 'shipping.manage-zones'), AdminShippingController.addPostalCodesToZone);
adminShippingRouter.delete('/zones/:id/postal-codes/:postalCode', requireAdminAuth, requirePermission('shipping.update', 'shipping.manage-zones'), AdminShippingController.removePostalCodeFromZone);

// Methods
adminShippingRouter.get('/methods', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-methods'), AdminShippingController.listMethods);
adminShippingRouter.post('/methods', requireAdminAuth, requirePermission('shipping.create', 'shipping.manage-methods'), AdminShippingController.createMethod);
adminShippingRouter.get('/methods/:id', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-methods'), AdminShippingController.getMethodById);
adminShippingRouter.patch('/methods/:id', requireAdminAuth, requirePermission('shipping.update', 'shipping.manage-methods'), AdminShippingController.updateMethod);
adminShippingRouter.delete('/methods/:id', requireAdminAuth, requirePermission('shipping.delete', 'shipping.manage-methods'), AdminShippingController.deleteMethod);

// Rates
adminShippingRouter.get('/rates', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-rates'), AdminShippingController.listRates);
adminShippingRouter.post('/rates', requireAdminAuth, requirePermission('shipping.create', 'shipping.manage-rates'), AdminShippingController.createRate);
adminShippingRouter.get('/rates/:id', requireAdminAuth, requirePermission('shipping.view', 'shipping.manage-rates'), AdminShippingController.getRateById);
adminShippingRouter.patch('/rates/:id', requireAdminAuth, requirePermission('shipping.update', 'shipping.manage-rates'), AdminShippingController.updateRate);
adminShippingRouter.delete('/rates/:id', requireAdminAuth, requirePermission('shipping.delete', 'shipping.manage-rates'), AdminShippingController.deleteRate);

// 3. Admin Shipments Router (Mounted under /api/v1/admin)
export const adminShipmentRouter = Router();
adminShipmentRouter.get('/shipments', requireAdminAuth, requirePermission('shipment.view', 'shipping.view'), AdminShippingController.listShipments);
adminShipmentRouter.get('/shipments/:id', requireAdminAuth, requirePermission('shipment.view', 'shipping.view'), AdminShippingController.getShipmentById);
adminShipmentRouter.post('/orders/:orderId/shipments', requireAdminAuth, requirePermission('shipment.create'), AdminShippingController.createShipment);
adminShipmentRouter.patch('/shipments/:id/status', requireAdminAuth, requirePermission('shipment.manage-status', 'shipment.update'), AdminShippingController.updateShipmentStatus);
adminShipmentRouter.patch('/shipments/:id/tracking', requireAdminAuth, requirePermission('shipment.update'), AdminShippingController.updateShipmentTracking);
adminShipmentRouter.post('/shipments/:id/cancel', requireAdminAuth, requirePermission('shipment.manage-status', 'shipment.update'), AdminShippingController.cancelShipment);

// 4. Public Quote & Serviceability Router (Mounted under /api/v1/shipping)
export const publicShippingRouter = Router();
publicShippingRouter.post('/rates/quote', ShippingQuoteController.getQuote);
publicShippingRouter.get('/serviceability/:postalCode', ShippingQuoteController.checkServiceability);
