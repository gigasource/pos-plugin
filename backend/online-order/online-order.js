const orderUtil = require('../../components/logic/orderUtil')
const {getBookingNumber, getVDate} = require('../../components/logic/productUtils')
const _ = require('lodash')
const io = require('socket.io-client');
const ProxyClient = require('@gigasource/nodejs-proxy-server/libs/client.js');
const url = require('url');
const axios = require('axios');

const {webshopUrl, port: backendPort} = global.APP_CONFIG;
let onlineOrderSocket = null;
let proxyClient = null;
let activeProxies = 0;
let deviceSockets = [];
let webShopConnected = false

function createOnlineOrderSocket(deviceId, cms) {
  const maxConnectionAttempt = 5;
  return new Promise((resolve, reject) => {
    if (onlineOrderSocket) return resolve()
    console.log('Creating online order')
    onlineOrderSocket = io(`${webshopUrl}?clientId=${deviceId}`);

    onlineOrderSocket.once('connect', async () => {
      if (cms.utils.getShouldUpdateApp()) {
        const deviceId = await getDeviceId();
        onlineOrderSocket.emit('updateVersion', require('../../package').version, deviceId);
      }
      webShopConnected = true
      deviceSockets.forEach(socket => socket.emit('webShopConnected'))
      resolve();
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
      deviceSockets.forEach(socket => socket.emit('webShopConnected'))
    })

    onlineOrderSocket.on('createOrder', async (orderData, ackFn) => {
      if (!orderData) return
      let { orderType: type, paymentType, customer, products: items,
        createdDate: dateString, shippingFee, note, orderToken, discounts, deliveryTime } = orderData

      items = items.map(item => {
        if (item.originalPrice) return item;
        return { originalPrice: item.price, ...item };
      });
      const date = new Date(dateString)
      const vDiscount = orderUtil.calOrderDiscount(items).toFixed(2)
      const vSum = (orderUtil.calOrderTotal(items) + orderUtil.calOrderModifier(items) + shippingFee).toFixed(2)
      const vTax = orderUtil.calOrderTax(items).toFixed(2)
      const taxGroups = _.groupBy(items, 'tax')
      const vTaxGroups = _.map(taxGroups, (val, key) => ({
        taxType: key,
        tax: orderUtil.calOrderTax(val),
        sum: orderUtil.calOrderTotal(val)
      }))

      const order = {
        id: await orderUtil.getLatestOrderId(),
        status: 'inProgress',
        items,
        customer,
        deliveryDate: dayjs(),
        payment: [{ type: paymentType, value: vSum }],
        type,
        date,
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
      }

      await cms.getModel('Order').create(order)
      deviceSockets.forEach(socket => socket.emit('updateOnlineOrders'))
      ackFn();
    });

    onlineOrderSocket.on('updateAppFeature', async data => {
      await Promise.all(_.map(data, async (enabled, name) => {
        return await cms.getModel('Feature').updateOne({ name }, { $set: { enabled } }, { upsert: true })
      }))
      deviceSockets.forEach(socket => socket.emit('updateAppFeature')) // emit to all frontends
    })

    onlineOrderSocket.on('unpairDevice', async () => {
      deviceSockets.forEach(socket => socket.emit('unpairDevice'))
    })

    onlineOrderSocket.on('startRemoteControl', (proxyServerPort, callback) => {
      activeProxies++;

      if (!proxyClient) {
        proxyClient = new ProxyClient({
          clientId: `${deviceId}-proxy-client`,
          proxyServerHost: `http://${url.parse(webshopUrl).hostname}`,
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

    onlineOrderSocket.on('updateApp', async (uploadPath, ackFn) => {
      uploadPath = `${global.APP_CONFIG.webshopUrl}${uploadPath}`
      console.log(`Updating ${uploadPath}`);
      ackFn();
      try {
        await axios.post('http://localhost:5000/update', {
          downlink: uploadPath
        })
      } catch (e) {
        console.error('Update app error or this is not an android device');
      }
    })

    onlineOrderSocket.on('updateOrderTimeOut', async (orderTimeOut) => {
      if (_.isNil(orderTimeOut)) return

      try {
        await cms.getModel('PosSetting').findOneAndUpdate({},
          { $set: { 'onlineDevice.orderTimeout': orderTimeOut } })
      } catch (e) {
        console.error('Error updating order timeout', e)
      }
    })

    onlineOrderSocket.on('disconnect', () => {
      webShopConnected = false
      deviceSockets.forEach(socket => socket.emit('webShopDisconnected'))

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

  if (onlineDevice.id && onlineDevice.paired) {
    return onlineDevice.id
  } else {
    if (!pairingCode) {
      return null
    } else {
      const pairingApiUrl = `${webshopUrl}/device/register`
      const requestBody = {pairingCode}
      requestBody.appName = 'POS_Android'
      requestBody.appVersion = require('../../package').version
      requestBody.hardware = global.APP_CONFIG.deviceName
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

async function updateDeviceStatus(paired, deviceId = null) {
  const SettingModel = cms.getModel('PosSetting');
  const {onlineDevice: deviceInfo} = (await SettingModel.findOne({}));

  deviceInfo.paired = paired;
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
  try {
    const deviceId = await getDeviceId();
    if (deviceId) await createOnlineOrderSocket(deviceId, cms);
  } catch (e) {
    console.error(e);
    await updateDeviceStatus(false);
  }

  cms.socket.on('connect', socket => {
    deviceSockets.push(socket)

    socket.on('disconnect', () => deviceSockets = deviceSockets.filter(sk => sk !== socket));

    socket.on('getWebshopUrl', callback => callback(webshopUrl));

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
          await updateDeviceStatus(true, deviceId);
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

      await updateDeviceStatus(false);
      callback();
    });

    socket.on('updateOrderStatus', (orderToken, orderStatus, extraInfo) => {
      onlineOrderSocket.emit('updateOrderStatus', orderToken, orderStatus, extraInfo)
    })

    socket.on('getWebShopSettingUrl', async (callback) => {
      const deviceId = await getDeviceId();
      if (!onlineOrderSocket || !deviceId) return callback(null);

      onlineOrderSocket.emit('getWebShopSettingUrl', deviceId, (webShopSettingUrl) => {
        callback && callback( `${webshopUrl}${webShopSettingUrl}`)
      })
    })
  })
}
