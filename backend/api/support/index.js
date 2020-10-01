const express = require('express');
const router = express.Router();
const ChatMessageModel = cms.getModel('ChatMessage');
const DeviceModel = cms.getModel('Device');
const UserModel = cms.getModel('User');
const StoreModel = cms.getModel('Store');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const {socket: internalSocketIOServer} = cms;
const {getNewDeviceCode} = require('../demoDevice');
const ObjectId = require('mongoose').Types.ObjectId;
const axios = require('axios')
const {getHost} = require('../utils')
const voipApi = require('./voip')
const { DEMO_STORE_ID } = require('../../restaurant-plus-apis/constants')
const _ = require('lodash')

/*TODO: need to refactor externalSocketIoServer so that it can be reused in different files
This one is to make sure Socket.io server is initialized before executing the code but it's not clean*/
setTimeout(() => {
  let externalSocketIoServer = getExternalSocketIoServer()

  externalSocketIoServer.on('connect', socket => {
    async function setDemoDeviceLastSeen(deviceId) {
      const device = await DeviceModel.findById(deviceId)
      if (!device) return
      const storeId = device.storeId;
      if (!storeId) return
      await StoreModel.findOneAndUpdate({_id: storeId, 'gSms.devices._id': deviceId}, {
        $set: {
          'gSms.devices.$.lastSeen': new Date()
        }
      })
      cms.socket.emit('loadStore', storeId)
    }

    if (socket.request._query && socket.request._query.clientId) {
      const deviceId = socket.request._query.clientId;
      setDemoDeviceLastSeen(deviceId)
      internalSocketIOServer.emit('gsms-device-connected', deviceId);

      socket.on('disconnect', async () => {
        await setDemoDeviceLastSeen(deviceId)
        internalSocketIOServer.emit('gsms-device-disconnected', deviceId);
      });
    }

    socket.on('chat-message', async (chatData, cb) => {
      let {clientId, userId, createdAt, text} = chatData;
      createdAt = new Date(createdAt); // createdAt will be String

      const sentryTags = `sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`;
      const sentryPayload = JSON.stringify(chatData, null, 2);

      console.debug(sentryTags, `Received chat msg from gsms client`, sentryPayload);

      if (!userId) userId = (await UserModel.findOne({username: 'admin'}))._id

      const savedMsg = await ChatMessageModel.create({
        clientId,
        userId,
        createdAt,
        text,
        read: false,
        fromServer: false
      });

      console.debug(sentryTags, `Saved chat msg from gsms client, emit to online-order frontend`, sentryPayload);
      internalSocketIOServer.in(`chatMessage-from-client-${clientId}`).emit('chatMessage', savedMsg._doc);
      internalSocketIOServer.emit('chatMessageNotification');
      cms.emit('chatMessage', {chatData, fromServer: false});

      cb && cb(savedMsg._doc);
    });

    // for devices with assigned store
    socket.on('getAllReservations', async (storeId, cb) => {
      const store = await StoreModel.findOne({id: storeId})
      if (!store) return cb([])
      const reservations = await cms.getModel('Reservation').aggregate(
        [
          {
            $match: { store: store._id }
          },
          {
            $set: {
              dateTime: {
                $dateFromString: {
                  dateString: '$date',
                  format: '%Y-%m-%d'
                }
              }
            }
          },
          {
            $match: { dateTime: { $gte: dayjs().subtract(1, 'week').startOf('day').toDate() } }
          }
        ]
      )
      cb(reservations)
    })

    socket.on('getMenu', async (storeId, cb) => {
      const store = await StoreModel.findOne({id: storeId})
      if (!store) return cb()

      const categories = await cms.getModel('Category').find({store: store._id.toString()}).lean()
      const products = await cms.getModel('Product').find({store: store._id.toString()}).lean()
      cb(categories, products)
    })

    socket.on('updateMenu', async (collection, _id, value, cb) => {
      const clientId = socket.request._query.clientId
      const device = await cms.getModel('Device').findById(clientId)
      if (!device.storeId) return
      const store = await cms.getModel('Store').findById(device.storeId)
      const TAG = `sentry:store=${store.name || store.settingName},alias=${store.alias},eventType=updateMenu,deviceId=${device._id}`
      console.debug(TAG, _id ? `Updating ${collection} item ${_id}` : `Adding ${collection} item`, value)
      // insert/update product or category
      try {
        const result = _id
          ? await cms.getModel(collection).findOneAndUpdate({ _id }, value, { new: true })
          : await cms.getModel(collection).create({ store: device.storeId, ...value })
        cb({ success: true, _id: result._id, result })
        if (process.env.TOPAZ_SERVICE_ENDPOINT) {
          const host = getHost(socket.request)
          const url = `${host}${result.image}`
          const topazResponse = (await axios.post(`${host}/topaz`, { url })).data
          if (topazResponse.success) {
            const newImagePath = topazResponse.data
            // update db
            await cms.getModel(collection).findOneAndUpdate({ _id: result._id}, { image: newImagePath })
            result.image = newImagePath
            externalSocketIoServer.emitTo(clientId, 'updateProductImage', { result })
          } else {
            console.log()
          }
        }
      } catch (error) {
        cb({ error })
      }
    })

    socket.on('updateMenuPosition', async (collection, fromItem, toItem, cb) => {
      const clientId = socket.request._query.clientId
      const device = await cms.getModel('Device').findById(clientId)
      if (!device.storeId) return

      const { _id: fromId, position: fromPosition } = fromItem
      const { _id: toId, position: toPosition } = toItem

      try {
        await cms.getModel(collection).findOneAndUpdate({ _id: fromId }, { position: toPosition })
        await cms.getModel(collection).findOneAndUpdate({ _id: toId }, { position: fromPosition })
        cb({ success: true })
      } catch (error) {
        cb({ error })
      }

    })

    socket.on('deleteMenuItem', async (collection, _id, cb) => {
      console.log('deleteMenuItem', collection, _id)

      // delete product or category
      try {
        await cms.getModel(collection).findOneAndDelete({ _id })

        if (collection === 'Category') { // delete products from said category too
          await cms.getModel('Product').deleteMany({ category: _id })
        }
        cb({ success: true })
      } catch (error) {
        cb({ error })
      }
    })

    socket.on('endCallFromUser', async (clientId, agentId) => {
      console.log('endCallFromUser', clientId, agentId)
      clientId = clientId.replace("device_", "")
      internalSocketIOServer.in(`endCallFromUser-${clientId}`).emit('endCallFromUser', { clientId, agentId })
    })

    socket.on('updateReservationStatus', async (reservationId, status, cb) => {
      try {
        await cms.getModel('Reservation').findOneAndUpdate({ _id: ObjectId(reservationId) }, { status })
        cb({ success: true })
        console.debug(`sentry:eventType=reservation,reservationId=${reservationId}`,
          `4. Online order backend: received reservation status update: ${status}`)
        cms.emit('sendClientReservationStatus', reservationId)
      } catch (error) {
        cb({ error })
      }
    })
  });

  externalSocketIoServer.registerAckFunction('makeAPhoneCallAck', async (clientId, agentId, callAccepted) => {
    console.log('makeAPhoneCallAck', clientId, agentId, callAccepted)
    internalSocketIOServer.in(`makeAPhoneCallAck-from-client-${clientId}`).emit('makeAPhoneCallAck', { clientId, agentId, callAccepted })
  })

  externalSocketIoServer.registerAckFunction('cancelCallAck', async (clientId, agentId) => {
    console.log('cancelCallAck', clientId, agentId)
    internalSocketIOServer.in(`cancelCallAck-from-client-${clientId}`).emit('cancelCallAck', { clientId, agentId })
  })

  externalSocketIoServer.registerAckFunction('endCallAck', async (clientId, agentId) => {
    console.log('endCallAck', clientId, agentId)
    internalSocketIOServer.in(`endCallAck-from-client-${clientId}`).emit('endCallAck', { clientId, agentId })
  })

  internalSocketIOServer.on('connect', socket => {
    socket.on('watch-chat-message', clientIds => {
      clientIds.forEach(clientId => {
        socket.join(`chatMessage-from-client-${clientId}`)
        socket.join(`makeAPhoneCallAck-from-client-${clientId}`)
        socket.join(`cancelCallAck-from-client-${clientId}`)
        socket.join(`endCallAck-from-client-${clientId}`)
        socket.join(`endCallFromUser-${clientId}`)
      });
    });

    socket.on('chat-message', async (chatData, cb) => {
      let {clientId, userId, createdAt, text} = chatData;
      createdAt = new Date(createdAt); // createdAt will be String

      const sentryTags = `sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`;
      const sentryPayload = JSON.stringify(chatData, null, 2);

      console.debug(sentryTags, `Received chat msg from online-order frontend`, sentryPayload);

      const receiverDevice = await DeviceModel.findById(clientId);
      if (!receiverDevice) return console.error(sentryTags, `No device found with id ${clientId}`, sentryPayload);

      const savedMsg = await ChatMessageModel.create({
        clientId,
        userId,
        createdAt,
        text,
        read: false,
        fromServer: true
      });
      const sender = await UserModel.findOne({_id: userId});
      const username = sender ? sender.name : '';

      console.debug(sentryTags, `Saved chat msg from online-order frontend, emit to gsms client`, sentryPayload);
      cms.emit('chatMessage', {chatData, fromServer: true});
      internalSocketIOServer.in(`chatMessage-from-client-${clientId}`).emit('chatMessage', {...savedMsg._doc, username});
      await getExternalSocketIoServer().emitToPersistent(clientId, 'chatMessage', [savedMsg._doc]);

      cb && cb(savedMsg._doc);
    });

    socket.on('send-menu', async storeId => {
      const store = await StoreModel.findOne({ _id: storeId })
      const categories = await cms.getModel('Category').find({ store: store._id }).lean()
      const products = await cms.getModel('Product').find({ store: store._id }).lean()
      const gSmsDevices = store.gSms.devices
      const devices = await cms.getModel('Device').find({ storeId: store._id }).lean()

      gSmsDevices.forEach(device => {
        const clientId = device._id.toString();
        getExternalSocketIoServer().emitTo(clientId, 'getNewMenu', categories, products)
        console.log(`sent new menu to ${clientId}`)
      })

      devices.forEach(device => {
        if(device.features && device.features.delivery) { //only update products if feature delivery is on
          const clientId = device._id.toString();
          getExternalSocketIoServer().emitTo(clientId, 'updateProducts', { products })

          console.log(`sent products to ${clientId}`)
        }
      })
    })

    socket.on('makeAPhoneCall', async (args, ack) => {
      let { clientId, agentId } = args;
      console.log('send makeAPhoneCall to ' + clientId)
      await getExternalSocketIoServer().emitToPersistent(clientId, 'makeAPhoneCall', [ {
        version: '0.0.1',
        clientId: `device_${clientId}`,
        agentId: agentId
      } ], 'makeAPhoneCallAck', [clientId, agentId])
    })

    socket.on('cancelCall', async (args, ack) => {
      let { clientId, agentId } = args;
      console.log('send cancelCall to ' + clientId)
      await getExternalSocketIoServer().emitToPersistent(clientId, 'cancelCall', [{}], 'cancelCallAck', [clientId, agentId])
    })

    socket.on('endCall', async (args, ack) => {
      let { clientId, agentId } = args;
      console.log('send endCall to ' + clientId)
      await getExternalSocketIoServer().emitToPersistent(clientId, 'endCall', [{}], 'endCallAck', [clientId, agentId])
    })
  });
}, 5000);

