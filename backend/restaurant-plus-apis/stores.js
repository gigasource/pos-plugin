const { MAX_NEARBY_DISTANCE } = require('./constants');
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const objectMapper = require('object-mapper');

const mapperConfig = {
  _id: '_id',
  id: 'id',
  name: 'name',
  address: 'address',
  settingName: 'settingName',
  settingAddress: 'settingAddress',
  'country.name': 'country',
  openHours: 'openHours',
  phone: 'phone',
  onlineOrdering: 'onlineOrdering',
  pickup: 'pickup',
};

const storeModel = cms.getModel('Store');

router.get('/nearby', async (req, res) => {
  const { coordinates } = req.query
  const [long, lat] = coordinates.split(',')

  const nearbyStores = await storeModel.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [long, lat] },
        $maxDistance: MAX_NEARBY_DISTANCE //5km from point
      }
    }
  }).lean()

  const mappedStores = nearbyStores.map(store => {
    return _.pick(store, ['_id', 'id', 'name', 'address', 'settingName', 'settingAddress', 'townCity', 'country',
      'zipCode', 'openHours', 'phone', 'location', 'googleMapPlaceId', 'onlineOrdering', 'delivery', 'pickup'])
  })

  res.status(200).json(mappedStores.map(e => objectMapper(e, mapperConfig)))
})

module.exports = router
