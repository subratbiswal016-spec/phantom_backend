import express from 'express';
import { toggleBlockUnknown, syncContacts, togglePushNotifications, toggleBlockedCallAlerts } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/block-unknown/toggle', authMiddleware, toggleBlockUnknown);
router.post('/sync-contacts', authMiddleware, syncContacts);
router.post('/notifications/push/toggle', authMiddleware, togglePushNotifications);
router.post('/notifications/alerts/toggle', authMiddleware, toggleBlockedCallAlerts);

export default router;
