const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
    },
    user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
    },
    name: {
          type: DataTypes.STRING(100),
          allowNull: false,
    },
    phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
    },
    token: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
    },
    status: {
          type: DataTypes.ENUM('disconnected', 'connecting', 'connected', 'banned'),
          defaultValue: 'disconnected',
    },
    qr_code: {
          type: DataTypes.TEXT,
          allowNull: true,
    },
    session_data: {
          type: DataTypes.LONGTEXT,
          allowNull: true,
    },
    webhook_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
    },
    is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
    },
    last_active: {
          type: DataTypes.DATE,
          allowNull: true,
    },
}, {
    tableName: 'devices',
});

module.exports = Device;
