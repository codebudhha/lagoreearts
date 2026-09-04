/**
 * Module 26: SEO Management System — Route Definitions
 * Lagoree Arts Luxury E-Commerce Backend
 */

import express from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  SeoAdminController,
  SeoPublicController,
  SitemapController,
  RobotsController
} from './seo.controller.ts';

// ==========================================
// Admin SEO Router (/api/v1/admin/seo)
// ==========================================
export const adminSeoRouter = express.Router();
adminSeoRouter.use(requireAdminAuth);

// Global site settings (specific subroutes before :entityType/:entityId)
adminSeoRouter.get('/settings', requirePermission('seo.view'), SeoAdminController.getSiteSettings);
adminSeoRouter.put('/settings', requirePermission('seo.settings'), SeoAdminController.updateSiteSettings);

// Metadata collection & inspection
adminSeoRouter.get('/', requirePermission('seo.view'), SeoAdminController.listMetadata);
adminSeoRouter.get('/:entityType/:entityId', requirePermission('seo.view'), SeoAdminController.getMetadata);
adminSeoRouter.put(
  '/:entityType/:entityId',
  requirePermission('seo.create'),
  SeoAdminController.upsertMetadata
);
adminSeoRouter.delete(
  '/:entityType/:entityId',
  requirePermission('seo.delete'),
  SeoAdminController.deleteMetadata
);

// ==========================================
// Public Storefront SEO Router (/api/v1/seo)
// ==========================================
export const publicSeoRouter = express.Router();

publicSeoRouter.get('/product/:slug', SeoPublicController.getProductSeo);
publicSeoRouter.get('/category/:slug', SeoPublicController.getCategorySeo);
publicSeoRouter.get('/collection/:slug', SeoPublicController.getCollectionSeo);
publicSeoRouter.get('/artist/:slug', SeoPublicController.getArtistSeo);
publicSeoRouter.get('/journal/:slug', SeoPublicController.getJournalPostSeo);
publicSeoRouter.get('/lookbook/:slug', SeoPublicController.getLookbookSeo);
publicSeoRouter.get('/sanskrit-edit/:slug', SeoPublicController.getSanskritEditSeo);
publicSeoRouter.get('/homepage', SeoPublicController.getHomepageSeo);
publicSeoRouter.get('/page/:slug', SeoPublicController.getPageSeo);
publicSeoRouter.get('/:entityType/:entityId', SeoPublicController.getByTypeAndId);

// Export standalone controllers for root mount (sitemap.xml, robots.txt)
export { SitemapController, RobotsController };
