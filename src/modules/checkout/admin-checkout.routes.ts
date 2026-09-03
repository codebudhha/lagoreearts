import { Router } from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { AdminCheckoutController } from './admin-checkout.controller.ts';

const router = Router();

router.use(requireAdminAuth);

router.get('/:id', requirePermission('checkout.view'), AdminCheckoutController.getById);

export { router as adminCheckoutRoutes };
