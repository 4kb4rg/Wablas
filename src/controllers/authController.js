const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    return res.status(201).json({
      status: true,
      message: 'Registration successful',
      data: { token, user: { id: user.id, name: user.name, email: user.email } }
    });
  } catch (err) {
    logger.error('Register error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ status: false, message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    return res.json({
      status: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, name: user.name, email: user.email } }
    });
  } catch (err) {
    logger.error('Login error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'apiKey', 'createdAt']
    });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    return res.json({ status: true, data: user });
  } catch (err) {
    logger.error('GetProfile error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.regenerateApiKey = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    const { v4: uuidv4 } = require('uuid');
    user.apiKey = uuidv4();
    await user.save();
    return res.json({ status: true, message: 'API key regenerated', data: { apiKey: user.apiKey } });
  } catch (err) {
    logger.error('RegenerateApiKey error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
