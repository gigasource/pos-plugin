const {p2pServerPlugin} = require('@gigasource/socket.io-p2p-plugin');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');
const axios = require('axios');
const redisAdapter = require('socket.io-redis');
const WATCH_DEVICE_STATUS_ROOM_PREFIX = 'watch-online-status-';
const ppApiv2 = require('./api/payment/paypal/payPalApiV2Adapter')
const createPayPalClient = require('@gigasource/payment-provider/src/PayPal/backend/createPayPalClient')

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
const sendOrderTimeouts = {};
const SEND_TIMEOUT = 30000;
const SOCKET_IO_REDIS_SYNC_INTERVAL = 60 * 1000;

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

  const {io, socket: internalSocketIOServer} = cms;

  if (global.APP_CONFIG.redis) {
    const {host, port, password} = global.APP_CONFIG.redis;
    io.adapter(redisAdapter({host, port, password})); //internalSocketIOServer will use adapter too, just need to call this once
  }

  function updateOrderStatus(orderToken, status) {
    internalSocketIOServer.to(orderToken).emit('updateOrderStatus', status)
  }

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

  externalSocketIOServer.registerAckFunction('createOrderAck', (orderToken, storeName, storeAlias, deviceId) => {
    console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId}`,
        `5. Online order backend: received ack from device, status = inProgress`);
    if (sendOrderTimeouts[orderToken]) {
      clearTimeout(sendOrderTimeouts[orderToken]);
      delete sendOrderTimeouts[orderToken]
    }
    updateOrderStatus(orderToken, {onlineOrderId: orderToken, status: 'inProgress'})
  });

  function notifyDeviceStatusChanged(clientId) {
    console.debug(`sentry:clientId=${clientId},eventType=socketConnection`, `Backend notifies frontend to update online/offline status`);
    internalSocketIOServer.to(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`).emit('updateDeviceStatus', clientId);
  }

  externalSocketIOServer.onLibLog((msg, extraInfo) => {
    let sentryTagString = 'sentry:lib=p2p-Socket.io,eventType=socketConnection';
    if (typeof extraInfo === 'object') Object.keys(extraInfo).forEach(key => sentryTagString += `,${key}=${extraInfo[key]}`);

    console.debug(sentryTagString, msg);
  });

  if (global.APP_CONFIG.redis) setInterval(() => externalSocketIOServer.syncClientList(), SOCKET_IO_REDIS_SYNC_INTERVAL);

  // externalSocketIOServer is Socket.io namespace for store/restaurant app to connect (use default namespace)
  externalSocketIOServer.on('connect', socket => {
    if (socket.request._query && socket.request._query.clientId) {
      const clientId = socket.request._query.clientId;
      console.debug(`sentry:clientId=${clientId},eventType=socketConnection`, `Client ${clientId} connected`);

      notifyDeviceStatusChanged(clientId);
      socket.once('disconnect', () => {
        /*
          if Redis adapter is used, clientId removal on Redis server is delayed for 3 seconds to avoid bug
          (this behavior is in @gigasource/socket.io-p2p-plugin package, check redis.js file),
          therefore notifyDeviceStatusChanged is delayed for 5 seconds
        */
        console.debug(`sentry:clientId=${clientId},eventType=socketConnection`, `Client ${clientId} disconnected`);
        if (global.APP_CONFIG.redis) {
          // delay a little to give time for updating client list on Redis
          setTimeout(() => notifyDeviceStatusChanged(clientId), 2000);
        } else {
          notifyDeviceStatusChanged(clientId);
        }
      });

      socket.on('getWebshopName', async (deviceId, callback) => {
        const DeviceModel = cms.getModel('Device');
        const StoreModel = cms.getModel('Store');

        const device = await DeviceModel.findById(deviceId);
        if (!device) return callback(null);

        const store = await StoreModel.findById(device.storeId);
        if (!store) return callback(null);

        callback({settingName: store.settingName, name: store.name, alias: store.alias});
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
      socket.on('updateOrderStatus', async (orderStatus) => {
        const {onlineOrderId, status, paypalOrderDetail, storeName, storeAlias} = orderStatus
        console.debug(`sentry:orderToken=${onlineOrderId},store=${storeName},alias=${storeAlias},clientId=${clientId}`,
            `10. Online order backend: received order status from restaurant, status = ${status}`);

        if (status === 'completed') {
          if (paypalOrderDetail) {
            const store = await cms.getModel('Store').findOne({alias: storeAlias})
            if (!store) {
              // store information is missing, so order will not be processed
              console.debug(`sentry:updateOrderStatus->captureOrder: Cannot find store for current order. Info: alias=${storeAlias}`)
              return;
            }

            try {
              const ppClient = createPayPalClient(
                  store.paymentProviders.paypal.clientId,
                  store.paymentProviders.paypal.secretToken)
              await ppApiv2.captureOrder(ppClient, paypalOrderDetail.orderID, true)
              console.debug('sentry:updateOrderStatus->captureOrder', 'completed -> captureOrder has been called.')
            } catch (e) {
              console.debug('sentry:updateOrderStatus->captureOrder', 'exception')
            }
          }
        } else {
          updateOrderStatus(onlineOrderId, orderStatus)
        }
      })

      socket.on('updateVersion', async (appVersion, _id) => {
        const deviceInfo = await cms.getModel('Device').findOneAndUpdate({_id}, {appVersion}, {new: true});
        if (deviceInfo) internalSocketIOServer.emit('reloadStores', deviceInfo.storeId);
      });
    }
  });

  // internalSocketIOServer is another Socket.io namespace for frontend to connect (use /app namespace)
  internalSocketIOServer.on('connect', socket => {
    let remoteControlDeviceId = null;

    socket.on('getOnlineDeviceIds', async callback => {
      if (global.APP_CONFIG.redis) {
        try {
          const clusterClientList = await externalSocketIOServer.getClusterClientIds();
          return callback(Array.from(clusterClientList));
        } catch (e) {
          console.error(e);
        }
      }

      callback(externalSocketIOServer.getAllClientId());
    });

    socket.on('getProxyInfo', callback => callback({
      proxyUrlTemplate: global.APP_CONFIG.proxyUrlTemplate,
      proxyRetryInterval: global.APP_CONFIG.proxyRetryInterval,
    }));

    socket.on('watchDeviceStatus', clientIdList => clientIdList.forEach(clientId => socket.join(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`)));
    socket.on('unwatchDeviceStatus', clientIdList => clientIdList.forEach(clientId => socket.leave(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`)));

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

      if (!device) {
        internalSocketIOServer.to(orderData.orderToken).emit('noOnlineOrderDevice', orderData.orderToken)
        return console.error('No store device with onlineOrdering feature found, created online order will not be saved');
      }

      const deviceId = device._id.toString();
      const {name: storeName, alias: storeAlias} = await cms.getModel('Store').findById(storeId);
      Object.assign(orderData, {storeName, storeAlias});

      cms.emit('sendOrderMessage', storeId, orderData) // send fcm message
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId}`,
          `2. Online order backend: received order from frontend, send to device`);

      socket.join(orderData.orderToken);

      const removePersistentMsg = await externalSocketIOServer.emitToPersistent(deviceId, 'createOrder', [orderData, new Date()],
          'createOrderAck', [orderData.orderToken, storeName, storeAlias, deviceId]);

      sendOrderTimeouts[orderData.orderToken] = setTimeout(() => {
        updateOrderStatus(orderData.orderToken, {onlineOrderId: orderData.orderToken, status: 'failedToSend'})
        removePersistentMsg()
      }, SEND_TIMEOUT);
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

            if (!proxyPort) {
              error = 'No port is available for proxying';
            } else {
              callback(proxyUrlTemplate, proxyPort);
            }
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
      const {results} = response.data
      if (!results || !results.length) return

      const {geometry: {location: {lat: latitude, lng: longitude}}} = results[0]
      return {latitude, longitude}
    }

    socket.on('getDistanceByPostalCode', async (code, fromCoords, callback) => {
      const toCoords = await getCoordsByPostalCode(code)
      if (!toCoords || !fromCoords) return callback()

      const geolib = require('geolib')
      const distance = geolib.getPreciseDistance(fromCoords, toCoords) / 1000   //distance in km
      callback(distance)
    })

    socket.on('createReservation', async (storeId, reservationData) => {
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({storeId, 'features.reservation': true});
      if (device) {
        const deviceId = device._id.toString();
        await externalSocketIOServer.emitToPersistent(deviceId, 'createReservation', [reservationData]);
      }
    })

    socket.on('updateReservationSetting', async (storeId, reservationSetting) => {
      console.log(reservationSetting)
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({ storeId, 'features.reservation': true });
      if (device) {
        const deviceId = device._id.toString();
        await externalSocketIOServer.emitToPersistent(deviceId, 'updateReservationSetting', [reservationSetting]);
      }
    })

    socket.once('disconnect', async () => {
      if (!remoteControlDeviceId) return

      const {proxyServerHost, proxyServerPort} = global.APP_CONFIG;
      await axios.delete(`${proxyServerHost}:${proxyServerPort}/stop-proxy?proxyClientId=${remoteControlDeviceId}-proxy-client`);
      remoteControlDeviceId = null;
    });
  });
}
