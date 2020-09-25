const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');
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



async function sendReservationConfirmationEmail(reservation, storeId) {
  try {
    const {customer: {email, firstName, lastName, phone}, noOfGuests, date, time, note} = reservation;
    if (!email) return;

    const store = await StoreModel.findOne({id: storeId});
    const storeName = store.name || store.settingName;

    const locale = (store.country && store.country.locale && store.country.locale.substring(0, 2).toLowerCase()) || 'en';

    const subject = {
      'en' : `Reservation Confirm for ${storeName}`,
      'de' : `Reservierungsbestätigung für ${storeName}`
    };

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

function createOrderAndReservationEventListeners(socket) {
  socket.on('createOrder', async (storeId, orderData) => {
    const internalSocketIOServer = getInternalSocketIOServer();
    const externalSocketIOServer = getExternalSocketIOServer();

    storeId = ObjectId(storeId);
    const device = await DeviceModel.findOne({storeId, 'features.onlineOrdering': true});

    const store = await StoreModel.findById(storeId);
    const storeName = store.name || store.settingName;
    const storeAlias = store.alias;

    let {
      orderType: type, paymentType, customer, products,
      createdDate, timeoutDate, shippingFee, note, orderToken,
      discounts, deliveryTime, paypalOrderDetail, forwardedStore,
    } = orderData;

    const order = {
      storeId,
      items: products.map(i => ({
        ...i,
        price: i.price.toFixed(2),
        originalPrice: i.originalPrice ? i.originalPrice.toFixed(2) : i.price.toFixed(2),
        ...i.vDiscount && {vDiscount: i.vDiscount.toFixed(2)},
        id: i.id || '',
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
    };
    await OrderModel.create(order);

    if (forwardedStore) {
      const s = await StoreModel.findById(forwardedStore);
      Object.assign(orderData, {forwardedStore: s});
    }

    if (store.gSms && store.gSms.enabled) {
      const externalSocketIOServer = getExternalSocketIOServer();
      cms.emit('sendOrderMessage', storeId, orderData); // send fcm message

      const demoDevices = store.gSms.devices;
      const formattedOrder = formatOrder(orderData);
      demoDevices.filter(i => i.registered).forEach(({_id}) => {
        /** @deprecated */
        const targetClientIdOld = `${store.id}_${_id.toString()}`;
        externalSocketIOServer.emitToPersistent(targetClientIdOld, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total]);

        const targetClientId = _id.toString();
        externalSocketIOServer.emitToPersistent(targetClientId, 'createOrder', [formattedOrder], 'demoAppCreateOrderAck', [store.id, _id, formattedOrder.total]);
        console.debug(`sentry:clientId=${targetClientId},store=${storeName},alias=${storeAlias},orderToken=${orderData.orderToken},eventType=orderStatus`,
          `2a. Online order backend: received order from frontend, sending to demo device`);
      })
    }

    if (!device) {
      socket.join(orderData.orderToken);

      if (store.gSms && store.gSms.enabled) {
        // accept order on front-end
        const timeToComplete = store.gSms.timeToComplete || 30;
        const locale = store.country.locale || 'en';
        const pluginPath = cms.allPlugins['pos-plugin'].pluginPath;
        const localeFilePath = path.join(pluginPath, 'i18n', `${locale}.js`);
        let responseMessage = '';

        if (fs.existsSync(localeFilePath)) {
          const {[locale]: {store}} = require(localeFilePath);
          if (store && store.deliveryIn && store.pickUpIn) {
            responseMessage = (
              orderData.orderType === 'delivery'
                ? store.deliveryIn
                : store.pickUpIn).replace('{0}', timeToComplete);
          }
        }

        return updateOrderStatus(orderData.orderToken,
          {
            storeName, storeAlias, onlineOrderId: orderData.orderToken, status: 'kitchen',
            responseMessage, total: orderData.totalPrice - (_.sumBy(orderData.discounts, i => i.value) || 0),
          });
      }
      internalSocketIOServer.to(orderData.orderToken).emit('noOnlineOrderDevice', orderData.orderToken);
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
      await updateOrderStatus(orderData.orderToken, {onlineOrderId: orderData.orderToken, status: 'failedToSend'});
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias},clientId=${deviceId},eventType=orderStatus`,
        `2b. Online order backend: failed to reach online order device, cancelling order`);
      removePersistentMsg();

      await updateStoreReport(storeId, {orderTimeouts: 1});
    }, SEND_ORDER_TIMEOUT);
  });

  socket.on('createReservation', async (storeId, reservationData, callback) => {
    const externalSocketIOServer = getExternalSocketIOServer();

    storeId = ObjectId(storeId);
    const store = await StoreModel.findById(storeId);

    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayjs(reservationData.date).day()];

    let availableSeat;
    const seatLimit = store.reservationSetting.seatLimit.find(limit =>
      (limit.startTime <= reservationData.time
        && limit.endTime >= reservationData.time
        && limit.days.includes(day)));

    if (seatLimit) {
      const reservations = await ReservationModel.find({
        store: storeId,
        date: reservationData.date,
        time: {$gte: seatLimit.startTime, $lte: seatLimit.endTime},
      })
      availableSeat = seatLimit.seat - reservations.reduce((seat, r) => (seat + r.noOfGuests), 0);
    }

    if (availableSeat && availableSeat < reservationData.noOfGuests) {
      console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
        `2. Online order backend: not enough available seat for reservation`);
      callback({error: true});
    } else {
      const device = await DeviceModel.findOne({storeId, 'features.reservation': true});
      const reservation = await ReservationModel.create(Object.assign({}, reservationData, {store: storeId}));
      await updateStoreReport(storeId, {reservations: reservationData.noOfGuests});

      if (device) {
        const deviceId = device._id.toString();
        await externalSocketIOServer.emitToPersistent(deviceId, 'createReservation', [{
          ...reservationData,
          onlineReservationId: reservation._id,
        }]);
        console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
          `2. Online order backend: sent reservation to device`);
      } else {
        console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias}`,
          `2. Online order backend: no device found, cancelled sending`);
      }

      if (store.gSms && store.gSms.enabled) {
        cms.emit('sendReservationMessage', storeId, reservationData);
        const demoDevices = store.gSms.devices;
        demoDevices.filter(i => i.registered).forEach(({_id}) => {
          /** @deprecated */
          const targetClientIdOld = `${store.id}_${_id}`;
          externalSocketIOServer.emitToPersistent(targetClientIdOld, 'createReservation', [{
            ...reservationData,
            _id: reservation._id,
          }]);

          const targetClientId = _id;
          externalSocketIOServer.emitToPersistent(targetClientId, 'createReservation', [{
            ...reservationData,
            _id: reservation._id,
          }]);
          console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},deviceId=${targetClientId}`,
            `2a. Online order backend: sent reservation to demo device`);
        });
      }

      if (store.reservationSetting && store.reservationSetting.emailConfirmation) {
        await sendReservationConfirmationEmail(reservationData, store.id);
      }
      callback({success: true});
    }
  });

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
}

module.exports = createOrderAndReservationEventListeners;
