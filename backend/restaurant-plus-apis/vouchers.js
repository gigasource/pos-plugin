const voucherModel = cms.getModel('RPVoucher');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');

const VoucherModel = cms.getModel('RPVoucher');
const PromotionModel = cms.getModel('RPPromotion');
const UserModel = cms.getModel('RPUser');
const PointHistoryModel = cms.getModel('RPPointHistory');

const { MAX_NEARBY_DISTANCE, VOUCHER_STATUS, POINT_HISTORY_TRANSACTION_TYPE } = require('./constants');
const {respondWithError} = require('./utils');

const mapperConfig = {
  _id: '_id',
  'restaurantPlusUser._id': 'userId',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  'promotion.name': 'promotion.name',
  'promotion.description': 'promotion.description',
  'promotion.quantity': 'promotion.quantity',
  'promotion.orderType': 'promotion.orderType',
  'promotion.store._id': 'promotion.store._id',
  'promotion.store.settingName': {
    key: 'promotion.storeName',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.promotion.store.name
  },
  'promotion.store.logoImageSrc': 'promotion.storeLogo',
  'promotion.price': 'promotion.price',
  'promotion.discountValue': 'promotion.discountValue',
  'promotion.discountType': 'promotion.discountType',
  'promotion.descriptionImageUrl': 'promotion.descriptionImageUrl',
}

router.get('/', async (req, res) => {
  const {userId, storeId, nameSearch, status, usable, voucherId} = req.query;
  if (!userId) return respondWithError(res, 400, 'Missing user ID in request');

  const userVouchers = await findVouchers({userId, nameSearch, storeId, status, usable: usable === 'true', voucherId});
  res.status(200).json(userVouchers.map(e => objectMapper(e, mapperConfig)));
});

router.get('/by-id/:voucherId', async (req, res) => {
  const {voucherId} = req.params;
  if (!voucherId) return respondWithError(res, 400, 'Missing voucher ID in request');

  const voucher = await VoucherModel.findById(voucherId).populate('promotion.store');
  res.status(200).json(objectMapper(voucher, mapperConfig));
});

router.put('/use-voucher/:voucherId', async (req, res) => {
  const {voucherId} = req.params;
  const {storeId} = req.query;
  if (!voucherId) return respondWithError(res, 400,'Missing voucher ID in request');
  if (!storeId) return respondWithError(res, 400,'Missing store ID in request');

  const voucher = await VoucherModel.findById(voucherId);
  if (!voucher) return respondWithError(res, 400,'Voucher not found');

  const nowInMs = new Date().getTime();
  if (voucher.status === VOUCHER_STATUS.USED) return respondWithError(res, 400,'This voucher has already been used');
  if (voucher.startDate && nowInMs < voucher.startDate.getTime()) return respondWithError(res, 400,'This voucher can not be used yet');
  if (voucher.endDate && nowInMs > voucher.endDate.getTime()) return respondWithError(res, 400,'This voucher has expired');
  if (voucher.promotion.store._id.toString() !== storeId) return respondWithError(res, 400,`This voucher can not be used with store ${storeId}`);

  await VoucherModel.updateOne({_id: voucher._id}, {status: VOUCHER_STATUS.UNUSED});
  res.status(204).send();
});

router.post('/', async (req, res) => {
  const {promotionId, userId, quantity} = req.body;
  if (!promotionId || !userId || !quantity) return respondWithError(res, 400,'Missing property in request body');

  const promotion = await PromotionModel.findById(promotionId);
  if (!promotion) return respondWithError(res, 400,'Selected promotion campaign not found');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400,'Selected user not found');

  const promoLimitForUser = promotion.limitForUser;
  const issuedVoucherForUserCount = await VoucherModel.countDocuments({
    promotion: promotion._id,
    restaurantPlusUser: ObjectId(userId),
  });

  if (issuedVoucherForUserCount >= promoLimitForUser) return respondWithError(res, 400, 'Promotion campaign issue limit has been reached for this user');

  const promoLimit = promotion.quantity;
  const issuedVoucherCount = await VoucherModel.countDocuments({
    promotion: promotion._id,
    status: {$in: [VOUCHER_STATUS.UNUSED, VOUCHER_STATUS.USED]},
  });

  if (issuedVoucherCount >= promoLimit) return respondWithError(res, 400, 'Promotion campaign issue limit has been reached');

  const now = new Date();
  let voucherStartDate, voucherEndDate;

  if (promotion.duration) {
    voucherStartDate = now;
    voucherEndDate = new Date(now.getTime() + promotion.duration);
  } else {
    voucherStartDate = promotion.startDate;
    voucherEndDate = promotion.endDate;
  }

  const newVoucher = await VoucherModel.create({
    promotion: promotion._id,
    restaurantPlusUser: user._id,
    status: VOUCHER_STATUS.UNUSED,
    createdAt: now,
    startDate: voucherStartDate,
    endDate: voucherEndDate,
  });

  await PointHistoryModel.create({
    voucher: newVoucher._id,
    restaurantPlusUser: user._id,
    value: promotion.price,
    transactionType: POINT_HISTORY_TRANSACTION_TYPE.USER_BUY_VOUCHER,
    createdAt: new Date(),
  });

  newVoucher.promotion = promotion;
  newVoucher.restaurantPlusUser = user;

  res.status(201).json(objectMapper(newVoucher, mapperConfig));
});

