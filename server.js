
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

const authRoutes = require('./src/routes/auth');
const deviceRoutes = require('./src/routes/device');
const messageRoutes = require('./src/routes/message');
const broadcastRoutes = require('./src/routes/broadcast');
const webhookRoutes = require('./src/routes/webhook');
const reportRoutes = require('./src/routes/report');

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/report', reportRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'WhatsApp Gateway Running', version: '1.0.0' });
  });

  app.use((err, req, res, next) => {
    logger.error(err.stack);
      res.status(500).json({ status: false, message: 'Internal Server Error' });
      });

      const start = async () => {
        try {
            await connectDB();
                await connectRedis();
                    app.listen(PORT, () => {
                          logger.info(`Server running on port ${PORT}`);
                              });
                                } catch (error) {
                                    logger.error('Failed to start server:', error);
                                        process.exit(1);
                                          }
                                          };

                                          start();
                                          module.exports = app;