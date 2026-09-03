import { Router } from '../../utils/express.ts';
import { resolveCartIdentity } from '../../middleware/resolveCartIdentity.ts';
import { CheckoutController } from './checkout.controller.ts';

const router = Router();

// Shopper / Guest checkout routes
router.use(resolveCartIdentity);

router.post('/', CheckoutController.create);
router.get('/:id', CheckoutController.getById);
router.patch('/:id/addresses', CheckoutController.updateAddresses);
router.post('/:id/recalculate', CheckoutController.recalculate);
router.post('/:id/validate', CheckoutController.validate);
router.post('/:id/complete', CheckoutController.complete);
router.post('/:id/cancel', CheckoutController.cancel);

export { router as checkoutRoutes };
