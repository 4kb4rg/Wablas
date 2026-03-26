const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', deviceController.getDevices);
router.post('/', deviceController.addDevice);
router.get('/:id', deviceController.getDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/:id/connect', deviceController.connectDevice);
router.get('/:id/qr', deviceController.getQRCode);
router.post('/:id/disconnect', deviceController.disconnectDevice);

module.exports = router;
