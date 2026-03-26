const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
    },
    device_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
    },
    user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
    },
    phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
    },
    message: {
          type: DataTypes.TEXT,
          allowNull: true,
    },
    type: {
          type: DataTypes.ENUM('text', 'image', 'document', 'audio', 'video', 'location'),
          defaultValue: 'text',
    },
    file_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
    },
    caption: {
          type: DataTypes.TEXT,
          allowNull: true,
    },
    status: {
          type: DataTypes.ENUM('pending', 'sending', 'sent', 'delivered', 'read', 'failed'),
          defaultValue: 'pending',
    },
    message_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
    },
    error_message: {
          type: DataTypes.TEXT,
          allowNull: true,
    },
    scheduled_at: {
          type: DataTypes.DATE,
          allowNull: true,
    },
    sent_at: {
          type: DataTypes.DATE,
          allowNull: true,
    },
}, {
    tableName: 'messages',
});

module.exports = Message;
