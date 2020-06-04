;"use strict"
const _ = require('lodash')
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { TransactionsGetRequest } = require('./requests/transactionsGetRequest')

async function captureOrder(payPalClient, orderId, debug=false) {
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

/**
 * Execute list transaction query
 * @param query
 * @param debug
 * @returns {Promise<*>}
 * @private
 */
async function _execListTransaction(payPalClient, query, debug) {
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

/**
 * Execute single/multiple transaction queries base on params
 * @param store_id
 * @param start_date
 * @param end_date
 * @param output
 * @param page_index
 * @param page_size
 * @returns {Promise<{lastRefreshedDateTime: *, transactions: []}|*[]>}
 */
async function getStoreTransaction(payPalClient, {
                    store_id,             /*Transaction of specified store*/
                    start_date, end_date, /*Allow filter*/
                    output,               /*Allow options field to get transaction order detail*/
                    page_index, page_size   /*Pagination*/
}) {
  const responses = []
  const outputFields = (output && _.trim(output) !== "") ? _.trim(output).split(',') : []
  const query =  {
    start_date,
    end_date,
    page_size: 500,
    transaction_status: 'S', /*succeeded*/
    transaction_type: 'T0006', /*Checkout API*/
    fields: _.uniq(['transaction_info', 'payer_info', ...outputFields]).join(',')
  }

  // exec first query
  let response = await _execListTransaction(payPalClient, query)
  if (response && response.statusCode === 200) {
    responses.push(response);

    // continue execute to gather all transaction
    // TODO: Known-issue: Load all transaction into memory for multiple request at the same time lead to memory issue
    if (response.result.total_pages > 1) {
      const queries = []
      for(let i=2; i<=response.result.total_pages; ++i)
        queries.push({...query, page: i})
      responses.push.apply(responses, await Promise.all(queries.map(qry => _execListTransaction(payPalClient, qry))))
    }

    const transactions = []
    _.each(responses, ({ statusCode, result }) => {
      if (statusCode === 200 && result && Array.isArray(result.transaction_details) && result.transaction_details.length > 0) {
        transactions.push.apply(transactions, result.transaction_details.filter(tranDetail => tranDetail && tranDetail.transaction_info && tranDetail.transaction_info.custom_field === store_id))
      }
    })

    return {
      transactions,
      totalPages: response.result.total_pages,
      lastRefreshedDateTime: response.result.last_refreshed_datetime
    }
  } else {
    return []
  }
}

/**
 * Get transaction detail
 * @param transaction_id
 * @param start_date
 * @param end_date
 * @param output
 * @returns {Promise<null|{transactions: *}>}
 */
async function getStoreTransactionById(payPalClient, {transaction_id, start_date, end_date, output}) {
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
  let { statusCode, result } = await _execListTransaction(payPalClient, query)
  if (statusCode === 200 && result) {
      return { transactions: result.transaction_details }
  } else {
    return null
  }
}

/**
 * Get actual received amount per transaction
 * @param tran
 * @returns {number}
 */
function _getActualReceivedAmount(tran) {
  // actual received
  // note that, fee returned from PayPal is nagative value
  // so adding fee is actual remove it from transaction amount
  let tranAmount = tran.transaction_info.transaction_amount.value;
  let feeAmount = tran.transaction_info.fee_amount.value
  return parseFloat(tranAmount) + parseFloat(feeAmount)
}

/**
 * Get balance of store
 * @param store_id
 * @param start_date
 * @param end_date
 * @returns {Promise<{balances: [{netAmount: number, currencyCode: string}], lastRefreshedDateTime: *}|{balances: [], lastRefreshedDateTime: *}>}
 */
async function getStoreBalance(payPalClient, {store_id, start_date, end_date}) {
  const { transactions, lastRefreshedDateTime } = await getStoreTransaction(payPalClient,{ store_id, start_date, end_date })
  if (transactions && transactions.length) {
    const transactionMap = _.groupBy(transactions, t => t.transaction_info.transaction_amount.currency_code)
    // calculate balances by currency code
    const balances = []
    _.each(_.keys(transactionMap), currencyCode => {
      balances.push({
        currencyCode,
        netAmount: _.sumBy(transactionMap[currencyCode], _getActualReceivedAmount).toFixed(2)
      })
    })
    return {
      lastRefreshedDateTime,
      balances,
    }
  } else {
    // empty balance
    return {
      lastRefreshedDateTime,
      balances: [{
        currencyCode: 'USD',
        netAmount: 0
      }]
    }
  }
}

module.exports = {
  captureOrder,
  getStoreTransaction,
  getStoreBalance,
  getStoreTransactionById,
}
