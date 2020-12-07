const express = require('express');
const router = express.Router();
const {respondWithError} = require('../utils');
const objectMapper = require('object-mapper');
const {jwtValidator} = require('../api-security');

const {
  getUserOrders,
  getOrderById,
  getStoreById,
  calculateShippingFee,
  createOrder,
  updateOrderStatus,
} = require('./controller');

const mapperConfig = {
  _id: '_id',
  'storeId.logoImageSrc': 'store.logoImageSrc',
  'storeId.settingName': {
    key: 'store.name',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.storeId.name
  },
  date: 'date',
  timeoutDate: 'timeoutDate',
  vSum: 'orderSum',
  vDiscount: "orderDiscountValue",
  itemCount: 'itemCount',
  paymentType: 'paymentType',
  shippingFee: 'shippingFee',
  'restaurantPlusVoucher.promotion.name': 'voucherName',
  'items[]._id': 'items[]._id',
  'items[].name': 'items[].name',
  'items[].originalPrice': 'items[].originalPrice',
  'items[].quantity': 'items[].quantity',
}

router.get('/', jwtValidator, async (req, res) => {
  const {userId} = req.query;
  if (!userId) return respondWithError(res, 400, 'Missing property in request');

  let userOrders = await getUserOrders(userId);

  res.status(200).json(userOrders.map(e => objectMapper(e, mapperConfig)));
});

router.get('/by-id/:orderId', jwtValidator, async (req, res) => {
  const {orderId} = req.params;
  if (!orderId) return respondWithError(res, 400, 'Missing property in request');

  const order = await getOrderById(orderId);
  if (!order) return respondWithError(res, 400, 'Invalid order ID');

  res.status(200).json(objectMapper(order, mapperConfig));
});

router.post('/calculate-shipping-fee', async (req, res) => {
  const {customerAddress, customerZipCode, storeId} = req.body;
  if (!customerAddress || !customerZipCode || !storeId) return respondWithError(res, 400, 'Missing property in request');

  const store = await getStoreById(storeId);
  if (!store) return respondWithError(res, 400, 'Invalid store ID');

  if (!store.deliveryFee) return respondWithError(res, 400, 'No delivery setup for store!')

  const {shippingFee, error} = await calculateShippingFee(store, customerAddress, customerZipCode);

  if (error) {
    respondWithError(res, 400, error);
  } else {
    res.status(200).json({shippingFee});
  }
});

// TODO: use transaction
router.post('/', jwtValidator, async (req, res) => {
  const {order} = req.body

  const {newOrder, error} = await createOrder(order);

  if (error) {
    respondWithError(res, 400, error);
  } else {
    res.status(201).json(objectMapper(newOrder, mapperConfig));
  }
});

router.put('/', jwtValidator, async (req, res) => {
  //todo schedule auto-cancel order after timeout
  const { orderId, status, timeToComplete, declineReason } = req.body
  if (!orderId || !status) res.sendStatus(400)

  const updatedOrder = await updateOrderStatus(orderId, status, timeToComplete, declineReason);

  res.status(204).json(updatedOrder);
});

module.exports = router;
