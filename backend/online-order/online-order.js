const {calOrderDiscount, calOrderModifier, calOrderTax, calOrderTotal, formatOrderItems, getLatestOrderId} = require('../../components/logic/orderUtil')
const {getBookingNumber, getVDate} = require('../../components/logic/productUtils')
const _ = require('lodash')
const io = require('socket.io-client');
const ProxyClient = require('@gigasource/nodejs-proxy-server/libs/client.js');
const axios = require('axios');
const dayjs = require('dayjs');

let customWebshopUrl
let {webshopUrl, port: backendPort} = global.APP_CONFIG;
let onlineOrderSocket = null;
let proxyClient = null;
let activeProxies = 0;
let webShopConnected = false;

const RECREATE_INTERVAL = 60000; // socket.io will try to recreate client socket every 60 seconds if current socket disconnects or fails to reconnects too many times
const NO_OF_ATTEMPT_BEFORE_RECREATE = 5; // if number of 'reconnecting' attempt > 5, recreate interval will be triggered
let recreateOnlineOrderSocketInterval = null;
let initFinished = false;

module.exports = async cms => {
  async function getWebShopUrl() {
    const posSetting = await cms.getModel('PosSetting').findOne()
    customWebshopUrl = posSetting.customServerUrl
    if (customWebshopUrl) return customWebshopUrl
    return webshopUrl
  }

  async function updateAlwaysOn(enabled) {
    console.log("Updating always on");
    try {
      await axios.post(`http://localhost:5000/update-alwayson-status`, {enabled})
    } catch (e) {
      console.error(e);
    }
  }

  function startSocketRecreateInterval() {
    if (!recreateOnlineOrderSocketInterval) {
      console.debug('startSocketRecreateInterval');

      recreateOnlineOrderSocketInterval = setInterval(async () => {
        console.debug('recreateOnlineOrderSocket');
        const deviceId = await getDeviceId();

        if (deviceId) await createOnlineOrderSocket(deviceId);
      }, RECREATE_INTERVAL);
    }
  }

  function stopSocketRecreateInterval() {
    if (recreateOnlineOrderSocketInterval) {
      console.debug('stopSocketRecreateInterval');
      clearInterval(recreateOnlineOrderSocketInterval);
      recreateOnlineOrderSocketInterval = null;
    }
  }

  function createOnlineOrderListeners(socket, deviceId) {
    // event logs for debugging
    console.debug('Creating onlineOrderSocket');
    socket.on('connect', () => console.debug('onlineOrderSocket connected'));
    socket.on('disconnect', () => console.debug(`onlineOrderSocket disconnected`));
    socket.on('reconnecting', numberOfAttempt => console.debug(`onlineOrderSocket reconnecting, attempt: ${numberOfAttempt}`));
    socket.on('reconnect', () => console.debug('onlineOrderSocket reconnected'));
    socket.on('reconnect_error', err => {
      console.debug(`onlineOrderSocket reconnect error:`);
      console.debug(err);
    });

    // connection related logic
    socket.on('connect', async () => {
      stopSocketRecreateInterval();

      webShopConnected = true
      cms.socket.emit('webShopConnected');

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
      let {
        orderType: type, paymentType, customer, products: items,
        createdDate, timeoutDate, shippingFee, note, orderToken, discounts, deliveryTime
      } = orderData

      const systemTimeDelta = dayjs(serverDateTime).diff(new Date(), 'millisecond')

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
        id: await getLatestOrderId(),
        status: 'inProgress',
        items: formatOrderItems(items),
        customer,
        deliveryDate: new Date(),
        payment: [{type: paymentType, value: vSum}],
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
      }

      const result = await cms.getModel('Order').create(order)
      cms.socket.emit('updateOnlineOrders')

      if (timeoutDate) {
        await scheduleDeclineOrder(timeoutDate, result._id, () => {
          cms.socket.emit('updateOnlineOrders')
        })
      }

      ackFn();
    });
    socket.on('updateAppFeature', async (data, callback) => {
      await Promise.all(_.map(data, async (enabled, name) => {
        if (name === 'alwaysOn') {
          const oldAlwaysOnValue = await cms.getModel('Feature').findOne({name})
          console.log(oldAlwaysOnValue.enabled);
          if (oldAlwaysOnValue.enabled != enabled) {
            await updateAlwaysOn(enabled)
          }
        }
        return await cms.getModel('Feature').updateOne({name}, {$set: {enabled}}, {upsert: true})
      }))
      cms.socket.emit('updateAppFeature')
      callback()
    });
    socket.on('unpairDevice', cb => {
      cms.socket.emit('unpairDevice')
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
      console.log(`Updating ${uploadPath}`);
      ackFn();
      try {
        await axios.post(`http://localhost:5000/update${type === 'PATCH' ? '' : '-original'}`, {
          downlink: uploadPath
        })
      } catch (e) {
        console.error('Update app error or this is not an android device');
      }
    });
    socket.on('updateOrderTimeOut', async (orderTimeOut, ackFn) => {
      if (_.isNil(orderTimeOut)) return

      try {
        await cms.getModel('PosSetting').findOneAndUpdate({},
            {$set: {'onlineDevice.orderTimeout': orderTimeOut}})
      } catch (e) {
        console.error('Error updating order timeout', e)
      } finally {
        ackFn()
      }
    });
    socket.on('startStream', async (cb) => {
      try {
        console.log('on start stream')
        const responseData = (await axios.post(`http://${global.APP_CONFIG.androidServerAddress || 'localhost'}:5000/start-stream`, {screencastId: deviceId})).data
        console.log(responseData)
      } catch (e) {
        console.log('start stream error', e);
      }

      cb && cb()
    });
    socket.on('stopStream', async (cb) => {
      try {
        console.log('on stop stream')
        const responseData = (await axios.post(`http://${global.APP_CONFIG.androidServerAddress || 'localhost'}:5000/stop-stream`)).data
        console.log(responseData)
      } catch (e) {
        console.log('stop stream error', e)
      }

      cb && cb()
    });
  }

  function createOnlineOrderSocket(deviceId) {
    return new Promise(async resolve => {
      if (onlineOrderSocket) onlineOrderSocket.disconnect(); // disconnect old socket to prevent server from keeping too many sockets

      const webshopUrl = await getWebShopUrl();
      onlineOrderSocket = io(`${webshopUrl}?clientId=${deviceId}`);
      onlineOrderSocket.once('connect', resolve);
      createOnlineOrderListeners(onlineOrderSocket, deviceId);
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
    const {onlineDevice} = posSettings;

    if (onlineDevice.id) {
      return onlineDevice.id
    } else {
      if (!pairingCode) {
        return null
      } else {
        const pairingApiUrl = `${await getWebShopUrl()}/device/register`
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

  try {
    const deviceId = await getDeviceId();
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

  const waitInitOnlineOrderSocket = function () {
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

    socket.on('disconnect', () => {
      console.log('internal socket disconnect')
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
          await createOnlineOrderSocket(deviceId);
          await updateDeviceStatus(deviceId);

          onlineOrderSocket.emit('getAppFeature', deviceId, async data => {
            await Promise.all(_.map(data, async (enabled, name) => {
              return await cms.getModel('Feature').updateOne({name}, {$set: {enabled}}, {upsert: true})
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
      removeOnlineOrderSocket();

      if (proxyClient) {
        proxyClient.destroy();
        proxyClient = null;
      }

      await updateDeviceStatus();
      callback();
    });

    socket.on('updateOrderStatus', (orderToken, orderStatus, extraInfo) => {
      onlineOrderSocket.emit('updateOrderStatus', orderToken, orderStatus, extraInfo)
      console.debug(`emit order status to server for order ${orderToken}`)
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
  })
}
