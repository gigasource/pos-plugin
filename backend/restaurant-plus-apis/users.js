const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const objectMapper = require('object-mapper');
const {respondWithError} = require('./utils');
const UserModel = cms.getModel('RPUser');

const admin = require('firebase-admin'); // admin is initialized in another file
const config = APP_CONFIG.firebaseAdminConfig;

// const idToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU1NGE3NTQ3Nzg1ODdjOTRjMTY3M2U4ZWEyNDQ2MTZjMGMwNDNjYmMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZ3Ntcy1jMWYzNSIsImF1ZCI6ImdzbXMtYzFmMzUiLCJhdXRoX3RpbWUiOjE1OTYwOTIwMTcsInVzZXJfaWQiOiJ0TlFIczJOeGY5VTdXcjRSODFNcW9EVTl4ckQyIiwic3ViIjoidE5RSHMyTnhmOVU3V3I0UjgxTXFvRFU5eHJEMiIsImlhdCI6MTU5NjA5MjAxNywiZXhwIjoxNTk2MDk1NjE3LCJwaG9uZV9udW1iZXIiOiIrODQ4MzIyMTEyOTYiLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7InBob25lIjpbIis4NDgzMjIxMTI5NiJdfSwic2lnbl9pbl9wcm92aWRlciI6InBob25lIn19.0so18MhY5_0CsC2pAMD_di_nGRWIqIDT35QqDiWd08mVwtElWP5pWKTviVd5w5OKnHA0yCZTwmjU6wJfpdLATvXkKiaYBNld22ss0OcLQJBROiqoNkXdt8xbIU8JDvKBiKzGzMm-HjaaRDsa76B3Yxj9sKns_MdYAI6DaWEyBv7blFmAoOC3Jna8Qbjn9b08vN2lK_y6QmelAYxCuVcR_6BjEIJ2PiI5dT0w7Zb_uA1za8MRUt3dhmBJ6mZw09hXd3hI0j8ZCyNooBt3Io_6qVmEJOVPlwdrduy7TYOpGjRopTof6vFgfxDhc8mDGCq2MEh_DBjqVfUfT0pp-aj0qg'

function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

router.post('/authenticate', async (req, res) => {
  const {idToken, phoneNumber, name} = req.body;
  if (!idToken || !phoneNumber || !name) return respondWithError(res, 400, 'Missing property in request body');

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
      res.status(200).json(user);
    } else {
      user = await UserModel.create({name, phoneNumber, addresses: [], createdAt: new Date(), rpPoint: 0});
      res.status(201).json(user);
    }
  } else {
    respondWithError(res, 400, 'Invalid token');
  }
});



module.exports = router;
