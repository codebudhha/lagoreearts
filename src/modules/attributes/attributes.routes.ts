import { Router } from '../../utils/express.ts';
import { AttributesController } from './attributes.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createAttributeValidator,
  updateAttributeValidator,
  createAttributeValueValidator,
  updateAttributeValueValidator
} from './attributes.validator.ts';

// 1. Admin Attribute Routes (/api/v1/admin/attributes)
export const adminAttributesRoutes = Router();

adminAttributesRoutes.use(requireAdminAuth);

// Attributes
adminAttributesRoutes.get('/', requirePermission('attribute.view'), AttributesController.list);
adminAttributesRoutes.get('/:id', requirePermission('attribute.view'), AttributesController.getById);

adminAttributesRoutes.post(
  '/',
  requirePermission('attribute.create'),
  createAttributeValidator.middleware(),
  AttributesController.create
);

adminAttributesRoutes.patch(
  '/:id',
  requirePermission('attribute.update'),
  updateAttributeValidator.middleware(),
  AttributesController.update
);

adminAttributesRoutes.delete('/:id', requirePermission('attribute.delete'), AttributesController.delete);

// Attribute Values
adminAttributesRoutes.get(
  '/:attributeId/values',
  requirePermission('attribute-value.view'),
  AttributesController.listValues
);

adminAttributesRoutes.post(
  '/:attributeId/values',
  requirePermission('attribute-value.create'),
  createAttributeValueValidator.middleware(),
  AttributesController.createValue
);

adminAttributesRoutes.patch(
  '/:attributeId/values/:valueId',
  requirePermission('attribute-value.update'),
  updateAttributeValueValidator.middleware(),
  AttributesController.updateValue
);

adminAttributesRoutes.delete(
  '/:attributeId/values/:valueId',
  requirePermission('attribute-value.delete'),
  AttributesController.deleteValue
);

// 2. Public Storefront Attribute Routes (/api/v1/attributes)
export const publicAttributesRoutes = Router();

publicAttributesRoutes.get('/', AttributesController.listPublic);
