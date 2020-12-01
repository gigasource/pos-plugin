const StoreModel = cms.getModel("Store");
const OrderModel = cms.getModel("Order");
const DeviceModel = cms.getModel("Device");
const UserModel = cms.getModel("RPUser");
const VoucherModel = cms.getModel("RPVoucher");

const path = require('path');
const fs = require('fs');
const {getDistance} = require('../utils');
const {getExternalSocketIoServer} = require('../../../backend/socket-io-server');
const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
const dayjs = require('dayjs');
const {firebaseAdminInstance} = require('../../app-notification/firebase-messaging/admin');
const {ORDER_RESPONSE_STATUS, NOTIFICATION_ACTION_TYPE, PROMOTION_DISCOUNT_TYPE, VOUCHER_STATUS} = require('../constants');
const jsonFn = require('json-fn');
const {sendNotification} = require('../../app-notification');
const {findVouchers} = require('../vouchers');

function calOrderTotal(items) {
  return _.sumBy(items, item => +(item.quantity * item.price));
}

function calOrderModifier(items) {
  return _.sumBy(items, item => item.modifiers ? _.sum(item.modifiers.map(i => i.price)) * item.quantity : 0);
}

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
  return cms.getModel('Device').find({ $or: [{storeId}, {storeIds: {$elemMatch: {$eq: storeId}}}], deviceType: 'gsms' })
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
      let deliveryDateTime;
      if (order.deliveryTime === 'asap') {
        deliveryDateTime = dayjs().add(timeToComplete, 'minute')
      } else {
        const _deliveryTime = new Date(order.deliveryTime)
        if (isNaN(_deliveryTime)) { // if not ISO format
          const timeRegex = new RegExp(/^([01]\d|2[0-3]):?([0-5]\d)$/)
          if (timeRegex.test(order.deliveryTime.trim())) { // if HH:mm format
            const [hour, minute] = order.deliveryTime.split(':')
            deliveryDateTime = dayjs(order.date).hour(hour).minute(minute)
          } else { // fallback to current date
            deliveryDateTime = dayjs()
          }
        } else { // ISO format
          deliveryDateTime = dayjs(_deliveryTime)
        }
      }

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

async function getOrderById(orderId) {
  return OrderModel.findById(orderId);
}

async function getStoreById(storeId) {
  return StoreModel.findById(storeId);
}

async function getUserOrders(userId) {
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

  return userOrders;
}

async function calculateShippingFee(store, customerAddress, customerZipCode) {
  if (store.deliveryFee.type === 'zipCode') {
    const zipCodeFees = (store.deliveryFee.zipCodeFees || []).map(({zipCode, fee, minOrder}) => {
      if (zipCode.includes(',') || zipCode.includes(';')) {
        zipCode = zipCode.replace(/\s/g, '').replace(/;/g, ',').split(',')
      }
      return Array.isArray(zipCode) ? zipCode.map(code => ({zipCode: code, fee, minOrder: minOrder || 0})) : {
        zipCode,
        fee,
        minOrder: minOrder || 0
      }
    }).flat()

    for (const deliveryFee of zipCodeFees) {
      if (deliveryFee.zipCode.trim().toLowerCase() === customerZipCode.toString().trim().toLowerCase()) {
        return {shippingFee: deliveryFee.fee};
      }
    }

    if (store.deliveryFee.acceptOrderInOtherZipCodes) {
      return {shippingFee: store.deliveryFee.defaultFee};
    }
  }

  if (store.deliveryFee.type === 'distance') {
    let distance = await getDistance(customerAddress, customerZipCode, store.coordinates)

    if (distance === undefined || distance === null) return {
      error: "Can't calculate the distance between restaurant and customer!",
    }

    if (distance >= 0) {
      for (const deliveryFee of _.sortBy(store.deliveryFee.distanceFees, 'radius')) {
        if (distance < deliveryFee.radius) {
          return {shippingFee: deliveryFee.fee};
        }
      }
    }
  }
}

async function createOrder(order) {
  let {
    storeId, items, type, customer, payment, note, deliveryTime, date, user, voucher, shippingFee,
    timeoutDate, deliveryDateTime,
  } = jsonFn.clone(order, true);

  customer.phone = customer.phoneNumber;
  delete customer.phoneNumber;

  const store = await StoreModel.findById(storeId)
  if (!store) {
    return {error: 'Invalid store ID!'};
  }

  let orderSum = (calOrderTotal(items) + calOrderModifier(items) + +shippingFee);
  let orderDiscountValue = 0;

  if (voucher) {
    voucher = await findVouchers({
      voucherId: voucher._id,
      status: VOUCHER_STATUS.UNUSED,
      usable: true,
    });

    if (voucher.length) voucher = voucher[0];
    else return {error: 'Invalid voucher'};

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

  return {newOrder};
}

async function updateOrderStatus(orderId, status, timeToComplete, declineReason) {
  const orderSearchQuery = orderId.includes('-') ? {onlineOrderId: orderId} : {_id: ObjectId(orderId)};

  const oldOrder = await cms.getModel('Order')
    .findOne(orderSearchQuery);

  // avoid duplicating actions, if other fields needs updating, create another function
  if (status === oldOrder.status) return;

  const updatedOrder = await cms.getModel('Order').findOneAndUpdate(
    orderSearchQuery,
    {
      status,
      ...(status === 'kitchen' && !isNaN(+timeToComplete)) && {
        timeToComplete: +timeToComplete,
        deliveryTime: dayjs(oldOrder.date).add(+timeToComplete, 'minute').toDate().toISOString(),
      },
      ...(status === 'declined' && declineReason) && {declineReason},
    }, {new: true});

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
    // no need to wait
    sendOrderNotificationToDevice(updatedOrder._id, status);
  }

  // send notification to all store's devices
  const gSmsDevices = await getGsmsDevices(updatedOrder.storeId);

  // no need to wait
  sendNotification(
    gSmsDevices,
    {},
    {actionType: NOTIFICATION_ACTION_TYPE.UPDATE_ORDER, orderId: updatedOrder._id.toString()},
  );

  return updatedOrder;
}

module.exports = {
  getUserOrders,
  getOrderById,
  getStoreById,
  calculateShippingFee,
  createOrder,
  updateOrderStatus,
  sendOrderNotificationToDevice,
}
