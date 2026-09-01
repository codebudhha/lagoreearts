import express from 'express';
import { createOrder, simulatePaymentVerification } from '../controllers/checkoutController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', optionalAuthenticate, createOrder);
router.post('/verify-payment', simulatePaymentVerification);

export default router;
