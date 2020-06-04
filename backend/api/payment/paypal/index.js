const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const paypalApiV2 = require('./paypalApiV2');
const express = require('express')
const router = express.Router()
const _ = require('lodash')

async function createPayPalClient(storeId) {
  const store = await cms.getModel('Store').findOne({_id: storeId}, { paymentProviders: 1 })
  if (store) {
    const envCtor = process.env.PAYPAL_MODE === 'sandbox' ? checkoutNodeJssdk.core.SandboxEnvironment : checkoutNodeJssdk.core.LiveEnvironment;
    const env = new envCtor({
      clientId: store.paymentProviders.paypal.clientId,
      clientSecret: store.paymentProviders.paypal.secretToken
    })
    return new checkoutNodeJssdk.core.PayPalHttpClient(env);
  }
}

router.get('/list-transaction', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const payPalClient = await createPayPalClient(store_id)
  const transactions = await paypalApiV2.getStoreTransaction(payPalClient,{ store_id, start_date, end_date, output })
  res.json(transactions)
})

router.get('/balance', async(req, res) => {
  const { store_id, start_date, end_date, output } = req.query
  const payPalClient = await createPayPalClient(store_id)
  const netAmount = await paypalApiV2.getStoreBalance(payPalClient, { store_id, start_date, end_date, output })
  res.json(netAmount)
})

router.get('/transaction-detail', async(req, res) => {
  const { store_id, transaction_id, output, start_date, end_date } = req.query
  const payPalClient = await createPayPalClient(store_id)
  const transactions = await paypalApiV2.getStoreTransactionById(payPalClient, { transaction_id, output, start_date, end_date })
  res.json(transactions)
})

module.exports = router
