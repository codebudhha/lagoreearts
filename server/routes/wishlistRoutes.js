import express from 'express';
import { getWishlist, toggleWishlist, moveToCart } from '../controllers/wishlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.post('/move-to-cart', moveToCart);

export default router;
