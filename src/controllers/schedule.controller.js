import { Schedule } from '../models/index.js';

// GET /schedule/list
export const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// POST /schedule/set
export const createSchedule = async (req, res, next) => {
  try {
    const { label, daysOfWeek, startTime, endTime } = req.body;
    const user = req.user;

    if (user.plan === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Scheduling is not available on the Free plan. Please upgrade to Basic or higher.',
      });
    }

    const schedule = await Schedule.create({
      userId: req.userId,
      label,
      daysOfWeek,
      startTime,
      endTime,
    });

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /schedule/update/:id
export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findOne({
      where: { id, user_id: req.userId },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const { label, daysOfWeek, startTime, endTime, isActive } = req.body;
    await schedule.update({
      ...(label !== undefined && { label }),
      ...(daysOfWeek !== undefined && { daysOfWeek }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(isActive !== undefined && { isActive }),
    });

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /schedule/delete/:id
export const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findOne({
      where: { id, user_id: req.userId },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    await schedule.destroy();

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
