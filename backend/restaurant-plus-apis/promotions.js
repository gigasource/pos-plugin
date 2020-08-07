const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');
const {PROMOTION_ORDER_TYPE, PROMOTION_DISCOUNT_TYPE, DEFAULT_PROMOTION_BACKGROUND} = require('./constants');

const {respondWithError} = require('./utils');
const PromotionModel = cms.getModel('RPPromotion');

const mapperConfig = {
  _id: '_id',
  name: 'name',
  price: 'price',
  discountType: 'discountType',
  discountValue: 'discountValue',
  description: 'description',
  orderType: 'orderType',
  createdAt: 'createdAt',
  startDate: 'startDate',
  endDate: 'endDate',
  'store._id': 'store._id',
  'store.settingName': {
    key: 'store.settingName',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.store.name
  },
  descriptionImageUrl: {
    key: 'descriptionImageUrl',
    transform: sourceValue => sourceValue || DEFAULT_PROMOTION_BACKGROUND
  },
  issuedVoucherCount: 'issuedVoucherCount',
}

router.get('/', async (req, res) => {
  const {storeId, includeNonStore} = req.query;
  const now = new Date();

  const aggregateSteps = [{
    $lookup: {
      from: 'rpvouchers',
      localField: '_id',
      foreignField: 'promotion',
      as: 'issuedVouchers'
    }
  },
    {
      $addFields: {
        limitNotReached: {$lte: [{$size: '$issuedVouchers'}, '$quantity']},
        issuedVoucherCount: {$size: '$issuedVouchers'},
      }
    },
    {$unset: 'issuedVouchers'},
    {
      $lookup: {
        from: 'stores',
        localField: 'store',
        foreignField: '_id',
        as: 'store',
      }
    },
    {$unwind: {path: '$store', preserveNullAndEmptyArrays: includeNonStore === 'true'}},
    {
      $match: {
        ...storeId && {'store._id': ObjectId(storeId)},
        enabled: true,
        limitNotReached: true,
        $and: [
          {$or: [{startDate: {$exists: false}}, {startDate: {$lte: now}}]},
          {$or: [{endDate: {$exists: false}}, {endDate: {$gte: now}}]}
        ],
      },
    }];

  const promotions = await PromotionModel.aggregate(aggregateSteps);
  res.status(200).json(promotions.map(e => objectMapper(e, mapperConfig)));
});

router.post('/', async (req, res) => {
  const {
    name, quantity, startDate, endDate, storeId, price, discountType, discountValue, description, orderType, limitForUser,
    duration, descriptionImageUrl, enabled
  } = req.body;

  if (!name || !storeId || !orderType) return respondWithError(res, 400, 'Missing property in request body');
  if (quantity < 0) return respondWithError(res, 400, 'Invalid quantity');
  if (price < 0) return respondWithError(res, 400, 'Invalid price');
  if (discountValue < 0) return respondWithError(res, 400, 'Invalid discount value');
  if (limitForUser < 0) return respondWithError(res, 400, 'Invalid voucher limit for user');
  if (duration < 0) return respondWithError(res, 400, 'Invalid voucher duration');
  if (!PROMOTION_ORDER_TYPE.VALUE_ARRAY.includes(orderType)) return respondWithError(res, 400, 'Invalid voucher order type');
  if (!PROMOTION_DISCOUNT_TYPE.VALUE_ARRAY.includes(discountType)) return respondWithError(res, 400, 'Invalid voucher discount type');

  const newPromotion = await PromotionModel.create({
    name,
    quantity: +quantity || 0,
    startDate: startDate && new Date(startDate),
    endDate: endDate && new Date(endDate),
    enabled,
    store: storeId,
    price: +price || 0,
    discountType,
    discountValue,
    description,
    orderType,
    limitForUser: +limitForUser || 0,
    duration: +duration || 0,
    descriptionImageUrl,
  });

  res.status(201).json(newPromotion);
});

router.put('/:promotionId', async (req, res) => {
  const {promotionId} = req.params;
  const {
    name, quantity, startDate, endDate, storeId, price, discountType, discountValue, description, orderType, limitForUser,
    duration, descriptionImageUrl, enabled
  } = req.body;

  if (!promotionId) return respondWithError(res, 400, 'Missing promotion ID in request');
  if (!name || !storeId || !orderType) return respondWithError(res, 400, 'Missing property in request body');
  if (quantity < 0) return respondWithError(res, 400, 'Invalid quantity');
  if (price < 0) return respondWithError(res, 400, 'Invalid price');
  if (discountValue < 0) return respondWithError(res, 400, 'Invalid discount value');
  if (limitForUser < 0) return respondWithError(res, 400, 'Invalid voucher limit for user');
  if (duration < 0) return respondWithError(res, 400, 'Invalid voucher duration');
  if (!PROMOTION_ORDER_TYPE.VALUE_ARRAY.includes(orderType)) return respondWithError(res, 400, 'Invalid voucher order type');
  if (!PROMOTION_DISCOUNT_TYPE.VALUE_ARRAY.includes(discountType)) return respondWithError(res, 400, 'Invalid voucher discount type');

  const newPromotion = await PromotionModel.findOneAndUpdate({_id: promotionId}, {
    ...name && {name},
    ...quantity && {quantity: +quantity},
    ...startDate && {startDate: new Date(startDate)},
    ...endDate && {endDate: new Date(endDate)},
    ...enabled && {enabled},
    ...storeId && {store: storeId},
    ...price && {price: +price},
    ...discountType && {discountType},
    ...discountValue && {discountValue},
    ...description && {description},
    ...orderType && {orderType},
    ...limitForUser && {limitForUser: +limitForUser},
    ...duration && {duration: +duration},
    ...descriptionImageUrl && {descriptionImageUrl},
  }, {new: true});

  res.status(200).json(newPromotion);
});

module.exports = router;