router.get('/chat/messages/not-replied', async (req, res) => {
  const lastMessages = await ChatMessageModel.aggregate([
    {$sort: {createdAt: -1}},
    {
      $lookup: {
        from: 'devices',
        let: {clientId: {$toObjectId: '$clientId'}, falseVal: false},
        pipeline: [
          {
            $match: {
              $and: [
                {$expr: {$eq: ['$_id', '$$clientId']}},
                {deleted: {$ne: true}}
              ]
            }
          },
        ],
        as: 'device',
      }
    },
    {$unwind: {path: '$device'}},
    {$group: {_id: '$clientId', fromServer: {$first: '$fromServer'}}},
    {$match: {fromServer: false}},
  ]);

  res.status(200).json({notRepliedCount: lastMessages.length});
})

router.get('/chat/messages', async (req, res) => {
  const {n = 0, offset = 0, clientId} = req.query;
  if (!clientId) return res.status(400).json({error: `'clientId' query can not be '${clientId}'`});

  const aggregationSteps = [
    {$sort: {createdAt: -1}},
    {$match: {clientId: clientId}}
  ];
  if (offset) aggregationSteps.push({$skip: +offset});
  if (n) aggregationSteps.push({$limit: +n});
  aggregationSteps.push(...[
    {
      $lookup: {
        from: 'users',
        let: {userId: {$toObjectId: '$userId'}, falseVal: false},
        pipeline: [
          {
            $match: {
                $expr: {$eq: ['$_id', '$$userId']}
            },
          },
          {$project: { "name": 1, "_id": 0 }}
        ],
        as: 'user',
      }
    },
    {$unwind: {path: '$user'}},
    {$addFields: { "username": "$user.name" }},
    {$unset: "user"}
  ]);

  try {
    const docs = await ChatMessageModel.aggregate(aggregationSteps);
    return res.status(200).json(docs);
  } catch (error) {
    return res.status(500).json({error});
  }

  // let query = ChatMessageModel.find({clientId}).sort({createdAt: -1});
  // if (offset) query = query.skip(+offset);
  // if (n) query = query.limit(+n);

  // try {
  //   const docs = await query.exec();

  //   return res.status(200).json(docs.map(({_doc}) => _doc));
  // } catch (error) {
  //   return res.status(500).json({error});
  // }
});

