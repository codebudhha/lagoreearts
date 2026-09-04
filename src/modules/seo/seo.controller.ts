/**
 * Module 26: SEO Management System — HTTP Controllers
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { ApiResponse } from '../../utils/apiResponse.ts';
import { SeoService } from './seo.service.ts';
import { SeoPublicService } from './seo.public.service.ts';
import { SeoValidator } from './seo.validator.ts';
import { SeoSerializer } from './seo.serializer.ts';

export class SeoAdminController {
  /**
   * GET /api/v1/admin/seo
   */
  static async listMetadata(req: any, res: any, next: any) {
    try {
      const { entityType, search, page, limit } = req.query;
      const validEntityType = entityType ? SeoValidator.validateEntityType(String(entityType)) : undefined;

      const { data, total } = await SeoService.listMetadata({
        entityType: validEntityType,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20
      });

      return ApiResponse.paginated(res, data, page ? Number(page) : 1, limit ? Number(limit) : 20, total, 200, 'SEO metadata list retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/seo/settings
   */
  static async getSiteSettings(req: any, res: any, next: any) {
    try {
      const settings = await SeoService.getSiteSettings();
      return ApiResponse.success(res, settings, 200, 'Global SEO site settings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/admin/seo/settings
   */
  static async updateSiteSettings(req: any, res: any, next: any) {
    try {
      const dto = SeoValidator.validateSiteSettings(req.body);
      const updated = await SeoService.updateSiteSettings(dto, {
        adminUserId: req.admin?.id,
        ipAddress: req.ip,
        userAgent: req.get?.('user-agent')
      });
      return ApiResponse.success(res, updated, 200, 'Global SEO site settings updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/seo/:entityType/:entityId
   */
  static async getMetadata(req: any, res: any, next: any) {
    try {
      const entityType = SeoValidator.validateEntityType(req.params.entityType);
      const entityId = String(req.params.entityId).trim();

      const preview = await SeoService.getMetadata(entityType, entityId);
      return ApiResponse.success(
        res,
        SeoSerializer.serializeAdminPreview(preview),
        200,
        'SEO metadata and resolution preview retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/admin/seo/:entityType/:entityId
   */
  static async upsertMetadata(req: any, res: any, next: any) {
    try {
      const entityType = SeoValidator.validateEntityType(req.params.entityType);
      const entityId = String(req.params.entityId).trim();
      const dto = SeoValidator.validateUpsertMetadata(req.body);

      const preview = await SeoService.upsertMetadata(entityType, entityId, dto, {
        adminUserId: req.admin?.id,
        ipAddress: req.ip,
        userAgent: req.get?.('user-agent')
      });

      return ApiResponse.success(
        res,
        SeoSerializer.serializeAdminPreview(preview),
        200,
        'SEO metadata saved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/seo/:entityType/:entityId
   */
  static async deleteMetadata(req: any, res: any, next: any) {
    try {
      const entityType = SeoValidator.validateEntityType(req.params.entityType);
      const entityId = String(req.params.entityId).trim();

      const preview = await SeoService.deleteMetadata(entityType, entityId, {
        adminUserId: req.admin?.id,
        ipAddress: req.ip,
        userAgent: req.get?.('user-agent')
      });

      return ApiResponse.success(
        res,
        SeoSerializer.serializeAdminPreview(preview),
        200,
        'SEO metadata removed and restored to deterministic fallback successfully'
      );
    } catch (err) {
      next(err);
    }
  }
}

export class SeoPublicController {
  /**
   * GET /api/v1/seo/:entityType/:entityId
   */
  static async getByTypeAndId(req: any, res: any, next: any) {
    try {
      const entityType = SeoValidator.validateEntityType(req.params.entityType);
      const entityId = String(req.params.entityId).trim();

      const preview = await SeoService.resolveSeo(entityType, entityId);
      return ApiResponse.success(
        res,
        SeoSerializer.serializePublicSeo(preview.resolvedSeo),
        200,
        'Public SEO metadata resolved successfully'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/product/:slug
   */
  static async getProductSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getProductSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Product SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/category/:slug
   */
  static async getCategorySeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getCategorySeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Category SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/collection/:slug
   */
  static async getCollectionSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getCollectionSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Collection SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/artist/:slug
   */
  static async getArtistSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getArtistSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Artist SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/journal/:slug
   */
  static async getJournalPostSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getJournalPostSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Journal Post SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/lookbook/:slug
   */
  static async getLookbookSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getLookbookSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Lookbook SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/sanskrit-edit/:slug
   */
  static async getSanskritEditSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getSanskritEditSeoBySlug(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Sanskrit Edit SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/homepage
   */
  static async getHomepageSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getHomepageSeo();
      return ApiResponse.success(res, seo, 200, 'Homepage SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/seo/page/:slug
   */
  static async getPageSeo(req: any, res: any, next: any) {
    try {
      const seo = await SeoPublicService.getPageSeo(req.params.slug);
      return ApiResponse.success(res, seo, 200, 'Page SEO resolved successfully');
    } catch (err) {
      next(err);
    }
  }
}

export class SitemapController {
  /**
   * GET /sitemap.xml
   */
  static async getSitemapXml(req: any, res: any, next: any) {
    try {
      const xml = await SeoService.generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(xml);
    } catch (err) {
      next(err);
    }
  }
}

export class RobotsController {
  /**
   * GET /robots.txt
   */
  static async getRobotsTxt(req: any, res: any, next: any) {
    try {
      const txt = await SeoService.generateRobotsTxt();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(txt);
    } catch (err) {
      next(err);
    }
  }
}
