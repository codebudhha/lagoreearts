import { Router } from '../../utils/express.ts';
import { CartController } from './cart.controller.ts';
import { resolveCartIdentity } from '../../middleware/resolveCartIdentity.ts';
import { requireCustomerAuth } from '../../middleware/requireCustomerAuth.ts';

const router = Router();

// Storefront cart routes
router.get('/', resolveCartIdentity, CartController.getCart);
router.post('/items', resolveCartIdentity, CartController.addItem);
router.patch('/items/:id', resolveCartIdentity, CartController.updateItem);
router.delete('/items/:id', resolveCartIdentity, CartController.removeItem);
router.delete('/', resolveCartIdentity, CartController.clearCart);
router.post('/recalculate', resolveCartIdentity, CartController.recalculate);

// Merge guest cart into authenticated customer cart
router.post('/merge', requireCustomerAuth, CartController.merge);

export default router;
