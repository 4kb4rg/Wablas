const router = require('express').Router();
const { jwtAuth } = require('../middleware/auth');
const Device = require('../models/Device');

router.use(jwtAuth);

router.put('/:deviceId', async (req, res) => {
  try {
      const { webhook_url } = req.body;
          const device = await Device.findOne({ where: { id: req.params.deviceId, user_id: req.user.id } });
              if (!device) return res.status(404).json({ status: false, message: 'Device not found' });
                  await device.update({ webhook_url });
                      res.json({ status: true, message: 'Webhook updated', data: device });
                        } catch (err) {
                            res.status(500).json({ status: false, message: err.message });
                              }
                              });

                              module.exports = router;