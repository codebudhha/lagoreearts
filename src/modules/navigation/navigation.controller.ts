import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import { NavigationService } from './navigation.service.ts';
import { NavigationPublicService } from './navigation-public.service.ts';
import type { NavigationLocation } from './navigation.types.ts';

export class NavigationController {
  // ==========================================
  // Public Handlers
  // ==========================================

  static async getPublicNavigation(req: Request, res: Response, next: NextFunction) {
    try {
      const location = (req.params.location || req.query.location || 'HEADER') as NavigationLocation;
      const validLocations: NavigationLocation[] = ['HEADER', 'FOOTER', 'MOBILE', 'SECONDARY'];

      if (!validLocations.includes(location)) {
        return ApiResponse.badRequest(res, `Invalid navigation location. Allowed: ${validLocations.join(', ')}`);
      }

      const result = await NavigationPublicService.getPublicNavigationByLocation(location);
      if (!result) {
        return ApiResponse.success(res, { location, items: [] }, 200, 'No active default navigation configured for this location');
      }

      return ApiResponse.success(res, result, 200, 'Public navigation retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Navigation Handlers
  // ==========================================

  static async listNavigations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NavigationService.listNavigations(req.query);
      return ApiResponse.success(res, result, 200, 'Navigations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getNavigationById(req: Request, res: Response, next: NextFunction) {
    try {
      const navigation = await NavigationService.getNavigationById(req.params.id);
      return ApiResponse.success(res, navigation, 200, 'Navigation retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createNavigation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const created = await NavigationService.createNavigation(req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, created, 201, 'Navigation created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateNavigation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const updated = await NavigationService.updateNavigation(req.params.id, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, updated, 200, 'Navigation updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteNavigation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const deleted = await NavigationService.deleteNavigation(req.params.id, userId, ipAddress, userAgent);
      return ApiResponse.success(res, deleted, 200, 'Navigation deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Navigation Item Handlers
  // ==========================================

  static async getNavigationItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await NavigationService.getNavigationItems(req.params.id);
      return ApiResponse.success(res, items, 200, 'Navigation items retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await NavigationService.getItemById(req.params.itemId);
      return ApiResponse.success(res, item, 200, 'Navigation item retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const item = await NavigationService.createItem(req.params.id, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, item, 201, 'Navigation item created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const item = await NavigationService.updateItem(req.params.itemId, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, item, 200, 'Navigation item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const deleted = await NavigationService.deleteItem(req.params.itemId, userId, ipAddress, userAgent);
      return ApiResponse.success(res, deleted, 200, 'Navigation item deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const items = await NavigationService.reorderItems(req.params.id, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, items, 200, 'Navigation items reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async moveItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).adminUser?.id || (req as any).admin?.id || (req as any).user?.id || (req as any).user?.sub;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const item = await NavigationService.moveItem(req.params.id, req.params.itemId, req.body, userId, ipAddress, userAgent);
      return ApiResponse.success(res, item, 200, 'Navigation item moved successfully');
    } catch (error) {
      next(error);
    }
  }
}
