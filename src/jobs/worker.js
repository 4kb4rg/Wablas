const Bull = require('bull');
const { Message, Device } = require('../models');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const messageQueue = new Bull('message-queue', REDIS_URL);
const broadcastQueue = new Bull('broadcast-queue', REDIS_URL);

messageQueue.process(async (job) => {
  const { deviceId, phone, content, messageDbId } = job.data;
  logger.info('Processing message job ' + job.id + ' for ' + phone);
  try {
    const result = await whatsappService.sendMessage(deviceId, phone, content);
    if (messageDbId) {
      await Message.update(
        { status: result.success ? 'sent' : 'failed', messageId: result.messageId || null },
        { where: { id: messageDbId } }
      );
    }
    return { success: result.success };
  } catch (err) {
    logger.error('Message job ' + job.id + ' failed:', err);
    if (messageDbId) {
      await Message.update({ status: 'failed' }, { where: { id: messageDbId } });
    }
    throw err;
  }
});

broadcastQueue.process(5, async (job) => {
  const { deviceId, phone, content, messageDbId } = job.data;
  logger.info('Processing broadcast job ' + job.id + ' for ' + phone);
  try {
    const result = await whatsappService.sendMessage(deviceId, phone, content);
    if (messageDbId) {
      await Message.update(
        { status: result.success ? 'sent' : 'failed', messageId: result.messageId || null },
        { where: { id: messageDbId } }
      );
    }
    return { success: result.success };
  } catch (err) {
    logger.error('Broadcast job ' + job.id + ' failed:', err);
    if (messageDbId) {
      await Message.update({ status: 'failed' }, { where: { id: messageDbId } });
    }
    throw err;
  }
});

messageQueue.on('completed', (job, result) => {
  logger.info('Message job ' + job.id + ' completed:', result);
});

messageQueue.on('failed', (job, err) => {
  logger.error('Message job ' + job.id + ' failed:', err.message);
});

broadcastQueue.on('completed', (job, result) => {
  logger.info('Broadcast job ' + job.id + ' completed:', result);
});

broadcastQueue.on('failed', (job, err) => {
  logger.error('Broadcast job ' + job.id + ' failed:', err.message);
});

const addMessageJob = (data, options = {}) => {
  return messageQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    ...options
  });
};

const addBroadcastJob = (data, options = {}) => {
  return broadcastQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    delay: options.delay || 1000,
    ...options
  });
};

const getQueueStats = async () => {
  const [msgWaiting, msgActive, msgCompleted, msgFailed] = await Promise.all([
    messageQueue.getWaitingCount(),
    messageQueue.getActiveCount(),
    messageQueue.getCompletedCount(),
    messageQueue.getFailedCount()
  ]);
  const [bcWaiting, bcActive, bcCompleted, bcFailed] = await Promise.all([
    broadcastQueue.getWaitingCount(),
    broadcastQueue.getActiveCount(),
    broadcastQueue.getCompletedCount(),
    broadcastQueue.getFailedCount()
  ]);
  return {
    messageQueue: { waiting: msgWaiting, active: msgActive, completed: msgCompleted, failed: msgFailed },
    broadcastQueue: { waiting: bcWaiting, active: bcActive, completed: bcCompleted, failed: bcFailed }
  };
};

module.exports = { messageQueue, broadcastQueue, addMessageJob, addBroadcastJob, getQueueStats };
