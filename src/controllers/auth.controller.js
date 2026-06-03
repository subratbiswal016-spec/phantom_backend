import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// POST /auth/login — Send OTP (mock for now)
export const login = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // In production, send OTP via Firebase/MSG91/Twilio Verify
    // For now, we mock it
    console.log(`📱 OTP sent to ${phone}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // In dev, we return a mock OTP for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: '123456' }),
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify — Verify OTP and create/login user
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;

    // In production, verify OTP with Firebase/MSG91
    // For dev, accept '123456'
    if (process.env.NODE_ENV === 'development' && otp !== '123456') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Find or create user
    let [user, created] = await User.findOrCreate({
      where: { phone },
      defaults: { phone, name: name || null },
    });

    if (created) {
      console.log(`👤 New user created: ${phone}`);
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: created ? 'Account created successfully' : 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          plan: user.plan,
          isInvisible: user.isInvisible,
          virtualNumber: user.virtualNumber,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /auth/me — Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        plan: user.plan,
        isInvisible: user.isInvisible,
        virtualNumber: user.virtualNumber,
        customMessage: user.customMessage,
        blockUnknown: user.blockUnknown,
      },
    });
  } catch (error) {
    next(error);
  }
};
