const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.post('/send', broadcastController.sendBroadcast);
router.get('/history', broadcastController.getBroadcastHistory);

module.exports = router;
