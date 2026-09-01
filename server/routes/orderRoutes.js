import express from 'express';
import { getMyOrders, getOrderDetail } from '../controllers/orderController.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/:identifier', optionalAuthenticate, getOrderDetail);

export default router;
