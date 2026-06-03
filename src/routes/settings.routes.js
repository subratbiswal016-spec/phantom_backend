import express from 'express';
import { toggleBlockUnknown, syncContacts } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/block-unknown/toggle', authMiddleware, toggleBlockUnknown);
router.post('/sync-contacts', authMiddleware, syncContacts);

export default router;
