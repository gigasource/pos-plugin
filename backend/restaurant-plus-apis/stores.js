const _ = require('lodash')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');
const {getExternalSocketIoServer} = require('../socket-io-server');
const {respondWithError} = require('./utils');
const {firebaseAdminInstance} = require('../app-notification/firebase-messaging/admin')
const apn = require('apn')
const { getApnProvider } = require('../app-notification/apn-provider/provider');
const UserModel = cms.getModel('RPUser');
const {jwtValidator} = require('./api-security');
const {NOTIFICATION_ACTION_TYPE} = require('./constants');
const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(isBetween)
dayjs.extend(isSameOrAfter)
dayjs.extend(customParseFormat)

const mapperConfig = {
  _id: '_id',
  id: 'id',
  name: 'name',
  address: 'address',
  settingName: 'settingName',
  settingAddress: 'settingAddress',
  townCity: 'city',
  'country.name': 'country',
  zipCode: 'zipCode',
  openHours: 'openHours',
  phone: 'phone',
  onlineOrdering: 'onlineOrdering',
  pickup: 'pickup',
  reservationSetting: 'reservationSetting',
  calcDistance: 'calcDistance',
  logoImageSrc: 'logoImageSrc',
  orderHeaderImageSrc: 'orderHeaderImageSrc',
  location: 'location',
  clientDomain: 'clientDomain',
  displayImage: 'displayImage',
  displayId: 'displayId',
  orderTimeOut: 'orderTimeOut',
  delivery: 'delivery'
};

const StoreModel = cms.getModel('Store');

router.get('/by-id/:storeId', async (req, res) => {
  const {storeId} = req.params;
  const {coordinates} = req.query
  if (!storeId) return respondWithError(res, 400, 'Missing store ID in request');

  let store;
  if (coordinates) {
    const [long, lat] = coordinates.split(',')

    const stores = await StoreModel.aggregate([
      {
        $geoNear: {
          near: {type: 'Point', coordinates: [+long, +lat]},
          distanceField: 'calcDistance',
          spherical: true,
          query: {_id: ObjectId(storeId)}
        }
      }
    ]);

    store = stores[0]
  } else {
    store = await StoreModel.findById(storeId);
  }

  res.status(200).json(objectMapper(store, mapperConfig));
});

router.get('/followed-by-user/:userId', jwtValidator, async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing property in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user ID');

  const {followedStores, location} = user;

  if (followedStores && followedStores.length && location && location.coordinates) {
    const long = location.coordinates[0];
    const lat = location.coordinates[1];

    const storeIds = followedStores.map(e => e._id);
    const storesWithDistance = await geoNearQuery({
      long, lat, query: {_id: {$in: storeIds}}
    });
    res.status(200).json(storesWithDistance);
  } else {
    res.status(200).json([]);
  }
});

router.get('/nearby', async (req, res) => {
  const {coordinates, maxDistance, limit} = req.query
  const [long, lat] = coordinates.split(',')

  const nearbyStores = await geoNearQuery({long, lat, maxDistance, limit});

  const mappedStores = nearbyStores.map(store => {
    return _.pick(store, ['_id', 'id', 'name', 'address', 'settingName', 'settingAddress', 'townCity', 'country',
      'zipCode', 'openHours', 'phone', 'location', 'googleMapPlaceId', 'onlineOrdering', 'delivery', 'pickup',
      'reservationSetting', 'calcDistance', 'logoImageSrc', 'orderHeaderImageSrc', 'displayId', 'displayImage', 'orderTimeOut'])
  })

  res.status(200).json(mappedStores.map(e => objectMapper(e, mapperConfig)))
});

function geoNearQuery({long, lat, maxDistance, limit, query}) {
  const aggregateSteps = [
    {
      $geoNear: {
        near: {type: 'Point', coordinates: [+long, +lat]},
        ...maxDistance && {maxDistance: +maxDistance},
        distanceField: 'calcDistance',
        ...query && {query},
        spherical: true
      }
    },
  ];

  if (limit) aggregateSteps.push({$limit: +limit});

  return StoreModel.aggregate(aggregateSteps);
}

router.get('/:id/menu', async (req, res) => {
  const {id} = req.params
  if (!id) res.sendStatus(400)

  const products = await cms.getModel('Product').find({store: id}).lean()
  const categories = await cms.getModel('Category').find({store: id}).lean()

  res.status(200).json({products, categories})
})

