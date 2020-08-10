const express = require('express');
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
const {firebaseAdminInstance} = require('../firebase-messaging/admin');
const {ORDER_RESPONSE_STATUS, NOTIFICATION_ACTION_TYPE, PROMOTION_DISCOUNT_TYPE, VOUCHER_STATUS} = require('./constants');
const jsonFn = require('json-fn');
const {findVouchers} = require('./vouchers');

const mapperConfig = {
  _id: '_id',
  'storeId.logoImageSrc': 'store.logoImageSrc',
  'storeId.settingName': {
    key: 'store.name',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.storeId.name
  },
  date: 'date',
  vSum: 'orderSum',
  vDiscount: "orderDiscountValue",
  itemCount: 'itemCount',
  paymentType: 'paymentType',
  shippingFee: 'shippingFee',
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

router.get('/', async (req, res) => {
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

router.get('/by-id/:orderId', async (req, res) => {
  const {orderId} = req.params;
  if (!orderId) return respondWithError(res, 400, 'Missing property in request');

  const order = await OrderModel.findById(orderId);
  if (!order) respondWithError(res, 400, 'Invalid order ID');

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
router.post('/', async (req, res) => {
  const {order} = req.body
  let {
    storeId, items, type, customer, payment, note, deliveryTime, date, user, voucher, shippingFee, total,
    timeoutDate
  } = jsonFn.clone(order, true);

  const store = await StoreModel.findById(storeId)
  if (!store) return respondWithError(res, 400, 'Invalid store ID!');

  let orderSum = (calOrderTotal(items) + calOrderModifier(items) + +shippingFee);
  let orderDiscountValue = 0;

  if (voucher) {
    voucher = await findVouchers(voucher._id);

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
  });

  await OrderModel.updateOne({_id: newOrder._id}, {onlineOrderId: newOrder._id});

  // including tablets & Restaurant Plus manager app
  sendOrderToStoreDevices(store._id, newOrder.toObject());

  UserModel.updateOne({_id: user._id}, {
    lastUsedAddress: {
      address: customer.address,
      zipCode: customer.zipCode
    }
  }).exec();

  res.status(201).json(objectMapper(newOrder, mapperConfig));
});

setTimeout(() => {
  getExternalSocketIoServer().registerAckFunction('createOrderAck', async orderToken => {
    await sendOrderNotificationToDevice(orderToken, ORDER_RESPONSE_STATUS.ORDER_IN_PROGRESS);
  });

  getExternalSocketIoServer().on('connect', socket => {
    socket.on('updateOrderStatus', async (orderStatus) => {
      const {onlineOrderId, status, responseMessage} = orderStatus
      await sendOrderNotificationToDevice(onlineOrderId, status, responseMessage);
    });
  });
}, 5000);

async function sendOrderNotificationToDevice(orderId, status, orderMessage) {
  const order = await OrderModel.findById(orderId);
  if (!order) return;

  const admin = firebaseAdminInstance();
  const storeName = order.settingName || order.name;
  const firebaseToken = rpUser.firebaseToken;

  let notification;

  switch (status) {
    case ORDER_RESPONSE_STATUS.ORDER_IN_PROGRESS: {
      notification = {
        title: 'Order Sent',
        body: `[${storeName}] Your order has been sent, awaiting confirmation form restaurant`,
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
    data: {
      orderId,
      status,
      actionType: NOTIFICATION_ACTION_TYPE.ORDER_STATUS,
      ...orderMessage && {orderMessage},
    },
    token: firebaseToken,
  }

  return admin.messaging().send(message);
}

async function sendOrderToStoreDevices(storeId, orderData) {
  storeId = ObjectId(storeId);
  const device = await DeviceModel.findOne({storeId, 'features.onlineOrdering': true});
  const store = await StoreModel.findById(storeId);

  const storeName = store.name || store.settingName;
  const storeAlias = store.alias;

  if (store.gSms && store.gSms.enabled) {
    cms.emit('sendOrderMessage', storeId, orderData) // send fcm message

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

      discounts = discounts.reduce((sum, discount) => sum + discount.value, 0)

      if (deliveryDateTime === 'asap') {
        const timeToComplete = store.gSms.timeToComplete || 30;
        deliveryDateTime = dayjs().add(timeToComplete, 'minute').toDate()
      }
      deliveryDateTime = jsonFn.clone(deliveryDateTime) //stringify

      customer = {
        name: customer.name,
        phoneNumber: customer.phoneNumber,
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
        discounts
      }
    }

    const demoDevices = store.gSms.devices
    demoDevices.filter(i => i.registered).forEach(({_id}) => {
      const formattedOrder = formatOrder(orderData);

      /** @deprecated */
      const targetClientIdOld = `${store.id}_${_id.toString()}`;
      getExternalSocketIoServer.emitToPersistent(targetClientIdOld, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total])

      const targetClientId = _id.toString();
      getExternalSocketIoServer.emitToPersistent(targetClientId, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total])
      console.debug(`sentry:clientId=${targetClientId},store=${storeName},alias=${storeAlias},orderToken=${orderData.orderToken},eventType=orderStatus`,
          `2a. Online order backend: received order from frontend, sending to demo device`);
    })
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
      return;
    }

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
  }
  const removePersistentMsg = await getExternalSocketIoServer().emitToPersistent(deviceId, 'createOrder', [data, new Date()],
      'createOrderAck', [orderData.orderToken, storeName, storeAlias, deviceId]);

  /*sendOrderTimeouts[orderData.orderToken] = setTimeout(async () => {
    updateOrderStatus(orderData.orderToken, {onlineOrderId: orderData.orderToken, status: 'failedToSend'})
    console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
        `2b. Online order backend: failed to reach online order device, cancelling order`)
    removePersistentMsg()

    await updateStoreReport(storeId, { orderTimeouts: 1 })
  }, SEND_TIMEOUT);*/
}

module.exports = router;
