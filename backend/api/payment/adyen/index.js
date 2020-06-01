const adyenPlatformApi = require('./adyenPlatformApi')
const express = require('express')
const router = express.Router()
const _ = require('lodash')

router.post('/createAccountHolder', async (req, res) => {
  const response = await adyenPlatformApi.createAccountHolder(req.body.metadata)
  res.json(response)
})

router.post('/closeAccountHolder', async (req, res) => {
  const response = await adyenPlatformApi.closeAccountHolder(req.body.metadata)
  res.json(response)
})

/**
 * get account holder check status
 */
router.post('/checkAccountHolder', async (req, res) => {
  const response = await adyenPlatformApi.checkAccountHolder(req.body.metadata)
  res.json(response)
})

/**
 * Update account info, link to bank account, add photo id, etc
 */
router.post('/updateAccountHolder', async (req, res) => {
  const response = await adyenPlatformApi.updateAccountHolder(req.body.metadata)
  res.json(response);
})

router.post('/deleteBankAccounts', async (req, res) => {
  const response = await adyenPlatformApi.deleteBankAccounts(req.body.metadata)
  res.json(response);
})

/**
 * get account holder balance
 */
router.post('/accountHolderBalance', async (req, res) => {
  const response = await adyenPlatformApi.accountHolderBalance(req.body.metadata)
  res.json(response)
})



module.exports = router
