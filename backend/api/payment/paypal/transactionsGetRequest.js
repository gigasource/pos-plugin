'use strict'

class TransactionsGetRequest {
  constructor(query) {
    this.path = this.generatePath(query);
    this.verb = 'GET';
    this.body = null;
    this.headers = {
      'Content-Type': 'application/json'
    };
  }

  generatePath(query) {
    if (!query)
      throw 'Invalid query';

    const parts = [
      'transaction_id', 'transaction_type', 'transaction_status', 'transaction_amount',
      'transaction_currency', 'start_date', 'end_date', 'payment_instrument_type', 'fields',
      'balance_affecting_records_only', 'page_size', 'page'
    ];

    const queryPart = parts.map(i => query[i] ? `${i}=${query[i]}` : null).filter(i => i).join('&');
    return `/v1/reporting/transactions?${queryPart}`
  }
}

module.exports = { TransactionsGetRequest: TransactionsGetRequest };
