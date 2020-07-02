const express = require('express');
const router = express.Router();
const DeviceModel = cms.getModel('Device');
const _ = require('lodash');
const axios = require('axios')

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
  let { clientId, metadata } = req.body;

  if (clientId) {
    const foundDevice = await DeviceModel.findOne({ _id: clientId, storeId: { $exists: false } })
    if (foundDevice) {
      if (metadata) { // { deviceLatLong || deviceAddress, deviceIP }
        if (metadata.deviceLatLong) {
          // update location
          const { latitude, longitude } = metadata.deviceLatLong
          const { longitude: existingLongitude, latitude: existingLatitude } = foundDevice.metadata.deviceLatLong;

          if (latitude !== existingLatitude || longitude !== existingLongitude ) {
            const address = await reverseGeocodePelias(latitude, longitude);
            if (address) metadata.deviceLocation = address
            console.log(`found address: ${address}`)
          }
        }

        await cms.getModel('Device').findOneAndUpdate({ _id: foundDevice._id },
          { metadata: Object.assign({}, foundDevice.metadata, metadata) })
      }
      return res.sendStatus(204)
    }
    return res.status(200).json({ unregistered: true })
  }
});

async function reverseGeocodePelias(lat, long) {
  const url = `https://pelias.gigasource.io/v1/reverse?point.lat=${lat}&point.lon=${long}`

  const req = await axios.get(url)
  const { features } = req.data

  if (features && features.length) {
    const { country, label, region, name } = features[0];
    return label || `${name}, ${region}, ${country}`
  }

  return await reverseGeocodeGoogle(lat, long)
}

async function reverseGeocodeGoogle(lat, long) { //fallback
  const apiKey = global.APP_CONFIG.mapsApiKey;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${apiKey}`

  const req = await axios.get(url)
  const { results } = req.data

  if (results && results.length) {
    return results[0]['formatted_address']
  }
}


module.exports = router
