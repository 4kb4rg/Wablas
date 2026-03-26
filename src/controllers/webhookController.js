const { Device } = require('../models');
const logger = require('../utils/logger');
const axios = require('axios');

exports.setWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { webhookUrl } = req.body;
    const device = await Device.findOne({ where: { id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    await device.update({ webhookUrl });
    return res.json({ status: true, message: 'Webhook updated', data: { webhookUrl } });
  } catch (err) {
    logger.error('SetWebhook error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ where: { id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    return res.json({ status: true, data: { webhookUrl: device.webhookUrl } });
  } catch (err) {
    logger.error('GetWebhook error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ where: { id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    await device.update({ webhookUrl: null });
    return res.json({ status: true, message: 'Webhook removed' });
  } catch (err) {
    logger.error('DeleteWebhook error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ where: { id, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    if (!device.webhookUrl) {
      return res.status(400).json({ status: false, message: 'No webhook URL configured' });
    }
    const payload = {
      event: 'test',
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook from Wablas' }
    };
    const response = await axios.post(device.webhookUrl, payload, { timeout: 10000 });
    return res.json({
      status: true,
      message: 'Webhook test sent',
      data: { statusCode: response.status, response: response.data }
    });
  } catch (err) {
    logger.error('TestWebhook error:', err);
    if (err.response) {
      return res.status(200).json({
        status: false,
        message: 'Webhook responded with error',
        data: { statusCode: err.response.status }
      });
    }
    return res.status(500).json({ status: false, message: 'Failed to reach webhook URL' });
  }
};

exports.receiveIncoming = async (req, res) => {
  try {
    const { token } = req.params;
    const device = await Device.findOne({ where: { token } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
    logger.info('Incoming webhook received for device ' + device.id + ':', req.body);
    return res.json({ status: true, message: 'Received' });
  } catch (err) {
    logger.error('ReceiveIncoming error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
