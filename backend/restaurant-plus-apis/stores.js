const { DEFAULT_NEARBY_DISTANCE } = require('./constants');
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const objectMapper = require('object-mapper');
const { getExternalSocketIoServer } = require('../socket-io-server');
const {respondWithError} = require('./utils');

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
  if (!storeId) return respondWithError(res, 400, 'Missing store ID in request');

  const store = await StoreModel.findById(storeId);
  res.status(200).json(objectMapper(store, mapperConfig));
});

router.get('/nearby', async (req, res) => {
  const { coordinates, maxDistance } = req.query
  const [long, lat] = coordinates.split(',')

  const nearbyStores = await StoreModel.aggregate([
    {
      $geoNear: {
        near: {  type: 'Point', coordinates: [+long, +lat] },
        maxDistance: +maxDistance || DEFAULT_NEARBY_DISTANCE,
        distanceField: 'calcDistance',
        spherical: true
      }
    }
  ])

  const mappedStores = nearbyStores.map(store => {
    return _.pick(store, ['_id', 'id', 'name', 'address', 'settingName', 'settingAddress', 'townCity', 'country',
      'zipCode', 'openHours', 'phone', 'location', 'googleMapPlaceId', 'onlineOrdering', 'delivery', 'pickup',
      'reservationSetting', 'calcDistance', 'logoImageSrc', 'orderHeaderImageSrc', 'displayId', 'displayImage', 'orderTimeOut'])
  })

  res.status(200).json(mappedStores.map(e => objectMapper(e, mapperConfig)))
})

router.get('/:id/menu', async (req, res) => {
  const { id } = req.params
  if (!id) res.sendStatus(400)

  const products = await cms.getModel('Product').find({ store: id }).lean()
  const categories = await cms.getModel('Category').find({ store: id }).lean()

  res.status(200).json({ products, categories })
})

router.post('/reservation', async (req, res) => {
  const { storeId, reservation } = req.body
  if (!storeId || !reservation) res.sendStatus(400)

  const newReservation = await cms.getModel('Reservation').create({...reservation, store: storeId})
  // todo emit to manager app
  const store = await StoreModel.findById(storeId)

  if (store.gSms && store.gSms.enabled) {
    cms.emit('sendReservationMessage', storeId, reservation)
    const demoDevices = store.gSms.devices
    demoDevices.filter(i => i.registered).forEach(({_id}) => {
      const targetClientId = _id;
      getExternalSocketIoServer().emitToPersistent(targetClientId, 'createReservation', [newReservation._doc])
      console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},deviceId=${targetClientId}`,
        `2. Online order backend: sent reservation to demo device`)
    })
  }

  res.sendStatus(200)
})

module.exports = router
