const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');
const ChatMessageModel = cms.getModel('ChatMessage');
const {DEVICE_TYPE} = require('./constants');
const {extractSortQueries} = require('../utils');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const dayjs = require('dayjs');
const _ = require('lodash');
const {
  getAndSortDevices,
  convertToGsmsStoreModel,

  reverseGeocodePelias,
  formatOrderForRpManager: formatOrder,
} = require('./utils');

function createDeviceApiRequestHandlers(deviceType = DEVICE_TYPE.GSMS) {
  async function getDeviceById(req, res) {
    const {clientId} = req.params;
    if (!clientId) return res.status(400).json({error: `clientId param can not be ${clientId}`});

    const device = await DeviceModel.findById(clientId);
    if (!device) return res.status(400).json({error: `Device with ID ${clientId} not found`});

    res.status(200).json(device._doc);
  }

  async function getAllDevices(req, res) {
    let {n = 0, offset = 0, sort = 'createdAt.desc', nameSearch} = req.query;

    sort = extractSortQueries(sort);

    const clusterClientList = global.APP_CONFIG.redis
      ? await getExternalSocketIoServer().getClusterClientIds()
      : getExternalSocketIoServer().getAllClientId();

    let devices = await getAndSortDevices(+n, +offset, sort, nameSearch);
    devices = await Promise.all(devices.map(async device => {
      const latestUnreadMsg = await ChatMessageModel.findOne({
        clientId: device._id
      }).sort({createdAt: -1});

      return {
        ...device,
        latestChatMessageDate: latestUnreadMsg ? latestUnreadMsg.createdAt : new Date(0),
        latestChatMessage: latestUnreadMsg,
        online: clusterClientList.includes(device._id),
      }
    }));

    res.status(200).json(devices);
  }

  async function deleteDeviceById(req, res) {
    const {deviceId} = req.params;
    if (!deviceId) return res.status(400).json({error: `deviceId param can not be ${deviceId}`});

    const device = await DeviceModel.findById(deviceId);
    if (!device) return res.status(400).json({error: `Device with ID ${deviceId} not found`});

    if (device.storeId) {
      const deviceStore = await StoreModel.findById(device.storeId);
      if (deviceStore.gSms && deviceStore.gSms.devices) {
        await StoreModel.findOneAndUpdate(
          {_id: deviceStore._id},
          {$pull: {'gSms.devices': {_id: deviceId}}}
        )
      }
    }

    // multi store
    if (device.enableMultiStore) {
      const stores = await StoreModel.find({_id: {$in: device.storeIds}})
      _.each(stores, s => {
        if (s.gSms && s.gSms.devices) {
          StoreModel.findOneAndUpdate(
            {_id: s._id},
            {$pull: {'gSms.devices': {_id: deviceId}}}
          )
        }
      })
    }

    await DeviceModel.updateOne({_id: device._id}, {deleted: true});
    res.status(204).send();
  }

  async function getAssignedStoreOfDevice(req, res) {
    const {deviceId} = req.params;
    if (!deviceId)
      return res.status(400).json({error: `deviceId can not be ${deviceId}`});

    let device = await DeviceModel.findById(deviceId);
    if (!device)
      return res.status(400).json({error: `No device found with ID ${deviceId}`});

    // multi store
    if (device.enableMultiStore) {
      const stores = await StoreModel.find({_id: {$in: device.storeIds}})
      if (stores && stores.length) {
        if (stores.length === 1) {
          device = await DeviceModel.updateOne({_id: device._id}, {
            storeId: stores[0]._id,
            enableMultiStore: false,
            stores: null
          }, {new: true})
        } else {
          return res.json({
            stores: stores.map(convertToGsmsStoreModel),
          })
        }
      } else {
        await DeviceModel.updateOne({_id: device._id}, {
          enableMultiStore: false,
          stores: null
        })
      }
    }

    const store = await StoreModel.findById(device.storeId || '');
    if (!store) {
      return res.status(200).json({
        error: `No store found with id ${device.storeId}`,
        assignedStore: null
      });
    }

    res.status(200).json({
      // fallback for older version
      _id: store._id.toString(),
      storeId: store.id,
      assignedStore: store.name || store.alias,
      // for newer version
      store: convertToGsmsStoreModel(store)
    });
  }

  async function getDeviceOnlineStatus(req, res) {
    let {clientIds} = req.query;

    const deviceQuery = deviceType === DEVICE_TYPE.POS
      ? {$or: [{deviceType: DEVICE_TYPE.POS}, {deviceType: {$exists: false}}]}
      : {deviceType: deviceType};

    if (clientIds) clientIds = clientIds.split(',');
    else clientIds = (await DeviceModel.find(deviceQuery)).map(({_id}) => _id);

    const clusterClientList = global.APP_CONFIG.redis
      ? await getExternalSocketIoServer().getClusterClientIds()
      : getExternalSocketIoServer().getAllClientId();

    const onlineStatusMap = clientIds.reduce((result, clientId) => {
      result[clientId] = clusterClientList.includes(clientId);
      return result;
    }, {});

    res.status(200).json(onlineStatusMap);
  }

  async function registerDevice(req, res) {
    let {hardwareId, hardware, appName, metadata} = req.body;

    if (!hardware) return res.status(400).json({error: 'missing hardware property in request body'});
    if (!metadata) return res.status(400).json({error: 'missing metadata property in request body'});

    if (metadata && metadata.deviceLatLong && !metadata.deviceLocation) {
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
        newDevice.deleted = false;
        newDevice.metadata = newDevice.metadata || {}
        Object.assign(newDevice.metadata, metadata);

        await DeviceModel.updateOne({hardwareId}, newDevice);
      }
    }

    if (!newDevice) {
      newDevice = await DeviceModel.create({
        name: hardware || 'New Device', paired: true, lastSeen: now, createdAt: now,
        hardware, appName, metadata, deviceType, notes: [], hardwareId,
      });
    }

    console.debug(`sentry:eventType=gsmsDeviceRegister,clientId=${newDevice._id}`,
      'New GSMS device registered');

    cms.socket.emit('newGsmsDevice', {
      ...newDevice._doc,
      online: true,
      unreadMessages: 0,
    });
    cms.emit('newGsmsDevice', {
      ...newDevice._doc,
      online: true,
      unreadMessages: 0,
    });
    res.status(201).json({clientId: newDevice._id});
  }

  async function updateDeviceMetadata(req, res) {
    let {clientId, metadata} = req.body;

    if (clientId) {
      const foundDevice = await DeviceModel.findOne({_id: clientId});
      if (foundDevice) {
        if (metadata) { // { deviceLatLong || deviceAddress, deviceIP }
          if (metadata.deviceLatLong) {
            // update location
            const {latitude, longitude} = metadata.deviceLatLong
            let shouldUpdateAddress = true

            if (foundDevice.metadata.deviceLatLong) {
              const {longitude: existingLongitude, latitude: existingLatitude} = foundDevice.metadata.deviceLatLong;
              if (latitude === existingLatitude && longitude === existingLongitude) shouldUpdateAddress = false
            }

            if (shouldUpdateAddress) {
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
  }

  async function reverseGeoWithLatLong(req, res) {
    const {lat, long} = req.query;
    if (!lat || !long) res.status(400).json({error: 'Missing lat or long value'});
    try {
      const formattedAddress = await reverseGeocodePelias(lat, long);
      res.json({address: formattedAddress})
    } catch (e) {
      res.status(500).json({error: e.message})
    }
  }

  async function getStoreGoogleMyBusinessId(req, res) {
    const storeId = req.query.storeId
    const store = await cms.getModel('Store').findOne({id: storeId})
    if (!store)
      res.status(400).end();
    else
      res.status(200).json({googleMyBusinessId: store.googleMyBusinessId})
  }

  async function getStoreMonthlyReport(req, res) {
    const storeId = req.query.storeId
    const store = await cms.getModel('Store').findOne({id: storeId})
    if (!store) return res.status(400).end()

    const feedback = await cms.getModel('Feedback').find({
      storeId: store._id.toString(),
      created: {$gte: dayjs().startOf('day').subtract(28, 'day').toDate()}
    })
    res.status(200).json({
      prevMonthReport: store.prevMonthReport,
      currentMonthReport: store.currentMonthReport,
      feedback
    })
  }

  async function getStoreLocale(req, res) {
    const storeId = req.query.storeId
    const store = await cms.getModel('Store').findOne({id: storeId})
    if (!store) return res.status(400).end()

    let currency, currencyLong

    switch (store.country.locale) {
      case 'de-DE': {
        currency = '€'
        currencyLong = 'EUR'
        break
      }
      case 'en-AU': {
        currency = 'A$'
        currencyLong = 'AUD'
        break
      }
      case 'en-GB': {
        currency = '£'
        currencyLong = 'GBP'
        break
      }
      case 'en-US': {
        currency = '$'
        currencyLong = 'USD'
        break
      }
      case 'fr-FR': {
        currency = '€'
        currencyLong = 'EUR'
        break
      }
      default: {
        currency = '$'
        currencyLong = 'USD'
        break
      }
    }

    res.status(200).json({
      currency, currencyLong
    })
  }

  async function getStoreSettings(req, res) {
    const storeId = req.query.storeId
    if (!storeId) return res.sendStatus(400)
    const store = await cms.getModel('Store').findOne({id: storeId})
    if (!store) return res.sendStatus(400)

    res.status(200).json({
      orderTimeout: store.orderTimeOut
    })
  }

  async function getStoreOrders(req, res) {
    const {storeId} = req.query
    if (!storeId) res.sendStatus(400)

    const store = await cms.getModel('Store').findOne({id: storeId})
    const orders = await cms.getModel('Order').find({
      storeId: store._id,
      date: {$gte: dayjs().startOf('day').toDate()}
    }).lean()

    res.status(200).json(orders.map(order => formatOrder(order, store)))
  }

  async function getOrderById(req, res) {
    const {id} = req.params
    if (!id) res.sendStatus(400)

    const order = await cms.getModel('Order').findById(id).lean()
    if (!order) return res.status(400).send('No order found!')

    res.status(200).json(formatOrder(order))
  }

  return {
    getDeviceById,
    getAllDevices,
    getAssignedStoreOfDevice,
    getDeviceOnlineStatus,
    getStoreGoogleMyBusinessId,
    getStoreMonthlyReport,
    getStoreLocale,
    getStoreSettings,
    getStoreOrders,
    getOrderById,
    registerDevice,
    deleteDeviceById,
    updateDeviceMetadata,
    reverseGeoWithLatLong,
  }
}

module.exports = createDeviceApiRequestHandlers;
