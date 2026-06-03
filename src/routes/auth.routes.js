import express from 'express';
import Joi from 'joi';
import { login, verifyOtp, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^\+\d{10,15}$/).required()
    .messages({ 'string.pattern.base': 'Phone must be in format +919XXXXXXXXX' }),
});

const verifySchema = Joi.object({
  phone: Joi.string().pattern(/^\+\d{10,15}$/).required(),
  otp: Joi.string().length(6).required(),
  name: Joi.string().max(100).optional(),
});

router.post('/login', validate(loginSchema), login);
router.post('/verify', validate(verifySchema), verifyOtp);
router.get('/me', authMiddleware, getMe);

export default router;
