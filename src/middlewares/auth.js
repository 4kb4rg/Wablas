const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'apiKey']
    });
    if (!user) {
      return res.status(401).json({ status: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: false, message: 'Invalid or expired token' });
    }
    logger.error('Auth middleware error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.token;
    if (!apiKey) {
      return res.status(401).json({ status: false, message: 'API key required' });
    }
    const user = await User.findOne({
      where: { apiKey },
      attributes: ['id', 'name', 'email', 'apiKey']
    });
    if (!user) {
      return res.status(401).json({ status: false, message: 'Invalid API key' });
    }
    req.user = user;
    next();
  } catch (err) {
    logger.error('ApiKey auth middleware error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();
    if (!authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'apiKey']
    });
    if (user) req.user = user;
    next();
  } catch (err) {
    next();
  }
};

module.exports = { authenticate, authenticateApiKey, optionalAuth };
