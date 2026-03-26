const { Message, Device } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');

exports.getMessageStats = async (req, res) => {
  try {
    const { token, startDate, endDate } = req.query;
    const device = await Device.findOne({ where: { token, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });

    const where = { deviceId: device.id };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const total = await Message.count({ where });
    const sent = await Message.count({ where: { ...where, status: 'sent' } });
    const failed = await Message.count({ where: { ...where, status: 'failed' } });
    const pending = await Message.count({ where: { ...where, status: 'pending' } });

    const byType = await Message.findAll({
      where,
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      group: ['type']
    });

    return res.json({
      status: true,
      data: {
        total,
        sent,
        failed,
        pending,
        byType: byType.map((r) => ({ type: r.type, count: parseInt(r.dataValues.count) }))
      }
    });
  } catch (err) {
    logger.error('GetMessageStats error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getMessageLog = async (req, res) => {
  try {
    const { token, status, phone, page = 1, limit = 50 } = req.query;
    const device = await Device.findOne({ where: { token, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });

    const where = { deviceId: device.id };
    if (status) where.status = status;
    if (phone) where.phone = { [Op.like]: '%' + phone + '%' };

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
    logger.error('GetMessageLog error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getDailyStats = async (req, res) => {
  try {
    const { token, days = 7 } = req.query;
    const device = await Device.findOne({ where: { token, userId: req.user.id } });
    if (!device) return res.status(404).json({ status: false, message: 'Device not found' });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await Message.findAll({
      where: {
        deviceId: device.id,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
        [fn('SUM', literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed']
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']]
    });

    return res.json({
      status: true,
      data: stats.map((r) => ({
        date: r.dataValues.date,
        total: parseInt(r.dataValues.total),
        sent: parseInt(r.dataValues.sent),
        failed: parseInt(r.dataValues.failed)
      }))
    });
  } catch (err) {
    logger.error('GetDailyStats error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
