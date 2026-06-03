import { VipContact } from '../models/index.js';
import { getRedis } from '../config/redis.js';

// GET /vip/list
export const getVipList = async (req, res, next) => {
  try {
    const contacts = await VipContact.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: contacts,
      count: contacts.length,
    });
  } catch (error) {
    next(error);
  }
};

// POST /vip/add
export const addVip = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    // Check if already exists
    const existing = await VipContact.findOne({
      where: { user_id: req.userId, phone },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This contact is already in your VIP list',
      });
    }

    const contact = await VipContact.create({
      userId: req.userId,
      name,
      phone,
    });

    // Update Redis cache
    const redis = getRedis();
    if (redis) {
      await redis.sadd(`vip:${req.userId}`, phone);
      console.log(`🔴 Redis: Added ${phone} to VIP set for user ${req.userId}`);
    }

    res.status(201).json({
      success: true,
      message: 'VIP contact added successfully',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /vip/remove/:id
export const removeVip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await VipContact.findOne({
      where: { id, user_id: req.userId },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'VIP contact not found',
      });
    }

    // Remove from Redis cache
    const redis = getRedis();
    if (redis) {
      await redis.srem(`vip:${req.userId}`, contact.phone);
      console.log(`🔴 Redis: Removed ${contact.phone} from VIP set`);
    }

    await contact.destroy();

    res.status(200).json({
      success: true,
      message: 'VIP contact removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
