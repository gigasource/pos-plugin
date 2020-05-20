const {p2pServerPlugin} = require('@gigasource/socket.io-p2p-plugin');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const ProxyServer = require('@gigasource/nodejs-proxy-server/libs/server.js');
const {remoteControlExpressServerPort, remoteControlSocketIOServerPort} = global.APP_CONFIG;
const deviceStatusSubscribers = {};
const _ = require('lodash');

const Schema = mongoose.Schema
const savedMessageSchema = new Schema({
  targetClientId: ObjectId,
  event: {
    type: String,
    trim: true,
  },
  args: Array,
  ackFnName: {
    type: String,
    trim: true,
  },
  ackFnArgs: Array,
  usageCount: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true
});

const SavedMessagesModel = mongoose.model('SocketIOSavedMessage', savedMessageSchema);

function updateMessage(targetClientId, _id, update) {
  return SavedMessagesModel.findByIdAndUpdate(_id, update).exec();
}

async function saveMessage(targetClientId, message) {
  const result = await SavedMessagesModel.create(Object.assign({targetClientId}, message));
  return result._id;
}

function deleteMessage(targetClientId, _id) {
  return SavedMessagesModel.deleteOne({_id}).exec();
}

function loadMessages(targetClientId) {
  return SavedMessagesModel.find({targetClientId});
}

