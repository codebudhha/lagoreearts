import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { JournalService } from './journal.service.ts';
import { JournalPublicService } from './journal-public.service.ts';

export class JournalAdminController {
  // ==========================================
  // Post Operations
  // ==========================================

  static async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JournalService.listPosts(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const post = await JournalService.createPost(req.body, adminUserId, meta);
      return ApiResponse.success(res, post, 201, 'Journal post created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await JournalService.getPostById(req.params.id);
      return ApiResponse.success(res, post);
    } catch (err) {
      next(err);
    }
  }

  static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updatePost(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Journal post updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updatePostStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updatePostStatus(req.params.id, req.body.status, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Journal post status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async publishPost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updatePostStatus(req.params.id, 'PUBLISHED', adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Journal post published successfully');
    } catch (err) {
      next(err);
    }
  }

  static async unpublishPost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updatePostStatus(req.params.id, 'DRAFT', adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Journal post unpublished successfully');
    } catch (err) {
      next(err);
    }
  }

  static async archivePost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updatePostStatus(req.params.id, 'ARCHIVED', adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Journal post archived successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.deletePost(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Journal post deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Media Operations
  // ==========================================

  static async attachPostMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const attached = await JournalService.attachPostMedia(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, attached, 201, 'Media attached to post successfully');
    } catch (err) {
      next(err);
    }
  }

  static async detachPostMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.detachPostMedia(
        req.params.id,
        req.params.mediaId,
        (req.query.role as string) || req.body.role || 'GALLERY',
        adminUserId,
        meta
      );
      return ApiResponse.success(res, null, 200, 'Media detached from post successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderPostMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.reorderPostMedia(req.params.id, req.body.items, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Post media reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Junction Replacements
  // ==========================================

  static async setPostTags(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const tags = req.body.tags || req.body.items || [];
      const updated = await JournalService.setPostTags(req.params.id, tags, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post tags updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPostProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.products || req.body.items || [];
      const updated = await JournalService.setPostProducts(req.params.id, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post products updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPostCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.collections || req.body.items || [];
      const updated = await JournalService.setPostCollections(req.params.id, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post collections updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPostArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.artists || req.body.items || [];
      const updated = await JournalService.setPostArtists(req.params.id, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post artists updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPostSanskritEdits(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.sanskritEdits || req.body.items || [];
      const updated = await JournalService.setPostSanskritEdits(req.params.id, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post Sanskrit Edits updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async setPostRelatedPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const items = req.body.relatedPosts || req.body.items || [];
      const updated = await JournalService.setPostRelatedPosts(req.params.id, items, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Post related posts updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Author Operations
  // ==========================================

  static async listAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JournalService.listAuthors(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const author = await JournalService.createAuthor(req.body, adminUserId, meta);
      return ApiResponse.success(res, author, 201, 'Author created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getAuthorById(req: Request, res: Response, next: NextFunction) {
    try {
      const author = await JournalService.getAuthorById(req.params.id);
      return ApiResponse.success(res, author);
    } catch (err) {
      next(err);
    }
  }

  static async updateAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updateAuthor(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Author updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.deleteAuthor(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Author deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Category Operations
  // ==========================================

  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JournalService.listCategories(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const category = await JournalService.createCategory(req.body, adminUserId, meta);
      return ApiResponse.success(res, category, 201, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await JournalService.getCategoryById(req.params.id);
      return ApiResponse.success(res, category);
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updateCategory(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.deleteCategory(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reorderCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.reorderCategories(req.body.items, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Categories reordered successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Tag Operations
  // ==========================================

  static async listTags(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JournalService.listTags(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const tag = await JournalService.createTag(req.body, adminUserId, meta);
      return ApiResponse.success(res, tag, 201, 'Tag created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getTagById(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await JournalService.getTagById(req.params.id);
      return ApiResponse.success(res, tag);
    } catch (err) {
      next(err);
    }
  }

  static async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const updated = await JournalService.updateTag(req.params.id, req.body, adminUserId, meta);
      return ApiResponse.success(res, updated, 200, 'Tag updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).admin?.id || (req as any).adminUser?.id;
      const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      await JournalService.deleteTag(req.params.id, adminUserId, meta);
      return ApiResponse.success(res, null, 200, 'Tag deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export class JournalPublicController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JournalPublicService.getPublicPosts(req.query as any);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await JournalPublicService.getPublicPostBySlug(req.params.slug);
      return ApiResponse.success(res, post);
    } catch (err) {
      next(err);
    }
  }
}
