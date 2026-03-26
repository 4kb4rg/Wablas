const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { deviceTokenMiddleware } = require('../middlewares/auth');

router.use(deviceTokenMiddleware);

router.post('/send', broadcastController.sendBroadcast);
router.get('/history', broadcastController.getBroadcastHistory);

module.exports = router;
