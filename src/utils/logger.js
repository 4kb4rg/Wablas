const winston = require('winston');
const path = require('path');

const logDir = 'logs';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          winston.format.json()
        ),
    defaultMeta: { service: 'whatsapp-gateway' },
    transports: [
          new winston.transports.Console({
                  format: winston.format.combine(
                            winston.format.colorize(),
                            winston.format.printf(({ timestamp, level, message }) => {
                                        return `${timestamp} [${level}]: ${message}`;
                            })
                          ),
          }),
          new winston.transports.File({
                  filename: path.join(logDir, 'error.log'),
                  level: 'error',
                  maxsize: 10485760,
                  maxFiles: 5,
          }),
          new winston.transports.File({
                  filename: path.join(logDir, 'combined.log'),
                  maxsize: 10485760,
                  maxFiles: 5,
          }),
        ],
});

module.exports = logger;
