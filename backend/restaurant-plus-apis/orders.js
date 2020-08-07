const express = require('express');
const router = express.Router();
const {respondWithError, getDistance, applyDiscountForOrder} = require('./utils');
const StoreModel = cms.getModel("Store");
const OrderModel = cms.getModel("Order");
const ObjectId = require('mongoose').Types.ObjectId;
const objectMapper = require('object-mapper');
const sumBy = require('lodash/sumBy');
const sum = require('lodash/sum');
const _ = require('lodash')

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

  if (!store.deliveryFee) return respondWithError(res, 400, 'No delivery setup for store!')

  if (store.deliveryFee.type === 'zipCode') {
    const zipCodeFees = (store.deliveryFee.zipCodeFees || []).map(({zipCode, fee, minOrder}) => {
      if (zipCode.includes(',') || zipCode.includes(';')) {
        zipCode = zipCode.replace(/\s/g, '').replace(/;/g, ',').split(',')
      }
      return zipCode instanceof Array ? zipCode.map(code => ({zipCode: code, fee, minOrder: minOrder || 0})) : {
        zipCode,
        fee,
        minOrder: minOrder || 0
      }
    }).flat()

    for (const deliveryFee of zipCodeFees) {
      if (_.lowerCase(_.trim(deliveryFee.zipCode)) === _.lowerCase(_.trim(customerZipCode.toString())))
        return res.status(200).json({shippingFee: deliveryFee.fee})
    }

    if (store.deliveryFee.acceptOrderInOtherZipCodes)
      return res.status(200).json({shippingFee: store.deliveryFee.defaultFee})
  }

  if (store.deliveryFee.type === 'distance') {
    let distance = await getDistance(customerAddress, customerZipCode, store.coordinates)
    if (distance === undefined || distance === null)
      return respondWithError(res, 400, "Can't calculate the distance between restaurant and customer!")
    if (distance >= 0) {
      for (const deliveryFee of _.sortBy(store.deliveryFee.distanceFees, 'radius')) {
        if (distance < deliveryFee.radius)
          return res.status(200).json({shippingFee: deliveryFee.fee})
      }
    }
  }
});

router.post('/create-order', async (req, res) => {
  const {order} = req.body
  let {storeId, items, type, customer, payment, note, deliveryTime, date, user, voucher, shippingFee, total, discountValue, timeoutDate} = order

  const store = await StoreModel.findById(storeId)
  if (!store) return respondWithError(res, 400, 'Invalid store ID!')

  if (discountValue > 0) {
    items = applyDiscountForOrder(items, {difference: discountValue, value: (total - discountValue)})
  }

  await cms.getModel('Order').create({
    storeId,
    items: items.map(item => ({
      ..._.omit(item, ['_id', 'groupPrinters']),
      groupPrinter: item.groupPrinters[0],
      groupPrinter2: store.useMultiplePrinters && item.groupPrinters.length >= 2 && item.groupPrinters[1],
      price: +item.price.toFixed(2),
      originalPrice: item.originalPrice ? +item.originalPrice.toFixed(2) : +item.price.toFixed(2),
      ...item.vDiscount && { vDiscount: +item.vDiscount.toFixed(2) },
      id: item.id || ''
    })),
    customer,
    payment,
    type,
    deliveryTime,
    deliveryDate: date,
    date,
    timeoutDate,
    shippingFee,
    note,
    online: true,
    restaurantPlusUser: user && user._id,
    restaurantPlusVoucher: voucher && voucher._id
  })

  res.sendStatus(200)
})
module.exports = router;
