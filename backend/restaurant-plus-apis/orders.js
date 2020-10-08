const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {respondWithError, getDistance, applyDiscountForOrder} = require('./utils');
const {getExternalSocketIoServer} = require('../../backend/socket-io-server');
const StoreModel = cms.getModel("Store");
const OrderModel = cms.getModel("Order");
const DeviceModel = cms.getModel("Device");
const UserModel = cms.getModel("RPUser");
const VoucherModel = cms.getModel("RPVoucher");
const ObjectId = require('mongoose').Types.ObjectId;
const objectMapper = require('object-mapper');
const sumBy = require('lodash/sumBy');
const sum = require('lodash/sum');
const _ = require('lodash');
const dayjs = require('dayjs');
const {firebaseAdminInstance} = require('../app-notification/firebase-messaging/admin');
const {ORDER_RESPONSE_STATUS, NOTIFICATION_ACTION_TYPE, PROMOTION_DISCOUNT_TYPE, VOUCHER_STATUS} = require('./constants');
const jsonFn = require('json-fn');
const { sendNotification } = require('../app-notification');
const {findVouchers} = require('./vouchers');
const {jwtValidator} = require('./api-security');
const { time } = require('console');

const mapperConfig = {
  _id: '_id',
  'storeId.logoImageSrc': 'store.logoImageSrc',
  'storeId.settingName': {
    key: 'store.name',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.storeId.name
  },
  date: 'date',
  timeoutDate: 'timeoutDate',
  vSum: 'orderSum',
  vDiscount: "orderDiscountValue",
  itemCount: 'itemCount',
  paymentType: 'paymentType',
  shippingFee: 'shippingFee',
  'restaurantPlusVoucher.promotion.name': 'voucherName',
  'items[]._id': 'items[]._id',
  'items[].name': 'items[].name',
  'items[].originalPrice': 'items[].originalPrice',
  'items[].quantity': 'items[].quantity',
}

function calOrderTotal(items) {
  return sumBy(items, item => +(item.quantity * item.price));
}

function calOrderModifier(items) {
  return sumBy(items, item => item.modifiers ? sum(item.modifiers.map(i => i.price)) * item.quantity : 0);
}

router.get('/', jwtValidator, async (req, res) => {
  const {userId} = req.query;
  if (!userId) return respondWithError(res, 400, 'Missing property in request');

  let userOrders = await OrderModel.find({restaurantPlusUser: ObjectId(userId)}).sort({date: -1});
  userOrders = userOrders.map(order => {
    const {items, shippingFee, payment} = order;
    const orderSum = order.vSum || (calOrderTotal(items) + calOrderModifier(items) + shippingFee).toFixed(2);
    const itemCount = items.reduce((acc, cur) => acc + cur.quantity, 0);
    const paymentType = payment[0].type;

    return {
      ...order._doc,
      vSum: +orderSum,
      itemCount,
      paymentType,
    }
  });

  res.status(200).json(userOrders.map(e => objectMapper(e, mapperConfig)));
});

router.get('/by-id/:orderId', jwtValidator, async (req, res) => {
  const {orderId} = req.params;
  if (!orderId) return respondWithError(res, 400, 'Missing property in request');

  const order = await OrderModel.findById(orderId);
  if (!order) return respondWithError(res, 400, 'Invalid order ID');

  res.status(200).json(objectMapper(order, mapperConfig));
});

