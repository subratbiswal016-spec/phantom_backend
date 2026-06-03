const PLAN_LIMITS = {
  free: { maxVips: 3, schedule: false, customMessage: false },
  basic: { maxVips: 10, schedule: true, customMessage: false },
  pro: { maxVips: Infinity, schedule: true, customMessage: true },
  business: { maxVips: Infinity, schedule: true, customMessage: true },
};

export const checkVipLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
    
    // Count existing VIPs
    const { VipContact } = await import('../models/index.js');
    const vipCount = await VipContact.count({ where: { user_id: user.id } });

    if (vipCount >= limits.maxVips) {
      return res.status(403).json({
        success: false,
        message: `VIP limit reached. Your ${user.plan} plan allows ${limits.maxVips} VIP contacts. Upgrade to add more.`,
        currentPlan: user.plan,
        limit: limits.maxVips,
        current: vipCount,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkScheduleAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    if (!limits.schedule) {
      return res.status(403).json({
        success: false,
        message: 'Schedule feature requires Basic plan or above. Please upgrade.',
        currentPlan: user.plan,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkCustomMessageAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    if (!limits.customMessage) {
      return res.status(403).json({
        success: false,
        message: 'Custom message requires Pro plan or above. Please upgrade.',
        currentPlan: user.plan,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { PLAN_LIMITS };
