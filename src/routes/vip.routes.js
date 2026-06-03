import express from 'express';
import Joi from 'joi';
import { getVipList, addVip, removeVip } from '../controllers/vip.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkVipLimit } from '../middleware/plan.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

const addVipSchema = Joi.object({
  name: Joi.string().max(100).required(),
  phone: Joi.string().pattern(/^\+\d{10,15}$/).required()
    .messages({ 'string.pattern.base': 'Phone must be in format +919XXXXXXXXX' }),
});

router.get('/list', authMiddleware, getVipList);
router.post('/add', authMiddleware, checkVipLimit, validate(addVipSchema), addVip);
router.delete('/remove/:id', authMiddleware, removeVip);

export default router;