router.post('/calculate-shipping-fee', async (req, res) => {
  const {customerAddress, customerZipCode, storeId} = req.body;
  if (!customerAddress || !customerZipCode || !storeId) return respondWithError(res, 400, 'Missing property in request');

  const store = await StoreModel.findById(storeId);
  if (!store) return respondWithError(res, 400, 'Invalid store ID');

  if (!store.deliveryFee) return respondWithError(res, 400, 'No delivery setup for store!')

  if (store.deliveryFee.type === 'zipCode') {
    const zipCodeFees = (store.deliveryFee.zipCodeFees || []).map(({zipCode, fee, minOrder}) => {
      if (zipCode.includes(',') || zipCode.includes(';')) {
        zipCode = zipCode.replace(/\s/g, '').replace(/;/g, ',').split(',')
      }
      return zipCode instanceof Array ? zipCode.map(code => ({zipCode: code, fee, minOrder: minOrder || 0})) : {
        zipCode,
        fee,
        minOrder: minOrder || 0
      }
    }).flat()

    for (const deliveryFee of zipCodeFees) {
      if (_.lowerCase(_.trim(deliveryFee.zipCode)) === _.lowerCase(_.trim(customerZipCode.toString())))
        return res.status(200).json({shippingFee: deliveryFee.fee})
    }

    if (store.deliveryFee.acceptOrderInOtherZipCodes)
      return res.status(200).json({shippingFee: store.deliveryFee.defaultFee})
  }

  if (store.deliveryFee.type === 'distance') {
    let distance = await getDistance(customerAddress, customerZipCode, store.coordinates)
    if (distance === undefined || distance === null)
      return respondWithError(res, 400, "Can't calculate the distance between restaurant and customer!")
    if (distance >= 0) {
      for (const deliveryFee of _.sortBy(store.deliveryFee.distanceFees, 'radius')) {
        if (distance < deliveryFee.radius)
          return res.status(200).json({shippingFee: deliveryFee.fee})
      }
    }
  }
});

// TODO: use transaction
router.post('/', jwtValidator, async (req, res) => {
  const {order} = req.body
  let {
    storeId, items, type, customer, payment, note, deliveryTime, date, user, voucher, shippingFee, total,
    timeoutDate, deliveryDateTime,
  } = jsonFn.clone(order, true);

  customer.phone = customer.phoneNumber;
  delete customer.phoneNumber;

  const store = await StoreModel.findById(storeId)
  if (!store) return respondWithError(res, 400, 'Invalid store ID!');

  let orderSum = (calOrderTotal(items) + calOrderModifier(items) + +shippingFee);
  let orderDiscountValue = 0;

  if (voucher) {
    voucher = await findVouchers({
      voucherId: voucher._id,
      status: VOUCHER_STATUS.UNUSED,
      usable: true,
    });

    if (voucher.length) voucher = voucher[0];
    else return respondWithError(res, 400, 'Invalid voucher');

    if (voucher.promotion.discountType === PROMOTION_DISCOUNT_TYPE.FLAT) {
      orderDiscountValue = orderSum >= voucher.promotion.discountValue ? voucher.promotion.discountValue : orderSum;
    } else if (voucher.promotion.discountType === PROMOTION_DISCOUNT_TYPE.PERCENT) {
      orderDiscountValue = (orderSum * voucher.promotion.discountValue / 100);
    }

    orderSum = orderSum - orderDiscountValue;
    if (orderSum < 0) orderSum = 0;

    await VoucherModel.updateOne({_id: voucher._id}, {status: VOUCHER_STATUS.USED});
  }

  const newOrder = await OrderModel.create({
    storeId,
    items: items.map(item => ({
      ..._.omit(item, ['_id', 'groupPrinters']),
      groupPrinter: item.groupPrinters[0],
      groupPrinter2: store.useMultiplePrinters && item.groupPrinters.length >= 2 && item.groupPrinters[1],
      price: +item.price.toFixed(2),
      originalPrice: item.originalPrice ? +item.originalPrice.toFixed(2) : +item.price.toFixed(2),
      ...item.vDiscount && {vDiscount: +item.vDiscount.toFixed(2)},
      id: item.id || ''
    })),
    customer,
    payment,
    type,
    deliveryTime,
    deliveryDate: date,
    date,
    timeoutDate,
    shippingFee,
    note,
    online: true,
    vSum: orderSum,
    vDiscount: orderDiscountValue,
    restaurantPlusUser: user && user._id,
    ...voucher && {restaurantPlusVoucher: voucher._id},
    status: ORDER_RESPONSE_STATUS.ORDER_IN_PROGRESS
  });

  await OrderModel.updateOne({_id: newOrder._id}, {onlineOrderId: newOrder._id});

  // including tablets & Restaurant Plus manager app
  sendOrderToStoreDevices(store, {
    ...newOrder.toObject(),
    deliveryDateTime,
    orderToken: newOrder._id,
    createdDate: date,
  });

  UserModel.updateOne({_id: user._id}, {
    lastUsedAddress: {
      address: customer.address,
      zipCode: customer.zipCode
    }
  }).exec();

  res.status(201).json(objectMapper(newOrder, mapperConfig));
});

