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

/*TODO: need to refactor externalSocketIoServer so that it can be reused in different files
This one is to make sure Socket.io server is initialized before executing the code but it's not clean*/
setTimeout(() => {
  getExternalSocketIoServer().on('connect', socket => {
    async function setDemoDeviceLastSeen(deviceId) {
      const device = await DeviceModel.findById(deviceId)
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

      if (!userId) userId = (await UserModel.findOne({name: 'admin'}))._id

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

      cb && cb(savedMsg._doc);
    });

    // for devices with assigned store
    socket.on('getAllReservations', async (storeId, cb) => {
      const store = await StoreModel.findOne({id: storeId})
      if (!store) return cb([])
      const reservations = await cms.getModel('Reservation').find({store: store._id}).lean()
      cb(reservations)
    })

    socket.on('getMenu', async (storeId, cb) => {
      const store = await StoreModel.findOne({id: storeId})
      if (!store) return cb()

      const categories = await cms.getModel('Category').find({store: store._id}).lean()
      const products = await cms.getModel('Product').find({store: store._id}).lean()
      cb(categories, products)
    })

    socket.on('updateMenu', async (collection, id, value) => {
      console.log('updateMenu', collection, id, value)
      // await cms.getModel(collection).findOneAndUpdate(id, value, {upsert: true})
    })
  });

  internalSocketIOServer.on('connect', socket => {
    socket.on('watch-chat-message', clientIds => {
      clientIds.forEach(clientId => socket.join(`chatMessage-from-client-${clientId}`));
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

      console.debug(sentryTags, `Saved chat msg from online-order frontend, emit to gsms client`, sentryPayload);
      await getExternalSocketIoServer().emitToPersistent(clientId, 'chatMessage', [savedMsg._doc]);

      cb && cb(savedMsg._doc);
    });
  });
}, 5000);

router.get('/chat/messages', async (req, res) => {
  const {n = 0, offset = 0, clientId} = req.query;
  if (!clientId) return res.status(400).json({error: `'clientId' query can not be '${clientId}'`});

  let query = ChatMessageModel.find({clientId}).sort({createdAt: -1});
  if (offset) query = query.skip(+offset);
  if (n) query = query.limit(+n);

  query.exec((error, docs) => {
    if (error) return res.status(500).json({error});

    res.status(200).json(docs.map(({_doc}) => _doc));
  });
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

router.put('/assign-device/:id', async (req, res) => {
  const { id } = req.params;
  const {
    storeId,
    /** @deprecated */
    customStoreId
  } = req.body;
  if (!id) return res.status(400).json({ error: `Id can not be ${id}` });
  if (!storeId && !customStoreId) return res.status(400).json({ error: `You must provide either storeId or customStoreId` });
  console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${storeId}`, `Assigning GSMS device to store with id ${storeId || customStoreId}`);

  try {
    const store = storeId
      ? await StoreModel.findById(storeId)
      : await StoreModel.findOne({id: customStoreId});
    if (!store) return res.status(400).json({error: `Store with ID ${storeId || customStoreId} not found`});

    const error = await assignDevice(id, store)
    if (error) res.status(400).json(error)

    getExternalSocketIoServer().emitToPersistent(id, 'updateStoreName', [store.name || store.settingName || store.alias]).then();

    getExternalSocketIoServer().emitToPersistent(id, 'storeAssigned', [store.id, store.name || store.settingName, store.alias]).then();

    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${storeId || customStoreId}`,
      `Successfully assigned GSMS device to store with id ${storeId || customStoreId}`);
    res.status(204).send();
  } catch (e) {
    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${storeId || customStoreId}`,
      `Error assigning GSMS device to store with id ${storeId || customStoreId}`, e);
    res.status(500).send('Encountered an error while assigning store')
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
      storeAlias: store.alias
    })
  } catch (e) {
    debugger
    console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${customStoreId}`,
      `Error assigning GSMS device to store with id ${customStoreId}`, e)
    res.status(500).send('Encountered an error while assigning store')
  }
})

async function assignDevice(id, store) {
  const device = await DeviceModel.findById(id);
  if (!device) return { error: `Device with ID ${id} not found` };

  if (device.storeId) {
    const oldStore = await StoreModel.findById(device.storeId);
    if (oldStore.gSms && oldStore.gSms.devices) {
      await StoreModel.findOneAndUpdate(
        { _id: oldStore._id },
        { $pull: { 'gSms.devices': { _id: id } } }
      )
    }
  }

  device.storeId = store._id;
  device.metadata = device.metadata || {};
  await DeviceModel.updateOne({ _id: id }, device);

  store.gSms = store.gSms || {};
  store.gSms.enabled = store.gSms.enabled || true;
  store.gSms.timeToComplete = store.gSms.timeToComplete || 30;
  store.gSms.autoAccept = store.gSms.autoAccept || true;
  store.gSms.devices = store.gSms.devices || [];

  await StoreModel.findOneAndUpdate({ _id: store._id }, {
    $push: {
      'gSms.devices': Object.assign({}, device._doc,
        {
          registered: true,
          code: await getNewDeviceCode(store.id),
          total: 0,
          orders: 0,
        })
    }
  });
}

module.exports = router;