router.get('/nearby', async (req, res) => {
  const { userId, coordinates } = req.query
  if (!userId || !coordinates) return res.sendStatus(400)

  const [long, lat] = coordinates.split(',')

  const nearbyStores = await cms.getModel('Store').find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [long, lat] },
        $maxDistance: MAX_NEARBY_DISTANCE //5km from point
      }
    }
  }).lean()

  const nearbyStorePromos = await cms.getModel('RPPromotion').find({
    store: { $in: nearbyStores.map(s => s._id) }
  }).lean()

  const nearbyVouchers = await VoucherModel.find({
    promotion: { $in: nearbyStorePromos.map(p => p._id) },
    restaurantPlusUser: userId,
    status: VOUCHER_STATUS.UNUSED
  })

  const sortedVouchers = [].concat(...nearbyStores.map(store =>
    nearbyVouchers
    .filter(voucher => voucher.promotion.store._id.toString() === store._id.toString())));

  res.status(200).json(sortedVouchers.map(e => objectMapper(e, mapperConfig)));
})

router.get('/store-vouchers', async (req, res) => {
  const { userId, storeId } = req.query
  if (!userId || !storeId) return res.sendStatus(400)

  const vouchers = await voucherModel.aggregate([
    {
      $lookup: {
        from: 'rppromotions',
        let: {promotion: {$toObjectId: '$promotion'}},
        pipeline: [{
          $match: {
            $expr: {
              $eq: ['$_id', '$$promotion']
            }
          },
        }],
        as: 'promotion',
      }
    },
    {
      $unwind: {
        path: '$promotion',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        restaurantPlusUser: new ObjectId(userId),
        'promotion.store': new ObjectId(storeId),
        status: 'unused'
      }
    }
  ])

  res.status(200).json({vouchers: vouchers.map(e => objectMapper(e, mapperConfig))})
})

function findVouchers({userId, nameSearch, storeId, status, voucherId, usable}) {
  const aggregateSteps = [];
  const now = new Date();

  aggregateSteps.push({$match: {restaurantPlusUser: ObjectId(userId)}});
  aggregateSteps.push({
    $lookup: {
      from: 'rppromotions',
      localField: 'promotion',
      foreignField: '_id',
      as: 'promotion',
    }
  });
  aggregateSteps.push({$unwind: {path: '$promotion'}});
  aggregateSteps.push({$addFields: {storeId: '$promotion.store'}});
  aggregateSteps.push({
    $lookup: {
      from: 'stores',
      localField: 'storeId',
      foreignField: '_id',
      as: 'store',
    }
  });
  aggregateSteps.push({$unwind: {path: '$store'}});

  if (nameSearch) aggregateSteps.push({$match: {promotionName: {$regex: nameSearch, $options: 'i'}}});
  if (storeId) aggregateSteps.push({$match: {storeId: ObjectId(storeId)}});
  if (status) {
    aggregateSteps.push({$match: {status}});

    if (status === VOUCHER_STATUS.UNUSED && usable) {
      aggregateSteps.push({$match: {
          'promotion.enabled': true,
          $and: [
            {$or: [{'startDate': {$exists: false}}, {'startDate': {$lte: now}}]},
            {$or: [{'endDate': {$exists: false}}, {'endDate': {$gte: now}}]}
          ],
        }});
    }
  }
  if (voucherId) aggregateSteps.push({$match: {_id: ObjectId(voucherId)}});

  return VoucherModel.aggregate(aggregateSteps);
}

module.exports = router
module.exports.findVouchers = findVouchers;
