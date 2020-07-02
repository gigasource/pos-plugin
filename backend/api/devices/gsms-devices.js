const express = require('express');
const router = express.Router();
const DeviceModel = cms.getModel('Device');

router.post('/register', async (req, res) => {
  let {hardware, appName, metadata} = req.body;

  if (!hardware) return res.status(400).json({error: 'missing hardware property in request body'});
  if (!metadata) return res.status(400).json({error: 'missing metadata property in request body'});

  const newDevice = await DeviceModel.create({
    name: hardware || 'New Device', paired: true, hardware, appName, metadata, deviceType: 'gsms',
  });

  cms.socket.emit('reloadUnassignedDevices');
  res.status(200).json({clientId: newDevice._id});
});

router.get('/gsms-devices', async (req, res) => {
  try {
    const gsmsDevices = await DeviceModel.find({deviceType: 'gsms'}).lean();
    res.status(200).json(gsmsDevices);
  } catch (error) {
    console.error(error);
    res.status(500).json({error});
  }
});

router.put('/device-metadata', async (req, res) => {
  let {clientId, metadata} = req.body;

  if (clientId) {
    const foundDevice = await DeviceModel.findOne({_id: clientId, storeId: {$exists: false}})
    if (foundDevice) {
      if (metadata) { // { deviceLatLong || deviceAddress, deviceIP }
        await cms.getModel('Device').findOneAndUpdate({ _id: foundDevice._id },
          { metadata: Object.assign({}, foundDevice.metadata, metadata) })
      }
      return res.sendStatus(204)
    }
    else return res.status(200).json({unregistered: true})
  }
});

module.exports = router
