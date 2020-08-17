const _ = require('lodash')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');
const {getExternalSocketIoServer} = require('../socket-io-server');
const {respondWithError} = require('./utils');
const {firebaseAdminInstance} = require('../firebase-messaging/admin')
const UserModel = cms.getModel('RPUser');
const {jwtValidator} = require('./api-security');
const {NOTIFICATION_ACTION_TYPE} = require('./constants');

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
  if (!userId) res.sendStatus(400)

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

router.post('/table-request', async (req, res) => {
  const { request } = req.body
  if (!request) return res.sendStatus(400)

  const newRequest = await cms.getModel('RPTableRequest').create({ ...request, status: 'pending' })

  res.status(200).json(newRequest)

  const devices = await getManagerDevices(request.storeId)
  if (!devices.length) return
  await sendNotification(
    {
      title: 'New Table',
      body: `New table request at ${dayjs(request.date).format('HH:mm')} for ${request.noOfGuests}`
    },
    { type: 'tableRequest', request: JSON.stringify(newRequest) },
    devices.map(d => d.firebaseToken)
  )
})

router.put('/table-request/:requestId', async (req, res) => {
  const { requestId } = req.params
  if (!requestId) res.sendStatus(400)

  const { status } = req.body

  console.log('update table request ', requestId, status)

  const request = await cms.getModel('RPTableRequest').findById(requestId)
  const user = await cms.getModel('RPUser').findById(ObjectId(request.rpUserId))
  const managerDevices = await getManagerDevices(request.storeId)
  const store = await StoreModel.findById(ObjectId(request.storeId))

  if (request.status === 'cancelled') {
    // notify cancelled
    if (managerDevices.length) await sendNotification(
      {
        title: 'Table request cancelled',
        body: `Table request at ${dayjs(request.date).format('HH:mm')} cancelled by user`
      },
      { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(request) },
      managerDevices.map(d => d.firebaseToken)
    )
    return
  }

  const newRequest = await cms.getModel('RPTableRequest').findOneAndUpdate({ _id: ObjectId(requestId) }, { status }, { new: true })


  switch (status) {
    case 'approved':
      // notify end user
      await sendNotification(
        {
          title: 'Table Request approved',
          body: `Your table request at ${store.name || store.settingName} at ${dayjs(request.date).format('HH:mm')} has been approved.`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
        [user.firebaseToken]
      )
      break
    case 'cancelled':
      // notify manager
      if (managerDevices.length) await sendNotification(
        {
          title: 'Table request cancelled',
          body: `Table request at ${dayjs(request.date).format('HH:mm')} cancelled by user`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
         managerDevices.map(d => d.firebaseToken)
      )
      break
    case 'declined':
      // notify end user
      await sendNotification(
        {
          title: 'Table Request declined',
          body: `Your table request at ${store.name || store.settingName} at ${dayjs(request.date).format('HH:mm')} has been declined.`
        },
        { actionType: NOTIFICATION_ACTION_TYPE.TABLE_REQUEST, request: JSON.stringify(newRequest) },
        [user.firebaseToken]
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

async function sendNotification(notification, data, tokens) {
  const admin = firebaseAdminInstance()

  const message = {
    notification,
    data,
    tokens
  }

  await admin.messaging().sendMulticast(message)
}

module.exports = router
module.exports.storeMapperConfig = mapperConfig;
module.exports.storeGeoNearQuery = geoNearQuery;
