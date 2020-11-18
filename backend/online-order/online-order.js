const {calOrderDiscount, calOrderModifier, calOrderTax, calOrderTotal, formatOrderItems, getLatestOrderId, getLatestDailyId} = require('../../components/logic/orderUtil')
const {getBookingNumber, getVDate} = require('../../components/logic/productUtils')
const _ = require('lodash')
const io = require('socket.io-client');
const ProxyClient = require('@gigasource/nodejs-proxy-server/libs/client.js');
const axios = require('axios');
const dayjs = require('dayjs');
const schedule = require('node-schedule');
const { initSocket, handleNewMasterId } = require('../master-node');
const { importDemoData } = require('../demo-data/socket-handler');
const rnBridge = require('../rn-bridge/app-rn-bridge')
const fs = require('fs')
const path = require('path')
const url = require('url')

let webshopUrl;
let storeName;
let storeAlias;
let reservationJobs = {};

let {webshopUrl: webshopUrlFromConfig, port: backendPort} = global.APP_CONFIG;
let onlineOrderSocket = null;
let proxyClient = null;
let activeProxies = 0;
let webShopConnected = false;


const RECREATE_INTERVAL = 60000; // socket.io will try to recreate client socket every 60 seconds if current socket disconnects or fails to reconnects too many times
const NO_OF_ATTEMPT_BEFORE_RECREATE = 5; // if number of 'reconnecting' attempt > 5, recreate interval will be triggered
let recreateOnlineOrderSocketInterval = null;
let initFinished = false;
const {saveDisconnectMessage, sendSavedMessages} = require('./sentry-saved-messages');

