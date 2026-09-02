import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ProductVariantService } from './variants.service.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

const service = new ProductVariantService();

export class AdminVariantsController {
  // ==========================================
  // Options Handlers
  // ==========================================

  static async getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const options = await service.getOptions(req.params.productId);
      return ApiResponse.success(res, options, 200, 'Product options retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getOption(req: Request, res: Response, next: NextFunction) {
    try {
      const option = await service.getOption(req.params.productId, req.params.optionId);
      return ApiResponse.success(res, option, 200, 'Product option retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async createOption(req: Request, res: Response, next: NextFunction) {
    try {
      const option = await service.createOption(req.params.productId, req.body, req);
      return ApiResponse.success(res, option, 201, 'Product option created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateOption(req: Request, res: Response, next: NextFunction) {
    try {
      const option = await service.updateOption(req.params.productId, req.params.optionId, req.body, req);
      return ApiResponse.success(res, option, 200, 'Product option updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteOption(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteOption(req.params.productId, req.params.optionId, req);
      return ApiResponse.success(res, null, 200, 'Product option deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Option Values Handlers
  // ==========================================

  static async getOptionValues(req: Request, res: Response, next: NextFunction) {
    try {
      const values = await service.getOptionValues(req.params.productId, req.params.optionId);
      return ApiResponse.success(res, values, 200, 'Option values retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async createOptionValue(req: Request, res: Response, next: NextFunction) {
    try {
      const value = await service.createOptionValue(req.params.productId, req.params.optionId, req.body, req);
      return ApiResponse.success(res, value, 201, 'Option value created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateOptionValue(req: Request, res: Response, next: NextFunction) {
    try {
      const value = await service.updateOptionValue(req.params.productId, req.params.optionId, req.params.valueId, req.body, req);
      return ApiResponse.success(res, value, 200, 'Option value updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteOptionValue(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteOptionValue(req.params.productId, req.params.optionId, req.params.valueId, req);
      return ApiResponse.success(res, null, 200, 'Option value deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Variants Handlers
  // ==========================================

  static async listVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        status: req.query.status,
        sku: req.query.sku,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        stockState: req.query.stockState
      };

      const result = await service.listVariants(req.params.productId, filters);
      return ApiResponse.success(res, result.items, 200, 'Product variants retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.getVariant(req.params.productId, req.params.variantId);
      return ApiResponse.success(res, variant, 200, 'Product variant retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.createVariant(req.params.productId, req.body, req);
      return ApiResponse.success(res, variant, 201, 'Product variant created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.updateVariant(req.params.productId, req.params.variantId, req.body, req);
      return ApiResponse.success(res, variant, 200, 'Product variant updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.updateVariantStatus(req.params.productId, req.params.variantId, req.body.status, req);
      return ApiResponse.success(res, variant, 200, 'Product variant status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSort(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await service.updateVariantSortOrder(req.params.productId, req.params.variantId, req.body.sortOrder, req);
      return ApiResponse.success(res, variant, 200, 'Product variant sort order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteVariant(req.params.productId, req.params.variantId, req);
      return ApiResponse.success(res, null, 200, 'Product variant deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
