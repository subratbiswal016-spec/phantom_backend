import { User } from '../models/index.js';
import { getRedis } from '../config/redis.js';

// POST /settings/block-unknown
export const toggleBlockUnknown = async (req, res, next) => {
  try {
    const user = req.user;
    // If block_unknown is provided in body, use it. Otherwise, toggle it.
    const requestedState = req.body.block_unknown;
    const newState = requestedState !== undefined ? requestedState : !user.blockUnknown;

    await user.update({ blockUnknown: newState });

    res.status(200).json({
      success: true,
      message: newState ? 'Unknown numbers will be blocked' : 'Unknown numbers allowed',
      data: { blockUnknown: newState },
    });
  } catch (error) {
    next(error);
  }
};

// POST /settings/sync-contacts
export const syncContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body; // Array of phone strings

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'Contacts must be an array of phone numbers',
      });
    }

    const redis = getRedis();
    if (!redis) {
      return res.status(503).json({
        success: false,
        message: 'Cache service unavailable',
      });
    }

    const key = `contacts:${req.userId}`;
    
    // Normalize and add
    const normalizedPhones = contacts
      .map(p => {
        let normalized = p.replace(/[\s\-\(\)]/g, '');
        if (!normalized.startsWith('+')) {
          normalized = `+${normalized}`;
        }
        return normalized;
      })
      .filter(p => p.length >= 10);

    if (normalizedPhones.length > 0) {
      // Clear existing and add new ones (pipeline)
      const pipeline = redis.pipeline();
      pipeline.del(key);
      pipeline.sadd(key, ...normalizedPhones);
      // Set expiry to 7 days, app should resync periodically or on change
      pipeline.expire(key, 604800); 
      await pipeline.exec();
    } else {
      await redis.del(key);
    }

    console.log(`📱 Synced ${normalizedPhones.length} contacts for user ${req.userId}`);

    res.status(200).json({
      success: true,
      message: 'Contacts synced successfully',
      count: normalizedPhones.length,
    });
  } catch (error) {
    next(error);
  }
};

// POST /settings/notifications/push/toggle
export const togglePushNotifications = async (req, res, next) => {
  try {
    const user = req.user;
    const newState = !user.pushNotifications;
    await user.update({ pushNotifications: newState });
    res.status(200).json({
      success: true,
      message: newState ? 'Push notifications enabled' : 'Push notifications disabled',
      data: { pushNotifications: newState },
    });
  } catch (error) {
    next(error);
  }
};

// POST /settings/notifications/alerts/toggle
export const toggleBlockedCallAlerts = async (req, res, next) => {
  try {
    const user = req.user;
    const newState = !user.blockedCallAlerts;
    await user.update({ blockedCallAlerts: newState });
    res.status(200).json({
      success: true,
      message: newState ? 'Blocked call alerts enabled' : 'Blocked call alerts disabled',
      data: { blockedCallAlerts: newState },
    });
  } catch (error) {
    next(error);
  }
};
