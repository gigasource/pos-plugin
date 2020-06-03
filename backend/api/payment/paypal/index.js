const paypalApiV2 = require('./paypalApiV2')
const PayPalPermissionServiceHelper = require('./PayPalPermissionServiceHelper')
const express = require('express')
const router = express.Router()
const _ = require('lodash')

const paypalPerm = new PayPalPermissionServiceHelper({
  mode: process.env.PAYPAL_MODE,
  appId: process.env.PAYPAL_APP_ID,
  apiCredential: {
    userId: process.env.PAYPAL_API_CREDENTIAL_USER_ID,
    password: process.env.PAYPAL_API_CREDENTIAL_PASSWORD,
    signature: process.env.PAYPAL_API_CREDENTIAL_SIGNATURE
  }
})

router.get('/list-transaction', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const transactions = await paypalApiV2.getStoreTransaction({ store_id, start_date, end_date, output })
  res.json(transactions)
})

router.get('/balance', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const netAmount = await paypalApiV2.getStoreBalance({ store_id, start_date, end_date, output })
  res.json(netAmount)
})

router.get('/transaction-detail', async(req, res) => {
  const { transaction_id, output, start_date, end_date } = req.query
  const transactions = await paypalApiV2.getStoreTransactionById({ transaction_id, output, start_date, end_date })
  res.json(transactions)
})

router.post('/requestPermissions', async (req, res) => {
  const { scope, callback } = req.body
  const response = await paypalPerm.requestPermission({scope, callback})
  res.json(response)
})

router.post('/getAccessToken', async (req, res) => {
  const { token, verifier } = req.body
  const response = await paypalPerm.getAccessToken({ token, verifier })
  res.json(response)
})

router.post('/getBasicPersonalData', async (req, res) => {
  const { token, tokenSecret } = req.body
  paypalPerm.setAuth(token, tokenSecret)
  const response = await paypalPerm.getBasicPersonalData()
  res.json(response)
})

router.post('/getAdvancedPersonalData', async (req, res) => {
  const { token, tokenSecret } = req.body
  paypalPerm.setAuth(token, tokenSecret)
  const response = await paypalPerm.getAdvancedPersonalData()
  res.json(response)
})


module.exports = router
