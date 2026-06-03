import { CallLog } from '../models/index.js';
import { Op } from 'sequelize';

// GET /calls/log
export const getCallLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.userId };
    if (status) where.status = status;

    const { count, rows } = await CallLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /calls/stats
export const getCallStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalBlocked, totalForwarded, blockedToday] = await Promise.all([
      CallLog.count({ where: { user_id: req.userId, status: 'blocked' } }),
      CallLog.count({ where: { user_id: req.userId, status: 'forwarded' } }),
      CallLog.count({
        where: {
          user_id: req.userId,
          status: 'blocked',
          created_at: { [Op.gte]: today },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBlocked,
        totalForwarded,
        blockedToday,
        total: totalBlocked + totalForwarded,
      },
    });
  } catch (error) {
    next(error);
  }
};
