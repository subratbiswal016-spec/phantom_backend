import express from 'express';
import { createUpiCollectRequest, razorpayWebhook } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected route to initiate payment
router.post('/upi-collect', authMiddleware, createUpiCollectRequest);

// Public webhook route for Razorpay to call
router.post('/webhook', razorpayWebhook);

export default router;
