import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ArtistsService } from './artists.service.ts';
import { ArtistMigrationService } from './artist-migration.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminArtistController {
  static async createArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const artist = await ArtistsService.createArtist(req.body, adminUserId, meta);
      return ApiResponse.success(res, artist, 201, 'Artist created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const artist = await ArtistsService.getArtistById(id);
      return ApiResponse.success(res, artist, 200, 'Artist retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await ArtistsService.updateArtist(id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Artist updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const deleted = await ArtistsService.deleteArtist(id, adminUserId, meta);
      return ApiResponse.success(res, deleted, 200, 'Artist deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const { status } = req.body;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await ArtistsService.updateArtistStatus(id, status, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Artist status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const { isFeatured } = req.body;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await ArtistsService.updateArtistFeatured(id, Boolean(isFeatured), adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Artist featured status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      await ArtistsService.reorderArtists(req.body, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Artists order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status, isFeatured, nationality, tradition, medium, specialization, sortBy, sortOrder } = req.query as any;
      const result = await ArtistsService.listAdminArtists({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        status,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined,
        nationality,
        tradition,
        medium,
        specialization,
        sortBy,
        sortOrder
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Media APIs
  // ==========================================

  static async listMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.id;
      const media = await ArtistsService.listArtistMedia(artistId);
      return ApiResponse.success(res, media, 200, 'Artist media retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async attachMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const attached = await ArtistsService.attachArtistMedia(artistId, req.body, adminUserId, meta);
      return ApiResponse.success(res, attached, 201, 'Media attached to artist successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPrimaryMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.id;
      const mediaId = req.params.mediaId;
      const role = req.query.role as string || 'PROFILE';
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await ArtistsService.setPrimaryMedia(artistId, mediaId, role, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Primary media set successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.id;
      const mediaId = req.params.mediaId;
      const role = req.query.role as string || req.body?.role || 'PROFILE';
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const detached = await ArtistsService.detachArtistMedia(artistId, mediaId, role, adminUserId, meta);
      return ApiResponse.success(res, detached, 200, 'Media detached from artist successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      await ArtistsService.reorderArtistMedia(artistId, req.body, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Artist media order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // ProductArtist APIs
  // ==========================================

  static async listProductArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const artists = await ArtistsService.listProductArtists(productId);
      return ApiResponse.success(res, artists, 200, 'Product artists retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async attachProductArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const attached = await ArtistsService.attachProductArtist(productId, req.body, adminUserId, meta);
      return ApiResponse.success(res, attached, 201, 'Artist attached to product successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateProductArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId;
      const artistId = req.params.artistId;
      const currentRole = req.query.role as string || req.body?.currentRole || 'ARTIST';
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const updated = await ArtistsService.updateProductArtist(productId, artistId, currentRole, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Product artist updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachProductArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId;
      const artistId = req.params.artistId;
      const role = req.query.role as string || req.body?.role || 'ARTIST';
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      const detached = await ArtistsService.detachProductArtist(productId, artistId, role, adminUserId, meta);
      return ApiResponse.success(res, detached, 200, 'Artist detached from product successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderProductArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.params.id;
      const adminUserId = (req as any).admin?.id || (req as any).user?.sub;
      const meta = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent']
      };

      await ArtistsService.reorderProductArtists(productId, req.body, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Product artists order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Migration Endpoint
  // ==========================================

  static async runMigration(req: Request, res: Response, next: NextFunction) {
    try {
      const dryRun = req.query.dryRun !== 'false';
      const summary = await ArtistMigrationService.migrateAntiqueAttributions({ dryRun });
      return ApiResponse.success(res, summary, 200, 'Antique attribution migration completed');
    } catch (err) {
      next(err);
    }
  }
}

export class PublicArtistController {
  static async listArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, featured, tradition, medium, specialization, sortBy, sortOrder } = req.query as any;
      const result = await ArtistsService.listPublicArtists({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        featured: featured !== undefined ? (featured === 'true' || featured === true) : undefined,
        tradition,
        medium,
        specialization,
        sortBy,
        sortOrder
      });

      return ApiResponse.success(res, result.items, 200, 'Public artists catalogue retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getArtistBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const artist = await ArtistsService.getPublicArtistBySlug(slug);
      return ApiResponse.success(res, artist, 200, 'Artist profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