router.get('/chat/messages-count', async (req, res) => {
  let {clientIds, fromServer, read} = req.query;
  if (read && read !== 'true' && read !== 'false') return res.status(400).json({error: `'read' query can only be 'true' or 'false'`});
  if (fromServer && fromServer !== 'true' && fromServer !== 'false') return res.status(400).json({error: `'fromServer' query can only be 'true' or 'false'`});

  if (clientIds) clientIds = clientIds.split(',');
  else clientIds = (await DeviceModel.find({deviceType: 'gsms'})).map(({_id}) => _id);

  const result = {};
  await Promise.all(clientIds.map(async clientId => {
    result[clientId] = await ChatMessageModel.countDocuments({
      clientId,
      ...read ? {read: read === 'true'} : {},
      ...fromServer ? {fromServer: fromServer === 'true'} : {},
    });
  }));

  res.status(200).json(result);
});

router.put('/chat/set-message-read', async (req, res) => {
  const {clientId} = req.query;
  if (!clientId) return res.status(400).json({error: `'clientId' query can not be '${clientId}'`});

  await ChatMessageModel.updateMany({clientId}, {read: true});
  res.status(204).send();
});

router.post('/notes', async (req, res) => {
  let {clientId, text, userId} = req.body;

  if (!clientId || !text || !userId) return res.status(400).json({error: '3 properties are required in body request: clientId, text, userId'})

  userId = new ObjectId(userId);
  const createdAt = new Date();
  const dataToInsert = {_id: ObjectId(), text, userId, createdAt};

  const device = await DeviceModel.findById(clientId);
  if (!device) return res.status(400).json({error: `No devices found with ID ${clientId}`});

  device.notes = device.notes || [];
  device.notes.push(dataToInsert);

  await DeviceModel.updateOne({_id: device._id}, device);
  res.status(201).json(dataToInsert);
});

