const express = require('express');
const router = express.Router();
const {respondWithError} = require('./utils');
const UserModel = cms.getModel('RPUser');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin'); // admin is initialized in another file
const objectMapper = require('object-mapper');

const mapperConfig = {
  _id: '_id',
  name: 'name',
  phoneNumber: 'phoneNumber',
  addresses: 'addresses',
  rpPoint: 'rpPoint',
}

function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

router.get('/by-id/:userId', async (req, res) => {
  const {userId} = req.params;
  if (!userId) return respondWithError(res, 400, 'Missing user id in request');

  const user = await UserModel.findById(userId);
  if (!user) return respondWithError(res, 400, 'Invalid user id');

  res.status(200).json(objectMapper(user, mapperConfig));
});

router.post('/authenticate', async (req, res) => {
  const {idToken, phoneNumber, name} = req.body;
  if (!idToken || !phoneNumber || !name) return respondWithError(res, 400, 'Missing property in request body');
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

    if (user) {
      res.status(200).json(objectMapper(user, mapperConfig));
    } else {
      user = await UserModel.create({name, phoneNumber, addresses: [], createdAt: new Date(), rpPoint: 0, firebaseUid});
      res.status(201).json(objectMapper(user, mapperConfig));
    }
  } else {
    respondWithError(res, 400, 'Invalid token');
  }
});

router.post('/check-id-token', async (req, res) => {
  const {idToken, uid} = req.body;
  if (!idToken || !uid) return respondWithError(res, 400, 'Missing property in request body');
  if (!jwt.decode(idToken)) return respondWithError(res, 400, 'Invalid token format');

  let decodedIdToken;

  try {
    decodedIdToken = await verifyIdToken(idToken);
  } catch (e) {
    console.error(e);
    decodedIdToken = null
  }

  if (decodedIdToken && decodedIdToken.uid === uid) {
    res.status(204).send();
  } else {
    respondWithError(res, 400, 'Invalid token');
  }
});

module.exports = router;
