const { Message, Device } = require('../models');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

exports.sendBroadcast = async (req, res) => {
  try {
    const { token, phones, message, type = 'text' } = req.body;
    const device = await Device.findOne({ where: { token, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    if (device.status !== 'connected') {
      return res.status(400).json({ status: false, message: 'Device not connected' });
    }
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ status: false, message: 'Phones array is required' });
    }

    const results = [];
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const phone of phones) {
      try {
        const result = await whatsappService.sendMessage(device.id, phone, { text: message });
        const msg = await Message.create({
          deviceId: device.id,
          phone,
          message,
          type,
          status: result.success ? 'sent' : 'failed',
          messageId: result.messageId || null
        });
        results.push({ phone, status: 'sent', id: msg.id });
      } catch (err) {
        logger.error('Broadcast send error for ' + phone + ':', err);
        await Message.create({
          deviceId: device.id,
          phone,
          message,
          type,
          status: 'failed'
        });
        results.push({ phone, status: 'failed', error: err.message });
      }
      await delay(1000);
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return res.json({
      status: true,
      message: 'Broadcast completed',
      data: { total: phones.length, sent, failed, results }
    });
  } catch (err) {
    logger.error('SendBroadcast error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getBroadcastHistory = async (req, res) => {
  try {
    const { token, page = 1, limit = 20 } = req.query;
    const device = await Device.findOne({ where: { token, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    const offset = (page - 1) * limit;
    const { count, rows } = await Message.findAndCountAll({
      where: { deviceId: device.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    return res.json({
      status: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    logger.error('GetBroadcastHistory error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
