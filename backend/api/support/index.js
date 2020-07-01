const express = require('express');
const router = express.Router();
const ChatMessageModel = cms.getModel('ChatMessage');
const DeviceModel = cms.getModel('Device');
const UserModel = cms.getModel('User');
const StoreModel = cms.getModel('Store');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const {socket: internalSocketIOServer} = cms;

/*TODO: need to refactor externalSocketIoServer so that it can be reused in different files
This one is to make sure Socket.io server is initialized before executing the code but it's not clean*/
setTimeout(() => {
  getExternalSocketIoServer().on('connect', socket => {
    socket.on('chat-message', async (chatData, cb) => {
      let {clientId, userId, createdAt, text} = chatData;
      createdAt = new Date(createdAt); // createdAt will be String
      const sentryTags = `sentry:eventType:supportChat,clientId=${clientId}`;
      const sentryPayload = JSON.stringify(chatData, null, 2);

      const serverUser = await UserModel.findById(userId);
      if (!serverUser) return console.error(sentryTags, `No user found with id ${userId}`, sentryPayload);

      internalSocketIOServer.in(`chatMessage-from-client-${clientId}`).emit('chatMessage', {text, createdAt});

      const savedMsg = await ChatMessageModel.create({clientId, userId, createdAt, text, read: false, fromServer: false});
      cb && cb(savedMsg);
    });
  });

  internalSocketIOServer.on('connect', socket => {
    socket.on('chat-message', async (chatData, cb) => {
      let {clientId, userId, createdAt, text} = chatData;
      createdAt = new Date(createdAt); // createdAt will be String
      const sentryTags = `sentry:eventType:supportChat,clientId=${clientId}`;
      const sentryPayload = JSON.stringify(chatData, null, 2);

      const receiverDevice = await DeviceModel.findById(clientId);
      if (!receiverDevice) return console.error(sentryTags, `No device found with id ${clientId}`, sentryPayload);

      await getExternalSocketIoServer().emitToPersistent(clientId, 'chatMessage', {clientId, userId, createdAt, text, fromServer: true});
      const savedMsg = await ChatMessageModel.create({clientId, userId, createdAt, text, read: false, fromServer: true});
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

router.put('/assign-device/:id', async (req, res) => {
  const {id} = req.params;
  const {storeId} = req.body;
  if (!id) return res.status(400).json({error: `Id can not be ${id}`});

  const device = await DeviceModel.findById(id);
  if (!device) return res.status(400).json({error: `Device with ID ${id} not found`});

  const store = await StoreModel.findById(id);
  if (!store) return res.status(400).json({error: `Store with ID ${storeId} not found`});

  device.storeId = storeId;
  device.metadata = device.metadata || {};
  await DeviceModel.updateOne({_id: id}, device);

  store.gSms = store.gSms || {
    enabled: true,
    timeToComplete: 30,
    autoAccept: true,
    devices: [],
  };

  store.gSms.devices.push(device._doc);
  await StoreModel.updateOne({_id: storeId}, store);

  res.status(204).send();
});

module.exports = router;
