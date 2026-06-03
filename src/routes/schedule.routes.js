import express from 'express';
import Joi from 'joi';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkScheduleAccess } from '../middleware/plan.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

const scheduleSchema = Joi.object({
  label: Joi.string().max(100).optional(),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(1).max(7)).min(1).required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    .messages({ 'string.pattern.base': 'Time must be in format HH:mm' }),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    .messages({ 'string.pattern.base': 'Time must be in format HH:mm' }),
});

const updateSchema = Joi.object({
  label: Joi.string().max(100).optional(),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(1).max(7)).optional(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  isActive: Joi.boolean().optional(),
});

router.get('/list', authMiddleware, getSchedules);
router.post('/set', authMiddleware, checkScheduleAccess, validate(scheduleSchema), createSchedule);
router.put('/update/:id', authMiddleware, checkScheduleAccess, validate(updateSchema), updateSchedule);
router.delete('/delete/:id', authMiddleware, deleteSchedule);

export default router;
