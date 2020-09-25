
const mongoose = require('mongoose');

const _ = require('lodash');
const axios = require('axios');
const ppApiv2 = require('./api/payment/paypal/payPalApiV2Adapter')

const fs = require('fs')
const path = require('path')
const jsonFn = require('json-fn')
const nodemailer = require('nodemailer')

let externalSocketIOServer;




module.exports = async function (cms) {
  const DeviceModel = cms.getModel('Device');



  async function setDemoDeviceLastSeen(storeId, deviceId) {
    await cms.getModel('Store').findOneAndUpdate({id: storeId, 'gSms.devices._id': deviceId}, {
      $set: {
        'gSms.devices.$.lastSeen': new Date()
      }
    })
    cms.socket.emit('loadStore', storeId)
  }

  async function setDeviceLastSeen(deviceId) {
    const lastSeen = new Date();

    await cms.getModel('Device').updateOne({_id: deviceId}, {
      $set: {lastSeen}
    });
    cms.socket.emit('updateDeviceLastSeen', deviceId, lastSeen);
  }

  // Handling node instance exit/start
  const savedSentryMessages = await SentrySavedMessagesModel.find({});
  const savedSentryMessageIds = savedSentryMessages.map(({_id}) => _id);
  await SentrySavedMessagesModel.deleteMany({_id: {$in: savedSentryMessageIds}});
  savedSentryMessages.forEach(({tagString, message}) => {
    if (tagString && message) console.debug(tagString, message);
  });

  // ----------------------------------------

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
    console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
        `5. Online order backend: received ack from device, status = inProgress`);
    if (sendOrderTimeouts[orderToken]) {
      clearTimeout(sendOrderTimeouts[orderToken]);
      delete sendOrderTimeouts[orderToken]
    }
    updateOrderStatus(orderToken, {onlineOrderId: orderToken, status: 'inProgress'})
  });

  externalSocketIOServer.registerAckFunction('demoAppCreateOrderAck', async (storeId, deviceId, orderTotal) => {
    try {
      const store = await cms.getModel('Store').findOne({id: storeId}).lean()
      const device = store.gSms.devices.find(i => i._id.toString() === deviceId.toString())

      await cms.getModel('Store').findOneAndUpdate({id: storeId, 'gSms.devices._id': deviceId}, {
        $set: {
          'gSms.devices.$.total': (device.total || 0) + orderTotal,
          'gSms.devices.$.orders': (device.orders || 0) + 1
        }
      })
      cms.socket.emit('loadStore', storeId)
    } catch (e) {
      console.log(e)
    }
  })

  function notifyDeviceStatusChanged(clientId) {
    console.debug(`sentry:clientId=${clientId},eventType=socketConnection`, `Backend notifies frontend to update online/offline status`);
    internalSocketIOServer.to(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`).emit('updateDeviceStatus', clientId);
  }

  // externalSocketIOServer is Socket.io namespace for store/restaurant app to connect (use default namespace)
  externalSocketIOServer.on('connect', socket => {
    if (socket.request._query && socket.request._query.clientId && !socket.request._query.demo) {
      const clientId = socket.request._query.clientId;
      console.debug(`sentry:clientId=${clientId},eventType=socketConnection,socketId=${socket.id}`,
          `1a. Client ${clientId} connected, socket id = ${socket.id}`);
      setDeviceLastSeen(clientId)
      socket.emit('connection-established', socket.id);

      notifyDeviceStatusChanged(clientId);
      socket.once('disconnect', () => {
        console.debug(`sentry:clientId=${clientId},eventType=socketConnection,socketId=${socket.id}`,
            `2a. Client ${clientId} disconnected, socket id = ${socket.id}`);
        setDeviceLastSeen(clientId)
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

        callback({
          settingName: store.settingName,
          name: store.name || store.settingName,
          alias: store.alias,
          locale: store.country.locale
        });
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

      socket.on('updateVersion', async (appVersion, _id) => {
        const deviceInfo = await cms.getModel('Device').findOneAndUpdate({_id}, {appVersion}, {new: true});
        if (deviceInfo) internalSocketIOServer.emit('reloadStores', deviceInfo.storeId);
      });
    }

    /** @deprecated */
    if (socket.request._query && socket.request._query.clientId && socket.request._query.demo) {
      const clientId = socket.request._query.clientId

      console.debug(`sentry:clientId=${clientId},eventType=socketConnection,socketId=${socket.id}`,
          `Demo client ${clientId} connected, socket id = ${socket.id}`);
      const [storeId, deviceId] = clientId.split('_')
      setDemoDeviceLastSeen(storeId, deviceId)

      socket.on('disconnect', () => {
        console.debug(`sentry:clientId=${clientId},eventType=socketConnection,socketId=${socket.id}`,
            `Demo client ${clientId} disconnected, socket id = ${socket.id}`);

        const [storeId, deviceId] = clientId.split('_')
        setDemoDeviceLastSeen(storeId, deviceId)
      })

      socket.on('getAllReservations', async (storeId, cb) => {
        const store = await cms.getModel('Store').findOne({id: storeId})
        if (!store) return cb([])
        const reservations = await cms.getModel('Reservation').find({store: store._id}).lean()
        cb(reservations)
      })
    }
  });


}
module.exports.getExternalSocketIoServer = function () {
  return externalSocketIOServer;
}
