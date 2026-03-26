const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
    try {
          redisClient = createClient({
                  url: process.env.REDIS_URL || 'redis://localhost:6379',
                  socket: {
                            reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
                  },
          });

      redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
          redisClient.on('connect', () => logger.info('Redis connected successfully'));
          redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

      await redisClient.connect();
    } catch (error) {
          logger.error('Redis connection failed:', error);
          throw error;
    }
};

const getRedis = () => {
    if (!redisClient) throw new Error('Redis not initialized');
    return redisClient;
};

module.exports = { connectRedis, getRedis };
