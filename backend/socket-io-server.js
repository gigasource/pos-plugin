const {p2pServerPlugin} = require('@gigasource/socket.io-p2p-plugin');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const deviceStatusSubscribers = {};
const _ = require('lodash');
const axios = require('axios');

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

  const {io, socket: internalSocketIOServer} = cms;
  const externalSocketIOServer = p2pServerPlugin(io, {
    clientOverwrite: true,
    saveMessage,
    loadMessages,
    deleteMessage,
    updateMessage,
  });

  // ack fns
  externalSocketIOServer.registerAckFunction('updateAppFeatureAck', async (device, features) => {
    const {_id, name, hardware} = device
    try {
      await cms.getModel('Device').updateOne({_id}, {features})
      cms.socket.emit('updateAppFeatureStatus', `Updated features successfully for ${name} (${hardware || `No hardware specified`})`,
          false, Object.assign({}, device, {features}))
    } catch (e) {
      cms.socket.emit('updateAppFeatureStatus', `Encountered an error updating features for ${name} (${hardware || `No hardware specified`})`, true, null)
    }
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

    socket.on('getWebShopSettingUrl', async (deviceId, locale, callback) => {
      const device = await cms.getModel('Device').findById(deviceId);
      if (!device) return callback(null);

      const store = await cms.getModel('Store').findById(device.storeId);
      if (!store) return callback(null);

      const user = await cms.getModel('User').findOne({store: store._id})
      if (!user) return callback(null);
      // permissionPlugin::generateAccessToken(username: String, password: String) -> access_token: String
      const accessToken = await cms.utils.generateAccessToken(user.username, user.password)
      if (accessToken) {
        callback && callback(`/sign-in?access_token=${accessToken}&redirect_to=/setting/${store.alias}?device=true&lang=${locale || 'en'}`)
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

    socket.on('getOnlineDeviceServices', async (deviceId, callback) => {
      try {
        const device = await cms.getModel('Device').findById(deviceId)
        if (!device) return callback({error: 'Device not found'})

        const store = await cms.getModel('Store').findById(device.storeId)
        if (!store) return callback({error: 'Store not found!'})

        const {delivery, pickup, noteToCustomers} = store

        return callback({services: {delivery, pickup, noteToCustomers}})
      } catch (error) {
        callback({error})
      }
    })

    socket.on('updateWebshopServices', async (deviceId, {delivery, pickup, noteToCustomers}, callback) => {
      try {
        const device = await cms.getModel('Device').findById(deviceId)
        if (!device) return callback({error: 'Device not found'})

        await cms.getModel('Store').findOneAndUpdate({_id: device.storeId}, {
          $set: {
            delivery,
            pickup,
            noteToCustomers
          }
        })
        callback({success: true})
      } catch (error) {
        callback({error})
      }
    })

    // TODO: analysis side fx
    socket.on('updateOrderStatus', (orderToken, orderStatus, extraInfo) => {
      console.debug(`backend received order status for order ${orderToken}`)
      internalSocketIOServer.to(orderToken).emit('updateOrderStatus', orderToken, orderStatus, extraInfo)
      console.debug(`backend emitted order status to frontend for order ${orderToken}`)
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
      proxyUrlTemplate: global.APP_CONFIG.proxyUrlTemplate,
      proxyRetryInterval: global.APP_CONFIG.proxyRetryInterval,
    }));

    socket.on('watchDeviceStatus', clientIdList => {
      deviceStatusSubscribers[socket.id] = _.uniq((deviceStatusSubscribers[socket.id] || []).concat(clientIdList));
    });

    socket.on('unwatchDeviceStatus', clientIdList => {
      deviceStatusSubscribers[socket.id] = _.uniq((deviceStatusSubscribers[socket.id] || []).filter(id => !clientIdList.includes(id)));
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
      console.debug(`joined room ${orderData.orderToken}`)

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
        let {proxyServerHost, proxyServerPort, proxyUrlTemplate} = global.APP_CONFIG;

        remoteControlDeviceId = deviceId;
        externalSocketIOServer.emitTo(deviceId, 'startRemoteControl', proxyServerHost, proxyServerPort, async () => {
          let error;

          try {
            const {proxyPort} = (await axios.post(`${proxyServerHost}:${proxyServerPort}/start-proxy?proxyClientId=${deviceId}-proxy-client`)).data;

            if (!proxyPort) error = 'No port is available for proxying';
            else callback(proxyUrlTemplate, proxyPort);
          } catch (e) {
            error = e;
          }

          if (error) {
            console.error(error);
            externalSocketIOServer.emitTo(deviceId, 'stopRemoteControl');
            callback(null);
          }
        });
      }
    });

    socket.on('stopRemoteControl', async deviceId => {
      if (!deviceId) return

      const {proxyServerHost, proxyServerPort} = global.APP_CONFIG;
      await axios.delete(`${proxyServerHost}:${proxyServerPort}/stop-proxy?proxyClientId=${deviceId}-proxy-client`);

      externalSocketIOServer.emitTo(deviceId, 'stopRemoteControl', () => remoteControlDeviceId = null);
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

    async function getCoordsByPostalCode(code) {
      //todo support countries
      const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${code}|country:DE&key=${global.APP_CONFIG.mapsApiKey}`

      const response = await axios.get(url)
      const { results } = response.data
      if (!results || !results.length) return

      const { geometry: { location: { lat: latitude, lng: longitude } } } = results[0]
      return { latitude, longitude }
    }

    function calcDistanceByCoords(fromCoords, toCoords) {
      const geolib = require('geolib')
      return geolib.getPreciseDistance(fromCoords, toCoords) / 1000   //distance in km
    }

    socket.on('getDistanceByPostalCode', async (code, fromCoords, callback) => {
      const toCoords = await getCoordsByPostalCode(code)
      if (!toCoords) callback()

      const distance = calcDistanceByCoords(fromCoords, toCoords)
      callback(distance)
    })

    socket.once('disconnect', async () => {
      delete deviceStatusSubscribers[socket.id]

      if (!remoteControlDeviceId) return

      const {proxyServerHost, proxyServerPort} = global.APP_CONFIG;
      await axios.delete(`${proxyServerHost}:${proxyServerPort}/stop-proxy?proxyClientId=${remoteControlDeviceId}-proxy-client`);
      remoteControlDeviceId = null;
    });
  });
}
