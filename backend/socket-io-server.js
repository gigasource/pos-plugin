const {p2pServerPlugin} = require('@gigasource/socket.io-p2p-plugin');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');
const axios = require('axios');
const redisAdapter = require('socket.io-redis');
const WATCH_DEVICE_STATUS_ROOM_PREFIX = 'watch-online-status-';
const ppApiv2 = require('./api/payment/paypal/payPalApiV2Adapter')
const createPayPalClient = require('@gigasource/payment-provider/src/PayPal/backend/createPayPalClient')
const fs = require('fs')
const path = require('path')
const jsonFn = require('json-fn')
const nodemailer = require('nodemailer')
const { NOTIFICATION_ACTION_TYPE } = require('./restaurant-plus-apis/constants');
const { sendNotification } = require('./app-notification');

const Schema = mongoose.Schema
let externalSocketIOServer;

const messageSchema = new Schema({
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
messageSchema.index({createdAt: 1},{expireAfterSeconds: 30 * 86400}); // delete saved messages if not sent after 30 days
const SocketIOSavedMessagesModel = mongoose.model('SocketIOSavedMessage', messageSchema);

const SentrySavedMessagesModel = mongoose.model('SentrySavedMessage', new Schema({
  tagString: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
}))

const sendOrderTimeouts = {};
const SEND_TIMEOUT = 30000;
const SOCKET_IO_REDIS_SYNC_INTERVAL = 60 * 1000;

function updateMessage(targetClientId, _id, update) {
  return SocketIOSavedMessagesModel.findByIdAndUpdate(_id, update).exec();
}

async function saveMessage(targetClientId, message) {
  const result = await SocketIOSavedMessagesModel.create(Object.assign({targetClientId}, message));
  return result._id;
}

function deleteMessage(targetClientId, _id) {
  return SocketIOSavedMessagesModel.deleteOne({_id}).exec();
}

function loadMessages(targetClientId) {
  return SocketIOSavedMessagesModel.find({targetClientId});
}

const mailTransporter = nodemailer.createTransport({
  pool: true,
  host: APP_CONFIG.mailConfig.host,
  port: 465,
  secure: true,
  auth: {
    user: APP_CONFIG.mailConfig.user,
    pass: APP_CONFIG.mailConfig.pass
  }
})

async function sendReservationConfirmationEmail(reservation, storeId) {
  try {
    const {customer: {email, firstName, lastName, phone}, noOfGuests, date, time, note} = reservation
    const store = await cms.getModel('Store').findOne({id: storeId})
    if (!email) return

    const storeName = store.name || store.settingName;

    const locale = (store.country && store.country.locale && store.country.locale.substring(0, 2).toLowerCase()) || 'en'

    const subject = {
      'en' : `Reservation Confirm for ${storeName}`,
      'de' : `Reservierungsbestätigung für ${storeName}`
    }

    const reservationMailTemplate = {
      'en' : `<h3>Hello ${lastName},</h3> 
              <p>Thank you for making a reservation.</p>
              <p>Your reservation is recorded as follows:</p>
              <ul>
                <li>No. of guests: ${noOfGuests}</li>
                <li>Date: ${dayjs(date, 'YYYY-MM-DD').format('MMM DD YYYY')}</li>
                <li>Time: ${time}</li>
                <li>First name: ${firstName}</li>
                <li>Last name: ${lastName}</li>
                <li>Email: ${email}</li>
                <li>Phone number: ${phone}</li>
                <li>Note: ${note || ''}</li>
              </ul>
              <p>We look forward to your visit and hope we will be enjoying your meal experience at ${storeName} as much as we will be enjoying your company.</p>
              <p>For more information, please do not hesitate to contact our number directly at ${store.phone}.</p>
              <p>See you very soon,</p>
              <p>${storeName} Team</p>`,
      'de' : `<h3>Sehr geehrte/r Frau/Herr ${lastName},</h3> 
              <p>Vielen Dank für Ihre Reservierung!</p>
              <p>Ihre Reserviereung wird wie fogt aufgezeichnet:</p>
              <ul>
                <li>Gast: ${noOfGuests}</li>
                <li>Datum: ${dayjs(date, 'YYYY-MM-DD').format('MMM DD YYYY')}</li>
                <li>Zeit: ${time}</li>
                <li>Vorname: ${firstName}</li>
                <li>Nachname: ${lastName}</li>
                <li>Email: ${email}</li>
                <li>Telefonnumber: ${phone}</li>
                <li>Hinweis: ${note || ''}</li>
              </ul>
              <p>Wir freuen uns auf Ihren Besuch und hoffen, dass wir Ihr Essenserlebnis im ${storeName} genießen werden genauso wie Ihre Gesamtheit. </p>
              <p>Für weitere Infomationen bitte kontaktieren Sie uns direkt unter unserer Nummer: ${store.phone}.</p>
              <p>Bis gleich! </p>
              <p>Mit freundlichen Grüßen,</p>
              <p>${storeName} Team</p>`
    }

    const message = {
      from: 'no-reply@restaurant.live',
      to: email,
      subject: subject[locale],
      html: reservationMailTemplate[locale]
    }

    mailTransporter.sendMail(message, err => {
      if (err) console.log(err)
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports = async function (cms) {
  const DeviceModel = cms.getModel('Device');

  const {io, socket: internalSocketIOServer} = cms;
  if (global.APP_CONFIG.redis) {
    const {hosts, password} = global.APP_CONFIG.redis;
    const Redis = require("ioredis");
    const startupRedisNodes = hosts.split(',').map(host => {
      const hostInfoArr = host.split(':');
      return {
        host: hostInfoArr[0],
        port: hostInfoArr[1],
      }
    });

    const ioredisOpt = {
      redisOptions: {password}
    };

    io.adapter(redisAdapter({
      pubClient: new Redis.Cluster(startupRedisNodes, ioredisOpt),
      subClient: new Redis.Cluster(startupRedisNodes, ioredisOpt),
    })); //internalSocketIOServer will use adapter too, just need to call this once
  }

  async function updateOrderStatus(orderToken, status) {
    if (sendOrderTimeouts[orderToken]) {
      clearTimeout(sendOrderTimeouts[orderToken]);
      delete sendOrderTimeouts[orderToken]
    }

    internalSocketIOServer.to(orderToken).emit('updateOrderStatus', status)

    if (status.status === 'kitchen') {
      const {storeAlias, total} = status
      if (!storeAlias) return

      const store = await cms.getModel('Store').findOne({alias: storeAlias}).lean()
      await updateStoreReport(store._id, { orders: 1, total })
    }

    await cms.getModel('Order').findOneAndUpdate({ onlineOrderId: orderToken }, { status: status.status })
  }

  async function updateStoreReport(storeId, change) {
    const store = await cms.getModel('Store').findById(storeId).lean()
    if (!store) return

    let { lastSyncAt, prevMonthReport, currentMonthReport } = store
    const newMonth = !lastSyncAt || dayjs().isAfter(dayjs(lastSyncAt), 'month')

    if (newMonth) {
      prevMonthReport = currentMonthReport
      currentMonthReport = Object.assign({ orders: 0, total: 0, reservations: 0, orderTimeouts: 0 }, change)
    } else {
      const newVal = _.reduce(currentMonthReport, (acc, val, key) => {
        if (!change[key]) {
          return  { ...acc, [key]: val }
        }
        return {
          ...acc,
          [key]: (val || 0) + change[key]
        }
      }, {})
      currentMonthReport = Object.assign({}, currentMonthReport, newVal)
    }

    await cms.getModel('Store').findOneAndUpdate({ _id: storeId }, {
      $set: {
        lastSyncAt: new Date(), prevMonthReport, currentMonthReport
      }
    })
  }

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

  externalSocketIOServer = p2pServerPlugin(io, {
    clientOverwrite: true,
    redisClusterEnabled: true,
    saveMessage,
    loadMessages,
    deleteMessage,
    updateMessage,
  });

  // Handling node instance exit/start
  const savedSentryMessages = await SentrySavedMessagesModel.find({});
  const savedSentryMessageIds = savedSentryMessages.map(({_id}) => _id);
  await SentrySavedMessagesModel.deleteMany({_id: {$in: savedSentryMessageIds}});
  savedSentryMessages.forEach(({tagString, message}) => {
    if (tagString && message) console.debug(tagString, message);
  });

  const fn = _.once(async () => {
    const connectedSockets = externalSocketIOServer.sockets.connected;
    await Promise.all(Object.keys(connectedSockets).map(async socketId => {
      const socket = connectedSockets[socketId];
      const {clientId} = socket;

      if (clientId) return await SentrySavedMessagesModel.create({
        tagString: `sentry:clientId=${clientId},eventType=socketConnection,socketId=${socketId}`,
        message: `2a. (Startup) Client ${clientId} disconnected, socket id = ${socketId}`,
      });
    }));

    if (global.APP_CONFIG.redis) {
      // Remove all socket clients belonging to this instance stored in Redis when this instance exits/be killed
      await externalSocketIOServer.removeInstanceClients();
    }

    setTimeout(() => process.exit(), 3000);
  });

  process.on('SIGINT', fn);
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

  externalSocketIOServer.onLibLog((msg, extraInfo) => {
    let sentryTagString = 'sentry:lib=p2p-Socket.io,eventType=socketConnection';
    if (typeof extraInfo === 'object') Object.keys(extraInfo).forEach(key => sentryTagString += `,${key}=${extraInfo[key]}`);

    console.debug(sentryTagString, msg);
  });

  if (global.APP_CONFIG.redis) setInterval(() => {
    externalSocketIOServer.syncClientList()
        .then(updatedClientIdList => {
          updatedClientIdList.forEach(clientId =>
              internalSocketIOServer.to(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`).emit('updateDeviceStatus', clientId));
        });

  }, SOCKET_IO_REDIS_SYNC_INTERVAL);

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

      socket.on('updateOrderStatus', async (orderStatus, cb) => {
        const {onlineOrderId, status, paypalOrderDetail, storeName, storeAlias, responseMessage} = orderStatus
        console.debug(`sentry:orderToken=${onlineOrderId},store=${storeName},alias=${storeAlias},clientId=${clientId},eventType=orderStatus`,
            `10. Online order backend: received order status from restaurant, status = ${status}`);

        // NOTE: cashPayment may have paypalOrderDetail is empty object
        const isPaypalPayment = paypalOrderDetail && paypalOrderDetail.orderID
        const isCashPayment = !isPaypalPayment // more provider here

        // skip 'completed' status
        if (status === "completed")
          return

        if (isCashPayment)
          return updateOrderStatus(onlineOrderId, orderStatus)

        switch (status) {
          case 'declined':
            updateOrderStatus(onlineOrderId, orderStatus)
            break;
          case 'kitchen':
            if (isPaypalPayment) {
              try {
                const ppClient = await initPayPalClient(storeAlias)
                let captureResult;
                const orderDetail = (await ppApiv2.orderDetail(ppClient, paypalOrderDetail.orderID)).result
                if (orderDetail.status === "COMPLETED") {
                  captureResult = _.pick(orderDetail, ['id', 'links', 'payer', 'status'])
                  captureResult.purchase_units = orderDetail.purchase_units.map(pu => _.pick(pu, ['reference_id', 'payments']))
                } else {
                  captureResult = (await ppApiv2.captureOrder(ppClient, paypalOrderDetail.orderID)).result
                }
                console.debug(`sentry:eventType=orderStatus,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'CaptureSuccess', JSON.stringify(captureResult))
                cb && cb({result: captureResult.status, responseData: captureResult})
                updateOrderStatus(onlineOrderId, orderStatus)
              } catch (e) {
                console.debug(`sentry:eventType=orderStatus,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'CaptureError')
                cb && cb({error: e.message})
              }
            }
            break;
          case 'completed':
            //
            break;
          default:
            console.warn('Invalid order status', status)
            break;
        }
      })

      socket.on('refundOrder', async (order, cb) => {
        const {paypalOrderDetail: pp, storeAlias} = order

        // paypal payment
        if (pp && pp.orderID && pp.captureResponses) {
          try {
            const ppClient = await initPayPalClient(storeAlias)
            const orderDetail = (await ppApiv2.orderDetail(ppClient, pp.orderID)).result
            const purchaseUnits = orderDetail.purchase_units
            // get all current refund transactions
            let finalRefunds = []
            _.each(purchaseUnits, pu => {
              if (pu.payments.refunds && pu.payments.refunds.length) {
                finalRefunds.push(..._.map(pu.payments.refunds, refund => {
                  // refund.links = [{ href: '../refunds/refundId, ... }, { href: '.../captures/captureId', ... } ]
                  const captureHATEOS = refund.links[1].href
                  const captureId = captureHATEOS.substr(captureHATEOS.lastIndexOf("/") + 1)
                  return {
                    id: refund.id,
                    captureId: captureId,
                    status: refund.status
                  }
                }))
              }
            })

            // get all completed capture (not refunded) transactions
            // then try to refund
            let completedCaptures = []
            _.each(purchaseUnits, pu => {
              completedCaptures.push(..._.filter(pu.payments.captures, capture => capture.status === "COMPLETED"))
            })

            if (completedCaptures.length) {
              const refundResponses = await Promise.all(_.map(completedCaptures, capture => {
                try {
                  const refundBody = {amount: capture.amount, note_to_payer: "Order cancelled"}
                  return ppApiv2.refundOrder(ppClient, capture.id, refundBody)
                } catch (e) {
                  return {error: e.message}
                }
              }))

              const responseData = _.map(refundResponses, (response, index) => {
                if (!response || !response.result || response.result.status !== "COMPLETED")
                  return {
                    status: "ERROR",
                    detail: response.error,
                    captureId: completedCaptures[index].id
                  }
                else
                  return {
                    ..._.pick(response.result, ['id', 'status']),
                    captureId: completedCaptures[index].id
                  }
              })

              // each time we use refund api, new refund id will be returned (eventhough with the same captureId)
              // incase we retry refund the failed refund, we need to update it
              _.each(responseData, rd => {
                const oldRdIndex = _.findIndex(finalRefunds, r => r.captureId === rd.captureId)
                if (oldRdIndex === -1) {
                  finalRefunds.push(rd)
                } else {
                  finalRefunds[oldRdIndex] = rd
                }
              })
            }

            cb && cb({responseData: finalRefunds || []})
          } catch (e) {
            console.debug(`sentry:eventType=refundOrder,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'RefundError')
            cb && cb({error: e.message})
          }
        } else {
          cb && cb({error: "No refund available"})
        }
      })

      async function initPayPalClient(storeAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeAlias});
        if (!store || !store.paymentProviders || !store.paymentProviders.paypal || _.trim(store.paymentProviders.paypal.clientId) === "" || _.trim(store.paymentProviders.paypal.secretToken) === "") {
          const errMessage = "PayPal provider is not installed"
          console.debug('sentry:eventType=orderStatus,paymentType=paypal', `2. Error: ${errMessage}. Info: store_alias=${storeAlias}`)
          cb && cb({error: errMessage})
          throw errMessage
        }
        const {clientId, secretToken} = store.paymentProviders.paypal
        return createPayPalClient(clientId, secretToken)
      }

      socket.on('updateVersion', async (appVersion, _id) => {
        const deviceInfo = await cms.getModel('Device').findOneAndUpdate({_id}, {appVersion}, {new: true});
        if (deviceInfo) internalSocketIOServer.emit('reloadStores', deviceInfo.storeId);
      });

      socket.on('updateOnlineReservation', async (reservation, tag, deviceId, callback) => {
        const _id = reservation.onlineReservationId
        delete(reservation._id)
        const date = dayjs(reservation.date).format('YYYY-MM-DD')
        const time = dayjs(reservation.date).format('HH:mm')
        const device = await cms.getModel('Device').findById(deviceId)
        console.debug(`sentry:eventType=reservation,store=${device.storeId},device=${deviceId}`,
            `Online order backend: receive reservation info from device`)
        switch (tag) {
          case 'create':
            const onlineReservation = await cms.getModel('Reservation').create(Object.assign({}, reservation, {store: device.storeId, date, time}))
            callback(onlineReservation._id) //update device online reservation id
            break
          case 'update':
            await cms.getModel('Reservation').findOneAndUpdate({_id}, Object.assign({}, reservation, {date, time}))
            break
          case 'delete':
            await cms.getModel('Reservation').deleteOne({_id})
            break
          default:
            break
        }
      })
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
      const device = await cms.getModel('Device').findById(deviceId).lean();
      const store = await cms.getModel('Store').findById(device.storeId);
      let sentryTags = `sentry:clientId=${deviceId},eventType=updateAppFeature`;
      if (store) sentryTags += `,store=${store.settingName},alias=${store.alias}`;

      try {
        externalSocketIOServer.emitToPersistent(deviceId, 'updateAppFeature', features, 'updateAppFeatureAck', [device, features]);

        console.debug(sentryTags, `2. Online Order backend: Sending feature update to client with id ${deviceId}`, JSON.stringify(features));
        cb(`Awaiting device feature update for ${device.name}(${device.hardware})`);
      } catch (e) {
        console.debug(sentryTags, `2. Online Order backend: Error while sending feature update to client with id ${deviceId}`, JSON.stringify(features));
        cb('Error emitting to device');
      }
    });

    socket.on('unpairDevice', async deviceId => {
      externalSocketIOServer.emitToPersistent(deviceId, 'unpairDevice')
    })
    socket.on('createOrder', async (storeId, orderData) => {
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({storeId, 'features.onlineOrdering': true});

      const store = await cms.getModel('Store').findById(storeId)
      const storeName = store.name || store.settingName
      const storeAlias = store.alias

      let {
        orderType: type, paymentType, customer, products, totalPrice,
        createdDate, timeoutDate, shippingFee, note, orderToken, discounts, deliveryTime, paypalOrderDetail, forwardedStore
      } = orderData

      const order = {
        storeId,
        items: products.map(i => ({
          ...i,
          price: i.price.toFixed(2),
          originalPrice: i.originalPrice ? i.originalPrice.toFixed(2) : i.price.toFixed(2),
          ...i.vDiscount && { vDiscount: i.vDiscount.toFixed(2) },
          id: i.id || ''
        })),
        customer,
        deliveryDate: new Date(),
        payment: [{type: paymentType}],
        type,
        date: new Date(createdDate),
        ...timeoutDate && {timeoutDate: dayjs(timeoutDate).toDate()},
        shippingFee,
        online: true,
        note,
        onlineOrderId: orderToken,
        discounts,
        deliveryTime,
        paypalOrderDetail,
        forwardedStore,
        vSum: totalPrice
      }
      const newOrder = await cms.getModel('Order').create(order)

      if(forwardedStore) {
        const s = await cms.getModel('Store').findById(forwardedStore)
        Object.assign(orderData, { forwardedStore: s })
      }

      if (store.gSms && store.gSms.enabled) {
        //cms.emit('sendOrderMessage', storeId, orderData) // send fcm message


        function formatOrder(orderData) {
          let {orderToken, createdDate, customer, deliveryDateTime, discounts, note, orderType, paymentType, products, shippingFee, totalPrice} = _.cloneDeep(orderData)

          products = products.map(({id, modifiers, name, note, originalPrice, quantity}) => {
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

          discounts = discounts.filter(d => d.type !== 'freeShipping').reduce((sum, discount) => sum + discount.value, 0)

          customer = {
            name: customer.name,
            phone: customer.phone,
            zipCode: customer.zipCode,
            address: customer.address
          }

          return {
            orderToken,
            orderType,
            paymentType,
            customer: JSON.stringify(customer),
            products: JSON.stringify(products),
            note,
            date: createdDate,
            shippingFee,
            total: totalPrice,
            deliveryTime: deliveryDateTime,
            discounts,
            status: 'inProgress'
          }
        }

        // const demoDevices = store.gSms.devices
        // const formattedOrder = formatOrder(orderData);
        const gSmsDevices = await cms.getModel('Device').find({ storeId: store._id.toString(), deviceType: 'gsms' })
        await sendNotification(
          gSmsDevices,
          {
            title: store.name || store.settingName,
            body: `You have a new order!`
          },
          { actionType: NOTIFICATION_ACTION_TYPE.ORDER, orderId: newOrder._id.toString() },
        )

        // demoDevices.filter(i => i.registered).forEach(({_id}) => {
        //
        //   /** @deprecated */
        //   const targetClientIdOld = `${store.id}_${_id.toString()}`;
        //   externalSocketIOServer.emitToPersistent(targetClientIdOld, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total])
        //
        //   const targetClientId = _id.toString();
        //   externalSocketIOServer.emitToPersistent(targetClientId, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total])
        //   console.debug(`sentry:clientId=${targetClientId},store=${storeName},alias=${storeAlias},orderToken=${orderData.orderToken},eventType=orderStatus`,
        //       `2a. Online order backend: received order from frontend, sending to demo device`);
        // })
      }

      if (!device) {
        if (store.gSms && store.gSms.enabled) {
          // accept order on front-end
          const timeToComplete = store.gSms.timeToComplete || 30
          const locale = store.country.locale || 'en'
          const pluginPath = cms.allPlugins['pos-plugin'].pluginPath
          const localeFilePath = path.join(pluginPath, 'i18n', `${locale}.js`);
          let responseMessage = ''

          if (fs.existsSync(localeFilePath)) {
            const {[locale]: {store}} = require(localeFilePath)
            if (store && store.deliveryIn && store.pickUpIn) {
              responseMessage = (orderData.orderType === 'delivery' ? store.deliveryIn : store.pickUpIn).replace('{0}', timeToComplete)
            }
          }

          socket.join(orderData.orderToken);
          return updateOrderStatus(orderData.orderToken,
              {
                storeName, storeAlias, onlineOrderId: orderData.orderToken, status: 'inProgress',
                responseMessage, total: orderData.totalPrice - (_.sumBy(orderData.discounts, i => i.value) || 0)
              })
        }
        internalSocketIOServer.to(orderData.orderToken).emit('noOnlineOrderDevice', orderData.orderToken)
        return console.error('No store device with onlineOrdering feature found, created online order will not be saved');
      }

      const deviceId = device._id.toString();
      Object.assign(orderData, {storeName, storeAlias});

      console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
          `2. Online order backend: received order from frontend, send to device`);

      socket.join(orderData.orderToken);

      const removePersistentMsg = await externalSocketIOServer.emitToPersistent(deviceId, 'createOrder', [orderData, new Date()],
          'createOrderAck', [orderData.orderToken, storeName, storeAlias, deviceId]);

      sendOrderTimeouts[orderData.orderToken] = setTimeout(async () => {
        updateOrderStatus(orderData.orderToken, {onlineOrderId: orderData.orderToken, status: 'failedToSend'})
        console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
            `2b. Online order backend: failed to reach online order device, cancelling order`)
        removePersistentMsg()

        await updateStoreReport(storeId, { orderTimeouts: 1 })
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

    async function getCoordsByPostalCode(code, address) {
      //todo support countries
      let url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${code}|country:DE&key=${global.APP_CONFIG.mapsApiKey}`
      if (address) url += `&address=${encodeURI(address)}`
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

    socket.on('getCoordsByGoogleApi', async (zipCode, address, callback) => {
      const result = await getCoordsByPostalCode(zipCode, address)
      if (!result) return callback()
      const {latitude, longitude} = result
      callback({long: longitude, lat: latitude})
    })

    async function getReviewInGoogleMap(placeId) {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&fields=rating,review,user_ratings_total&key=${global.APP_CONFIG.mapsApiKey}`)
      const { result } = response.data
      return result
    }

    socket.on('getReviewInGoogleMap', async (placeId, callback) => {
      const result = await getReviewInGoogleMap(placeId)
      callback(result)
    })

    socket.on('createReservation', async (storeId, reservationData, callback) => {
      storeId = ObjectId(storeId);
      const store = await cms.getModel('Store').findById(storeId);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayjs(reservationData.date).day()]
      const seatLimit = store.reservationSetting.seatLimit.find(limit => (limit.startTime <= reservationData.time && limit.endTime >= reservationData.time && limit.days.includes(day)))
      let availableSeat
      if (seatLimit) {
        const reservations = await cms.getModel('Reservation').find({store: storeId, date: reservationData.date, time: {$gte: seatLimit.startTime, $lte: seatLimit.endTime}})
        availableSeat = seatLimit.seat - reservations.reduce((seat, r) => (seat + r.noOfGuests), 0)
      }
      if(availableSeat && availableSeat < reservationData.noOfGuests) {
        console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
            `2. Online order backend: not enough available seat for reservation`)
        callback({error: true})
      } else {
        const device = await DeviceModel.findOne({storeId, 'features.reservation': true});
        const reservation = await cms.getModel('Reservation').create(Object.assign({}, reservationData, {store: storeId}));
        await updateStoreReport(storeId, { reservations: reservationData.noOfGuests })

        if (device) {
          const deviceId = device._id.toString();
          await externalSocketIOServer.emitToPersistent(deviceId, 'createReservation', [{...reservationData, onlineReservationId: reservation._id}]);
          console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
              `2. Online order backend: sent reservation to device`)
        } else {
          console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
              `2. Online order backend: no device found, cancelled sending`)
        }

        if (store.gSms && store.gSms.enabled) {
          cms.emit('sendReservationMessage', storeId, reservationData)
          const demoDevices = store.gSms.devices
          demoDevices.filter(i => i.registered).forEach(({_id}) => {

            /** @deprecated */
            const targetClientIdOld = `${store.id}_${_id}`;
            externalSocketIOServer.emitToPersistent(targetClientIdOld, 'createReservation', [{ ...reservationData, _id: reservation._id }])

            const targetClientId = _id;
            externalSocketIOServer.emitToPersistent(targetClientId, 'createReservation', [{ ...reservationData, _id: reservation._id }])
            console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},deviceId=${targetClientId}`,
                `2a. Online order backend: sent reservation to demo device`)
          })
        }

        if (store.reservationSetting && store.reservationSetting.emailConfirmation) {
          sendReservationConfirmationEmail(reservationData, store.id)
        }
        callback({success: true})
      }
    })

    socket.on('updateReservationSetting', async (storeId, reservationSetting) => {
      storeId = ObjectId(storeId);
      const device = await DeviceModel.findOne({storeId, 'features.reservation': true});
      const store = await cms.getModel('Store').findById(storeId);
      if (device) {
        const deviceId = device._id.toString();
        await externalSocketIOServer.emitToPersistent(deviceId, 'updateReservationSetting', [reservationSetting]);
        console.debug(`sentry:eventType=reservationSetting,store=${store.name},alias=${store.alias}`,
            `2. Online Order backend: sent reservation setting to device id=${deviceId}`)
      } else {
        console.debug(`sentry:eventType=reservationSetting,store=${store.name},alias=${store.alias}`,
            `2. Online Order backend: no device found, cancelled sending`)
      }
    })

    socket.on('removeGSmsDevice', async (storeId, deviceId, callback = () => null) => {
      if (!storeId || !deviceId) return callback(new Error('no storeId/deviceId'))

      try {
        const {name, settingName, alias} = await cms.getModel('Store').findOne({id: storeId})
        await cms.getModel('Store').findOneAndUpdate({id: storeId}, {
          $pull: {
            'gSms.devices': {_id: deviceId}
          }
        })

        const targetClientId = `${storeId}_${deviceId}`;
        externalSocketIOServer.emitToPersistent(targetClientId, 'unregister')
        console.debug(`sentry:clientId=${targetClientId},store=${name || settingName},alias=${alias},eventType=pair`,
            `Online order: Emit event: unpair demo client ${targetClientId}, socket id = ${socket.id}`)
        cms.socket.emit('loadStore', storeId)
        callback()
      } catch (e) {
        console.log(e)
        callback(e)
      }
    })

    socket.on('removeStore', async (storeId, cb) => {
      // remove store
      await cms.getModel('Store').deleteOne({_id: storeId})

      // remove devices & unpair all
      const devices = await cms.getModel('Device').find({storeId})
      const deviceIds = devices.map(i => i._id)
      await cms.getModel('Device').deleteMany({_id: {$in: deviceIds}})
      deviceIds.forEach(i => externalSocketIOServer.emitToPersistent(i, 'unpairDevice'))

      // remove products
      await cms.getModel('Product').deleteMany({store: storeId})

      // remove discounts
      await cms.getModel('Discount').deleteMany({store: storeId})

      // remove store owner user
      const deviceRole = await cms.getModel('Role').findOne({name: 'device'})
      await cms.getModel('User').deleteOne({role: deviceRole._id, store: storeId})

      // run callback
      typeof cb === 'function' && cb()
    })

    socket.on('removeStoreGroup', async _id => {
      // check for stores in group
      const storesInGroup = await cms.getModel('Store').find({group: _id})
      if (!storesInGroup || !storesInGroup.length) {
        await cms.getModel('StoreGroup').deleteOne({_id})

        // pull from other users' store groups
        await cms.getModel('User').updateMany()

        // refresh display
        cms.socket.emit('loadStore')
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
module.exports.getExternalSocketIoServer = function () {
  return externalSocketIOServer;
}
