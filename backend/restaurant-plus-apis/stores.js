const { MAX_NEARBY_DISTANCE } = require('./constants');
const _ = require('lodash')
const express = require('express')
const router = express.Router()

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

  res.status(200).json(mappedStores)
})

module.exports = router
