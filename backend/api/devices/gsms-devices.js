const express = require('express');
const router = express.Router();
const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');
const ChatMessageModel = cms.getModel('ChatMessage');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const _ = require('lodash');
const axios = require('axios');
const {extractSortQueries} = require('../utils');
const dayjs = require('dayjs')
const jsonFn = require('json-fn')

function getAndSortDevices(n = 0, offset = 0, sort, nameSearch) {
  // unread message count will be dynamic, so getting devices with an offset may result in missing some devices due to order changes
  const limit = sort.unreadMessages ? n + offset : n;
  const skip = sort.unreadMessages ? null : offset;

  const steps = [{
    $match: {
      deleted: {$ne: true},
      deviceType: 'gsms',
    }
  }];

  if (nameSearch) {
    steps.push({
      $lookup: {
        from: 'stores',
        let: {storeId: {$toObjectId: '$storeId'}},
        pipeline: [{
          $match: {
            $expr: {
              $eq: ['$_id', '$$storeId']
            }
          },
        }],
        as: 'store',
      }
    });

    steps.push({
      $unwind: {
        path: '$store',
        preserveNullAndEmptyArrays: true
      }
    });
    steps.push({$addFields: {storeName: '$store.name'}});
    steps.push({$unset: 'store'});
    steps.push({
      $addFields: {
        nameSearchField: {
          $concat: [
            '$name',
            {$cond: [{$ifNull: ['$metadata.customerName', false]}, ' - ', '']},
            {$ifNull: ['$metadata.customerName', '']},
            {$cond: [{$ifNull: ['$storeName', false]}, ' - ', '']},
            {$ifNull: ['$storeName', '']},
          ]
        }
      }
    });
    steps.push({$unset: 'storeName'});

    steps.push({
      $match: {
        nameSearchField: {$regex: nameSearch, $options: 'i'}
      }
    });
  }

  steps.push({
    $lookup: {
      from: 'chatmessages',
      let: {deviceId: {$toString: '$_id'}},
      pipeline: [
        {
          $match: {
            read: false,
            fromServer: false,
            $expr: {$eq: ['$clientId', '$$deviceId']},
          }
        }
      ],
      as: 'unreadClientChats'
    }
  });

  steps.push({$addFields: {unreadMessages: {$size: '$unreadClientChats'}}});
  steps.push({$unset: 'unreadClientChats'});
  steps.push({$sort: sort});
  if (skip) steps.push({$skip: skip});
  if (limit) steps.push({$limit: limit});

  return DeviceModel.aggregate(steps);
}

router.get('/devices/:clientId', async (req, res) => {
  const {clientId} = req.params;
  if (!clientId) return res.status(400).json({error: `clientId param can not be ${clientId}`});

  const device = await DeviceModel.findById(clientId);
  if (!device) return res.status(400).json({error: `Device with ID ${clientId} not found`});

  res.status(200).json(device._doc);
});

router.get('/devices', async (req, res) => {
  let {n = 0, offset = 0, sort = 'createdAt.desc', nameSearch} = req.query;

  sort = extractSortQueries(sort);

  const clusterClientList = global.APP_CONFIG.redis
      ? await getExternalSocketIoServer().getClusterClientIds()
      : getExternalSocketIoServer().getAllClientId();

  let devices = await getAndSortDevices(+n, +offset, sort, nameSearch);
  devices = await Promise.all(devices.map(async device => {
    const latestUnreadMsg = await ChatMessageModel.findOne({
      clientId: device._id,
      read: false,
      fromServer: false
    }).sort({createdAt: -1});

    return {
      ...device,
      latestChatMessageDate: latestUnreadMsg ? latestUnreadMsg.createdAt : new Date(0),
      online: clusterClientList.includes(device._id),
    }
  }));

  res.status(200).json(devices);
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
          {_id: deviceStore._id},
          {$pull: {'gSms.devices': {_id: deviceStore._id}}}
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

  res.status(200).json({_id: store._id.toString(), storeId: store.id, assignedStore: store.name || store.alias});
});

router.get('/device-online-status', async (req, res) => {
  let {clientIds} = req.query;

  if (clientIds) clientIds = clientIds.split(',');
  else clientIds = (await DeviceModel.find({deviceType: 'gsms'})).map(({_id}) => _id);

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
      newDevice.deleted = false;
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

  cms.socket.emit('newGsmsDevice', {
    ...newDevice._doc,
    online: true,
    unreadMessages: 0,
  });
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

router.get('/google-my-business-id', async (req, res) => {
  const storeId = req.query.storeId
  const store = await cms.getModel('Store').findOne({ id: storeId })
  if (!store)
    res.status(400).end();
  else
    res.status(200).json({ googleMyBusinessId: store.googleMyBusinessId })
})

router.get('/monthly-report', async (req, res) => {
  const storeId = req.query.storeId
  const store = await cms.getModel('Store').findOne({ id: storeId })
  if (!store) return res.status(400).end()

  const feedback = await cms.getModel('Feedback').find({
    storeId: store._id.toString(),
    created: { $gte: dayjs().startOf('day').subtract(28, 'day').toDate() }
  })
  res.status(200).json({
    prevMonthReport: store.prevMonthReport,
    currentMonthReport: store.currentMonthReport,
    feedback
  })
})

router.get('/store-locale', async (req, res) => {
  const storeId = req.query.storeId
  const store = await cms.getModel('Store').findOne({ id: storeId })
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
});

router.get('/get-orders', async (req, res) => {
  const { storeId } = req.query
  if (!storeId) res.sendStatus(400)

  const store = await cms.getModel('Store').findOne({ id: storeId })
  const orders = await cms.getModel('Order').find({
    storeId: store._id,
    date: { $gte: dayjs().startOf('day').toDate() }
  }).lean()

  res.status(200).json(orders.map(order => formatOrder(order, store)))
})

function formatOrder(order, store) {
  const products = order.items.map(({id, modifiers, name, note, originalPrice, quantity}) => {
    if (modifiers && modifiers.length) {
      const sumOfModifiers = modifiers.reduce((sum, {price, quantity}) => sum + quantity * price, 0)
      originalPrice = originalPrice + sumOfModifiers
    }

    return {
      id,
      name,
      originalPrice,
      note,
      modifiers: modifiers.map(({name}) => name).join(', '),
      quantity,
    }
  })

  if (order.deliveryTime === 'asap') {
    const timeToComplete = (store.gSms && store.gSms.timeToComplete) || 30;
    order.deliveryTime = dayjs(order.date).add(timeToComplete, 'minute').toDate()
  }
  const deliveryTime = jsonFn.clone(order.deliveryTime)

  const discounts = order.discounts.reduce((sum, discount) => sum + discount.value, 0)
  const total = _.sumBy(products, p => p.originalPrice) - discounts

  return {
    orderToken: order.orderToken || order._id.toString(),
    orderType: order.orderType || 'onlineOrder',
    paymentType: order.payment[0].type,
    customer: JSON.stringify(order.customer),
    products: JSON.stringify(products),
    note: order.note,
    date: order.date,
    shippingFee: order.shippingFee,
    total,
    deliveryTime,
    discounts,
  }
}

module.exports = router

// RpManager is Restaurant Plus Manager app, this function formats order data to match format used in the app
module.exports.formatOrderForRpManager = formatOrder;