module.exports = async cms => {
  sendSavedMessages();

  const fn = _.once(async () => {
    //if (process.platform === 'darwin') return process.exit();
    if (onlineOrderSocket && onlineOrderSocket.connected) {
      try {
        await saveDisconnectMessage(onlineOrderSocket);
      } catch (e) {
        console.error(e)
      }
      process.exit();
    } else {
      process.exit();
    }
  });

  process.on('SIGINT', fn);

  async function getWebShopUrl() {
    const posSetting = await cms.getModel('PosSetting').findOne()

    webshopUrl = posSetting.customServerUrl ? posSetting.customServerUrl : webshopUrlFromConfig;
    return webshopUrl
  }

  function getBaseSentryTags(eventType) {
    const appVersion = require('../../package').version;
    const {deviceName} = global.APP_CONFIG;

    let tag = `sentry:webshopUrl=${webshopUrl},store=${storeName},alias=${storeAlias},version=${appVersion},deviceName=${deviceName},eventType=${eventType}`;
    if (onlineOrderSocket && onlineOrderSocket.clientId) tag += `,clientId=${onlineOrderSocket.clientId}`;

    return tag;
  }

  async function updateAlwaysOn(enabled) {
    if (!/^android/.test(process.platform)) return;
    console.log("Updating always on");
    try {
      await axios.post(`http://localhost:5000/update-alwayson-status`, {enabled})
    } catch (e) {
      console.error(e);
    }
  }

  async function updateStartOnBoot(enabled) {
    if (!/^android/.test(process.platform)) return;
    try {
      await axios.post(`http://localhost:5000/update-startonboot-status`, {enabled})
    } catch (e) {
      console.error(e);
    }
  }

  function startSocketRecreateInterval() {
    if (!recreateOnlineOrderSocketInterval) {
      console.debug(getBaseSentryTags('socketConnection'), 'start recreateOnlineOrderSocketInterval');

      recreateOnlineOrderSocketInterval = setInterval(async () => {
        const deviceId = await getDeviceId();
        const sentryTags = getBaseSentryTags('socketConnection') + `,clientId=${deviceId}`;

        try {
          await axios.get(`${webshopUrl}/health-check`);
          console.debug(sentryTags, 'recreate online order socket in recreateOnlineOrderSocketInterval');
        } catch (e) {
          console.debug(sentryTags, 'Could not reach webshop in recreateOnlineOrderSocketInterval', e.stack);
        }

        if (deviceId) await createOnlineOrderSocket(deviceId);
      }, RECREATE_INTERVAL);
    }
  }

  function stopSocketRecreateInterval() {
    if (recreateOnlineOrderSocketInterval) {
      getDeviceId().then(deviceId => {
        const sentryTags = getBaseSentryTags('socketConnection') + `,clientId=${deviceId}`;
        console.debug(sentryTags, 'stop recreateOnlineOrderSocketInterval');
      });

      clearInterval(recreateOnlineOrderSocketInterval);
      recreateOnlineOrderSocketInterval = null;
    }
  }

  function cancelRemoveReservationJob(reservation) {
    if (!reservation) return
    const guestName = reservation.customer.name;
    const reservationTime = dayjs(reservation.date).format('HH:mm')

    if (reservationJobs[reservation._id]) {
      reservationJobs[reservation._id].cancel()
      delete reservationJobs[reservation._id]
      console.debug(`${getBaseSentryTags('reservation')},reservation`, `Restaurant: cancelled scheduler job for reservation guest '${guestName}' (${reservationTime})`)
    }
  }

  async function scheduleRemoveReservationJob(reservation) {
    async function declineReservation() {
      const res = await cms.getModel('Reservation').findById(reservation._id)
      if (res.status !== 'declined') {
        res.status = 'declined'
        await cms.getModel('Reservation').updateOne({_id: reservation._id}, res) // update db
      }
      delete reservationJobs[reservationId] // remove cached job
      console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`, `Restaurant: auto-declined reservation ${guestName} (${reservationTime})`)
      cms.socket.emit('updateReservationList', getBaseSentryTags('reservation'))
      console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`, `Restaurant backend: signalled 'updateReservationList' front-end to fetch data`)
      cms.socket.emit('updateOnlineReservation', reservation._id, 'delete')
    }

    if (!reservation) return

    const reservationId = reservation._id;
    const guestName = reservation.customer.name;
    const reservationTime = dayjs(reservation.date).format('HH:mm')
    const posSettings = await cms.getModel('PosSetting').findOne()
    const timeout = posSettings.reservation && posSettings.reservation.removeOverdueAfter
        ? posSettings.reservation.removeOverdueAfter : 0 // fallback to 0 timeout (no auto-decline)

    if (timeout === 0) { // do not auto-decline, cancel job and return
      return cancelRemoveReservationJob(reservation)
    }

    const timeoutDateTime = dayjs(reservation.date).add(timeout, 'minute').toDate()

    const execNow = dayjs().isAfter(timeoutDateTime)
    if (execNow) { // exec now
      await declineReservation()
      // check existing jobs and delete them
      return cancelRemoveReservationJob(reservation)
    }

    // check existing jobs and reschedule
    if (reservationJobs[reservationId]) {
      const rescheduleSuccess = schedule.rescheduleJob(reservationJobs[reservationId], timeoutDateTime)

      return console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`,
          rescheduleSuccess
              ? `Restaurant: Reschedule successful for guest '${guestName}' at ${timeoutDateTime}`
              : `Restaurant: Reschedule failed for guest '${guestName}' at ${timeoutDateTime}`
      )
    }
    // else start job
    reservationJobs[reservationId] = schedule.scheduleJob(timeoutDateTime, declineReservation)
    console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`, `Restaurant: scheduled reservation decline for guest '${guestName}' (${reservationTime}) at ${timeoutDateTime}`)
  }

  async function initReservationSchedules() {
    // fetch all pending reservations
    let pendingReservations = await cms.getModel('Reservation').find({status: 'pending'}).lean()
    // cancel if device is not registered
    const posSettings = await cms.getModel('PosSetting').findOne()
    if (!posSettings.onlineDevice.id) {
      return await cms.getModel('Reservation').updateMany({ _id: { $in: pendingReservations.map(i => i._id) } }, { status: 'declined' })
    }
    // start jobs
    console.debug(getBaseSentryTags('reservation'), `Restaurant: scheduling Reservation jobs on init`)
    pendingReservations.forEach(res => {
      scheduleRemoveReservationJob(res)
    })
  }

  function createOnlineOrderListeners(socket, deviceId) {
    // event logs for debugging
    const sentryTags = getBaseSentryTags('socketConnection') + `,clientId=${deviceId},clientSocketId=${socket.id}`;
    console.debug(sentryTags, 'Creating onlineOrderSocket');

    // onlineOrderSocket.clientId = deviceId
    socket.clientId = deviceId;
    socket.on('connect', () => console.debug(sentryTags, 'onlineOrderSocket connected'));
    socket.on('disconnect', () => socket.serverSocketId
        ? console.debug(sentryTags + `,socketId=${socket.serverSocketId}`, '2b. onlineOrderSocket disconnected')
        : console.debug(sentryTags, 'onlineOrderSocket disconnected'));
    socket.on('reconnecting', numberOfAttempt => console.debug(sentryTags, `onlineOrderSocket reconnecting, attempt: ${numberOfAttempt}`));
    socket.on('reconnect', () => console.debug(sentryTags, 'onlineOrderSocket reconnected'));
    socket.on('reconnect_error', err => console.debug(sentryTags, `onlineOrderSocket reconnect error: ` + err.stack));
    socket.on('connection-established', socketId => {
      socket.serverSocketId = socketId;
      console.debug(sentryTags + `,socketId=${socket.serverSocketId}`, '1b. onlineOrderSocket connected');
    });

    // connection related logic
    socket.on('SERVER_PING', callback => callback(`pong from client ${deviceId}`));
    socket.on('connect', async () => {
      stopSocketRecreateInterval();

      webShopConnected = true
      cms.socket.emit('webShopConnected');
      const posSetting = await cms.getModel('PosSetting').findOne()
      const {onlineDevice: {store: {name, alias}}} = posSetting
      console.debug(`sentry:onConnect=true,store=${name}`, `Value of shouldUpdate: ${cms.utils.getShouldUpdateApp()}`)
      if (cms.utils.getShouldUpdateApp()) socket.emit('updateVersion', require('../../package').version, deviceId);
    });

    socket.on('reconnect', () => {
      stopSocketRecreateInterval();

      webShopConnected = true
      cms.socket.emit('webShopConnected')
    });

    socket.on('disconnect', () => {
      startSocketRecreateInterval();
      webShopConnected = false
      cms.socket.emit('webShopDisconnected')

      activeProxies = 0;
      if (proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }
    });

    socket.on('reconnecting', numberOfAttempt => {
      if (numberOfAttempt > NO_OF_ATTEMPT_BEFORE_RECREATE) startSocketRecreateInterval();
    });

    // listeners for features
    async function scheduleDeclineOrder(date, _id, cb) {
      const timeOut = dayjs(date).diff(dayjs(), 'millisecond')

      setTimeout(async () => {
        let model = cms.getModel('Order');
        const order = await model.findOne({_id})
        if (order && order.status !== 'inProgress') return

        await model.findOneAndUpdate({_id}, {status: 'declined'})
        cb()
      }, timeOut)
    }

    socket.on('createOrder', async (orderData, serverDateTime, ackFn) => {
      if (!orderData) return

      const newOrderId = await getLatestOrderId()
      const dailyId = await getLatestDailyId()

      let {
        orderType: type, paymentType, customer, products: items,
        createdDate, timeoutDate, shippingFee, note, orderToken, discounts, deliveryTime, paypalOrderDetail, forwardedStore
      } = orderData

      console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${orderData.orderToken},orderId=${newOrderId}`,
          `3. Restaurant backend: Order id ${newOrderId}: received order from online-order`, JSON.stringify(items));

      items = items.map(item => {
        if (item.originalPrice) return item;
        return {originalPrice: item.price, ...item};
      });
      const date = new Date(createdDate)
      const vDiscount = calOrderDiscount(items).toFixed(2)
      const vSum = (calOrderTotal(items) + calOrderModifier(items) + shippingFee).toFixed(2)
      const vTax = calOrderTax(items).toFixed(2)
      const taxGroups = _.groupBy(items, 'tax')
      const vTaxGroups = _.map(taxGroups, (val, key) => ({
        taxType: key,
        tax: calOrderTax(val).toFixed(2),
        sum: calOrderTotal(val).toFixed(2)
      }))

      const order = {
        dailyId,
        id: newOrderId,
        status: 'inProgress',
        items: formatOrderItems(items),
        customer,
        deliveryDate: new Date(),
        payment: [{type: paymentType, value: vSum}],
        type,
        date,
        ...timeoutDate && {timeoutDate: dayjs(timeoutDate).toDate()},
        vDate: await getVDate(date),
        bookingNumber: getBookingNumber(date),
        shippingFee,
        vSum,
        vTax,
        vTaxGroups,
        vDiscount,
        received: vSum,
        online: true,
        note,
        onlineOrderId: orderToken,
        discounts,
        deliveryTime,
        paypalOrderDetail,
        forwardedStore: forwardedStore && (forwardedStore.name || forwardedStore.settingName)
      }

      const result = await cms.getModel('Order').create(order)
      cms.socket.emit('updateOnlineOrders', getBaseSentryTags('orderStatus') + `,orderToken=${orderData.orderToken},orderId=${newOrderId}`)
      cms.socket.emit('updateOnlineOrderCounter')

      if (timeoutDate) {
        await scheduleDeclineOrder(timeoutDate, result._id, () => {
          cms.socket.emit('updateOnlineOrders', getBaseSentryTags('orderStatus') + `,orderToken=${orderData.orderToken},orderId=${newOrderId}`)
        })
      }

      console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${orderData.orderToken},orderId=${newOrderId}`,
          `4. Restaurant backend: Order id ${newOrderId}: send ack fn to online-order`)
      ackFn();
    });

    socket.on('updateReservationSetting', async (reservationSetting, ackFn) => {
      console.debug(getBaseSentryTags('reservationSetting'),
          `1. Restaurant backend: received reservation setting:`, JSON.stringify(reservationSetting))
      await cms.getModel('PosSetting').findOneAndUpdate({}, {reservation: reservationSetting})
      cms.socket.emit('updateReservationList')
      console.debug(getBaseSentryTags('reservationSetting'),
          `2. Restaurant backend: signalled 'updateReservationList' front-end to fetch reservation data`)

      typeof ackFn === 'function' && ackFn()

      // reschedule existing jobs
      const pendingReservations = await cms.getModel('Reservation').find({status: 'pending'}).lean()
      if (pendingReservations && pendingReservations.length) {
        pendingReservations.forEach(res => scheduleRemoveReservationJob(res))
      }
    })

    socket.on('createReservation', async (reservationData, ackFn) => {
      console.debug(getBaseSentryTags('reservation'),
          `1. Restaurant backend: received reservation:
        guests:${reservationData.noOfGuests};date:${reservationData.date};time:${reservationData.time};
        customer:${reservationData.customer.name || 'no name'},${reservationData.customer.email || 'no email'},${reservationData.customer.phone || 'no phone'};
        note:${reservationData.note}`)

      try {
        const {date, time} = reservationData
        const [hour, minute] = time.split(':')
        const reservation = await cms.getModel('Reservation').create(Object.assign({}, reservationData, {
          date: dayjs(date, 'YYYY-MM-DD').hour(hour).minute(minute).toDate(),
          status: 'pending'
        }))
        cms.socket.emit('updateReservationList', getBaseSentryTags('reservation'))
        console.debug(getBaseSentryTags('reservation'),
            `2. Restaurant backend: signalled 'updateReservationList' front-end to fetch data`)
        typeof ackFn === 'function' && ackFn()

        await scheduleRemoveReservationJob(reservation) // create auto-decline job & start job

        cms.socket.emit('ringReservationBell')
      } catch (e) {
        console.log(e)
      }
    })

    socket.on('updateAppFeature', async (data, callback) => {
      await Promise.all(_.map(data, async (enabled, name) => {
        if (name === 'alwaysOn') {
          const oldAlwaysOnValue = await cms.getModel('Feature').findOne({name})
          console.log(oldAlwaysOnValue.enabled);
          if (oldAlwaysOnValue.enabled != enabled) {
            await updateAlwaysOn(enabled)
          }
        }
        if (name === 'startOnBoot') {
          await updateStartOnBoot(enabled)
        }
        return await cms.getModel('Feature').updateOne({name}, {$set: {enabled}}, {upsert: true})
      }))

      console.debug(getBaseSentryTags('updateAppFeature'), '3. Restaurant backend: received feature update from server, emitting to frontend', JSON.stringify(data));

      cms.socket.emit('updateAppFeature', sentryTags, data);
      callback();
    });
    socket.on('unpairDevice', async cb => {
      await unregisterOnlineOrderDevice()
      cms.socket.emit('unpairDevice')
      cms.socket.emit('denySignIn')
      cb();
    });
    socket.on('startRemoteControl', async (proxyServerHost, proxyServerPort, callback) => {
      activeProxies++;

      if (!proxyClient) {
        proxyClient = new ProxyClient({
          clientId: `${deviceId}-proxy-client`,
          proxyServerHost,
          socketIOPort: proxyServerPort,
          remoteHost: 'localhost',
          remotePort: backendPort,
          remoteSocketKeepAlive: true,
          onConnect: callback,
        });
      } else {
        callback();
      }
    });
    socket.on('stopRemoteControl', callback => {
      if (activeProxies > 0) activeProxies--;

      if (activeProxies === 0 && proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }

      if (typeof callback === 'function') callback();
    });
    socket.on('updateApp', async (uploadPath, type, ackFn) => {
      try {
        const posSetting = await cms.getModel('PosSetting').findOne();
        const {onlineDevice} = posSetting;
        const {store: {name, alias}} = onlineDevice;

        console.log(`sentry:clientId=${onlineDevice.id},eventType=updateApp`, `Updating ${uploadPath}`);

        rnBridge.sendToRN(JSON.stringify({
          action: 'updateApp',
          downlink: uploadPath,
          type,
          store: (name ? name : ''),
          clientID: onlineDevice.id,
        }))
      } catch (e) {
        console.error('Update app error or this is not an android device');
      }

      ackFn();
    });
    socket.on('startStream', async (cb) => {
      try {
        console.log('on start stream')
        rnBridge.sendToRN(JSON.stringify({
          action: 'startStream',
          data: {
            screencastId: deviceId
          }
        }))
      } catch (e) {
        console.log('start stream error', e);
      }
      cb && cb()
    });
    socket.on('stopStream', async (cb) => {
      try {
        console.log('on stop stream')
        rnBridge.sendToRN(JSON.stringify({
          action: 'stopStream'
        }))
      } catch (e) {
        console.log('stop stream error', e)
      }
      cb && cb()
    });
    socket.on('updateMasterDevice', async (masterClientId, ack) => {
      // set masterClientId
      // newMasterClientId is always different from the old one
      await cms.getModel("PosSetting").findOneAndUpdate({}, { masterClientId });
      cms.socket.emit('getMasterDevice', masterClientId)
      if (ack) ack();
      //await cms.execPostAsync('load:syncDbHook'); //todo uncomment
      await handleNewMasterId(socket);
    })

    socket.on('updateProducts', async (data) => {
      const { products } = data
      if(!products || !Array.isArray(products)) return
      const ProductModel = cms.getModel('Product')
      await ProductModel.deleteMany({
        type: 'delivery'
      })
      await ProductModel.create(products.map(p => ({
        ...p,
        type: 'delivery',
        option: {
          favorite: !!p.mark.favorite
        },
        groupPrinter: p.groupPrinters[0],
        groupPrinter2: p.groupPrinters[1],
      })))
    })

    socket.on('approveSignIn_v2', async (response, ack) => {
      console.log('approveSignIn_v2')
      const { clientId: deviceId, storeId, storeAlias: alias, storeName: name, storeLocale: locale, isFirstDevice } = response
      await cms.getModel('PosSetting').findOneAndUpdate({}, {
        $set: {
          'onlineDevice.store': {
            id: storeId,
            name,
            alias,
            locale
          },
          signInRequest: null
        }
      })

      storeName = name
      storeAlias = alias

      console.log('getAppFeature')
      onlineOrderSocket.emit('getAppFeature', deviceId, async data => {
        await Promise.all(_.map(data, async (enabled, name) => {
          return await cms.getModel('Feature').updateOne({ name }, { $set: { enabled } }, { upsert: true })
        }))
        socket.emit('updateAppFeature')
      })

      onlineOrderSocket.emit('getReservationSetting', deviceId, async setting => {
        await cms.getModel('PosSetting').updateOne({}, { reservation: setting });
      });

      cms.socket.emit('approveSignIn', isFirstDevice)
      typeof ack === 'function' && ack()
    })

    socket.on('denySignIn_v2', async ({ requestId }, ack) => {
      console.log('denySignIn_v2')
      await cms.getModel('PosSetting').findOneAndUpdate({}, {
        $set: {
          'signInRequest.status': 'notApproved',
          'onlineDevice.store': {}
        }
      })

      cms.socket.emit('denySignIn')
      typeof ack === 'function' && ack()
    })

    socket.on('import-init-data', async (demoDataSrc, ack = () => null) => {
      console.log('importing data from server')
      const downloadUrl = url.resolve(await getWebShopUrl(), demoDataSrc, { responseType: 'stream' })
      const { data } = await axios.get(downloadUrl)
      await importDemoData(data)
      ack()
    })
    // register device which is installed from store
    cms.post('run:registerAppFromStore', () => {
      socket.emit('registerAppFromStore');
    })
  }

  async function unregisterOnlineOrderDevice() {
    console.log('unregisterOnlineOrderDevice')
    removeOnlineOrderSocket();
    if (proxyClient) {
      proxyClient.destroy();
      proxyClient = null;
    }

    await cms.getModel('PosSetting').findOneAndUpdate({}, {
      $set: {
        'onlineDevice': {
          id: null,
          store: {}
        },
        'signInRequest.status': 'notApproved',
      }
    })
  }

  function createOnlineOrderSocket(deviceId) {
    return new Promise(async resolve => {
      const webshopUrl = await getWebShopUrl();
      if (onlineOrderSocket) {
        onlineOrderSocket.disconnect(); // disconnect old socket to prevent server from keeping too many sockets
        onlineOrderSocket = null;

        // delay a little for old socket to disconnect first
        setTimeout(async () => {
          onlineOrderSocket = io(`${webshopUrl}?clientId=${deviceId}`, {forceNew: true});
          onlineOrderSocket.once('connect', resolve);
          createOnlineOrderListeners(onlineOrderSocket, deviceId);
          await initSocket(onlineOrderSocket);
        }, 2000);
      } else {
        onlineOrderSocket = io(`${webshopUrl}?clientId=${deviceId}`, {forceNew: true});
        onlineOrderSocket.once('connect', resolve);
        createOnlineOrderListeners(onlineOrderSocket, deviceId);
        await initSocket(onlineOrderSocket);
      }
    });
  }

  function removeOnlineOrderSocket() {
    if (onlineOrderSocket) {
      onlineOrderSocket.off();
      onlineOrderSocket.disconnect();
      onlineOrderSocket = null;
    }
  }

  async function getDeviceId(pairingCode) {
    const posSettings = await cms.getModel('PosSetting').findOne({});
    const { onlineDevice } = posSettings;

    if (onlineDevice.id) {
      return onlineDevice.id
    } else {
      if (pairingCode) {
        const { deviceId } = await registerWithCode(pairingCode)
        return deviceId
      } else {
        const { deviceId } = await registerDevice()
        if (deviceId) {
          console.log('deviceId', deviceId)
          return deviceId
        }
      }
    }
  }

  async function updateDeviceStatus(deviceId = null) {
    const SettingModel = cms.getModel('PosSetting');
    const {onlineDevice: deviceInfo} = (await SettingModel.findOne({}));

    deviceInfo.id = deviceId;

    await cms.getModel('PosSetting').updateOne({}, {onlineDevice: deviceInfo});
  }

  try {
    const posSettings = await cms.getModel('PosSetting').findOne({});
    const { onlineDevice } = posSettings;

    const deviceId = onlineDevice.id;
    if (deviceId) await createOnlineOrderSocket(deviceId);
  } catch (e) {
    console.error(`Create online order socket error: ${e}`);
    await updateDeviceStatus();
  } finally {
    cms.emit('initOnlineOrderSocketFinished');
    initFinished = true;
  }

  const alwaysOnFeature = await cms.getModel('Feature').findOne({name: 'alwaysOn'});
  if (alwaysOnFeature) await updateAlwaysOn(alwaysOnFeature.enabled);
  const startOnBootFeature = await cms.getModel('Feature').findOne({name: 'startOnBoot'});
  if (startOnBootFeature) await updateStartOnBoot(startOnBootFeature.enabled);
  initReservationSchedules()

  const waitInitOnlineOrderSocket = function () {
    return new Promise(resolve => {
      if (initFinished) {
        resolve();
      } else {
        cms.on('initOnlineOrderSocketFinished', resolve)
      }
    })
  }

  async function searchForPlace(text, token, language = 'en', country = 'DE') {
    let searchResult = []
    const posSettings = await cms.getModel('PosSetting').findOne();
    const apiKey = posSettings.generalSetting.googleMapApiKey || posSettings.call.googleMapApiKey;

    const autocompleteApiUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
    const { data: autocompleteResult } = await axios.get(autocompleteApiUrl, {
      params: {
        key: apiKey,
        input: text,
        language,
        sessiontoken: token
      }
    })

    if (autocompleteResult.predictions && autocompleteResult.predictions.length) {
      searchResult = autocompleteResult.predictions
    }

    return searchResult
  }

  async function getPlaceDetail(placeId, token, language = 'en') {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json'

    const posSettings = await cms.getModel('PosSetting').findOne();
    const apiKey = posSettings.generalSetting.googleMapApiKey || posSettings.call.googleMapApiKey;

    const { data } = await axios.get(url, {
      params: {
        key: apiKey,
        place_id: placeId,
        language,
        ...token && { sessiontoken: token }
      }
    })

    const { result } = data
    return result
  }

  async function getPublicIp() {
    try {
      const getIpReq = await axios.get('https://api.ipify.org', { responseType: 'text' });
      return getIpReq.data
    } catch (e) {
      console.log('cannot get public ip', e);
      return null
    }
  }

  const registerDevice = _.throttle(async function (cb = () => null) {
    const webshopUrl = await getWebShopUrl()

    try {
      const data = {
        appName: 'POS_Android',
        appVersion: require('../../package').version,
        hardware: global.APP_CONFIG.deviceName,
        hardwareId: global.APP_CONFIG.hardwareID,
        release: require('../../package').release,
        osName: global.APP_CONFIG.osName,
        metadata: {
          deviceIp: await getPublicIp()
        }
      };
      const pkgPath = path.resolve(__dirname, '../../pkg/pos-restaurant-react-native/.git/HEAD')
      if (fs.existsSync(pkgPath)) {
        data.appBaseVersion = fs.readFileSync(pkgPath, 'utf8').trim()
      }
      const { data: { clientId: deviceId } } = await axios.post(`${webshopUrl}/pos-device/register`, data)
      if (deviceId) {
        await cms.getModel('PosSetting').findOneAndUpdate({}, { $set: { 'onlineDevice.id': deviceId } })
        cb({ deviceId })
        return { deviceId }
      }
    } catch (error) {
      console.error('Error registering device', error)
      cb({ error })
    }
  }, 5000, { leading: true, trailing: false })

  async function registerWithCode(pairingCode) {
    try {
      const pairingApiUrl = `${await getWebShopUrl()}/device/register`
      const requestBody = { pairingCode }
      requestBody.appName = 'POS_Android'
      requestBody.appVersion = require('../../package').version
      requestBody.hardware = global.APP_CONFIG.deviceName
      requestBody.hardwareId = global.APP_CONFIG.hardwareID
      requestBody.release = require('../../package').release
      requestBody.osName = global.APP_CONFIG.osName
      const pkgPath = path.resolve(__dirname, '../../pkg/pos-restaurant-react-native/.git/HEAD')
      if (fs.existsSync(pkgPath)) {
        requestBody.appBaseVersion = fs.readFileSync(pkgPath, 'utf8').trim()
      }
      const response = await axios.post(pairingApiUrl, requestBody)
      const { deviceId, storeId, storeAlias: alias, storeName: name, storeLocale: locale, isFirstDevice } = response.data
      await cms.getModel('PosSetting').findOneAndUpdate({}, {
        $set: {
          onlineDevice: {
            id: deviceId,
            store: {
              id: storeId,
              name,
              alias,
              locale
            }
          },
          signInRequest: null
        }
      })
      return { deviceId, isFirstDevice }
    } catch (error) {
      console.error(error)
      return { error }
    }
  }

  cms.socket.on('connect', async socket => {
    await waitInitOnlineOrderSocket();

    console.log('internal socket connect')

    socket.on('disconnect', () => {
      console.log('internal socket disconnect')
    });

    socket.on('getWebshopUrl', async callback => callback(await getWebShopUrl(cms)));

    socket.on('getWebshopName', async callback => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);
      const posSettings = await cms.getModel('PosSetting').findOne()
      const { onlineDevice: { store } } = posSettings
      typeof callback === 'function' && callback(store.name);
    });

    socket.on('getWebshopId', async callback => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebshopId', deviceId, callback);
    });

    socket.on('getPairStatus', async callback => {
      const deviceId = await getDeviceId()
      if (!onlineOrderSocket || !deviceId) return callback({error: 'Device not paired'});
      const posSettings = await cms.getModel('PosSetting').findOne()
      const { onlineDevice: { store } } = posSettings
      if (!store || !store.id) return callback({error: 'Device not paired'})
      onlineOrderSocket.emit('getPairStatus', deviceId, callback);
    })

    socket.on('socketConnected', async callback => {
      callback(webShopConnected)
    })

    socket.on('registerOnlineOrderDevice', async (pairingCode, callback) => {
      const { deviceId, isFirstDevice } = await registerWithCode(pairingCode)

      if (deviceId) {
        try {
          if (!onlineOrderSocket || !onlineOrderSocket.connected) {
            await createOnlineOrderSocket(deviceId);
          }

          onlineOrderSocket.emit('getAppFeature', deviceId, async data => {
            await Promise.all(_.map(data, async (enabled, name) => {
              return await cms.getModel('Feature').updateOne({name}, {$set: {enabled}}, {upsert: true})
            }))
            socket.emit('updateAppFeature')
          })

          onlineOrderSocket.emit('getReservationSetting', deviceId, async setting => {
            await cms.getModel('PosSetting').updateOne({}, { reservation: setting });
          });

          if (typeof callback === 'function') callback(null, deviceId, isFirstDevice)
        } catch (e) {
          console.error(e);
          callback(e);
        }
      } else {
        callback(`Invalid pairing code`);
      }
    });

    socket.on('updateOrderStatus', async (orderStatus, cb) => {
      typeof cb === 'function' && cb()
      const {orderId, onlineOrderId, status, responseMessage} = orderStatus
      console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${onlineOrderId},orderId=${orderId}`,
        `8.1 Restaurant backend: received update order status message from frontend`)

      const posSetting = await cms.getModel('PosSetting').findOne()
      const {onlineDevice: {store: {name, alias}}} = posSetting

      console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${onlineOrderId},orderId=${orderId}`,
        `9. Restaurant backend: Order id ${orderId}: send order status to online-order: status: ${status}, message: ${responseMessage}`)
      onlineOrderSocket.emit('updateOrderStatus', {...orderStatus, storeName: name, storeAlias: alias}, async ({result, error, responseData}) => {
        // TODO: Check result response in another language
        //  + result is status returned by PayPal when we send CAPTURE request to capture money in a transaction
        //  + transaction info stored in paypalOrderDetail object
        if (isPrepaidOrder) {
          this.dialog.capturing.show = false
        }

        if (error || result !== 'COMPLETED') {
          this.dialog.captureFailed.show = true
          this.dialog.captureFailed.error = error || `Transaction status: ${result}`
        } else {
          if (isPrepaidOrder) {
            // store response data for later use
            updateOrderInfo.paypalOrderDetail = {
              ...updateOrderInfo.paypalOrderDetail,
              captureResponses: responseData
            }
            await cms.getModel('Order').findOneAndUpdate({ _id: order._id }, updateOrderInfo)
            this.printOnlineOrderKitchen(order._id)
            this.printOnlineOrderReport(order._id)
            await this.updateOnlineOrders()
          }
        }
      })
    })

    socket.on('refundOrder', async(order, cb) => {
      const posSetting = await cms.getModel('PosSetting').findOne()
      const {onlineDevice: {store: {name, alias}}} = posSetting
      const {id, onlineOrderId} = order
      console.debug(getBaseSentryTags('refundOrder') + `orderToken=${onlineOrderId},orderId=${id}`,
          `Restaurant backend: Refund order ${id}`)
      onlineOrderSocket.emit('refundOrder', { ...order, storeName: name, storeAlias: alias }, ({error, responseData}) => {
        cb && cb({error, responseData})
      })
    })

    socket.on('getWebShopSettingUrl', async (locale, callback) => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebShopSettingUrl', deviceId, locale, async (webShopSettingUrl) => {
        callback && callback(`${await getWebShopUrl()}${webShopSettingUrl}`)
      })
    })

    socket.on('getOnlineDeviceServices', async (callback) => {
      const deviceId = await getDeviceId()
      if (!onlineOrderSocket || !deviceId) return callback(null);

      try {
        onlineOrderSocket.emit('getOnlineDeviceServices', deviceId, async ({services: {delivery, pickup, noteToCustomers}, error}) => {
          if (error) return callback({error})
          await cms.getModel('PosSetting').findOneAndUpdate({}, {
            $set: {
              'onlineDevice.services': {delivery, pickup, noteToCustomers: noteToCustomers || ''}
            }
          })
          const services = {delivery, pickup, noteToCustomers}
          callback({services})
        })
      } catch (error) {
        const posSetting = cms.getModel('PosSetting').findOne()
        callback(posSetting.onlineDevice.services, error)
      }
    })

    socket.on('updateOnlineDeviceServices', async (services, callback) => {
      const deviceId = await getDeviceId()
      if (!onlineOrderSocket || !deviceId) return callback(null);

      try {
        onlineOrderSocket.emit('updateWebshopServices', deviceId, services, async ({success, error}) => {
          if (error) return callback({error})
          await cms.getModel('PosSetting').findOneAndUpdate({}, {$set: {'onlineDevice.services': services}})
          callback({success})
        })
      } catch (error) {
        callback({error})
      }
    })

    socket.on('rescheduleReservation', async (_id, change) => {
      const reservation = await cms.getModel('Reservation').findById(_id)
      if (!reservation) return

      // logs
      const guestName = reservation.customer.name;
      const reservationTime = dayjs(reservation.date).format('HH:mm')
      console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`,
        `2. Restaurant backend: Reschedule requested for '${guestName}' (${reservationTime}), change: ${JSON.stringify(change)}`)

      // reschedule here
      switch (reservation.status) {
        case 'pending': {
          await scheduleRemoveReservationJob(reservation)
          return
        }
        case 'completed': {
          return cancelRemoveReservationJob(reservation)
        }
        case 'declined': {
          return cancelRemoveReservationJob(reservation)
        }
      }
    })

    socket.on('scheduleNewReservation', async (reservation) => {
      if (!reservation) return
      const guestName = reservation.customer.name;
      const reservationTime = dayjs(reservation.date).format('HH:mm')
      console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`,
        `Restaurant backend: New schedule created for '${guestName}' (${reservationTime})`)
      await scheduleRemoveReservationJob(reservation)
    })

    socket.on('updateOnlineReservation', async (_id, tag) => {
      const deviceId = await getDeviceId()
      const reservation = await cms.getModel('Reservation').findOne({_id})
      console.debug(`${getBaseSentryTags('reservation')},reservationId=${reservation._id}`,
          `Restaurant backend: emit update reservation info to online server`)
      onlineOrderSocket.emit('updateOnlineReservation', reservation, tag, deviceId, async (onlineReservationId) => {
        await cms.getModel('Reservation').findOneAndUpdate({_id}, {onlineReservationId})
      })
    })

    socket.on('searchPlace', async (text, token, cb) => {
      const places = await searchForPlace(text, token)
      cb && cb(places)
    })

    socket.on('getPlaceDetail', async (place_id, token, cb) => {
      const place = await getPlaceDetail(place_id, token)
      cb && cb(place)
    })

    socket.on('getZipcode', async (text, token, cb) => {
      const places = await searchForPlace(text, token)
      const place = await getPlaceDetail(places[0].place_id, token)
      const component = place.address_components.find(c => c.types.includes('postal_code'))
      cb && cb(place.name, component.long_name)
    })

    socket.on('getDeliveryProducts', async (cb) => {
      const deviceId = await getDeviceId()
      onlineOrderSocket.emit('getDeliveryProducts', deviceId, async products => {
        await cms.getModel('Product').deleteMany({
          type: 'delivery'
        })
        await cms.getModel('Product').create(products.map(p => ({
          ...p,
          type: 'delivery',
          option: {
            favorite: !!(p.mark && p.mark.favorite)
          },
          groupPrinter: p.groupPrinters[0],
          groupPrinter2: p.groupPrinters[1],
        })))
        cb && cb()
      })
    })

    socket.on('sendSignInRequest', async (phoneNo, googleMapPlaceId, storeData, cb = () => null) => {
      const sentryTags = getBaseSentryTags('sendSignInRequest');
      try {
        const webshopUrl = await getWebShopUrl()
        const deviceId = await getDeviceId()
        await createOnlineOrderSocket(deviceId)
        const { country, location, zipCode, name, address } = storeData;
        const { data: request } = await axios.post(`${webshopUrl}/store/sign-in-requests`, {
          storeName: name,
          googleMapPlaceId,
          deviceId,
          storeData: { phoneNo, address, country, zipCode, location },
          pos: true
        })
        console.debug(sentryTags, 'POS backend: sendSignInRequest success', request)
        if (!request.message) {
          await cms.getModel('PosSetting').findOneAndUpdate({}, { $set: { signInRequest: request } })
        }
        if (request && request.storeData) {
          const { _id, name, alias, settingName } = request.storeData
          await cms.getModel('PosSetting').findOneAndUpdate({}, {
            $set: {
              'onlineDevice.store': {
                id: _id,
                name: name || settingName,
                alias
              }
            }
          })
        }
        cb(request)
      } catch (e) {
        console.debug(sentryTags, 'POS backend: sendSignInRequest error', e)
      }
    })

    socket.on('getSignInRequestStatus', () => {

    })

    socket.on('setMasterDevice', async () => {
      const sentryTags = getBaseSentryTags('setMasterDevice');

      try {
        console.debug(sentryTags, 'POS backend: setMasterDevice event listener')
        const posSettings = await cms.getModel('PosSetting').findOne({}).lean();
        const { onlineDevice } = posSettings;

        if (!onlineDevice.store || !onlineDevice.store.alias) return cb(null)
        const ip = global.APP_CONFIG.deviceIp;
        onlineOrderSocket.emit('setMasterDevice', ip, id => {
          console.debug(sentryTags, 'POS backend: setMasterDevice cb', id)
          cms.getModel('PosSetting').findOneAndUpdate({}, { masterIp: ip, masterClientId: id })
        })
      } catch (e) {
        console.debug(sentryTags, 'Error setting master device', e)
      }
    })
  })
}
