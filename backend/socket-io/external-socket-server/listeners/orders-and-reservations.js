const ppApiv2 = require('../../../api/payment/paypal/payPalApiV2Adapter');
const createPayPalClient = require('@gigasource/payment-provider/src/PayPal/backend/createPayPalClient');
const _ = require('lodash');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const path = require('path');
const fs = require('fs');
const jsonFn = require('json-fn');
const nodemailer = require('nodemailer');

const {getExternalSocketIOServer} = require('../../external-socket-server');
const {getInternalSocketIOServer} = require('../../internal-socket-server');

const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');
const OrderModel = cms.getModel('Order');
const ReservationModel = cms.getModel('Reservation');

const sendOrderTimeouts = {};
const SEND_ORDER_TIMEOUT = 30000;

const mailTransporter = nodemailer.createTransport({
  pool: true,
  host: APP_CONFIG.mailConfig.host,
  port: 465,
  secure: true,
  auth: {
    user: APP_CONFIG.mailConfig.user,
    pass: APP_CONFIG.mailConfig.pass,
  },
});

function formatOrder(orderData) {
  let {
    orderToken, createdDate, customer, deliveryDateTime,
    discounts, note, orderType, paymentType, products, shippingFee, totalPrice
  } = _.cloneDeep(orderData);

  products = products.map(({id, modifiers, name, note, originalPrice, quantity}) => {
    if (modifiers && modifiers.length) {
      const sumOfModifiers = modifiers.reduce((sum, {price, quantity}) => sum + quantity * price, 0);
      originalPrice = originalPrice + sumOfModifiers;
    }

    return {
      id,
      name,
      originalPrice,
      note,
      modifiers: modifiers.map(({name}) => name).join(', '),
      quantity,
    }
  });

  discounts = discounts.filter(d => d.type !== 'freeShipping').reduce((sum, discount) => sum + discount.value, 0);

  if (deliveryDateTime === 'asap') {
    const timeToComplete = store.gSms.timeToComplete || 30;
    deliveryDateTime = dayjs().add(timeToComplete, 'minute').toDate();
  }
  deliveryDateTime = jsonFn.clone(deliveryDateTime); //stringify

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
  }
}

async function updateStoreReport(storeId, change) {
  const store = await StoreModel.findById(storeId).lean();
  if (!store) return;

  let {lastSyncAt, prevMonthReport, currentMonthReport} = store;
  const newMonth = !lastSyncAt || dayjs().isAfter(dayjs(lastSyncAt), 'month');

  if (newMonth) {
    prevMonthReport = currentMonthReport;
    currentMonthReport = Object.assign({orders: 0, total: 0, reservations: 0, orderTimeouts: 0}, change);
  } else {
    const newVal = _.reduce(currentMonthReport, (acc, val, key) => {
      if (!change[key]) {
        return {...acc, [key]: val}
      }
      return {
        ...acc,
        [key]: (val || 0) + change[key]
      }
    }, {});
    currentMonthReport = Object.assign({}, currentMonthReport, newVal);
  }

  await StoreModel.findOneAndUpdate({_id: storeId}, {
    $set: {lastSyncAt: new Date(), prevMonthReport, currentMonthReport},
  });
}

