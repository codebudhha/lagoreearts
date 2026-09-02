import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { CategoriesService } from './categories.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

export class PublicCategoriesController {
  /**
   * GET /api/v1/categories
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await CategoriesService.listPublicCategories({
        parentId: req.query.parentId as string,
        featured: req.query.featured === 'true'
      });
      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/categories/tree
   */
  static async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await CategoriesService.getCategoryTree(true); // active only
      return ApiResponse.success(res, tree);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/categories/:slug
   */
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.getCategoryBySlug(req.params.slug, true);
      return ApiResponse.success(res, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        shortDescription: category.shortDescription,
        description: category.description,
        image: category.image,
        imageAlt: category.imageAlt,
        bannerImage: category.bannerImage,
        bannerImageAlt: category.bannerImageAlt,
        isFeatured: category.isFeatured,
        sortOrder: category.sortOrder,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        canonicalUrl: category.canonicalUrl,
        ogTitle: category.ogTitle,
        ogDescription: category.ogDescription,
        ogImage: category.ogImage,
        parent: category.parent ? { id: category.parent.id, name: category.parent.name, slug: category.parent.slug } : null,
        children: (category.children || []).filter((c: any) => c.status === 'ACTIVE').map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          shortDescription: c.shortDescription
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/categories/:slug/breadcrumb
   */
  static async getBreadcrumbs(req: Request, res: Response, next: NextFunction) {
    try {
      const breadcrumbs = await CategoriesService.getBreadcrumbs(req.params.slug);
      return ApiResponse.success(res, breadcrumbs);
    } catch (err) {
      next(err);
    }
  }
}
