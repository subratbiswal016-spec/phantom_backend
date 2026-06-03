import cron from 'node-cron';
import { User, Schedule } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Scheduler Service
 * Runs every minute, checks if any schedule should activate/deactivate invisible mode
 */
export const startSchedulerService = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentDay = now.getDay() || 7; // Convert 0 (Sun) to 7
      const currentTime = `${now.getHours().toString().padLeft(2, '0')}:${now.getMinutes().toString().padLeft(2, '0')}`;

      // Find all active schedules (filter days in JS for SQLite compatibility)
      const allSchedules = await Schedule.findAll({
        where: { isActive: true },
        include: [{ model: User, as: 'user' }],
      });

      const schedules = allSchedules.filter(s => s.daysOfWeek && s.daysOfWeek.includes(currentDay));

      for (const schedule of schedules) {
        const shouldBeInvisible = isTimeInRange(
          currentTime,
          schedule.startTime,
          schedule.endTime
        );

        if (shouldBeInvisible !== schedule.user.isInvisible) {
          await schedule.user.update({ isInvisible: shouldBeInvisible });
          console.log(
            `⏰ Schedule "${schedule.label}": User ${schedule.user.phone} → ${shouldBeInvisible ? 'INVISIBLE' : 'VISIBLE'}`
          );
        }
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error.message);
    }
  });

  console.log('⏰ Scheduler service started — checking every minute');
};

/**
 * Check if current time falls within start-end range
 * Handles overnight ranges (e.g., 22:00 - 07:00)
 */
function isTimeInRange(current, start, end) {
  if (start <= end) {
    return current >= start && current < end;
  } else {
    // Overnight range (e.g., 22:00 - 07:00)
    return current >= start || current < end;
  }
}

// Polyfill for padLeft
String.prototype.padLeft = function (length, char = ' ') {
  return this.padStart(length, char);
};