async function updateOrderStatus(orderToken, status) {
  const storeName = status ? status.storeName : '';
  const storeAlias = status ? status.storeAlias : '';
  const internalSocketIOServer = getInternalSocketIOServer();

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.1. Online order backend: update order status, status = ${status.status}`, JSON.stringify(sendOrderTimeouts));

  if (sendOrderTimeouts[orderToken]) {
    console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
      `10.2. Online order backend: clear timeout, status = ${status.status}`);

    clearTimeout(sendOrderTimeouts[orderToken]);
    delete sendOrderTimeouts[orderToken];
  }

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.3. Online order backend: emit status to frontend, status = ${status.status}`, JSON.stringify(sendOrderTimeouts));
  internalSocketIOServer.to(orderToken).emit('updateOrderStatus', status);

  if (status.status === 'kitchen') {
    const {storeAlias, total} = status;
    if (!storeAlias) return;

    const store = await StoreModel.findOne({alias: storeAlias}).lean();
    await updateStoreReport(store._id, {orders: 1, total});
  }

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.4. Online order backend: update db, status = ${status.status}`);
  await OrderModel.findOneAndUpdate({onlineOrderId: orderToken}, {status: status.status});
}

async function sendReservationConfirmationEmail(reservation, storeId) {
  try {
    const {customer: {email, firstName, lastName, phone}, noOfGuests, date, time, note} = reservation;
    if (!email) return;

    const store = await StoreModel.findOne({id: storeId});
    const storeName = store.name || store.settingName;

    const locale = (store.country && store.country.locale && store.country.locale.substring(0, 2).toLowerCase()) || 'en';

    const subject = {
      'en': `Reservation Confirm for ${storeName}`,
      'de': `Reservierungsbestätigung für ${storeName}`
    };

    const reservationMailTemplate = {
      'en': `<h3>Hello ${lastName},</h3> 
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
      'de': `<h3>Sehr geehrte/r Frau/Herr ${lastName},</h3> 
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
    };

    const message = {
      from: 'no-reply@restaurant.live',
      to: email,
      subject: subject[locale],
      html: reservationMailTemplate[locale],
    };

    mailTransporter.sendMail(message, err => {
      if (err) console.log(err);
    });
  } catch (e) {
    console.log(e);
  }
}

async function initPayPalClient(storeAlias) {
  const store = await StoreModel.findOne({alias: storeAlias});
  if (!store || !store.paymentProviders || !store.paymentProviders.paypal ||
    _.trim(store.paymentProviders.paypal.clientId) === "" || _.trim(store.paymentProviders.paypal.secretToken) === "") {
    const errMessage = "PayPal provider is not installed";
    console.debug('sentry:eventType=orderStatus,paymentType=paypal', `2. Error: ${errMessage}. Info: store_alias=${storeAlias}`);
    cb && cb({error: errMessage});
    throw errMessage;
  }
  const {clientId, secretToken} = store.paymentProviders.paypal;
  return createPayPalClient(clientId, secretToken);
}

function createOrderAndReservationEventListeners(socket) {
  socket.on('refundOrder', async (order, cb) => {
    const {paypalOrderDetail: pp, storeAlias} = order;

    // paypal payment
    if (pp && pp.orderID && pp.captureResponses) {
      try {
        const ppClient = await initPayPalClient(storeAlias);
        const orderDetail = (await ppApiv2.orderDetail(ppClient, pp.orderID)).result;
        const purchaseUnits = orderDetail.purchase_units;
        // get all current refund transactions
        let finalRefunds = [];
        _.each(purchaseUnits, pu => {
          if (pu.payments.refunds && pu.payments.refunds.length) {
            finalRefunds.push(..._.map(pu.payments.refunds, refund => {
              // refund.links = [{ href: '../refunds/refundId, ... }, { href: '.../captures/captureId', ... } ]
              const captureHATEOS = refund.links[1].href;
              const captureId = captureHATEOS.substr(captureHATEOS.lastIndexOf("/") + 1);
              return {
                id: refund.id,
                captureId: captureId,
                status: refund.status,
              };
            }));
          }
        });

        // get all completed capture (not refunded) transactions
        // then try to refund
        let completedCaptures = [];
        _.each(purchaseUnits, pu => {
          completedCaptures.push(..._.filter(pu.payments.captures, capture => capture.status === "COMPLETED"));
        });

        if (completedCaptures.length) {
          const refundResponses = await Promise.all(_.map(completedCaptures, capture => {
            try {
              const refundBody = {amount: capture.amount, note_to_payer: "Order cancelled"};
              return ppApiv2.refundOrder(ppClient, capture.id, refundBody);
            } catch (e) {
              return {error: e.message};
            }
          }));

          const responseData = _.map(refundResponses, (response, index) => {
            if (!response || !response.result || response.result.status !== "COMPLETED")
              return {
                status: "ERROR",
                detail: response.error,
                captureId: completedCaptures[index].id,
              }
            else
              return {
                ..._.pick(response.result, ['id', 'status']),
                captureId: completedCaptures[index].id,
              }
          });

          // each time we use refund api, new refund id will be returned (eventhough with the same captureId)
          // incase we retry refund the failed refund, we need to update it
          _.each(responseData, rd => {
            const oldRdIndex = _.findIndex(finalRefunds, r => r.captureId === rd.captureId);
            if (oldRdIndex === -1) {
              finalRefunds.push(rd);
            } else {
              finalRefunds[oldRdIndex] = rd;
            }
          });
        }

        cb && cb({responseData: finalRefunds || []});
      } catch (e) {
        console.debug(`sentry:eventType=refundOrder,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'RefundError');
        cb && cb({error: e.message});
      }
    } else {
      cb && cb({error: "No refund available"});
    }
  });

  socket.on('updateOnlineReservation', async (reservation, tag, deviceId, callback) => {
    const _id = reservation.onlineReservationId;
    delete(reservation._id);
    const date = dayjs(reservation.date).format('YYYY-MM-DD');
    const time = dayjs(reservation.date).format('HH:mm');
    const device = await DeviceModel.findById(deviceId);
    console.debug(`sentry:eventType=reservation,store=${device.storeId},device=${deviceId}`,
      `Online order backend: receive reservation info from device`);

    switch (tag) {
      case 'create':
        const onlineReservation = await ReservationModel.create(Object.assign({}, reservation, {store: device.storeId, date, time}));
        callback(onlineReservation._id); //update device online reservation id
        break;
      case 'update':
        await ReservationModel.findOneAndUpdate({_id}, Object.assign({}, reservation, {date, time}));
        break;
      case 'delete':
        await ReservationModel.deleteOne({_id});
        break;
      default:
        break;
    }
  })

  socket.on('getReservationSetting', async (deviceId, callback) => {
    const device = await DeviceModel.findById(deviceId);
    if (!device) return callback(null);

    const store = await StoreModel.findById(device.storeId);
    if (!store) return callback(null);

    callback({
      ...store.reservationSetting,
      openHours: store.openHours,
    })
  });

  socket.on('updateOrderStatus', async (orderStatus, cb) => {
    const {onlineOrderId, status, paypalOrderDetail, storeName, storeAlias} = orderStatus
    console.debug(`sentry:orderToken=${onlineOrderId},store=${storeName},alias=${storeAlias},clientId=${clientId},eventType=orderStatus`,
      `10. Online order backend: received order status from restaurant, status = ${status}`);

    // NOTE: cashPayment may have paypalOrderDetail is empty object
    const isPaypalPayment = paypalOrderDetail && paypalOrderDetail.orderID;
    const isCashPayment = !isPaypalPayment; // more provider here

    // skip 'completed' status
    if (status === "completed") return;

    if (isCashPayment) return updateOrderStatus(onlineOrderId, orderStatus);

    switch (status) {
      case 'declined':
        await updateOrderStatus(onlineOrderId, orderStatus);
        break;
      case 'kitchen':
        if (isPaypalPayment) {
          try {
            const ppClient = await initPayPalClient(storeAlias);
            let captureResult;
            const orderDetail = (await ppApiv2.orderDetail(ppClient, paypalOrderDetail.orderID)).result;
            if (orderDetail.status === "COMPLETED") {
              captureResult = _.pick(orderDetail, ['id', 'links', 'payer', 'status']);
              captureResult.purchase_units = orderDetail.purchase_units.map(pu => _.pick(pu, ['reference_id', 'payments']));
            } else {
              captureResult = (await ppApiv2.captureOrder(ppClient, paypalOrderDetail.orderID)).result;
            }
            console.debug(`sentry:eventType=orderStatus,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'CaptureSuccess', JSON.stringify(captureResult));
            cb && cb({result: captureResult.status, responseData: captureResult});
            await updateOrderStatus(onlineOrderId, orderStatus);
          } catch (e) {
            console.debug(`sentry:eventType=orderStatus,paymentType=paypal,store=${storeAlias},paypalMode=${process.env.PAYPAL_MODE}`, 'CaptureError');
            cb && cb({error: e.message});
          }
        }
        break;
      case 'completed':
        break;
      default:
        console.warn('Invalid order status', status);
        break;
    }
  });
}

module.exports = createOrderAndReservationEventListeners;
