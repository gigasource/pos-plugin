const DeviceModel = cms.getModel('Device');
const {DEVICE_TYPE} = require('./constants');
const _ = require('lodash');

function getAndSortDevices(n = 0, offset = 0, sort, nameSearch) {
  // unread message count will be dynamic, so getting devices with an offset may result in missing some devices due to order changes
  const limit = sort.unreadMessages ? n + offset : n;
  const skip = sort.unreadMessages ? null : offset;

  const steps = [{
    $match: {
      deleted: {$ne: true},
      deviceType: DEVICE_TYPE.GSMS,
    }
  }];

  if (nameSearch) {
    steps.push({
      $lookup: {
        from: 'stores',
        let: {storeId: {$toObjectId: '$storeId'}},
        pipeline: [{
          $match: {
            $expr: {
              $eq: ['$_id', '$$storeId']
            }
          },
        }],
        as: 'store',
      }
    });

    steps.push({
      $unwind: {
        path: '$store',
        preserveNullAndEmptyArrays: true
      }
    });
    steps.push({$addFields: {storeName: '$store.name'}});
    steps.push({$unset: 'store'});
    steps.push({
      $addFields: {
        nameSearchField: {
          $concat: [
            '$name',
            {$cond: [{$ifNull: ['$metadata.customerName', false]}, ' - ', '']},
            {$ifNull: ['$metadata.customerName', '']},
            {$cond: [{$ifNull: ['$storeName', false]}, ' - ', '']},
            {$ifNull: ['$storeName', '']},
          ]
        }
      }
    });
    steps.push({$unset: 'storeName'});

    steps.push({
      $match: {
        nameSearchField: {$regex: nameSearch, $options: 'i'}
      }
    });
  }

  steps.push({
    $lookup: {
      from: 'chatmessages',
      let: {deviceId: {$toString: '$_id'}},
      pipeline: [
        {
          $match: {
            read: false,
            fromServer: false,
            $expr: {$eq: ['$clientId', '$$deviceId']},
          }
        }
      ],
      as: 'unreadClientChats'
    }
  });

  steps.push({$addFields: {unreadMessages: {$size: '$unreadClientChats'}}});
  steps.push({$unset: 'unreadClientChats'});
  steps.push({$sort: sort});
  if (skip) steps.push({$skip: skip});
  if (limit) steps.push({$limit: limit});

  return DeviceModel.aggregate(steps);
}

function convertToGsmsStoreModel(store) {
  return {
    _id: store._id.toString(),
    id: store.id,
    name: store.name || store.alias,
    alias: store.alias,
    googleMyBusinessId: store.googleMyBusinessId,
    orderTimeOut: store.orderTimeOut
  }
}

async function reverseGeocodePelias(lat, long) {
  const url = `https://pelias.gigasource.io/v1/reverse?point.lat=${lat}&point.lon=${long}`

  const req = await axios.get(url)
  const {features} = req.data

  if (features && features.length) {
    const {country, label, region, name} = features[0].properties;
    return label || `${name}, ${region}, ${country}`
  }

  return await reverseGeocodeGoogle(lat, long)
}

async function reverseGeocodeGoogle(lat, long) { //fallback
  const apiKey = global.APP_CONFIG.mapsApiKey;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${apiKey}`

  const req = await axios.get(url)
  const {results} = req.data

  if (results && results.length) {
    return results[0]['formatted_address']
  }
}

function formatOrder(order) {
  const products = order.items.map(({id, modifiers, name, note, originalPrice, quantity}) => {
    if (modifiers && modifiers.length) {
      const sumOfModifiers = modifiers.reduce((sum, {price, quantity}) => sum + quantity * price, 0)
      originalPrice = originalPrice + sumOfModifiers
    }

    return {
      id,
      name,
      originalPrice,
      note,
      modifiers: modifiers.map(({name}) => name).join(', '),
      quantity,
    }
  })

  const discounts = order.discounts
    .filter(d => d.type !== 'freeShipping')
    .reduce((sum, discount) => sum + discount.value, 0)
  const total = order.vSum
    ? order.vSum
    : _.sumBy(products, p => p.originalPrice * p.quantity) - discounts + order.shippingFee

  return {
    orderToken: order.onlineOrderId || order._id.toString(),
    orderType: order.type,
    paymentType: order.payment[0].type,
    customer: JSON.stringify(order.customer),
    products: JSON.stringify(products),
    note: order.note,
    date: order.date,
    shippingFee: order.shippingFee,
    total,
    deliveryTime: order.deliveryTime,
    discounts,
    status: order.status,
    storeId: order.storeId.toString(),
  }
}

module.exports = {
  getAndSortDevices,
  convertToGsmsStoreModel,
  reverseGeocodeGoogle,

  reverseGeocodePelias,
  formatOrderForRpManager: formatOrder,
}
