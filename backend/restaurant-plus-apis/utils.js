const { PELIAS_HOST } = require('./constants');
const axios = require('axios');
const _ = require('lodash')

function respondWithError(res, status, msg) {
  res.status(status);

  if (msg) res.json({error: msg});
  else res.send();
}

async function getDistance(address, code, storeCoords) {
  let geoApiUrl = `${PELIAS_HOST}/v1/search?text=${encodeURI(address)}`;

  const {lat, long} = storeCoords;
  geoApiUrl += `&focus.point.lat=${lat}&focus.point.lon=${long}`;

  try {
    const {data: {features}} = await axios.get(geoApiUrl);
    if (features && features.length) {
      const foundLocation = features.find(location => location.properties.postalcode === code);
      if (foundLocation) {
        const {properties: {distance}} = foundLocation;
        return distance;
      } else {
        return await getDistanceByPostalCode(code, address, {latitude: lat, longitude: long});
      }
    }
  } catch (e) {
    return await getDistanceByPostalCode(code, address, {latitude: lat, longitude: long});
  }
}

async function getDistanceByPostalCode(code, address, fromCoords) {
  //todo support countries
  let url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${code}|country:DE&key=${global.APP_CONFIG.mapsApiKey}`
  if (address)
    url += `&address=${encodeURI(address)}`
  const response = await axios.get(url)
  const {results} = response.data
  if (!results || !results.length)
    return undefined

  const {geometry: {location: {lat: latitude, lng: longitude}}} = results[0]
  const geolib = require('geolib')
  return geolib.getPreciseDistance(fromCoords, {latitude, longitude}) / 1000
}

function applyDiscountForOrder(items, { difference, value }) {
  const totalWithoutDiscountResist = difference + value;
  const percent =  difference / totalWithoutDiscountResist * 100;
  let sumDiscount = 0;
  const lastDiscountableItemIndex = _.findLastIndex(items, item => !item.discountResistance);
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (!item.discountResistance) {
      if (i < lastDiscountableItemIndex) {
        item.price = +(item.originalPrice * (100 - percent) / 100);
        item.discountUnit = 'percent';
        item.vDiscount = +(item.originalPrice - item.price)
        sumDiscount += item.vDiscount ? (item.vDiscount * item.quantity) : 0;
      } else {
        item.discountUnit = 'amount';
        item.vDiscount = +((difference - sumDiscount)/item.quantity)
        item.price = item.originalPrice - item.vDiscount;
      }
    }
  }
  return items;
}

module.exports = {
  respondWithError,
  getDistance,
  applyDiscountForOrder
}
