const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const objectMapper = require('object-mapper');
const {firebaseAdminInstance} = require('../firebase-messaging/admin');
const admin = firebaseAdminInstance();
const ObjectId = require('mongoose').Types.ObjectId;

const UserModel = cms.getModel('RPUser');
const StoreModel = cms.getModel('Store');
const PointHistoryModel = cms.getModel('RPPointHistory');

const {POINT_HISTORY_TRANSACTION_TYPE} = require('./constants');


const mapperConfig = {
  _id: '_id',
/*  store: 'store',
  restaurantPlusUser: 'user',*/
  value: 'value',
  transactionType: 'transactionType',
  createdAt: 'createdAt',
}

async function notifyToClient(type = "", title = "", message = "", token = "") {
  const firebaseMsg = {
    notification: {
      title,
      body: message
    },
    data: {
      type,
      message
    }
  }
  return admin.messaging().sendToDevice(
    [token],
    {...firebaseMsg},
    {
      contentAvailable: true,
      priority: 'high',
    }
  )
}

router.get('/', async (req, res) => {
  const {storeId, userId} = req.query;
  if (!userId) return respondWithError(res, 400, 'Missing property in request');

  const transactions = await PointHistoryModel.find({
    restaurantPlusUser: ObjectId(userId),
    ...storeId && {store: ObjectId(storeId)},
  });

  res.status(200).json(transactions.map(e => objectMapper(e, mapperConfig)));
});

router.post('/', async (req, res) => {
  const {storeId, userId, value, transactionType} = req.body;
  if (!userId || !value) return respondWithError(res, 400, 'Missing property in request body');
  if (typeof value !== 'number') return respondWithError(res, 400, "Property 'value' must be number");
  if (!POINT_HISTORY_TRANSACTION_TYPE.VALUE_ARRAY.includes(transactionType)) return respondWithError(res, 400, 'Invalid transaction type');

  switch (transactionType) {
    case POINT_HISTORY_TRANSACTION_TYPE.STORE_REWARD_POINT: {
      if (!storeId) return respondWithError(res, 400, 'Missing store id in request');

      const transaction = await PointHistoryModel.create({
        store: storeId,
        restaurantPlusUser: userId,
        value,
        transactionType,
        createdAt: new Date(),
      });

      const user = await UserModel.findById(userId);
      const currentUserPoints = user.rpPoints;

      currentUserPoints[storeId] = (currentUserPoints[storeId] || 0) + value

      await UserModel.updateOne({_id: user._id}, {rpPoints: currentUserPoints});

      res.status(201).json(objectMapper(transaction, mapperConfig));

      if (user.firebaseToken) {
        const store = await StoreModel.findOne({_id: storeId});
        await notifyToClient('reward_point', 'Point received',
          `You have received ${value} reward points from ${store.name}`, user.firebaseToken)
      }
      break;
    }
/*    case POINT_HISTORY_TRANSACTION_TYPE.USER_BUY_VOUCHER: {
      if (!voucherId) return respondWithError(res, 400, 'Missing voucher id in request');

      const transaction = await PointHistoryModel.create({
        voucher: voucherId,
        user: userId,
        value,
        transactionType,
        createdAt: new Date(),
      });

      res.status(201).json(transaction);
      break;
    }*/
  }
});

module.exports = router;
