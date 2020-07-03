const express = require('express');
const router = express.Router();
const ChatMessageModel = cms.getModel('ChatMessage');
const DeviceModel = cms.getModel('Device');
const UserModel = cms.getModel('User');
const StoreModel = cms.getModel('Store');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const {socket: internalSocketIOServer} = cms;
const {getNewDeviceCode} = require('../demoDevice');

/*TODO: need to refactor externalSocketIoServer so that it can be reused in different files
This one is to make sure Socket.io server is initialized before executing the code but it's not clean*/
setTimeout(() => {
  getExternalSocketIoServer().on('connect', socket => {
    if (socket.request._query && socket.request._query.clientId) {
      const deviceId = socket.request._query.clientId;
      internalSocketIOServer.emit('gsms-device-connected', deviceId);

      socket.on('disconnect', () => {
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
  if (!clientId) return res.status(400).json({error: `clientId query can not be ${clientId}`});

  let query = ChatMessageModel.find({clientId}).sort({createdAt: -1});
  if (offset) query = query.skip(offset);
  if (n) query = query.limit(n);

  query.exec((error, docs) => {
    if (error) return res.status(500).json({error});

    res.status(200).json(docs.map(({_doc}) => _doc));
  });
});

router.get('/chat/unread-messages-count', async (req, res) => {
  let {clientIds, fromServer} = req.query;
  if (!clientIds) return res.status(400).json({error: `clientIds query can not be ${clientIds}`});

  clientIds = clientIds.split(',');

  const result = {};
  await Promise.all(clientIds.map(async clientId => {
    result[clientId] = await ChatMessageModel.countDocuments({clientId, read: false, fromServer});
  }));

  res.status(200).json(result);
});

router.put('/chat/set-message-read', async (req, res) => {
  const {clientId} = req.query;
  if (!clientId) return res.status(400).json({error: `clientId query can not be ${clientId}`});

  const a = await ChatMessageModel.updateMany({clientId}, {read: true});
  res.status(204).send();
});

router.put('/assign-device/:id', async (req, res) => {
  const {id} = req.params;
  const {storeId, customStoreId} = req.body;
  if (!id) return res.status(400).json({error: `Id can not be ${id}`});
  if (!storeId && !customStoreId) return res.status(400).json({error: `You must provice either storeId or customStoreId`});

  console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${storeId || customStoreId}`, `Assigning GSMS device to store with id ${storeId || customStoreId}`);

  const device = await DeviceModel.findById(id);
  if (!device) return res.status(400).json({error: `Device with ID ${id} not found`});

  if (device.storeId) {
    const oldStore = await StoreModel.findById(device.storeId);
    if (oldStore.gSms && oldStore.gSms.devices) {
      oldStore.gSms.devices = oldStore.gSms.devices.filter(e => e._id.toString() !== id);
      await StoreModel.updateOne({_id: oldStore._id}, oldStore);
    }
  }

  const store = storeId
    ? await StoreModel.findById(storeId)
    : await StoreModel.findOne({id: customStoreId});
  if (!store) return res.status(400).json({error: `Store with ID ${storeId || customStoreId} not found`});

  device.storeId = store._id;
  device.metadata = device.metadata || {};
  await DeviceModel.updateOne({_id: id}, device);

  store.gSms = store.gSms || {};
  store.gSms.enabled = store.gSms.enabled || true;
  store.gSms.timeToComplete = store.gSms.timeToComplete || 30;
  store.gSms.autoAccept = store.gSms.autoAccept || true;
  store.gSms.devices = store.gSms.devices || [];

  store.gSms.devices.push(Object.assign({}, device._doc,
      {
        registered: true,
        code: await getNewDeviceCode(store.id),
        total: 0,
        orders: 0,
      }));
  await StoreModel.updateOne({_id: store._id}, store);

  getExternalSocketIoServer().emitToPersistent(id, 'updateStoreName', [store.name || store.settingName || store.alias]).then(() => {
  });

  getExternalSocketIoServer().emitToPersistent(id, 'storeAssigned',
      [store.id, store.name || store.settingName, store.alias]).then(() => {
  });

  console.debug(`sentry:eventType=gsmsDeviceAssign,clientId=${id},storeId=${storeId}`, `Successfully assigned GSMS device to store with id ${storeId}`);
  res.status(204).send();
});

module.exports = router;