router.put('/', jwtValidator, async (req, res) => {
  //todo schedule auto-cancel order after timeout
  const { orderId, status, timeToComplete, declineReason } = req.body
  if (!orderId || !status) res.sendStatus(400)

  // update order
  function isValidTimeToComplete(time) {
    const parsedTime = parseInt(time)
    return !isNaN(parsedTime) && parsedTime > 0
  }
  const updatedOrder = await cms.getModel('Order').findOneAndUpdate(
    { ...orderId.includes('-')
        ? { onlineOrderId: orderId }
        : { _id: ObjectId(orderId) }},
    {
      status,
      ...status === 'kitchen' && { timeToComplete },
      ...status === 'declined' && { declineReason },
      ...status === 'kitchen'
        && isValidTimeToComplete(timeToComplete)
        && { deliveryTime: dayjs().add(+timeToComplete, 'minute').toDate().toISOString() }
    },
    { new: true })
  res.status(204).json(updatedOrder)

  // send to frontend
  if (updatedOrder.onlineOrderId) {
    const store = await StoreModel.findById(updatedOrder.storeId)
    const responseMessage = getOrderStatusResponseMessage(updatedOrder, store, timeToComplete)
    const orderStatus = {
      orderId: updatedOrder._id,
      onlineOrderId: updatedOrder.onlineOrderId,
      status,
      responseMessage,
      total: updatedOrder.vSum,
      storeAlias: store.alias
    }

    cms.socket.to(updatedOrder.onlineOrderId).emit('updateOrderStatus', orderStatus)
  }
  // send to client app
  if (updatedOrder.restaurantPlusUser) {
    sendOrderNotificationToDevice(updatedOrder._id, status)
  }

  // send notification to all store's devices
  const gSmsDevices = await getGsmsDevices(updatedOrder.storeId);
  await sendNotification(
    gSmsDevices,
    {},
    { actionType: NOTIFICATION_ACTION_TYPE.UPDATE_ORDER, orderId: updatedOrder._id.toString() },
  )
})

// TODO: fix this
const interval = setInterval(() => {
  const externalSocketServer = getExternalSocketIoServer();

  if (externalSocketServer) {
    externalSocketServer.registerAckFunction('createOrderAck', orderToken => {
      sendOrderNotificationToDevice(orderToken, ORDER_RESPONSE_STATUS.ORDER_IN_PROGRESS);
    });

    externalSocketServer.on('connect', socket => {
      socket.on('updateOrderStatus', (orderStatus) => {
        const {onlineOrderId, status, responseMessage} = orderStatus;
        sendOrderNotificationToDevice(onlineOrderId, status, responseMessage);
      });
    });

    clearInterval(interval);
  }
}, 50);

async function sendOrderNotificationToDevice(orderId, status, orderMessage) {
  const order = await OrderModel.findById(orderId);
  if (!order) return;

  const admin = firebaseAdminInstance();
  const storeName = order.storeId.settingName || order.storeId.name;
  const firebaseToken = order.restaurantPlusUser.firebaseToken;

  let notification;

  switch (status) {
    case ORDER_RESPONSE_STATUS.ORDER_IN_PROGRESS: {
      notification = {
        title: 'Order Sent',
        body: `[${storeName}] Your order has been sent, awaiting confirmation from restaurant`,
      }
      break;
    }
    case ORDER_RESPONSE_STATUS.ORDER_CONFIRMED: {
      notification = {
        title: 'Order Confirmed',
        body: `[${storeName}] Your order has been confirmed`,
      }
      break;
    }
    case ORDER_RESPONSE_STATUS.ORDER_CANCELLED: {
      notification = {
        title: 'Order Declined',
        body: `[${storeName}] Your order has been declined`,
      }
    }
  }

  const message = {
    notification,
    apns: {
      payload: {
        aps: {
          'mutable-content': 1
        }
      }
    },
    data: {
      orderId: orderId.toString(),
      status,
      actionType: NOTIFICATION_ACTION_TYPE.ORDER_STATUS,
      ...orderMessage && {orderMessage},
    },
    token: firebaseToken,
  }

  return admin.messaging().send(message);
}

