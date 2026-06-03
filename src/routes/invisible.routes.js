import express from 'express';
import { toggleInvisible, getInvisibleStatus } from '../controllers/invisible.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/toggle', authMiddleware, toggleInvisible);
router.get('/status', authMiddleware, getInvisibleStatus);

export default router;
