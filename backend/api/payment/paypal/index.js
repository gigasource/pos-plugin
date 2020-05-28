const paypalApiV2 = require('./paypalApiV2')
const express = require('express')
const router = express.Router()
const _ = require('lodash')

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

module.exports = router
