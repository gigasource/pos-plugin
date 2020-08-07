const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const {PELIAS_HOST} = require('./constants');
const StoreModel = cms.getModel("Store");
const OrderModel = cms.getModel("Order");
const axios = require('axios');
const ObjectId = require('mongoose').Types.ObjectId;
const objectMapper = require('object-mapper');
const sumBy = require('lodash/sumBy');
const sum = require('lodash/sum');

const mapperConfig = {
  _id: '_id',
  'storeId.logoImageSrc': 'store.logoImageSrc',
  'storeId.settingName': {
    key: 'store.name',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.storeId.name
  },
  date: 'date',
  orderSum: 'orderSum',
  itemCount: 'itemCount',
  paymentType: 'paymentType',
}

function calOrderTotal(items) {
  return sumBy(items, item => +(item.quantity * item.price));
}

function  calOrderModifier(items) {
  return sumBy(items, item => item.modifiers ? sum(item.modifiers.map(i => i.price)) * item.quantity : 0);
}

router.get('/', async (req, res) => {
  const {userId} = req.query;
  if (!userId) return respondWithError(res, 400, 'Missing property in request');

  let userOrders = await OrderModel.find({restaurantPlusUser: ObjectId(userId)}).sort({date: -1});
  userOrders = userOrders.map(order => {
    const {items, shippingFee, payment} = order;
    const orderSum = (calOrderTotal(items) + calOrderModifier(items) + shippingFee).toFixed(2);
    const itemCount = items.reduce((acc, cur) => acc + cur.quantity, 0);
    const paymentType = payment[0].type;

    return {
      ...order._doc,
      orderSum: +orderSum,
      itemCount,
      paymentType,
    }
  });

  res.status(200).json(userOrders.map(e => objectMapper(e, mapperConfig)));
});

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
