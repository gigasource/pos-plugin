"use strict"
const _ = require('lodash')

/**
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('./requests/paypalClient');

const { TransactionsGetRequest } = require('./requests/transactionsGetRequest')
const { PayoutCreateRequest } = require('./requests/payoutRequest')

async function createOrder(requestBody, debug=false) {
  try {
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation")
    request.requestBody(requestBody);
    const response = await payPalClient.client().execute(request);
    if (debug){
      console.log("Creating Order with Complete Payload:");
      console.log("Status Code: " + response.statusCode);
      console.log("Status: " + response.result.status);
      console.log("Order ID: " + response.result.id);
      console.log("Intent: " + response.result.intent);
      console.log("Links: ");
      response.result.links.forEach((item, index) => {
        let rel = item.rel;
        let href = item.href;
        let method = item.method;
        let message = `\t${rel}: ${href}\tCall Type: ${method}`;
        console.log(message);
      });
      console.log(`Gross Amount: ${response.result.purchase_units[0].amount.currency_code} ${response.result.purchase_units[0].amount.value}`);

      // To toggle print the whole body comment/uncomment the below line
      console.log(JSON.stringify(response.result, null, 4));
    }
    return response;
  }
  catch (e) {
    console.log(e)
  }
}
async function captureOrder(orderId, debug=false) {
  try {
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const response = await payPalClient.client().execute(request);
    if (debug){
      console.log("Status Code: " + response.statusCode);
      console.log("Status: " + response.result.status);
      console.log("Capture ID: " + response.result.id);
      console.log("Links:");
      response.result.links.forEach((item, index) => {
        let rel = item.rel;
        let href = item.href;
        let method = item.method;
        let message = `\t${rel}: ${href}\tCall Type: ${method}`;
        console.log(message);
      });
      // To toggle print the whole body comment/uncomment the below line
      console.log(JSON.stringify(response.result, null, 4));
    }
    return response;
  }
  catch (e) {
    console.log(e)
  }
}
async function listTransaction(query, debug) {
  try {
    const request = new TransactionsGetRequest(query);
    const response = await payPalClient.client().execute(request)
    if (debug) {
      console.log(response)
    }
    return response
  } catch (e) {
    console.log(e)
  }
}
async function getTransactionByStore({store_id, start_date, end_date, output}) {
  const responses = []
  const query =  {
    start_date,
    end_date,
    page_size: 500 /*max page size*/,
    transaction_status: 'S', /*succeeded*/
    fields: 'transaction_info,payer_info'
  }
  // exec first query
  let response = await listTransaction(query, true)
  if (response && response.statusCode === 200) {
    responses.push(response);

    // build remain query
    const queries = []
    for(let i=2; i<=response.result.total_pages; ++i)
      queries.push({...query, page: i})

    responses.push.apply(responses, await Promise.all(queries.map(qry => listTransaction(qry, true))))

    const transactions = []
    _.each(responses, response => {
      transactions.push.apply(transactions, response.result.transaction_details.filter(transaction => transaction.transaction_info.custom_field === store_id))
    })

    if (output === 'net_amount_only') {
      const netAmount = _.sumBy(transactions, tran => {
        return tran.transaction_info.transaction_amount.value - tran.transaction_info.fee_amount.value
      });
      return { net_amount: netAmount }
    } else if (output === 'money_only') {
      const money = transactions.map(tran => ({
        transaction_amount: tran.transaction_info.transaction_amount,
        fee_amount: tran.transaction_info.fee_amount,
        discount_amount: tran.transaction_info.discount_amount,
      }))
      return { money }
    } else {
      return { transactions }
    }
  } else {
    return []
  }
}
async function payout(requestBody, debug = false) {
  try {
    const request = new PayoutCreateRequest();
    request.requestBody(requestBody);
    const response = await payPalClient.client().execute(request);
    if (debug) {
      console.log(response)
    }
    return response;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  createOrder: createOrder,
  captureOrder: captureOrder,
  listTransaction: listTransaction,
  getTransactionByStore: getTransactionByStore,
  payout: payout,
}
