const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authMiddleware } = require('../middlewares/auth');

router.put('/set/:deviceId', authMiddleware, webhookController.setWebhook);
router.delete('/remove/:deviceId', authMiddleware, webhookController.removeWebhook);
router.post('/incoming/:token', webhookController.handleIncoming);

module.exports = router;
