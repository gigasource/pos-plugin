const { calOrderDiscount, calOrderModifier, calOrderTax, calOrderTotal, formatOrderItems, getLatestOrderId } = require('../../components/logic/orderUtil')
const {getBookingNumber, getVDate} = require('../../components/logic/productUtils')
const _ = require('lodash')
const io = require('socket.io-client');
const ProxyClient = require('@gigasource/nodejs-proxy-server/libs/client.js');
const url = require('url');
const axios = require('axios');
const dayjs = require('dayjs');

let customWebshopUrl
let {webshopUrl, port: backendPort} = global.APP_CONFIG;
let onlineOrderSocket = null;
let proxyClient = null;
let activeProxies = 0;
let deviceSockets = [];
let webShopConnected = false

async function getWebShopUrl(cms) {
  const posSetting = await cms.getModel('PosSetting').findOne()
  customWebshopUrl = posSetting.customServerUrl
  if (customWebshopUrl) return customWebshopUrl
  return webshopUrl
}

function createOnlineOrderSocket(deviceId, cms) {

  async function scheduleDeclineOrder(date, _id, cb) {
    const timeOut = dayjs(date).diff(dayjs(), 'millisecond')

    setTimeout(async () => {
      let model = cms.getModel('Order');
      const order = await model.findOne({ _id })
      if (order && order.status !== 'inProgress') return

      await model.findOneAndUpdate({ _id }, { status: 'declined' })
      cb()
    }, timeOut)
  }

  const maxConnectionAttempt = 5;
  return new Promise(async (resolve, reject) => {
    if (onlineOrderSocket) return resolve()
    console.log('Creating online order')
    onlineOrderSocket = io(`${await getWebShopUrl(cms)}?clientId=${deviceId}`);

    onlineOrderSocket.on('connect', () => console.log('external socket connect'))

    onlineOrderSocket.once('connect', async () => {
      console.log('connect');
      webShopConnected = true
      cms.socket.emit('webShopConnected');
      //deviceSockets.forEach(socket => socket.emit('webShopConnected'))
      resolve();
      if (cms.utils.getShouldUpdateApp()) {
        onlineOrderSocket.emit('updateVersion', require('../../package').version, deviceId);
      }
    });

    onlineOrderSocket.on('reconnecting', function (numberOfAttempt) {
      //fixme: find better solutions
      /*if (numberOfAttempt >= maxConnectionAttempt) {
        reject(`Can not pair with server at address ${webshopUrl}`);
        cleanupOnlineOrderSocket();
      }*/
      console.log('reconnecting');
    });

    onlineOrderSocket.on('reconnect', () => {
      console.log('reconnect')
      webShopConnected = true
      console.log(JSON.stringify(deviceSockets))
      cms.socket.emit('webShopConnected')
      //deviceSockets.forEach(socket => socket.emit('webShopConnected'))
    })

    onlineOrderSocket.on('createOrder', async (orderData, serverDateTime, ackFn) => {
      if (!orderData) return
      let { orderType: type, paymentType, customer, products: items,
        createdDate, timeoutDate, shippingFee, note, orderToken, discounts, deliveryTime, paypalOrderDetail } = orderData

      const systemTimeDelta = dayjs(serverDateTime).diff(new Date(), 'millisecond')

      items = items.map(item => {
        if (item.originalPrice) return item;
        return { originalPrice: item.price, ...item };
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
        id: await getLatestOrderId(),
        status: 'inProgress',
        items: formatOrderItems(items),
        customer,
        deliveryDate: new Date(),
        payment: [{
          type: paymentType,
          value: vSum,
        }],
        type,
        date,
        ...timeoutDate && {timeoutDate: dayjs(timeoutDate).add(systemTimeDelta, 'millisecond').toDate()},
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
        paypalOrderDetail
      }

      const result = await cms.getModel('Order').create(order)
      cms.socket.emit('updateOnlineOrders')
      //deviceSockets.forEach(socket => socket.emit('updateOnlineOrders'))

      if (timeoutDate) {
        await scheduleDeclineOrder(timeoutDate, result._id, () => {
          cms.socket.emit('updateOnlineOrders')
          //deviceSockets.forEach(socket => socket.emit('updateOnlineOrders'));
        })
      }

      ackFn();
    });

    onlineOrderSocket.on('updateAppFeature', async (data, callback) => {
      await Promise.all(_.map(data, async (enabled, name) => {
        return await cms.getModel('Feature').updateOne({ name }, { $set: { enabled } }, { upsert: true })
      }))
      cms.socket.emit('updateAppFeature')
      callback()
      //deviceSockets.forEach(socket => socket.emit('updateAppFeature')) // emit to all frontends
    })

    onlineOrderSocket.on('unpairDevice', cb => {
      cms.socket.emit('unpairDevice')
      //deviceSockets.forEach(socket => socket.emit('unpairDevice'))
      cb();
    })

    onlineOrderSocket.on('startRemoteControl', async (proxyServerPort, callback) => {
      activeProxies++;

      if (!proxyClient) {
        proxyClient = new ProxyClient({
          clientId: `${deviceId}-proxy-client`,
          proxyServerHost: `http://${url.parse(await getWebShopUrl(cms)).hostname}`,
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

    onlineOrderSocket.on('stopRemoteControl', callback => {
      if (activeProxies > 0) activeProxies--;

      if (activeProxies === 0 && proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }

      if (typeof callback === 'function') callback();
    });

    onlineOrderSocket.on('updateApp', async (uploadPath, type, ackFn) => {
      console.log(`Updating ${uploadPath}`);
      ackFn();
      try {
        await axios.post(`http://localhost:5000/update${type === 'PATCH' ? '' : '-original'}`, {
          downlink: uploadPath
        })
      } catch (e) {
        console.error('Update app error or this is not an android device');
      }
    })

    onlineOrderSocket.on('updateOrderTimeOut', async (orderTimeOut, ackFn) => {
      if (_.isNil(orderTimeOut)) return

      try {
        await cms.getModel('PosSetting').findOneAndUpdate({},
          { $set: { 'onlineDevice.orderTimeout': orderTimeOut } })
      } catch (e) {
        console.error('Error updating order timeout', e)
      } finally {
        ackFn()
      }
    })

    onlineOrderSocket.on('startStream', async (cb) => {
      try {
        console.log('on start stream')
        const responseData = (await axios.post(`http://${global.APP_CONFIG.androidServerAddress || 'localhost'}:5000/start-stream`, { screencastId: deviceId })).data
        console.log(responseData)
      } catch (e) {
        console.log('start stream error', e);
      }

      cb && cb()
    })

    onlineOrderSocket.on('stopStream', async (cb) => {
      try {
        console.log('on stop stream')
        const responseData = (await axios.post(`http://${global.APP_CONFIG.androidServerAddress || 'localhost'}:5000/stop-stream`)).data
        console.log(responseData)
      } catch (e) {
        console.log('stop stream error', e)
      }

      cb && cb()
    })

    onlineOrderSocket.on('disconnect', () => {
      console.log('disconnect');
      webShopConnected = false
      cms.socket.emit('webShopDisconnected')
      //deviceSockets.forEach(socket => socket.emit('webShopDisconnected'))

      activeProxies = 0;
      if (proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }
    })
  });
}

async function getDeviceId(pairingCode) {
  const posSettings = await cms.getModel('PosSetting').findOne({});
  const {onlineDevice} = posSettings;

  if (onlineDevice.id) {
    return onlineDevice.id
  } else {
    if (!pairingCode) {
      return null
    } else {
      const pairingApiUrl = `${await getWebShopUrl(cms)}/device/register`
      const requestBody = {pairingCode}
      requestBody.appName = 'POS_Android'
      requestBody.appVersion = require('../../package').version
      requestBody.hardware = global.APP_CONFIG.deviceName
      requestBody.release = require('../../package').release
      try {
        const requestResponse = await axios.post(pairingApiUrl, requestBody)
        return requestResponse.data.deviceId
      } catch (e) {
        console.error(e)
        return null
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

function cleanupOnlineOrderSocket() {
  if (onlineOrderSocket) {
    onlineOrderSocket.off();
    onlineOrderSocket.disconnect();
    onlineOrderSocket.destroy();
    onlineOrderSocket = null;
  }
}

module.exports = async cms => {
  let initFinished = false;
  const initOnlineOrderSocket = async function() {
    try {
      const deviceId = await getDeviceId();
      if (deviceId) await createOnlineOrderSocket(deviceId, cms);
    } catch (e) {
      console.error(e);
      await updateDeviceStatus();
    } finally {
      cms.emit('initOnlineOrderSocketFinished');
      initFinished = true;
    }
  }

  await initOnlineOrderSocket();
  const waitInitOnlineOrderSocket = function() {
    return new Promise(resolve => {
      if (initFinished) {
        resolve();
      } else {
        cms.on('initOnlineOrderSocketFinished', resolve)
      }
    })
  }

  cms.socket.on('connect', async socket => {
    await waitInitOnlineOrderSocket();

    console.log('internal socket connect')
    //deviceSockets.push(socket)

    socket.on('disconnect', () => {
      console.log('internal socket disconnect')
      //deviceSockets = deviceSockets.filter(sk => sk !== socket)
    });

    socket.on('getWebshopUrl', async callback => callback(await getWebShopUrl(cms)));

    socket.on('getWebshopName', async callback => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebshopName', deviceId, callback);
    });

    socket.on('getWebshopId', async callback => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebshopId', deviceId, callback);
    });

    socket.on('getPairStatus', async callback => {
      const deviceId = await getDeviceId()
      if (!onlineOrderSocket || !deviceId) return callback({error: 'Device not paired'});

      onlineOrderSocket.emit('getPairStatus', deviceId, callback);
    })

    socket.on('socketConnected', async callback => {
      callback(webShopConnected)
    })

    socket.on('registerOnlineOrderDevice', async (pairingCode, callback) => {
      const deviceId = await getDeviceId(pairingCode)

      if (deviceId) {
        try {
          await createOnlineOrderSocket(deviceId, cms);
          await updateDeviceStatus(deviceId);

          onlineOrderSocket.emit('getAppFeature', deviceId, async data => {
            await Promise.all(_.map(data, async (enabled, name) => {
              return await cms.getModel('Feature').updateOne({ name }, { $set: { enabled } }, { upsert: true })
            }))
            socket.emit('updateAppFeature')
          })

          if (typeof callback === 'function') callback(null, deviceId)
        } catch (e) {
          console.error(e);
          callback(e);
        }
      } else {
        callback(`Invalid pairing code`);
      }
    });

    socket.on('unregisterOnlineOrderDevice', async callback => {
      cleanupOnlineOrderSocket();

      if (proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }

      await updateDeviceStatus();
      callback();
    });

    socket.on('updateOrderStatus', (orderStatus) => {
      onlineOrderSocket.emit('updateOrderStatus', orderStatus)
    })

    socket.on('getWebShopSettingUrl', async (callback) => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebShopSettingUrl', deviceId, async (webShopSettingUrl) => {
        callback && callback( `${await getWebShopUrl(cms)}${webShopSettingUrl}`)
      })
    })
  })
}
