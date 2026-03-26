const { Message, Device } = require('../models');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const getDeviceForUser = async (deviceToken, userId) => {
  const device = await Device.findOne({ where: { token: deviceToken, userId } });
  return device;
};

exports.sendText = async (req, res) => {
  try {
    const { token, phone, message } = req.body;
    const device = await getDeviceForUser(token, req.user.id);
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    if (device.status !== 'connected') {
      return res.status(400).json({ status: false, message: 'Device not connected' });
    }
    const result = await whatsappService.sendMessage(device.id, phone, { text: message });
    const msg = await Message.create({
      deviceId: device.id,
      phone,
      message,
      type: 'text',
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId || null
    });
    return res.json({ status: true, message: 'Message sent', data: msg });
  } catch (err) {
    logger.error('SendText error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.sendImage = async (req, res) => {
  try {
    const { token, phone, caption } = req.body;
    const device = await getDeviceForUser(token, req.user.id);
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    if (device.status !== 'connected') {
      return res.status(400).json({ status: false, message: 'Device not connected' });
    }
    if (!req.file) return res.status(400).json({ status: false, message: 'Image file required' });
    const result = await whatsappService.sendMessage(device.id, phone, {
      image: { url: req.file.path },
      caption: caption || ''
    });
    const msg = await Message.create({
      deviceId: device.id,
      phone,
      message: caption || '',
      type: 'image',
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId || null
    });
    return res.json({ status: true, message: 'Image sent', data: msg });
  } catch (err) {
    logger.error('SendImage error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.sendDocument = async (req, res) => {
  try {
    const { token, phone, filename } = req.body;
    const device = await getDeviceForUser(token, req.user.id);
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    if (device.status !== 'connected') {
      return res.status(400).json({ status: false, message: 'Device not connected' });
    }
    if (!req.file) return res.status(400).json({ status: false, message: 'Document file required' });
    const result = await whatsappService.sendMessage(device.id, phone, {
      document: { url: req.file.path },
      fileName: filename || req.file.originalname
    });
    const msg = await Message.create({
      deviceId: device.id,
      phone,
      message: filename || req.file.originalname,
      type: 'document',
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId || null
    });
    return res.json({ status: true, message: 'Document sent', data: msg });
  } catch (err) {
    logger.error('SendDocument error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { token, phone, page = 1, limit = 20 } = req.query;
    const device = await getDeviceForUser(token, req.user.id);
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    const where = { deviceId: device.id };
    if (phone) where.phone = phone;
    const offset = (page - 1) * limit;
    const { count, rows } = await Message.findAndCountAll({
      where,
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
    logger.error('GetMessages error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
