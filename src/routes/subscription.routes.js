import express from 'express';
import { authMiddleware as protect } from '../middleware/auth.middleware.js';
import { upgradeSubscription } from '../controllers/subscription.controller.js';

const router = express.Router();

router.use(protect);

router.post('/upgrade', upgradeSubscription);

export default router;
