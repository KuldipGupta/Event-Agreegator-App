const redis = require('redis');
const logger = require('./logger');

let client = null;
let redisAvailable = false;

// Create Redis client
const initRedis = async () => {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
           
            return new Error('Redis max retries exceeded');
          }
          return retries * 100;
        }
      }
    });

    client.on('error', (err) => {
      // Only log non-connection errors
      if (!err.message.includes('ECONNREFUSED') && !err.message.includes('connect')) {
        logger.error('Redis error:', err.message);
      }
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
      redisAvailable = true;
    });

    await client.connect();
    redisAvailable = true;
  } catch (err) {
    logger.warn('Redis unavailable - caching disabled. Using in-memory fallback.');
    redisAvailable = false;
  }
};

// In-memory cache fallback
const memoryCache = new Map();

// Get from cache
const getCache = async (key) => {
  try {
    if (redisAvailable && client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to memory cache
      return memoryCache.get(key) || null;
    }
  } catch (err) {
    logger.error('Cache get error:', err.message);
    return null;
  }
};

// Set cache with TTL (default 24 hours)
const setCache = async (key, data, ttl = 24 * 60 * 60) => {
  try {
    if (redisAvailable && client) {
      await client.setEx(key, ttl, JSON.stringify(data));
    } else {
      // Fallback to memory cache (no TTL)
      memoryCache.set(key, data);
      setTimeout(() => memoryCache.delete(key), ttl * 1000);
    }
  } catch (err) {
    logger.error('Cache set error:', err.message);
  }
};

// Delete cache
const deleteCache = async (key) => {
  try {
    if (redisAvailable && client) {
      await client.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (err) {
    logger.error('Cache delete error:', err.message);
  }
};

// Clear all cache
const clearAllCache = async () => {
  try {
    if (redisAvailable && client) {
      await client.flushDb();
    } else {
      memoryCache.clear();
    }
  } catch (err) {
    logger.error('Cache clear error:', err.message);
  }
};

// Cache key generator
const getCacheKey = (prefix, params) => {
  return `${prefix}:${JSON.stringify(params)}`;
};

// Initialize Redis on startup
initRedis();

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearAllCache,
  getCacheKey
};
