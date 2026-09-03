import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { LookbookService } from './lookbook.service.ts';
import { LookbookPublicService } from './lookbook-public.service.ts';
import type { LookbookSectionMediaRole } from './lookbook.types.ts';

export class LookbookController {
  // ==========================================
  // Public Controller Handlers
  // ==========================================

  static async getPublicLookbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LookbookPublicService.getPublicLookbooks(req.query);
      return ApiResponse.success(res, result, 200, 'Published lookbooks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getPublicLookbookBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const lookbook = await LookbookPublicService.getPublicLookbookBySlug(req.params.slug);
      return ApiResponse.success(res, lookbook, 200, 'Published lookbook retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Lookbook Controller Handlers
  // ==========================================

  static async listLookbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LookbookService.listLookbooks(req.query);
      return ApiResponse.success(res, result, 200, 'Lookbooks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getLookbookById(req: Request, res: Response, next: NextFunction) {
    try {
      const lookbook = await LookbookService.getLookbookById(req.params.id);
      return ApiResponse.success(res, lookbook, 200, 'Lookbook retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.createLookbook(req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 201, 'Lookbook created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.updateLookbook(req.params.id, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 200, 'Lookbook updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const deleted = await LookbookService.deleteLookbook(req.params.id, userId, ipAddress, userAgent);
      return ApiResponse.success(res, deleted, 200, 'Lookbook deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async publishLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.publishLookbook(req.params.id, req.body.publishedAt, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 200, 'Lookbook published successfully');
    } catch (error) {
      next(error);
    }
  }

  static async unpublishLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.unpublishLookbook(req.params.id, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 200, 'Lookbook unpublished successfully');
    } catch (error) {
      next(error);
    }
  }

  static async archiveLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.archiveLookbook(req.params.id, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 200, 'Lookbook archived successfully');
    } catch (error) {
      next(error);
    }
  }

  static async duplicateLookbook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const lookbook = await LookbookService.duplicateLookbook(req.params.id, userId, ipAddress, userAgent);
      return ApiResponse.success(res, lookbook, 201, 'Lookbook duplicated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Section Controller Handlers
  // ==========================================

  static async getSections(req: Request, res: Response, next: NextFunction) {
    try {
      const lookbook = await LookbookService.getLookbookById(req.params.id);
      return ApiResponse.success(res, lookbook.sections || [], 200, 'Lookbook sections retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createSection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.createSection(req.params.id, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 201, 'Lookbook section created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getSectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const section = await LookbookService.getSectionById(req.params.sectionId);
      return ApiResponse.success(res, section, 200, 'Lookbook section retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.updateSection(req.params.sectionId, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Lookbook section updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteSection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const deleted = await LookbookService.deleteSection(req.params.sectionId, userId, ipAddress, userAgent);
      return ApiResponse.success(res, deleted, 200, 'Lookbook section deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async reorderSections(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const sections = await LookbookService.reorderSections(req.params.id, req.body.items, userId, ipAddress, userAgent);
      return ApiResponse.success(res, sections, 200, 'Lookbook sections reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Section Entity Junction Handlers
  // ==========================================

  static async setSectionProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionProducts(req.params.sectionId, req.body.products, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section products updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionCollections(req.params.sectionId, req.body.collections, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section collections updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionArtists(req.params.sectionId, req.body.artists, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section artists updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionCategories(req.params.sectionId, req.body.categories, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section categories updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionJournals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionJournals(req.params.sectionId, req.body.journals, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section journal posts updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionSanskritEdits(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const section = await LookbookService.setSectionSanskritEdits(req.params.sectionId, req.body.sanskritEdits, userId, ipAddress, userAgent);
      return ApiResponse.success(res, section, 200, 'Section sanskrit edit profiles updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Section Media Handlers
  // ==========================================

  static async attachSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const { mediaId, role, sortOrder, isPrimary } = req.body;
      const attached = await LookbookService.attachSectionMedia(
        req.params.sectionId,
        mediaId,
        role,
        sortOrder,
        isPrimary,
        userId,
        ipAddress,
        userAgent
      );
      return ApiResponse.success(res, attached, 201, 'Media attached to section successfully');
    } catch (error) {
      next(error);
    }
  }

  static async detachSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const { sectionId, mediaId, role } = req.params;
      const detached = await LookbookService.detachSectionMedia(
        sectionId,
        mediaId,
        role as LookbookSectionMediaRole,
        userId,
        ipAddress,
        userAgent
      );
      return ApiResponse.success(res, detached, 200, 'Media detached from section successfully');
    } catch (error) {
      next(error);
    }
  }

  static async reorderSectionMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const reordered = await LookbookService.reorderSectionMedia(
        req.params.sectionId,
        req.body.items,
        userId,
        ipAddress,
        userAgent
      );
      return ApiResponse.success(res, reordered, 200, 'Section media reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setSectionPrimaryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const { mediaId, role } = req.body;
      const media = await LookbookService.setSectionPrimaryMedia(
        req.params.sectionId,
        mediaId,
        role,
        userId,
        ipAddress,
        userAgent
      );
      return ApiResponse.success(res, media, 200, 'Section primary media updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