router.put('/assign-device/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const {
    storeId,
    /** @deprecated */
    customStoreId
  } = req.body;
  if (!deviceId) return res.status(400).json({ error: `Id can not be ${deviceId}` });
  if (!storeId && !customStoreId) return res.status(400).json({ error: `You must provide either storeId or customStoreId` });
  console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${deviceId},storeId=${storeId}`, `Assigning GSMS device to store with id ${storeId || customStoreId}`);

  try {
    const store = storeId
      ? await StoreModel.findById(storeId)
      : await StoreModel.findOne({id: customStoreId});
    if (!store) return res.status(400).json({error: `Store with ID ${storeId || customStoreId} not found`});

    const error = await assignDevice(deviceId, store)
    if (error) res.status(400).json(error)

    getExternalSocketIoServer().emitToPersistent(deviceId, 'updateStoreName', [store.name || store.settingName || store.alias]);

    getExternalSocketIoServer().emitToPersistent(deviceId, 'storeAssigned', [store.id, store.name || store.settingName, store.alias, store._id]);

    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${deviceId},storeId=${storeId || customStoreId}`,
      `Successfully assigned GSMS device to store with id ${storeId || customStoreId}`);
    res.status(204).send();
  } catch (e) {
    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${deviceId},storeId=${storeId || customStoreId}`,
      `Error assigning GSMS device to store with id ${storeId || customStoreId}`, e);
    res.status(500).send('Encountered an error while assigning store')
  }
});

// This endpoint is not only send from R+ but also from StoreManagement screen
// If this endpoint used by R+ app, { storeId } = req.body while storeId is user-friendly id of specified store
// If this endpoint used by Pos website, { storeId, notify } = req.body while storeId is user-friendly id, notify is boolean flag indicate that
// the server should notify to the device about deletion
router.put('/remove-device-store/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) return res.status(400).json({error: `deviceId can not be ${deviceId}`});
    const device = await DeviceModel.findById(deviceId);
    if (!device) return {error: `Device with ID ${deviceId} not found`};
    const { storeId, notify } = req.body;
    if (device.enableMultiStore) {
      const store = await cms.getModel('Store').findOne({id: storeId})
      if (store) {
        await removeDeviceFromStore(device, store._id)
        let currentStores = _.filter(device.storeIds, _id => _id.toString() !== store._id.toString())

        let newStoreId = device.storeId
        if (currentStores.length > 0)
          newStoreId = currentStores[0]

        if (currentStores.length === 1) {
          currentStores = null
        }

        await DeviceModel.updateOne({_id: device._id}, {
          storeIds: currentStores,
          storeId: newStoreId,
          enableMultiStore: currentStores && currentStores.length > 1,
        })
      }
    } else {
      if (device.storeId)
        await removeDeviceFromStore(device, device.storeId);
      await DeviceModel.updateOne({_id: device._id}, {storeId: null});
    }

    // TODO: remove device from StoreManagement page, then notify should be send to device
    if (notify) {

    }

    res.status(204).send();
  } catch (e) {
    console.debug('sentry:eventType=gsmsDeviceRemove', `support/remove-device-store/:deviceId has an exception: ${e.message}`)
  }
});

router.put('/assign-device-to-store/:id', async (req, res) => {
  const { id } = req.params;
  const { customStoreId } = req.body;
  if (!id) return res.status(400).json({ error: `Id can not be ${id}` });
  if (!customStoreId) return res.status(400).json({ error: `You must provide either storeId or customStoreId` });
  console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${customStoreId}`,
    `Assigning GSMS device to store with id ${customStoreId}`);

  try {
    const store = await StoreModel.findOne({id: customStoreId})
    if (!store) return res.status(400).json({error: `Store with ID ${customStoreId} not found`});

    const error = await assignDevice(id, store)
    if (error) return res.status(400).json(error)

    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${customStoreId}`,
      `Successfully assigned GSMS device to store with id ${customStoreId}`)

    res.status(200).json({
      storeId: store.id,
      storeName: store.name || store.settingName,
      storeAlias: store.alias,
      _id: store._id.toString()
    })
  } catch (e) {
    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${customStoreId}`,
      `Error assigning GSMS device to store with id ${customStoreId}`, e)
    res.status(500).send('Encountered an error while assigning store')
  }
})

