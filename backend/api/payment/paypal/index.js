const createPayPalClient = require('@gigasource/payment-provider/src/PayPal/backend/createPayPalClient')
const paypalApiV2 = require('./payPalApiV2Adapter');
const express = require('express')
const router = express.Router()
const _ = require('lodash')

async function createPayPalClientFromStoreId(storeId) {
  const store = await cms.getModel('Store').findOne({_id: storeId}, { paymentProviders: 1 })
  if (store) {
    return createPayPalClient(
        store.paymentProviders.paypal.clientId,
        store.paymentProviders.paypal.secretToken
    )
  }
}

router.get('/list-transaction', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const payPalClient = await createPayPalClientFromStoreId(store_id)
  const transactions = await paypalApiV2.getStoreTransaction(payPalClient,{ store_id, start_date, end_date, output })
  res.json(transactions)
})

router.get('/balance', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const payPalClient = await createPayPalClientFromStoreId(store_id)
  const netAmount = await paypalApiV2.getStoreBalance(payPalClient, { store_id, start_date, end_date, output })
  res.json(netAmount)
})

router.get('/transaction-detail', async(req, res) => {
  const { store_id, transaction_id, output, start_date, end_date } = req.query
  const payPalClient = await createPayPalClientFromStoreId(store_id)
  const transactions = await paypalApiV2.getStoreTransactionById(payPalClient, { transaction_id, output, start_date, end_date })
  res.json(transactions)
})

module.exports = router
