const { Device } = require('../models');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({ where: { userId: req.user.id } });
    return res.json({ status: true, data: devices });
  } catch (err) {
    logger.error('GetDevices error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.addDevice = async (req, res) => {
  try {
    const { name, webhookUrl } = req.body;
    const device = await Device.create({
      userId: req.user.id,
      name,
      webhookUrl,
      token: uuidv4(),
      status: 'disconnected'
    });
    return res.status(201).json({ status: true, message: 'Device created', data: device });
  } catch (err) {
    logger.error('AddDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    return res.json({ status: true, data: device });
  } catch (err) {
    logger.error('GetDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    const { name, webhookUrl } = req.body;
    await device.update({ name, webhookUrl });
    return res.json({ status: true, message: 'Device updated', data: device });
  } catch (err) {
    logger.error('UpdateDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    await whatsappService.disconnectSession(device.id);
    await device.destroy();
    return res.json({ status: true, message: 'Device deleted' });
  } catch (err) {
    logger.error('DeleteDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.connectDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    const result = await whatsappService.createSession(device.id, device.token);
    return res.json({ status: true, message: 'Connecting device', data: result });
  } catch (err) {
    logger.error('ConnectDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getQRCode = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    const qr = whatsappService.getQRCode(device.id);
    if (!qr) return res.status(404).json({ status: false, message: 'QR code not available yet' });
    return res.json({ status: true, data: { qr } });
  } catch (err) {
    logger.error('GetQRCode error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.disconnectDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    await whatsappService.disconnectSession(device.id);
    await device.update({ status: 'disconnected', phoneNumber: null });
    return res.json({ status: true, message: 'Device disconnected' });
  } catch (err) {
    logger.error('DisconnectDevice error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