async function removeDeviceFromStore(device, storeId) {
  const oldStore = await StoreModel.findById(storeId);
  if (oldStore && oldStore.gSms && oldStore.gSms.devices) {
    await StoreModel.findOneAndUpdate(
        { _id: oldStore._id },
        { $pull: { 'gSms.devices': { _id: device._id } } }
    )
  }
}

async function assignDevice(deviceId, store) {
  let device = await DeviceModel.findById(deviceId);
  if (!device) return { error: `Device with ID ${deviceId} not found` };
  if (!device.storeId) {
    device.storeId = store._id;
  } else {
    let deviceLinkToDemoStore = false
    if (device.storeId) {
      const linkedStore = await cms.getModel('Store').findOne({ _id: device.storeId })
      if (linkedStore && linkedStore.id === DEMO_STORE_ID) {
        await removeDeviceFromStore(device, linkedStore._id)
        deviceLinkToDemoStore = true
      }
    }

    let currentStores;
    if (Array.isArray(device.storeIds) && device.storeIds.length) {
      currentStores = device.storeIds
    } else {
      currentStores = deviceLinkToDemoStore ? [] : [device.storeId]
    }

    if (currentStores.indexOf(store._id) >= 0) {
      return
    }

    currentStores.push(store._id)
    if (currentStores.length > 1) {
      device.storeIds = currentStores
      device.enableMultiStore = true
    } else {
      device.storeId = currentStores[0]
      device.enableMultiStore = false
    }
  }

  device.metadata = device.metadata || {};
  device = await DeviceModel.findOneAndUpdate({ _id: deviceId }, device, { new: true });

  // add device info to specified store
  store.gSms = store.gSms || {};
  store.gSms.enabled = store.gSms.enabled || true;
  store.gSms.timeToComplete = store.gSms.timeToComplete || 30;
  store.gSms.autoAccept = store.gSms.autoAccept || true;
  store.gSms.devices = store.gSms.devices || [];

  const newGsmsDevice = Object.assign({}, device._doc,
      {
        registered: true,
        code: await getNewDeviceCode(store.id),
        total: 0,
        orders: 0,
      })

  await StoreModel.findOneAndUpdate({ _id: store._id }, {
    $push: {
      'gSms.devices': newGsmsDevice
    }
  });
}

