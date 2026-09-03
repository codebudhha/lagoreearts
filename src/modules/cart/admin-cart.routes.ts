import { Router } from '../../utils/express.ts';
import { AdminCartController } from './admin-cart.controller.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';

const router = Router();

router.use(requireAdminAuth);

router.get('/:id', requirePermission('cart.view'), AdminCartController.getCartById);

export default router;
