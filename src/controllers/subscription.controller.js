import { User } from '../models/index.js';

// POST /subscription/upgrade
export const upgradeSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body; // 'free', 'basic', 'pro', 'business'

    if (!['free', 'basic', 'pro', 'business'].includes(plan?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    const user = req.user;
    
    // Simulate payment processing delay (optional, frontend handles this)
    
    // Update user plan
    user.plan = plan.toLowerCase();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan.toUpperCase()} plan`,
      data: {
        plan: user.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};
