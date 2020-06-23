const _ = require('lodash')
const randomstring = require('randomstring')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store')

function generateDeviceCode() {
  return randomstring.generate({length: 9, charset: 'numeric'})
}

async function generateUniqueDeviceCode() {
  const deviceCodes = _.map(await DeviceModel.find({}, {deviceCode: 1}), device => device.deviceCode)
  let newDeviceCode
  do {
    newDeviceCode = generateDeviceCode()
  } while (_.includes(deviceCodes, newDeviceCode))
  return newDeviceCode
}

async function addPairedDeviceToStore(deviceId, storeId) {
  const store = await StoreModel.findOne({_id: storeId }, {devices: 1})
  const deviceIds = _.map(store.devices, e => e._id)

  if (!deviceIds.includes(deviceId)) deviceIds.push(deviceId)

  return await StoreModel.findOneAndUpdate({_id: storeId}, { devices: deviceIds });
}

async function removePairedDeviceFromStore(deviceId, storeId) {
  const store = await StoreModel.findOne({ _id: storeId }, {devices: 1});
  const deviceIds = _.map(store.devices, e => e._id)
  const newDeviceIds = _.filter(deviceIds, id => id !== deviceId)
  await StoreModel.updateOne({ _id: storeId.toString() }, { devices: newDeviceIds });
}

router.get('/pairing-code', async (req, res) => {
  const {storeId} = req.query

  if (!storeId) return res.status(400).json({message: 'Missing storeId in request'});

  // Only 1 store can have "onlineOrder" feature
  const device = await DeviceModel.findOne({storeId, paired: false})
  if (device) return res.status(200).json({pairingCode: device.pairingCode})

  // Create new device if none exists
  const pairingCode = await generateUniqueDeviceCode()
  await DeviceModel.create({
    pairingCode,
    storeId: ObjectId(storeId),
    paired: false,
  })

  res.status(200).json({pairingCode})
})

router.post('/register', async (req, res) => {
  // hardware: Sunmi, Kindle-Fire, etc, ...
  // appName: Pos-Germany.apk
  // appVersion: 1.51
  let {pairingCode, hardware, appName, appVersion, release } = req.body;
  if (!pairingCode) return res.status(400).json({message: 'Missing pairingCode in request body'});
  const deviceInfo = await DeviceModel.findOne({pairingCode, paired: false});
  if (deviceInfo) {
    // online status will be updated when client connects to external Socket.io server (see backend/socket-io-server.js file)
    await DeviceModel.updateOne({pairingCode}, { name: hardware || 'New Device', paired: true, hardware, appName, appVersion, release, features: {
        fastCheckout: false,
        manualTable: false,
        delivery: false,
        editMenuCard: false,
        tablePlan: false,
        onlineOrdering: false,
        editTablePlan: false,
        staffReport: false,
        eodReport: false,
        monthlyReport: false,
        remoteControl: true,
        proxy: true,
        alwaysOn: true,
        reservation: false
      }
    });
    const store = await addPairedDeviceToStore(deviceInfo._id, deviceInfo.storeId);
    cms.socket.emit('reloadStores', deviceInfo.storeId);
    res.status(200).json({deviceId: deviceInfo._id, storeName: store.name || store.settingName, storeAlias: store.alias});
  } else {
    res.status(400).json({message: 'Invalid pairing code or pairing code has been used by another device'})
  }
})

router.post('/unregister', async (req, res) => {
  const {_id} = req.body;
  const deviceInfo = await DeviceModel.findOne({_id});
  if (deviceInfo) {
    await removePairedDeviceFromStore(_id, deviceInfo.storeId)
    await DeviceModel.deleteOne({_id})
    res.status(200).json({deviceId: deviceInfo._id})
  } else {
    res.status(400).json({message: 'Bad request: Invalid id'})
  }
})


module.exports = router
