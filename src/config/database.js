const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
  {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: (msg) => logger.debug(msg),
        pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000,
        },
        define: {
                timestamps: true,
                underscored: true,
        },
  }
  );

const connectDB = async () => {
    try {
          await sequelize.authenticate();
          await sequelize.sync({ alter: false });
          logger.info('Database connected successfully');
    } catch (error) {
          logger.error('Database connection failed:', error);
          throw error;
    }
};

module.exports = { sequelize, connectDB };