router.post('/reservation', jwtValidator, async (req, res) => {
  const {storeId, reservation} = req.body
  if (!storeId || !reservation) res.sendStatus(400)

  const store = await StoreModel.findById(storeId)
  const newReservation = await cms.getModel('Reservation').create({...reservation, store: storeId})
  console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},reservationId=${newReservation._id}`,
    `1. Online order backend: received new reservation from end user`)

  if (store.gSms && store.gSms.enabled) {
    cms.emit('sendReservationMessage', storeId, reservation)
    const demoDevices = store.gSms.devices
    demoDevices.filter(i => i.registered).forEach(({_id}) => {
      const targetClientId = _id;
      getExternalSocketIoServer().emitToPersistent(targetClientId, 'createReservation', [newReservation._doc])
      console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},deviceId=${targetClientId},reservationId=${newReservation._id}`,
        `2. Online order backend: sent reservation to manager app device`)
    })
  }

  res.sendStatus(200)
})

router.get('/reservations', jwtValidator, async (req, res) => {
  const {userId} = req.query
  if (!userId) return res.sendStatus(400)

  const reservations = await cms.getModel('Reservation').aggregate([
    {$match: {userId: ObjectId(userId)}},
    {
      $lookup: {
        from: 'stores',
        localField: 'store',
        foreignField: '_id',
        as: 'store',
      }
    },
    {$unwind: {path: '$store', preserveNullAndEmptyArrays: true}},
    {$set: {logoImageSrc: '$store.logoImageSrc', storeName: '$store.name'}},
    {$unset: 'store'}
  ])
  res.status(200).json(reservations)
})

router.get('/reservations/time-slots/', async (req, res) => {
  const { storeId, date } = req.query
  if (!storeId || !date) return res.sendStatus(400)

  const inputDate = dayjs(date)
  let startTime = inputDate.startOf('day')
  let endTime = inputDate.endOf('day')
  const store = await StoreModel.findById(storeId)

  const timeSlots = []

  // has open/close time
  if (store.openHours) {
    for (const settings of store.openHours) {
      if (settings.dayInWeeks[inputDate.day()]) {
        const [startHour, startMinute] = settings.openTime.split(':')
        startTime = startTime.hour(+startHour).minute(+startMinute)
        const [endHour, endMinute] = settings.closeTime.split(':')
        endTime = endTime.hour(+endHour).minute(+endMinute)
      }
    }
  }

  if (inputDate.isSame(dayjs(), 'day')) {
    startTime = dayjs().add(2, 'hour').minute(0)
    if (startTime.isBefore(dayjs().add(2, 'hour'))) startTime = startTime.add(30, 'minute')
  }
  timeSlots.push(...getTimeSlots(startTime, endTime))

  // has seat limit settings
  if (store.reservationSetting.seatLimit && store.reservationSetting.seatLimit.length) {
    const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = daysInWeek[inputDate.day()]
    const seatLimits = store.reservationSetting.seatLimit

    const reservations = await cms.getModel('Reservation').find({
      store: storeId,
      date: inputDate.format('YYYY-MM-DD')
    }).lean()

    for (const seatLimit of seatLimits) {
      if (seatLimit.days.includes(day)) {
        const startTime = dayjs(`${inputDate.format('YYYY-MM-DD')} ${seatLimit.startTime}`, 'YYYY-MM-DD HH:mm')
        const endTime = dayjs(`${inputDate.format('YYYY-MM-DD')} ${seatLimit.endTime}`, 'YYYY-MM-DD HH:mm')

        const reservationsInSlot = reservations.filter(r => {
          return dayjs(`${r.date} ${r.time}`, 'YYYY-MM-DD HH:mm').isBetween(startTime, endTime, '[]')
        })

        const guestsInSlot = _.sumBy(reservationsInSlot, 'noOfGuests')
        if (guestsInSlot >= seatLimit.seat) _.pullAll(timeSlots, getTimeSlots(startTime, endTime))
      }
    }

  }

  const sortedSlots = timeSlots.sort((cur, next) => cur.localeCompare(next))
  res.status(200).json(sortedSlots)

  function getTimeSlots(start, end) {
    let startTime = dayjs(start)
    startTime = startTime.minute(30).isBefore(startTime)
      ? startTime.add(1, 'hour').minute(0)
      : startTime.minute(30)

    const endTime = dayjs(end)
    if (startTime.isSameOrAfter(endTime)) return []

    const list = [];
    while (!startTime.isAfter(endTime)) {
      list.push(startTime.format('HH:mm'))
      startTime = startTime.add(30, 'minute')
    }
    return list
  }
})

router.get('/table-request/:requestId', async (req, res) => {
  const { requestId } = req.params
  if (!requestId) return res.sendStatus(400)

  const request = await cms.getModel('RPTableRequest').findById(requestId).lean()
  res.status(200).json(request)
})

