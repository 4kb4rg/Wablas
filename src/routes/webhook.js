const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticate } = require('../middlewares/auth');

router.get('/:id', authenticate, webhookController.getWebhook);
router.post('/:id', authenticate, webhookController.setWebhook);
router.delete('/:id', authenticate, webhookController.deleteWebhook);
router.post('/:id/test', authenticate, webhookController.testWebhook);
router.post('/incoming/:token', webhookController.receiveIncoming);

module.exports = router;
