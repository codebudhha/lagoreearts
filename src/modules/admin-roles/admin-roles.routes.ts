import { Router } from '../../utils/express.ts';
import { AdminRolesController } from './admin-roles.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { createRoleValidator, updateRoleValidator } from './admin-roles.validator.ts';

const router = Router();

// All routes require authenticated admin
router.use(requireAdminAuth);

// GET /api/v1/admin/roles
router.get('/', requirePermission('settings.view'), AdminRolesController.list);

// GET /api/v1/admin/roles/permissions
router.get('/permissions', requirePermission('settings.view'), AdminRolesController.listPermissions);

// GET /api/v1/admin/roles/:id
router.get('/:id', requirePermission('settings.view'), AdminRolesController.getById);

// POST /api/v1/admin/roles
router.post('/', requirePermission('settings.update'), createRoleValidator.middleware(), AdminRolesController.create);

// PATCH /api/v1/admin/roles/:id
router.patch('/:id', requirePermission('settings.update'), updateRoleValidator.middleware(), AdminRolesController.update);

// DELETE /api/v1/admin/roles/:id
router.delete('/:id', requirePermission('settings.update'), AdminRolesController.delete);

export const adminRolesRoutes = router;
