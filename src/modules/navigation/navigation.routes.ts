import express from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { NavigationController } from './navigation.controller.ts';
import { NavigationValidator } from './navigation.validator.ts';

// ==========================================
// Admin Navigation Router
// ==========================================
export const adminNavigationRouter = express.Router();
adminNavigationRouter.use(requireAdminAuth);

// ------------------------------------------
// Navigation Item Routes
// ------------------------------------------
adminNavigationRouter.get(
  '/:id/items',
  requirePermission('navigation.view'),
  NavigationController.getNavigationItems
);

adminNavigationRouter.post(
  '/:id/items',
  requirePermission('navigation.create', 'navigation.update'),
  NavigationValidator.validateCreateNavigationItem,
  NavigationController.createItem
);

adminNavigationRouter.put(
  '/:id/items/order',
  requirePermission('navigation.update'),
  NavigationValidator.validateReorderItems,
  NavigationController.reorderItems
);

adminNavigationRouter.post(
  '/:id/items/:itemId/move',
  requirePermission('navigation.update'),
  NavigationValidator.validateMoveItem,
  NavigationController.moveItem
);

adminNavigationRouter.get(
  '/:id/items/:itemId',
  requirePermission('navigation.view'),
  NavigationController.getItemById
);

adminNavigationRouter.patch(
  '/:id/items/:itemId',
  requirePermission('navigation.update'),
  NavigationValidator.validateUpdateNavigationItem,
  NavigationController.updateItem
);

adminNavigationRouter.delete(
  '/:id/items/:itemId',
  requirePermission('navigation.delete'),
  NavigationController.deleteItem
);

// ------------------------------------------
// Navigation Root Routes
// ------------------------------------------
adminNavigationRouter.get(
  '/',
  requirePermission('navigation.view'),
  NavigationController.listNavigations
);

adminNavigationRouter.post(
  '/',
  requirePermission('navigation.create'),
  NavigationValidator.validateCreateNavigation,
  NavigationController.createNavigation
);

adminNavigationRouter.get(
  '/:id',
  requirePermission('navigation.view'),
  NavigationController.getNavigationById
);

adminNavigationRouter.patch(
  '/:id',
  requirePermission('navigation.update', 'navigation.publish'),
  NavigationValidator.validateUpdateNavigation,
  NavigationController.updateNavigation
);

adminNavigationRouter.delete(
  '/:id',
  requirePermission('navigation.delete'),
  NavigationController.deleteNavigation
);

// ==========================================
// Public Storefront Router
// ==========================================
export const publicNavigationRouter = express.Router();

publicNavigationRouter.get('/', NavigationController.getPublicNavigation);
publicNavigationRouter.get('/:location', NavigationController.getPublicNavigation);