module.exports = function (cms) {
  const DeviceModel = cms.getModel('Device');
  let onlineDeviceIds = [];

  const proxyServer = new ProxyServer({
    expressServerPort: remoteControlExpressServerPort,
    socketIOServerPort: remoteControlSocketIOServerPort || 8901,
    ignoreStreamError: true,
  });
  // for destroy: proxyServer.destroy();

  const {io, socket: internalSocketIOServer} = cms;
  const externalSocketIOServer = p2pServerPlugin(io, {
    clientOverwrite: true,
    saveMessage,
    loadMessages,
    deleteMessage,
    updateMessage,
  });

  function updateDeviceAndNotify(online, clientId) {
    if (online) onlineDeviceIds.push(clientId);
    else onlineDeviceIds = onlineDeviceIds.filter(e => e !== clientId);

    Object.keys(deviceStatusSubscribers).forEach(socketId => {
      const deviceWatchList = deviceStatusSubscribers[socketId]

      if (deviceWatchList && deviceWatchList.includes(clientId)) {
        internalSocketIOServer.connected[socketId].emit('updateDeviceStatus');
      }
    });
  }

  // externalSocketIOServer is Socket.io namespace for store/restaurant app to connect (use default namespace)
  externalSocketIOServer.on('connect', socket => {
    socket.on('getWebshopName', async (deviceId, callback) => {
      const DeviceModel = cms.getModel('Device');
      const StoreModel = cms.getModel('Store');

      const device = await DeviceModel.findById(deviceId);
      if (!device) return callback(null);

      const store = await StoreModel.findById(device.storeId);
      if (!store) return callback(null);

      callback(store.settingName);
    });

    socket.on('getWebshopId', async (deviceId, callback) => {
      const device = await cms.getModel('Device').findById(deviceId);
      if (!device) return callback(null);

      const store = await cms.getModel('Store').findById(device.storeId);
      if (!store) return callback(null);

      callback(store.id);
    })

    socket.on('getWebShopSettingUrl', async (deviceId, callback) => {
      const device = await cms.getModel('Device').findById(deviceId);
      if (!device) return callback(null);

      const store = await cms.getModel('Store').findById(device.storeId);
      if (!store) return callback(null);

      const user = await cms.getModel('User').findOne({ store: store._id })
      if (!user) return callback(null);
      // permissionPlugin::generateAccessToken(username: String, password: String) -> access_token: String
      const accessToken = await cms.utils.generateAccessToken(user.username,  user.password)
      if (accessToken) {
        callback && callback(`/sign-in?access_token=${accessToken}&redirect_to=/setting/${store.alias}?device=true`)
      } else {
        callback && callback(null)
      }
    })

    socket.on('getPairStatus', async (deviceId, callback) => {
      const device = await cms.getModel('Device').findById(deviceId)
      if (!device) return callback({error: 'Device not found'})
      return callback({success: true})
    })

    socket.on('getAppFeature', async (deviceId, callback) => {
      const device = await cms.getModel('Device').findById(deviceId)
      if (!device) return callback({error: 'Device not found'})
      return callback(device.features)
    })

    // TODO: analysis side fx
    socket.on('updateOrderStatus', (orderToken, orderStatus, extraInfo) => {
      internalSocketIOServer.to(orderToken).emit('updateOrderStatus', orderToken, orderStatus, extraInfo)
    })

    socket.on('updateVersion', async (appVersion, _id) => {
      const deviceInfo = await cms.getModel('Device').findOneAndUpdate({_id}, {appVersion}, {new: true});
      if (deviceInfo) internalSocketIOServer.emit('reloadStores', deviceInfo.storeId);
    })

    if (socket.request._query && socket.request._query.clientId) {
      const clientId = socket.request._query.clientId;
      updateDeviceAndNotify(true, clientId);
      socket.once('disconnect', () => updateDeviceAndNotify(false, clientId));
    }
  });

  // internalSocketIOServer is another Socket.io namespace for frontend to connect (use /app namespace)
  internalSocketIOServer.on('connect', socket => {
    let remoteControlDeviceId = null;

    socket.on('getOnlineDeviceIds', callback => callback(onlineDeviceIds));

    socket.on('getProxyInfo', callback => callback({
      proxyHost: global.APP_CONFIG.proxyHost,
      proxyRetryInterval: global.APP_CONFIG.proxyRetryInterval,
    }));

    socket.on('watchDeviceStatus', clientIdList => {
      deviceStatusSubscribers[socket.id] = _.uniq((deviceStatusSubscribers[socket.id] || []).concat(clientIdList));
    });

    socket.on('unwatchDeviceStatus', clientIdList => {
      deviceStatusSubscribers[socket.id] = _.uniq((deviceStatusSubscribers[socket.id] || []).filter(id => !clientIdList.includes(id)));
    });

    externalSocketIOServer.registerAckFunction('updateAppFeatureAck', async (device, features) => {
      const { _id, name, hardware } = device
      try {
        await cms.getModel('Device').updateOne({ _id }, { features })
        cms.socket.emit('updateAppFeatureStatus', `Updated features successfully for ${name} (${hardware || `No hardware specified`})`,
          false, Object.assign({}, device, { features }))
      } catch (e) {
        cms.socket.emit('updateAppFeatureStatus', `Encountered an error updating features for ${name} (${hardware || `No hardware specified`})`, true, null)
      }
    });

    socket.on('updateAppFeature', async (deviceId, features, cb) => {
      try {
        const device = await cms.getModel('Device').findById(deviceId).lean();
        externalSocketIOServer.emitToPersistent(deviceId, 'updateAppFeature', features, 'updateAppFeatureAck', [device, features]);
        cb(`Awaiting device feature update for ${device.name}(${device.hardware})`)
      } catch (e) {
        cb('Error emitting to device')
      }
    });

    socket.on('unpairDevice', async deviceId => {
      externalSocketIOServer.emitToPersistent(deviceId, 'unpairDevice')
    })
    socket.on('createOrder', async (storeId, orderData) => {
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({storeId, 'features.onlineOrdering': true});

      if (!device) return console.error('No store device with onlineOrdering feature found, created online order will not be saved');

      // join orderToken room
      socket.join(orderData.orderToken)

      const deviceId = device._id.toString();
      externalSocketIOServer.emitToPersistent(deviceId, 'createOrder', [orderData, new Date()]);
    });

    socket.on('updateApp', async (deviceId, uploadPath, type) => {
      externalSocketIOServer.emitToPersistent(deviceId, 'updateApp', [uploadPath, type]);
    })

    socket.on('startRemoteControl', async (deviceId, callback) => {
      if (!deviceId) {
        callback(null);
      } else {
        remoteControlDeviceId = deviceId;
        externalSocketIOServer.emitTo(deviceId, 'startRemoteControl', remoteControlSocketIOServerPort || 8901, async () => {
          const proxyPort = await proxyServer.startProxy(`${deviceId}-proxy-client`);

          if (!proxyPort) {
            externalSocketIOServer.emitTo(deviceId, 'stopRemoteControl');
            callback(null);
          } else {
            callback(proxyPort);
          }
        })
      }
    });

    socket.on('stopRemoteControl', async deviceId => {
      if (!deviceId) return
      proxyServer.stopProxy(`${deviceId}-proxy-client`);

      externalSocketIOServer.emitTo(deviceId, 'stopRemoteControl', () => {
        remoteControlDeviceId = null;
      })
    });

    socket.on('updateOrderTimeOut', async (storeId, orderTimeOut) => {
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({storeId, 'features.onlineOrdering': true});
      if (!device) return console.error('No store device with onlineOrdering feature found, created online order will not be saved');
      externalSocketIOServer.emitToPersistent(device._id.toString(), 'updateOrderTimeOut', orderTimeOut)
    });

    socket.on('startStream', async (deviceId) => {
      if (!deviceId) return
      externalSocketIOServer.emitToPersistent(deviceId, 'startStream');
    })

    socket.on('stopStream', async (deviceId) => {
      if (!deviceId) return
      externalSocketIOServer.emitToPersistent(deviceId, 'stopStream')
    })

    socket.once('disconnect', () => {
      delete deviceStatusSubscribers[socket.id]

      if (!remoteControlDeviceId) return
      proxyServer.stopProxy(`${remoteControlDeviceId}-proxy-client`);
      remoteControlDeviceId = null;
    });
  });
}
