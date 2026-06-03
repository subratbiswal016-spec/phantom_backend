import { VipContact } from '../models/index.js';
import { getRedis } from '../config/redis.js';

/**
 * Redis Cache Service for VIP contacts
 * Maintains a Redis SET per user for O(1) VIP lookup
 */

// Sync all VIP contacts for a user to Redis
export const syncVipCacheForUser = async (userId) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    const contacts = await VipContact.findAll({
      where: { user_id: userId },
      attributes: ['phone'],
    });

    const key = `vip:${userId}`;
    
    // Clear existing and re-add
    await redis.del(key);
    
    if (contacts.length > 0) {
      const phones = contacts.map((c) => c.phone);
      await redis.sadd(key, ...phones);
      console.log(`🔴 Redis: Synced ${phones.length} VIPs for user ${userId}`);
    }
  } catch (error) {
    console.error(`Redis sync failed for user ${userId}:`, error.message);
  }
};

// Sync all users' VIP caches (on server start)
export const syncAllVipCaches = async () => {
  const redis = getRedis();
  if (!redis) {
    console.log('⚠️ Redis not available — VIP lookups will use database');
    return;
  }

  try {
    const contacts = await VipContact.findAll({
      attributes: ['user_id', 'phone'],
    });

    // Group by user
    const byUser = {};
    for (const contact of contacts) {
      const uid = contact.user_id;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(contact.phone);
    }

    // Bulk sync to Redis
    const pipeline = redis.pipeline();
    for (const [userId, phones] of Object.entries(byUser)) {
      const key = `vip:${userId}`;
      pipeline.del(key);
      if (phones.length > 0) {
        pipeline.sadd(key, ...phones);
      }
    }
    await pipeline.exec();

    console.log(`🔴 Redis: Synced VIP caches for ${Object.keys(byUser).length} users`);
  } catch (error) {
    console.error('Redis bulk sync failed:', error.message);
  }
};
