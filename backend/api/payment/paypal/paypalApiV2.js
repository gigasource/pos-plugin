"use strict"
const _ = require('lodash')
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
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
  const outputFields = (output && _.trim(output) !== "") ? _.trim(output).split(',') : []
  const query =  {
    start_date,
    end_date,
    page_size: 500 /*max page size*/,
    transaction_status: 'S', /*succeeded*/
    transaction_type: 'T0006', /*Checkout API*/
    fields: _.uniq(['transaction_info', 'payer_info', ...outputFields]).join(',')
  }

  // exec first query
  let response = await listTransaction(query)
  if (response && response.statusCode === 200) {
    responses.push(response);

    // build remain query
    const queries = []
    for(let i=2; i<=response.result.total_pages; ++i)
      queries.push({...query, page: i})

    // TODO: Known-issue: Load all transaction into memory for multiple request at the same time lead to memory issue
    responses.push.apply(responses, await Promise.all(queries.map(qry => listTransaction(qry))))

    const transactions = []
    _.each(responses, ({ statusCode, result }) => {
      if (statusCode === 200 && result && Array.isArray(result.transaction_details) && result.transaction_details.length > 0) {
        transactions.push.apply(transactions, result.transaction_details.filter(tranDetail => tranDetail && tranDetail.transaction_info && tranDetail.transaction_info.custom_field === store_id))
      }
    })
    return { transactions, lastRefreshedDateTime: response.result.last_refreshed_datetime }
  } else {
    return []
  }
}
async function getTransactionById({transaction_id, start_date, end_date, output}) {
  const outputFields = (output && _.trim(output) !== "") ? _.trim(output).split(',') : []
  const query =  {
    transaction_id,
    start_date,
    end_date,
    transaction_status: 'S', /*succeeded*/
    fields: _.uniq(['transaction_info', 'payer_info', ...outputFields]).join(',')
  }
  // Note: A transaction ID is not unique in the reporting system.
  // The response can list two transactions with the same ID.
  // One transaction can be balance affecting while the other is non-balance affecting.
  let { statusCode, result } = await listTransaction(query)
  if (statusCode === 200 && result) {
      return { transactions: result.transaction_details }
  } else {
    return null
  }
}
async function getNetAmountByStore({store_id, start_date, end_date}) {
  const { transactions, lastRefreshedDateTime } = await getTransactionByStore({store_id, start_date, end_date })

  // Expected that all transaction has been confirmed have the same currency code
  //
  if (transactions && transactions.length) {
    return {
      currencyCode: transactions[0].transaction_info.transaction_amount.currency_code,
      lastRefreshedDateTime,
      netAmount: _.sumBy(transactions, tran => {
        const tranInfo = tran.transaction_info
        if (!tranInfo)
          return 0;
        const tranAmount = tran.transaction_info.transaction_amount
        if (!tranAmount)
          return 0;
        const feeAmount = tran.transaction_info.fee_amount || { value: 0 }
        return parseFloat(tranAmount.value) - Math.abs(parseFloat(feeAmount.value))
      })
    }
  } else {
    return {
      currencyCode: 'USD',
      netAmount: 0
    }
  }
}

module.exports = {
  createOrder,
  captureOrder,
  getTransactionByStore,
  getNetAmountByStore,
  getTransactionById,
}
