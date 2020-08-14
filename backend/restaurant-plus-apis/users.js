const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const ObjectId = require('mongoose').Types.ObjectId;
const UserModel = cms.getModel('RPUser');
const StoreModel = cms.getModel('Store');
const PointHistoryModel = cms.getModel('RPPointHistory');
const DeviceModel = cms.getModel('Device');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin'); // admin is initialized in another file
const objectMapper = require('object-mapper');
const {storeMapperConfig} = require('./stores');
const {generateUserJwtToken} = require('./api-security');
const {jwtValidator} = require('./api-security');
const JWT_EXPIRE_IN = '7d';
const {RESTAURANT_PLUS_ROLES} = require('./constants');

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
  lastUsedAddress: 'lastUsedAddress',
  followedStores: {
    key: 'followedStores',
    transform(sourceValue) {
      return Object.keys(sourceValue).reduce((acc, key) => {
        if (key !== 'length') acc.push(objectMapper(sourceValue[key]._doc, storeMapperConfig));
        return acc;
      }, []);
    },
  },
  apiToken: 'apiToken',
}

function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

router.get('/rp-points/:userId', jwtValidator, async (req, res) => {
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
    const latestTransaction = transactions.find(({_id}) => _id.toString() === storeId);

    rpPoints[storeId] = {
      value: pointValue,
      store: objectMapper(stores.find(({_id}) => _id.toString() === storeId)._doc, storeMapperConfig),
      lastTransactionDate: latestTransaction && latestTransaction.createdAt,
    }
  });

  res.status(200).json(rpPoints);
})

router.get('/by-id/:userId', jwtValidator, async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user id');

  res.status(200).json(objectMapper(user, mapperConfig));
});

router.put('/:userId', jwtValidator, async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const {name, email, addresses, firebaseToken, avatar, lastUsedAddress, location} = req.body;
  const {long, lat} = location || {};

  const newUser = await UserModel.findOneAndUpdate({_id: ObjectId(userId)}, {
    ...name && {name},
    ...addresses && {addresses},
    ...email && {email},
    ...firebaseToken && {firebaseToken},
    ...avatar && {avatar},
    ...lastUsedAddress && {lastUsedAddress},
    ...(long && lat) && {
      location: {
        type: 'Point',
        coordinates: [long, lat]
      }
    },
  }, {new: true});

  res.status(200).json(objectMapper(newUser, mapperConfig));
});

router.post('/authenticate', async (req, res) => {
  let {idToken, firebaseToken, phoneNumber, name, signInType, email, avatar} = req.body;
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
    const firebaseUid = decodedIdToken.uid;
    let user = await UserModel.findOne({firebaseUid});

    name = name || decodedIdToken.name;
    email = email || decodedIdToken.email;
    avatar = avatar || decodedIdToken.picture;

    if (user) {
      const jwtToken = generateUserJwtToken({
        userId: user._id.toString(),
        role: RESTAURANT_PLUS_ROLES.RP_CLIENT,
      }, JWT_EXPIRE_IN);

      // update firebaseToken whenever login success
      if (firebaseToken) await UserModel.findOneAndUpdate({firebaseUid}, {
        firebaseToken,
        ...!user.name && {name},
        ...!user.email && {email},
        ...!user.avatar && {avatar},
      });

      res.status(200).json(objectMapper({...user._doc, apiToken: jwtToken}, mapperConfig));
    } else {
      user = await UserModel.create({
        name: name || '',
        ...phoneNumber && {phoneNumber},
        ...email && {email},
        ...avatar && {avatar},
        addresses: [],
        createdAt: new Date(),
        rpPoints: {},
        firebaseUid,
        initialSignInType: signInType,
      });

      const jwtToken = generateUserJwtToken({
        userId: user._id.toString(),
        role: RESTAURANT_PLUS_ROLES.RP_CLIENT,
      }, JWT_EXPIRE_IN);

      res.status(201).json(objectMapper({...user._doc, apiToken: jwtToken}, mapperConfig));
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
    const jwtToken = generateUserJwtToken({
      userId: user._id.toString(),
      role: RESTAURANT_PLUS_ROLES.RP_CLIENT,
    }, JWT_EXPIRE_IN);

    if (user.firebaseUid === uid && decodedIdToken.uid === uid) {
      return res.status(200).json(objectMapper({...user._doc, apiToken: jwtToken}, mapperConfig));
    }
  }

  respondWithError(res, 400, 'Invalid token');
});

router.post('/follow-store', jwtValidator, async (req, res) => {
  const {userId, storeId} = req.body;
  if (!userId || !storeId) return respondWithError(res, 400, 'Missing property in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user ID');

  const store = await StoreModel.findById(storeId);
  if (!store) return respondWithError(res, 400, 'Invalid store ID');

  const {followedStores = []} = user;
  if (!followedStores.includes(storeId)) {
    followedStores.push(storeId);
    await UserModel.updateOne({_id: user._id}, {followedStores});
  }

  res.status(204).send();
});

router.post('/unfollow-store', jwtValidator, async (req, res) => {
  const {userId, storeId} = req.body;
  if (!userId || !storeId) return respondWithError(res, 400, 'Missing property in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user ID');

  const store = await StoreModel.findById(storeId);
  if (!store) return respondWithError(res, 400, 'Invalid store ID');

  let {followedStores = []} = user;
  if (followedStores.length) {
    followedStores = followedStores.filter(e => e._id.toString() !== storeId);
    await UserModel.updateOne({_id: user._id}, {followedStores});
  }

  res.status(204).send();
});

router.post('/manager-app-authenticate', async (req, res) => {
  const {hardwareId, deviceId} = req.body;

  if (!hardwareId || !deviceId) return respondWithError(res, 400, 'Missing property in request');

  const device = await DeviceModel.findById(deviceId);
  if (!device) return respondWithError(res, 400, 'Invalid device ID');
  if (device.hardwareId !== hardwareId) return respondWithError(res, 400, 'Device credentials do not match');

  const jwtToken = generateUserJwtToken({deviceId: device._id, role: RESTAURANT_PLUS_ROLES.RP_MANAGER}, JWT_EXPIRE_IN);
  res.status(200).json({apiToken: jwtToken});
});

module.exports = router;
