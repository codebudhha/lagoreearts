import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { HomepageService } from './homepage.service.ts';
import { HomepagePublicService } from './homepage-public.service.ts';

export class HomepageAdminController {
  // ==========================================
  // Homepage Operations
  // ==========================================

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomepageService.listHomepages(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const homepage = await HomepageService.createHomepage(req.body, adminUserId, meta);
      return ApiResponse.success(res, homepage, 201, 'Homepage created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const homepage = await HomepageService.getHomepageById(req.params.id);
      return ApiResponse.success(res, homepage);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await HomepageService.updateHomepage(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Homepage updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await HomepageService.updateHomepageStatus(req.params.id, req.body.status, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Homepage status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await HomepageService.setDefaultHomepage(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Default homepage set successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await HomepageService.deleteHomepage(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Homepage deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Section Operations
  // ==========================================

  static async listSections(req: Request, res: Response, next: NextFunction) {
    try {
      const sections = await HomepageService.listSections(req.params.homepageId);
      return ApiResponse.success(res, sections);
    } catch (err) {
      next(err);
    }
  }

  static async createSection(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const section = await HomepageService.createSection(req.params.homepageId, req.body, adminUserId, meta);
      return ApiResponse.success(res, section, 201, 'Section created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const section = await HomepageService.getSectionById(req.params.homepageId, req.params.sectionId);
      return ApiResponse.success(res, section);
    } catch (err) {
      next(err);
    }
  }

  static async updateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await HomepageService.updateSection(req.params.homepageId, req.params.sectionId, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Section updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteSection(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await HomepageService.deleteSection(req.params.homepageId, req.params.sectionId, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Section deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderSections(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await HomepageService.reorderSections(req.params.homepageId, req.body.items, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Sections reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Section Items Operations
  // ==========================================

  static async setSectionProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.items || req.body.products || req.body.ids;
      const updated = await HomepageService.setSectionProducts(req.params.homepageId, req.params.sectionId, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Section products updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setSectionCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.items || req.body.collections || req.body.ids;
      const updated = await HomepageService.setSectionCollections(req.params.homepageId, req.params.sectionId, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Section collections updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setSectionArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.items || req.body.artists || req.body.ids;
      const updated = await HomepageService.setSectionArtists(req.params.homepageId, req.params.sectionId, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Section artists updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setSectionCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.items || req.body.categories || req.body.ids;
      const updated = await HomepageService.setSectionCategories(req.params.homepageId, req.params.sectionId, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Section categories updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async attachSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const attached = await HomepageService.attachSectionMedia(req.params.homepageId, req.params.sectionId, req.body, adminUserId, meta);
      return ApiResponse.success(res, attached, 201, 'Media attached to section successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await HomepageService.detachSectionMedia(
        req.params.homepageId,
        req.params.sectionId,
        req.params.mediaId,
        req.query.role as string,
        adminUserId,
        meta
      );
      return ApiResponse.success(res, null, 200, 'Media detached from section successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await HomepageService.reorderSectionMedia(req.params.homepageId, req.params.sectionId, req.body.items, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Section media reordered successfully');
    } catch (err) {
      next(err);
    }
  }
}

export class HomepagePublicController {
  static async getDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const homepage = await HomepagePublicService.getPublicDefaultHomepage();
      return ApiResponse.success(res, homepage);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const homepage = await HomepagePublicService.getPublicHomepageBySlug(req.params.slug);
      return ApiResponse.success(res, homepage);
    } catch (err) {
      next(err);
    }
  }
}
