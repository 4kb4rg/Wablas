const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
    },
    name: {
          type: DataTypes.STRING(100),
          allowNull: false,
    },
    email: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
    },
    password: {
          type: DataTypes.STRING(255),
          allowNull: false,
    },
    token: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
    },
    is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
    },
    role: {
          type: DataTypes.ENUM('admin', 'user'),
          defaultValue: 'user',
    },
    quota: {
          type: DataTypes.INTEGER,
          defaultValue: 1000,
    },
    quota_used: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
    },
}, {
    tableName: 'users',
    hooks: {
          beforeCreate: async (user) => {
                  if (user.password) {
                            user.password = await bcrypt.hash(user.password, 12);
                  }
          },
          beforeUpdate: async (user) => {
                  if (user.changed('password')) {
                            user.password = await bcrypt.hash(user.password, 12);
                  }
          },
    },
});

User.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = User;