router.post('/table-request', async (req, res) => {
  const { request } = req.body
  if (!request) return res.sendStatus(400)

  const newRequest = await cms.getModel('RPTableRequest').create({
    ...request,
    status: 'pending'
  })

  console.log(newRequest)
  res.status(200).json(newRequest)

  const devices = await getManagerDevices(request.storeId)
  if (!devices.length) return
  await sendNotification(
    devices,
    {
      title: 'New Table',
      body: `New table request at ${dayjs(request.date).format('HH:mm')} for ${request.noOfGuests}`
    },
    { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
  )
})

router.put('/table-request/:requestId', jwtValidator, async (req, res) => {
  const { requestId } = req.params
  if (!requestId) return res.sendStatus(400)

  const { status } = req.body

  console.log('update table request ', requestId, status)

  const request = await cms.getModel('RPTableRequest').findById(requestId)
  const user = await cms.getModel('RPUser').findById(ObjectId(request.rpUserId))
  const managerDevices = await getManagerDevices(request.storeId)
  const store = await StoreModel.findById(ObjectId(request.storeId))

  if (request.status === 'cancelled') {
    // notify cancelled
    if (managerDevices.length) await sendNotification(
      managerDevices,
      {
        title: 'Table request cancelled',
        body: `Table request at ${dayjs(request.date).format('HH:mm')} cancelled by user`
      },
      { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(request) },
    )
    return
  }

  const newRequest = await cms.getModel('RPTableRequest').findOneAndUpdate({ _id: ObjectId(requestId) }, { status }, { new: true })

  switch (status) {
    case 'approved':
      // notify end user
      await sendNotification(
        [user],
        {
          title: 'Table Request approved',
          body: `Your table request at ${store.name || store.settingName} at ${dayjs(request.date).format('HH:mm')} has been approved.`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
      )
      break
    case 'cancelled':
      // notify manager
      if (managerDevices.length) await sendNotification(
        managerDevices,
        {
          title: 'Table request cancelled',
          body: `Table request at ${dayjs(request.date).format('HH:mm')} cancelled by user`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
      )
      break
    case 'declined':
      // notify end user
      await sendNotification(
        [user],
        {
          title: 'Table Request declined',
          body: `Your table request at ${store.name || store.settingName} at ${dayjs(request.date).format('HH:mm')} has been declined.`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
      )
      break
    case 'expired':
      await sendNotification(
        [user],
        {
          title: 'Table Request expired',
          body: `Your table request at ${store.name || store.settingName} at ${dayjs(request.date).format('HH:mm')} has expired.`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
      )

      if (managerDevices.length) await sendNotification(
        managerDevices,
        {
          title: 'Table request expired',
          body: `Table request at ${dayjs(request.date).format('HH:mm')} has expired`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
      )
      break
    default:
      break
  }
  res.status(200).json({ success: true })
})

async function getManagerDevices(storeId) {
  return await cms.getModel('Device').find({ storeId: storeId.toString(), firebaseToken: { $exists: true } })
}

async function sendNotification(devices, notification, payload) {
  const tokens = devices.reduce((acc, cur) => {
    if (cur.osName === 'ios' && cur.osVersion) {
      const [majorVersion] = cur.osVersion.split('.')
      if (+majorVersion < 13) {
        acc.apnTokens = [...acc.apnTokens, cur.apnToken]
        return acc
      }
    }
    acc.firebaseTokens = [...acc.firebaseTokens, cur.firebaseToken]
    return acc
  }, { apnTokens: [], firebaseTokens: [] })

  sendApn(notification, payload, tokens.apnTokens)
  sendFirebaseNotification(notification, payload, tokens.firebaseTokens)
}

async function sendFirebaseNotification(notification, data, tokens) {
  const admin = firebaseAdminInstance()
  const formattedData = {
    ...data,
    notification: JSON.stringify(notification)
  }
  const message = {
    data: formattedData,
    tokens,
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
          'content-available': 1
        }
      }
    },
    android: {
      priority: 'high'
    },
  }

  const result = await admin.messaging().sendMulticast(message)
  if (result.successCount) {
    console.debug('sentry:eventType=notification', 'Error sending notification', result.responses.filter(r => !r.success))
  }
}

function sendApn(notification, payload, tokens) {
  const apnProvider = getApnProvider()

  const note = new apn.Notification();

  note.alert = notification.title
  note.body = notification.body
  note.payload = { ...payload, ...notification }
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.topic = 'io.gigasource.gsms.voip';
  note.mutableContent = 1;
  note.category = 'GSMSNoti'
  return apnProvider.send(note, tokens)
}

module.exports = router
module.exports.storeMapperConfig = mapperConfig;
module.exports.storeGeoNearQuery = geoNearQuery;
