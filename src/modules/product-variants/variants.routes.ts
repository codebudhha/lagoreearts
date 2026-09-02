import { Router } from '../../utils/express.ts';
import { AdminVariantsController } from './admin-variants.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createProductOptionValidator,
  updateProductOptionValidator,
  createProductOptionValueValidator,
  updateProductOptionValueValidator,
  createVariantValidator,
  updateVariantValidator,
  updateVariantStatusValidator,
  updateVariantSortValidator
} from './variants.validator.ts';

export const adminProductOptionsRouter = Router();

// ==========================================
// Product Options Endpoints
// ==========================================

adminProductOptionsRouter.use(requireAdminAuth);

adminProductOptionsRouter.get(
  '/:productId/options',
  requirePermission('product-option.view'),
  AdminVariantsController.getOptions
);

adminProductOptionsRouter.post(
  '/:productId/options',
  requirePermission('product-option.create'),
  createProductOptionValidator.middleware(),
  AdminVariantsController.createOption
);

adminProductOptionsRouter.get(
  '/:productId/options/:optionId',
  requirePermission('product-option.view'),
  AdminVariantsController.getOption
);

adminProductOptionsRouter.patch(
  '/:productId/options/:optionId',
  requirePermission('product-option.update'),
  updateProductOptionValidator.middleware(),
  AdminVariantsController.updateOption
);

adminProductOptionsRouter.delete(
  '/:productId/options/:optionId',
  requirePermission('product-option.delete'),
  AdminVariantsController.deleteOption
);

// ==========================================
// Option Values Endpoints
// ==========================================

adminProductOptionsRouter.get(
  '/:productId/options/:optionId/values',
  requirePermission('product-option.view'),
  AdminVariantsController.getOptionValues
);

adminProductOptionsRouter.post(
  '/:productId/options/:optionId/values',
  requirePermission('product-option.create'),
  createProductOptionValueValidator.middleware(),
  AdminVariantsController.createOptionValue
);

adminProductOptionsRouter.patch(
  '/:productId/options/:optionId/values/:valueId',
  requirePermission('product-option.update'),
  updateProductOptionValueValidator.middleware(),
  AdminVariantsController.updateOptionValue
);

adminProductOptionsRouter.delete(
  '/:productId/options/:optionId/values/:valueId',
  requirePermission('product-option.delete'),
  AdminVariantsController.deleteOptionValue
);

// ==========================================
// Product Variants Endpoints
// ==========================================

export const adminProductVariantsRouter = Router();

adminProductVariantsRouter.use(requireAdminAuth);

adminProductVariantsRouter.get(
  '/:productId/variants',
  requirePermission('variant.view'),
  AdminVariantsController.listVariants
);

adminProductVariantsRouter.post(
  '/:productId/variants',
  requirePermission('variant.create'),
  createVariantValidator.middleware(),
  AdminVariantsController.createVariant
);

adminProductVariantsRouter.get(
  '/:productId/variants/:variantId',
  requirePermission('variant.view'),
  AdminVariantsController.getVariant
);

adminProductVariantsRouter.patch(
  '/:productId/variants/:variantId/status',
  requirePermission('variant.update'),
  updateVariantStatusValidator.middleware(),
  AdminVariantsController.updateStatus
);

adminProductVariantsRouter.patch(
  '/:productId/variants/:variantId/sort',
  requirePermission('variant.update'),
  updateVariantSortValidator.middleware(),
  AdminVariantsController.updateSort
);

adminProductVariantsRouter.patch(
  '/:productId/variants/:variantId',
  requirePermission('variant.update'),
  updateVariantValidator.middleware(),
  AdminVariantsController.updateVariant
);

adminProductVariantsRouter.delete(
  '/:productId/variants/:variantId',
  requirePermission('variant.delete'),
  AdminVariantsController.deleteVariant
);
