const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  getContentType,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');
const { Device } = require('../models');

const sessions = new Map();
const SESSION_DIR = path.join(process.cwd(), 'sessions');

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
  fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
}

const initDevice = async (device) => {
  const sessionPath = path.join(SESSION_DIR, device.token);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['WhatsApp Gateway', 'Chrome', '110.0.0'],
  });

  sessions.set(device.token, sock);
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const QRCode = require('qrcode');
      try {
        const qrDataURL = await QRCode.toDataURL(qr);
        await Device.update({ qr_code: qrDataURL, status: 'connecting' }, { where: { token: device.token } });
        logger.info('QR code generated for device ' + device.id);
      } catch (err) {
        logger.error('QR generation error:', err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error) instanceof Boom
        && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      await Device.update({ status: 'disconnected' }, { where: { token: device.token } });
      sessions.delete(device.token);

      if (shouldReconnect) {
        setTimeout(() => initDevice(device), 5000);
      } else {
        logger.info('Device ' + device.id + ' logged out');
        const sp = path.join(SESSION_DIR, device.token);
        if (fs.existsSync(sp)) fs.rmSync(sp, { recursive: true });
      }
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
      await Device.update(
        { status: 'connected', qr_code: null, phone, last_active: new Date() },
        { where: { token: device.token } }
      );
      logger.info('Device ' + device.id + ' connected - Phone: ' + phone);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      if (!message.key.fromMe && message.message) {
        try {
          const deviceRecord = await Device.findOne({ where: { token: device.token } });
          if (deviceRecord?.webhook_url) {
            const payload = {
              device_id: deviceRecord.id,
              phone: message.key.remoteJid?.split('@')[0],
              message: extractMessageText(message),
              type: getContentType(message.message),
              timestamp: message.messageTimestamp,
              from_me: message.key.fromMe,
              message_id: message.key.id,
            };
            axios.post(deviceRecord.webhook_url, payload, { timeout: 5000 }).catch((err) => {
              logger.warn('Webhook delivery failed: ' + err.message);
            });
          }
        } catch (err) {
          logger.error('Message handler error:', err);
        }
      }
    }
  });

  return sock;
};

const extractMessageText = (message) => {
  const content = message.message;
  if (!content) return '';
  if (content.conversation) return content.conversation;
  if (content.extendedTextMessage) return content.extendedTextMessage.text;
  if (content.imageMessage) return content.imageMessage.caption || '';
  if (content.videoMessage) return content.videoMessage.caption || '';
  return '';
};

const getSession = (token) => sessions.get(token);

const disconnectDevice = async (token) => {
  const sock = sessions.get(token);
  if (sock) {
    try { await sock.logout(); } catch (e) { logger.warn('Logout error:', e.message); }
    sessions.delete(token);
  }
};

const sendTextMessage = async (token, phone, text) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  return sock.sendMessage(phone, { text });
};

const sendImageMessage = async (token, phone, filePath, caption) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  const buffer = fs.readFileSync(filePath);
  return sock.sendMessage(phone, { image: buffer, caption: caption || '' });
};

const sendDocumentMessage = async (token, phone, filePath, filename) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  const buffer = fs.readFileSync(filePath);
  const mimetype = 'application/octet-stream';
  return sock.sendMessage(phone, { document: buffer, mimetype, fileName: filename });
};

const sendAudioMessage = async (token, phone, filePath) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  const buffer = fs.readFileSync(filePath);
  return sock.sendMessage(phone, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
};

const sendVideoMessage = async (token, phone, filePath, caption) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  const buffer = fs.readFileSync(filePath);
  return sock.sendMessage(phone, { video: buffer, caption: caption || '' });
};

const sendLocationMessage = async (token, phone, latitude, longitude, name) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  return sock.sendMessage(phone, { location: { degreesLatitude: latitude, degreesLongitude: longitude, name: name || '' } });
};

const checkPhone = async (token, phone) => {
  const sock = getSession(token);
  if (!sock) throw new Error('Device not connected');
  const [result] = await sock.onWhatsApp(phone);
  return result?.exists || false;
};

const restoreActiveSessions = async () => {
  try {
    const devices = await Device.findAll({ where: { is_active: true } });
    logger.info('Restoring ' + devices.length + ' device sessions...');
    for (const device of devices) {
      const sessionPath = path.join(SESSION_DIR, device.token);
      if (fs.existsSync(sessionPath)) {
        initDevice(device).catch((err) => logger.error('Failed to restore device ' + device.id + ':', err));
      }
    }
  } catch (error) {
    logger.error('Restore sessions error:', error);
  }
};

module.exports = { initDevice, disconnectDevice, getSession, sendTextMessage, sendImageMessage, sendDocumentMessage, sendAudioMessage, sendVideoMessage, sendLocationMessage, checkPhone, restoreActiveSessions };
