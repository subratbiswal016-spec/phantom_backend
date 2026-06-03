import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;

export const connectRedis = async () => {
  // Use mock Redis for local dev without Docker
  const useMock = process.env.USE_MOCK_REDIS !== 'false';
  
  if (useMock) {
    console.log('✅ Using Mock In-Memory Redis (Local Dev)');
    const memoryStore = new Map();
    
    redis = {
      sadd: async (key, ...members) => {
        if (!memoryStore.has(key)) memoryStore.set(key, new Set());
        const set = memoryStore.get(key);
        members.forEach(m => set.add(m));
        return members.length;
      },
      srem: async (key, member) => {
        if (!memoryStore.has(key)) return 0;
        return memoryStore.get(key).delete(member) ? 1 : 0;
      },
      sismember: async (key, member) => {
        if (!memoryStore.has(key)) return 0;
        return memoryStore.get(key).has(member) ? 1 : 0;
      },
      del: async (key) => {
        return memoryStore.delete(key) ? 1 : 0;
      },
      pipeline: () => {
        const ops = [];
        return {
          del: (key) => { ops.push(() => redis.del(key)); return this; },
          sadd: (key, ...members) => { ops.push(() => redis.sadd(key, ...members)); return this; },
          expire: (key, seconds) => { return this; },
          exec: async () => {
            for (const op of ops) await op();
            return [];
          }
        };
      }
    };
    return redis;
  }

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
