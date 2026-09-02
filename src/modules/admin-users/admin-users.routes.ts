import { Router } from '../../utils/express.ts';
import { AdminUsersController } from './admin-users.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import {
  createAdminUserValidator,
  updateAdminUserValidator,
  updateAdminStatusValidator
} from './admin-users.validator.ts';

const router = Router();

// All routes require authenticated admin
router.use(requireAdminAuth);

// GET /api/v1/admin/users
router.get('/', requirePermission('admin.view'), AdminUsersController.list);

// GET /api/v1/admin/users/:id
router.get('/:id', requirePermission('admin.view'), AdminUsersController.getById);

// POST /api/v1/admin/users
router.post('/', requirePermission('admin.create'), createAdminUserValidator.middleware(), AdminUsersController.create);

// PATCH /api/v1/admin/users/:id
router.patch('/:id', requirePermission('admin.update'), updateAdminUserValidator.middleware(), AdminUsersController.update);

// PATCH /api/v1/admin/users/:id/status
router.patch('/:id/status', requirePermission('admin.update'), updateAdminStatusValidator.middleware(), AdminUsersController.updateStatus);

// DELETE /api/v1/admin/users/:id
router.delete('/:id', requirePermission('admin.delete'), AdminUsersController.delete);

export const adminUsersRoutes = router;
