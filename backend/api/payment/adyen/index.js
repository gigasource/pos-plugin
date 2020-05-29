const adyenPlatformApi = require('./adyenPlatformApi')
const express = require('express')
const router = express.Router()
const _ = require('lodash')

router.post('/createAccountHolder', async (req, res) => {
  const {metaData} = req.body
  const response = await adyenPlatformApi.createAccountHolder(metaData)
  res.json(response)
})



module.exports = router
