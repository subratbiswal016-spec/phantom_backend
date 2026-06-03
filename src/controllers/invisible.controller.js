import { User } from '../models/index.js';

// POST /invisible/toggle
export const toggleInvisible = async (req, res, next) => {
  try {
    const user = req.user;
    const newState = !user.isInvisible;

    await user.update({ isInvisible: newState });

    console.log(`👻 User ${user.phone} is now ${newState ? 'INVISIBLE' : 'VISIBLE'}`);

    // Emit via Socket.io if available
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${user.id}`).emit('invisibleStateChanged', {
        isInvisible: newState,
      });
    }

    res.status(200).json({
      success: true,
      message: newState ? 'Invisible mode activated' : 'Invisible mode deactivated',
      data: { isInvisible: newState },
    });
  } catch (error) {
    next(error);
  }
};

// GET /invisible/status
export const getInvisibleStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { isInvisible: req.user.isInvisible },
    });
  } catch (error) {
    next(error);
  }
};
