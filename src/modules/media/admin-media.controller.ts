import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { MediaService } from './media.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class AdminMediaController {
  /* ========================================================================
   * FOLDERS
   * ======================================================================== */

  static async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const folder = await MediaService.createFolder(req.body, req.admin?.id, meta);
      return ApiResponse.success(res, folder, 201, 'Media folder created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const folder = await MediaService.updateFolder(req.params.id, req.body, req.admin?.id, meta);
      return ApiResponse.success(res, folder, 200, 'Media folder updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      await MediaService.deleteFolder(req.params.id, req.admin?.id, meta);
      return ApiResponse.success(res, { success: true }, 200, 'Media folder deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = await MediaService.getFolder(req.params.id);
      return ApiResponse.success(res, folder);
    } catch (err) {
      next(err);
    }
  }

  static async listFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const folders = await MediaService.listFolders(req.query.search as string);
      return ApiResponse.success(res, folders);
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
   * ASSETS
   * ======================================================================== */

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };

      // Handle file buffer from multipart upload or base64/buffer payload
      let buffer: Buffer | null = null;
      let originalFilename = 'upload.jpg';

      if (req.file) {
        buffer = req.file.buffer;
        originalFilename = req.file.originalname || originalFilename;
      } else if (req.body?.file && Buffer.isBuffer(req.body.file)) {
        buffer = req.body.file;
        originalFilename = req.body.filename || originalFilename;
      } else if (req.body?.buffer && typeof req.body.buffer === 'string') {
        buffer = Buffer.from(req.body.buffer, 'base64');
        originalFilename = req.body.filename || originalFilename;
      } else if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
      }

      if (!buffer) {
        return ApiResponse.error(res, 'MEDIA_MISSING_FILE', 'No image file uploaded', 400);
      }

      const input = {
        title: req.body?.title,
        altText: req.body?.altText,
        caption: req.body?.caption,
        folderId: req.body?.folderId
      };

      const asset = await MediaService.uploadMedia(buffer, originalFilename, input, req.admin?.id, meta);
      return ApiResponse.success(res, asset, 201, 'Media uploaded successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const asset = await MediaService.getMedia(req.params.id);
      return ApiResponse.success(res, asset);
    } catch (err) {
      next(err);
    }
  }

  static async updateMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      const asset = await MediaService.updateMedia(req.params.id, req.body, req.admin?.id, meta);
      return ApiResponse.success(res, asset, 200, 'Media updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = { ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] };
      await MediaService.deleteMedia(req.params.id, req.admin?.id, meta);
      return ApiResponse.success(res, { success: true }, 200, 'Media deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MediaService.listMedia(req.query as any);
      return ApiResponse.success(res, result.items, 200, 'Media list retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async listOrphans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MediaService.listOrphans(req.query as any);
      return ApiResponse.success(res, result.items, 200, 'Orphaned media retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
