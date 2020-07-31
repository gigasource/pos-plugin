const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');

const UserModel = cms.getModel('RPUser');
const PointHistoryModel = cms.getModel('RPPointHistory');

const {POINT_HISTORY_TRANSACTION_TYPE} = require('./constants');

router.post('/', async (req, res) => {
  const {storeId, userId, value, transactionType} = req.body;
  if (!userId || !value) return respondWithError(res, 400, 'Missing property in request body');
  if (!POINT_HISTORY_TRANSACTION_TYPE.VALUE_ARRAY.includes(transactionType)) return respondWithError(res, 400, 'Invalid transaction type');

  switch (transactionType) {
    case POINT_HISTORY_TRANSACTION_TYPE.STORE_REWARD_POINT: {
      if (!storeId) return respondWithError(res, 400, 'Missing store id in request');

      const transaction = await PointHistoryModel.create({
        store: storeId,
        user: userId,
        value,
        transactionType,
        createdAt: new Date(),
      });

      const user = await UserModel.findById(userId);
      const currentUserPoint = user.rpPoint;

      await UserModel.updateOne({_id: user._id}, {rpPoint: currentUserPoint - value});

      res.status(201).json(transaction);
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