async function getGsmsDevices(storeId) {
  return cms.getModel('Device').find({ $or: [{storeId}, {$and: [{enableMultiStore: true}, {storeIds: {$elemMatch: {$eq: storeId}}}]}], deviceType: 'gsms' })
}

async function sendOrderToStoreDevices(store, orderData) {
  const device = await DeviceModel.findOne({storeId: store._id, 'features.onlineOrdering': true});

  const storeName = store.name || store.settingName;
  const storeAlias = store.alias;

  if (store.gSms && store.gSms.enabled) {
    // const gSmsDevices = await cms.getModel('Device').find({ storeId: store._id.toString(), deviceType: 'gsms' })
    let storeId = store._id.toString();
    const gSmsDevices = await getGsmsDevices(storeId);
    await sendNotification(
      gSmsDevices,
      {
        title: store.name || store.settingName,
        body: `You have a new order!`
      },
      { actionType: NOTIFICATION_ACTION_TYPE.ORDER, orderId: orderData._id.toString() },
    )
  }

  if (!device) {
    if (store.gSms && store.gSms.enabled) return;
    return console.error('No store device with onlineOrdering feature found, created online order will not be saved');
  }

  const deviceId = device._id.toString();
  Object.assign(orderData, {storeName, storeAlias});

  const data = {
    ...orderData,
    products: orderData.items.map(i => ({
      ...i,
      price: +i.price.toFixed(2),
      originalPrice: i.originalPrice ? +i.originalPrice.toFixed(2) : +i.price.toFixed(2),
      ...i.vDiscount && {vDiscount: +i.vDiscount.toFixed(2)},
      id: i.id || ''
    })),
    orderType: orderData.type
  }

  const removePersistentMsg = await getExternalSocketIoServer().emitToPersistent(deviceId, 'createOrder', [data, new Date()],
    'createOrderAck', [orderData._id]);

  /*sendOrderTimeouts[orderData.orderToken] = setTimeout(async () => {
    updateOrderStatus(orderData.orderToken, {onlineOrderId: orderData.orderToken, status: 'failedToSend'})
    console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
        `2b. Online order backend: failed to reach online order device, cancelling order`)
    removePersistentMsg()

    await updateStoreReport(storeId, { orderTimeouts: 1 })
  }, SEND_TIMEOUT);*/
}

function getOrderStatusResponseMessage(order, store, timeToComplete) {
  switch (order.status) {
    case 'kitchen':
      const deliveryDateTime = order.deliveryTime === 'asap'
        ? dayjs().add(timeToComplete, 'minute')
        : dayjs(order.deliveryTime, 'HH:mm')
      const diff = deliveryDateTime.diff(dayjs(order.date), 'minute')
      const storeLocale = store.country.locale || 'en'

      const pluginPath = cms.allPlugins['pos-plugin'].pluginPath
      const localeFilePath = path.join(pluginPath, 'i18n', `${storeLocale}.js`);

      if (fs.existsSync(localeFilePath)) {
        const {[storeLocale]: {store}} = require(localeFilePath)
        if (store && store.deliveryIn && store.pickUpIn) {
          return (order.type === 'delivery' ? store.deliveryIn : store.pickUpIn).replace('{0}', diff)
        }
      }
      return ''
    case 'declined':
      return order.declineReason || ''
    default:
      return ''
  }
}

module.exports = router;
