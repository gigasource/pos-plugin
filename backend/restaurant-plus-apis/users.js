const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const ObjectId = require('mongoose').Types.ObjectId;
const UserModel = cms.getModel('RPUser');
const StoreModel = cms.getModel('Store');
const PointHistoryModel = cms.getModel('RPPointHistory');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin'); // admin is initialized in another file
const objectMapper = require('object-mapper');

const mapperConfig = {
  _id: '_id',
  name: 'name',
  phoneNumber: 'phoneNumber',
  addresses: 'addresses[]',
  rpPoints: 'rpPoints',
  createdAt: 'createdAt',
  firebaseUid: 'firebaseUid',
  email: 'email',
  avatar: 'avatar',
}

const storeMapperConfig = {
  _id: '_id',
  logoImageSrc: 'logoImageSrc',
  settingName: {
    key: 'name',
    transform: (sourceValue, sourceObject) => sourceValue || sourceObject.name
  },
}

function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

router.get('/rp-points/:userId', async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user id');

  const {rpPoints = {}} = user;
  const storeIds = Object.keys(rpPoints);

  const transactions = await PointHistoryModel.aggregate([
    {$match: {store: {$in: storeIds.map(e => ObjectId(e))}, restaurantPlusUser: ObjectId(userId)}},
    {$sort: {createdAt: -1}},
    {$group: {_id: '$store', createdAt: {$first: '$createdAt'}}},
  ]);

  const stores = await StoreModel.find({_id: {$in: storeIds}});
  storeIds.forEach(storeId => {
    const pointValue = rpPoints[storeId];
    rpPoints[storeId] = {
      value: pointValue,
      store: objectMapper(stores.find(({_id}) => _id.toString() === storeId)._doc, storeMapperConfig),
      lastTransactionDate: transactions.find(({_id}) => _id.toString() === storeId).createdAt,
    }
  });

  res.status(200).json(rpPoints);
})

router.get('/by-id/:userId', async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user id');

  res.status(200).json(objectMapper(user, mapperConfig));
});

router.put('/:userId', async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const {name, email, addresses, firebaseToken, avatar} = req.body;
  const newUser = await UserModel.findOneAndUpdate({_id: ObjectId(userId)}, {
    ...name && {name},
    ...addresses && {addresses},
    ...email && {email},
    ...firebaseToken && {firebaseToken},
    ...avatar && {avatar},
  }, {new: true});

  res.status(200).json(objectMapper(newUser, mapperConfig));
});

router.post('/authenticate', async (req, res) => {
  let {idToken, firebaseToken, phoneNumber, name, signInType} = req.body;
  if (!idToken) return respondWithError(res, 400, 'Missing property in request body');
  if (!jwt.decode(idToken)) return respondWithError(res, 400, 'Invalid token');

  let decodedIdToken;

  try {
    decodedIdToken = await verifyIdToken(idToken);
  } catch (e) {
    console.error(e);
    decodedIdToken = null
  }

  if (decodedIdToken) {
    name = name || decodedIdToken.name || '';
    const firebaseUid = decodedIdToken.uid;
    let user = await UserModel.findOne({firebaseUid});

    if (user) {
      res.status(200).json(objectMapper(user, mapperConfig));
      // update firebaseToken whenever login success
      if (firebaseToken) await UserModel.findOneAndUpdate({firebaseUid}, {firebaseToken});
    } else {
      user = await UserModel.create({
        name: name || '',
        ...phoneNumber && {phoneNumber},
        addresses: [],
        createdAt: new Date(),
        rpPoints: {},
        firebaseUid,
        initialSignInType: signInType,
      });
      res.status(201).json(objectMapper(user, mapperConfig));
    }
  } else {
    respondWithError(res, 400, 'Invalid token');
  }
});

router.post('/check-id-token', async (req, res) => {
  const {idToken, uid, userId} = req.body;
  if (!idToken || !uid || !userId) return respondWithError(res, 400, 'Missing property in request body');
  if (!jwt.decode(idToken)) return respondWithError(res, 400, 'Invalid token format');

  let decodedIdToken;

  try {
    decodedIdToken = await verifyIdToken(idToken);
  } catch (e) {
    console.error(e);
    decodedIdToken = null
  }

  if (decodedIdToken) {
    const user = await UserModel.findById(userId);

    if (user.firebaseUid === uid && decodedIdToken.uid === uid) {
      return res.status(200).json(objectMapper(user, mapperConfig));
    }
  }

  respondWithError(res, 400, 'Invalid token');
});

module.exports = router;
