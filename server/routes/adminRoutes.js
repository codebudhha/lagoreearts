import express from 'express';
import {
  getAdminMetrics,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/metrics', getAdminMetrics);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