router.put('/update-token/:id', async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  if (!id) return res.status(400).json({ error: `Id can not be ${id}` });
  if (!token) return res.status(400).json({ error: `You must provide token` });
  try {
    const updatedDevice = await DeviceModel.findOneAndUpdate({ _id: id }, { firebaseToken: token })
    if (!updatedDevice) {
      const updatedUser = await cms.getModel('User').findOneAndUpdate({_id: id}, { firebaseToken: token })
      if (!updatedUser)
        return res.status(400).json({ error: `Device ${id} not found` })
    }
    res.status(204).send()
  } catch (e) {
    res.status(500).json({error: 'Error updating device token'})
  }
})

router.put('/update-apn-token/:id', async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  if (!id || !token) return res.sendStatus(400)

  try {
    const updatedDevice = await DeviceModel.findOneAndUpdate({ _id: id }, { apnToken: token })
    if (!updatedDevice) {
      const updateUser = await cms.getModel('User').findOneAndUpdate({ _id: id }, { apnToken: token })
      if (!updateUser)
        return res.status(400).json({ error: `Device or user with "${id}" not found` })
    }
    res.status(204).send()
  } catch (e) {
    res.status(500).json({error: 'Error updating device apn token'})
  }
})

router.put('/update-os-info/:id', async (req, res) => {
  const { id } = req.params;
  const { osName, osVersion } = req.body;

  if (!id || !osName || !osVersion) return res.sendStatus(400)

  try {
    const updatedDevice = await DeviceModel.findOneAndUpdate({ _id: id }, { osName, osVersion })
    if (!updatedDevice) return res.status(400).json({ error: `Device ${id} not found` })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({error: 'Error updating device os info'})
  }
})

router.use('/voip', voipApi)

module.exports = router;
module.exports.assignDevice = assignDevice;
