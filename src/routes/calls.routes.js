import express from 'express';
import { getCallLog, getCallStats } from '../controllers/calls.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/log', authMiddleware, getCallLog);
router.get('/stats', authMiddleware, getCallStats);

export default router;
