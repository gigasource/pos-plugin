const express = require('express');
const router = express.Router();

const {requestBodyHasProps, respondWithError} = require('./utils');
const StoreGroupModel = cms.getModel('StoreGroup');

router.post('/', async (req, res) => {
  if (requestBodyHasProps(req, res, ['storeGroupName'])) {
    const {storeGroupName} = req.body;
    if (!storeGroupName) return respondWithError(res, 400, 'Group name can not be empty');

    const existingGroup = await StoreGroupModel.findOne({name: storeGroupName});

    if (existingGroup) {
      res.status(200).json({
        _id: existingGroup._id.toString(),
        name: existingGroup.name,
      });
    } else {
      const createdGroup = await StoreGroupModel.create({name: storeGroupName});

      res.status(201).json({
        _id: createdGroup._id.toString(),
        name: createdGroup.name,
      });
    }
  }
});

module.exports = router;
