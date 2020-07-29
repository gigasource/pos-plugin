const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');

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
}

router.get('/', async (req, res) => {
  const {storeId} = req.query;
  if (!storeId) return respondWithError(res, 400, 'Missing store ID in request');

  const aggregateSteps = [{
      $lookup: {
        from: 'rpvouchers',
        localField: '_id',
        foreignField: 'promotion',
        as: 'issuedVouchers'
      }
    },
    {$addFields: {limitNotReached: {$lte: [{$size: '$issuedVouchers'}, '$quantity']}}},
    {$unset: 'issuedVouchers'},
    {
      $match: {
        store: ObjectId(storeId),
        enabled: true,
        limitNotReached: true,
      }
    }];

  const promotions = await PromotionModel.aggregate(aggregateSteps);
  res.status(200).json(promotions.map(e => objectMapper(e, mapperConfig)));
});

module.exports = router;
