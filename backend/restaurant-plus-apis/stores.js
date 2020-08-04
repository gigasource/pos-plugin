const { MAX_NEARBY_DISTANCE } = require('./constants');
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const objectMapper = require('object-mapper');
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
};

const StoreModel = cms.getModel('Store');

router.get('/by-id/:storeId', async (req, res) => {
  const {storeId} = req.params;
  if (!storeId) return respondWithError(res, 400, 'Missing store ID in request');

  const store = await StoreModel.findById(storeId);
  res.status(200).json(objectMapper(store, mapperConfig));
});

router.get('/nearby', async (req, res) => {
  const { coordinates } = req.query
  const [long, lat] = coordinates.split(',')

  const nearbyStores = await StoreModel.aggregate([
    {
      $geoNear: {
        near: {  type: 'Point', coordinates: [+long, +lat] },
        maxDistance: MAX_NEARBY_DISTANCE,
        distanceField: 'calcDistance',
        spherical: true
      }
    }
  ])

  const mappedStores = nearbyStores.map(store => {
    return _.pick(store, ['_id', 'id', 'name', 'address', 'settingName', 'settingAddress', 'townCity', 'country',
      'zipCode', 'openHours', 'phone', 'location', 'googleMapPlaceId', 'onlineOrdering', 'delivery', 'pickup',
      'reservationSetting', 'calcDistance', 'logoImageSrc', 'orderHeaderImageSrc', 'displayId', 'displayImage'])
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

module.exports = router
