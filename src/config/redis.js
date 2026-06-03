import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;

export const connectRedis = async () => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    return redis;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    // Don't throw — app can work without Redis (slower VIP lookups)
    return null;
  }
};

export const getRedis = () => redis;

export default redis;
