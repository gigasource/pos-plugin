const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');

router.post('/register', async (req, res) => {
  const {storeId} = req.body;
  if (!storeId) return res.status(400).json({error: 'Missing data in request'});

  const store = await StoreModel.findById(storeId);
  if (!store) return res.status(400).json({error: 'Invalid store ID'});

  const newPosCommandDevice = await DeviceModel.create({
    name: 'POS command client',
    deviceType: 'posCommandDevice',
    storeId: ObjectId(storeId),
    paired: true,
  });

  res.status(200).json({clientId: newPosCommandDevice._id.toString()});
});

module.exports = router
