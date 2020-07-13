const express = require('express');
const router = express.Router();
const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');
const ChatMessageModel = cms.getModel('ChatMessage');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const _ = require('lodash');
const axios = require('axios')

router.get('/devices/:clientId', async (req, res) => {
  const {clientId} = req.params;
  if (!clientId) return res.status(400).json({error: `clientId param can not be ${clientId}`});

  const device = await DeviceModel.findById(clientId);
  if (!device) return res.status(400).json({error: `Device with ID ${clientId} not found`});

  res.status(200).json(device._doc);
});

router.get('/devices', async (req, res) => {
  let gsmsDevices = await DeviceModel.find(
      {deviceType: 'gsms', $or: [{deleted: false}, {deleted: {$exists: false}}]}).lean();

  gsmsDevices = await Promise.all(gsmsDevices.map(async device => {
    const latestUnreadMsg = await ChatMessageModel.findOne({clientId: device._id, read: false}).sort({createdAt: -1});

    return {
      ...device,
      latestChatMessageDate: latestUnreadMsg ? latestUnreadMsg.createdAt : new Date(0),
    }
  }));

  res.status(200).json(gsmsDevices);
});

router.delete('/devices/:clientId', async (req, res) => {
  const {clientId} = req.params;
  if (!clientId) return res.status(400).json({error: `clientId param can not be ${clientId}`});

  const device = await DeviceModel.findById(clientId);
  if (!device) return res.status(400).json({error: `Device with ID ${clientId} not found`});

  if (device.storeId) {
    const deviceStore = await StoreModel.findById(device.storeId);
    if (deviceStore.gSms && deviceStore.gSms.devices) {
      await StoreModel.findOneAndUpdate(
        { _id: deviceStore._id },
        { $pull: { 'gSms.devices': { _id: id } } }
      )
    }
  }

  await DeviceModel.updateOne({_id: device._id}, {deleted: true});
  res.status(204).send();
});

router.get('/device-assigned-store/:clientId', async (req, res) => {
  const {clientId} = req.params;
  if (!clientId) return res.status(400).json({error: `clientId can not be ${clientId}`});

  const device = await DeviceModel.findById(clientId);
  if (!device) return res.status(400).json({error: `No device found with ID ${clientId}`});

  const store = await StoreModel.findById(device.storeId || '');
  if (!store) return res.status(200).json({assignedStore: null});

  res.status(200).json({assignedStore: store.name || store.alias});
});

router.get('/device-online-status', async (req, res) => {
  let {clientIds} = req.query;
  if (!clientIds) return res.status(400).json({error: `clientIds query can not be ${clientIds}`});

  clientIds = clientIds.split(',');

  const clusterClientList = global.APP_CONFIG.redis
      ? await getExternalSocketIoServer().getClusterClientIds()
      : getExternalSocketIoServer().getAllClientId();

  const onlineStatusMap = clientIds.reduce((result, clientId) => {
    result[clientId] = clusterClientList.includes(clientId);
    return result;
  }, {});

  res.status(200).json(onlineStatusMap);
});

router.post('/register', async (req, res) => {
  let {hardwareId, hardware, appName, metadata} = req.body;

  if (!hardware) return res.status(400).json({error: 'missing hardware property in request body'});
  if (!metadata) return res.status(400).json({error: 'missing metadata property in request body'});

  if (metadata && metadata.deviceLatLong) {
    const {latitude, longitude} = metadata.deviceLatLong

    try {
      const address = await reverseGeocodePelias(latitude, longitude);
      if (address) metadata.deviceLocation = address;
    } catch (e) {
      metadata.deviceLocation = 'N/A';
      console.error('sentry:sentry:eventType=gsmsDeviceRegister', e, JSON.stringify(e, null, 2));
    }
  }

  const now = new Date();
  let newDevice;
  if (hardwareId) {
    newDevice = await DeviceModel.findOne({hardwareId});

    if (newDevice) {
      newDevice.name = hardware;
      newDevice.hardware = hardware;
      newDevice.paired = true;
      newDevice.lastSeen = now;
      newDevice.appName = appName;
      Object.assign(newDevice.metadata, metadata);

      await DeviceModel.updateOne({hardwareId}, newDevice);
    }
  }

  if (!newDevice) {
    newDevice = await DeviceModel.create({
      name: hardware || 'New Device', paired: true, lastSeen: now, createdAt: now,
      hardware, appName, metadata, deviceType: 'gsms', notes: [], hardwareId,
    });
  }

  console.debug(`sentry:eventType=gsmsDeviceRegister,clientId=${newDevice._id}`,
      'New GSMS device registered');

  cms.socket.emit('reloadUnassignedDevices');
  res.status(201).json({clientId: newDevice._id});
});

router.put('/device-metadata', async (req, res) => {
  let {clientId, metadata} = req.body;

  if (clientId) {
    const foundDevice = await DeviceModel.findOne({_id: clientId});
    if (foundDevice) {
      if (metadata) { // { deviceLatLong || deviceAddress, deviceIP }
        if (metadata.deviceLatLong) {
          // update location
          const {latitude, longitude} = metadata.deviceLatLong
          const {longitude: existingLongitude, latitude: existingLatitude} = foundDevice.metadata.deviceLatLong;

          if (latitude !== existingLatitude || longitude !== existingLongitude) {
            const address = await reverseGeocodePelias(latitude, longitude);
            if (address) metadata.deviceLocation = address
            console.log(`found address: ${address}`)
          }
        }

        await cms.getModel('Device').findOneAndUpdate({_id: foundDevice._id},
            {metadata: Object.assign({}, foundDevice.metadata, metadata)})
      }
      return res.sendStatus(204)
    } else {
      return res.status(400).json({error: `Device with ID ${clientId} not found`});
    }
  } else {
    res.status(400).json({error: `clientId can not be ${clientId}`});
  }
});

async function reverseGeocodePelias(lat, long) {
  const url = `https://pelias.gigasource.io/v1/reverse?point.lat=${lat}&point.lon=${long}`

  const req = await axios.get(url)
  const {features} = req.data

  if (features && features.length) {
    const {country, label, region, name} = features[0];
    return label || `${name}, ${region}, ${country}`
  }

  return await reverseGeocodeGoogle(lat, long)
}

async function reverseGeocodeGoogle(lat, long) { //fallback
  const apiKey = global.APP_CONFIG.mapsApiKey;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${apiKey}`

  const req = await axios.get(url)
  const {results} = req.data

  if (results && results.length) {
    return results[0]['formatted_address']
  }
}


module.exports = router
