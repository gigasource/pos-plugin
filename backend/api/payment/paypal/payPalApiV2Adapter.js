const _ = require('lodash')
const PayPalAPIv2 = require('@gigasource/payment-provider/src/PayPal/backend/paypalApiV2')

async function captureOrder(payPalClient, orderId, debug=false) {
  return await PayPalAPIv2.captureOrder(payPalClient, orderId, debug);
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
  /*Transaction of specified store*/
  store_id,
  /*Allow filter*/
  start_date,
  end_date,
  /*Allow options field to get transaction order detail*/
  output,
  /*Pagination*/
  page_index,
  page_size
}) {
  const outputFields = (output && _.trim(output) !== "") ? _.trim(output).split(',') : []
  const result = await PayPalAPIv2.getTransactions(payPalClient, {
    start_date,
    end_date,
    page_size: 500,
    transaction_status: 'S', /*succeeded*/
    transaction_type: 'T0006', /*Checkout API*/
    fields: _.uniq(['transaction_info', 'payer_info', ...outputFields]).join(',')
  })
  if (result.transactions)
    result.transactions = result.transactions.filter(tranDetail => filterTransactionByStore(tranDetail, store_id))
  return result;
}

function filterTransactionByStore(tranDetail, store_id) {
  return tranDetail && tranDetail.transaction_info && tranDetail.transaction_info.custom_field === store_id
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
  return await PayPalAPIv2.getTransactionDetail(payPalClient, query)
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
