import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  validateCoupon
} from '../controllers/cartController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getCart);
router.post('/add', optionalAuthenticate, addToCart);
router.put('/items/:id', optionalAuthenticate, updateCartItem);
router.delete('/items/:id', optionalAuthenticate, removeCartItem);
router.post('/coupon', validateCoupon);

export default router;
