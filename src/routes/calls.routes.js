import express from 'express';
import { getCallLog, getCallStats, createCallLog } from '../controllers/calls.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/log', authMiddleware, getCallLog);
router.post('/log', authMiddleware, createCallLog);
router.get('/stats', authMiddleware, getCallStats);

export default router;
