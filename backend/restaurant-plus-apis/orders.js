const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const {PELIAS_HOST} = require('./constants');
const StoreModel = cms.getModel("Store");
const axios = require('axios');

router.post('/calculate-shipping-fee', async (req, res) => {
  const {customerAddress, customerZipCode, storeId} = req.body;
  if (!customerAddress || !customerZipCode || !storeId) return respondWithError(res, 400, 'Missing property in request');

  const store = await StoreModel.findById(storeId);
  if (!store) return respondWithError(res, 400, 'Invalid store ID');

  let geoApiUrl = `${PELIAS_HOST}/v1/search?text=${encodeURI(customerAddress)}`;

  if (this.store.coordinates) {
    const {lat, long} = store.coordinates;
    geoApiUrl += `&focus.point.lat=${lat}&focus.point.lon=${long}`;
  }

  try {
    const {data: {features}} = await axios.get(geoApiUrl);
    if (features && features.length) {
      const foundLocation = features.find(location => location.properties.postalcode === customerZipCode);
      if (foundLocation) {
        const {properties: {distance}, geometry: {coordinates}} = foundLocation;
        this.customer.distance = distance;
      } else {
        await this.getDistanceByPostalCode(customerZipCode, {latitude: lat, longitude: long});
      }
    }
  } catch (e) {
    await this.getDistanceByPostalCode(customerZipCode, {latitude: lat, longitude: long});
  }
});

module.exports = router;
