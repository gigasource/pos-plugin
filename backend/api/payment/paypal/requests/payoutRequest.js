;"use strict"

class PayoutCreateRequest {
  constructor() {
    this.path = '/v1/payments/payouts';
    this.verb = 'GET';
    this.body = null;
    this.headers = {
      'Content-Type': 'application/json'
    };
  }

  prefer(prefer) {
    this.headers['Prefer'] = prefer;
    return this;
  }

  _validateSenderBatchHeader(requestBody) {
    // validate
    if (!requestBody.sender_batch_header)
      throw "Missing sender_batch_header"
    if (!requestBody.sender_batch_header.sender_batch_id)
      throw "Missing sender_batch_header.sender_batch_id"
    if (!requestBody.sender_batch_header.recipient_type)
      throw "Missing sender_batch_header.recipient_type"
    if (!requestBody.sender_batch_header.email_subject)
      throw "Missing sender_batch_header.email_subject"
    if (!requestBody.sender_batch_header.email_message)
      throw "Missing sender_batch_header.email_message"
  }

  _validateItems(requestBody) {
    if (!requestBody.items)
      throw "Missing items"
    if (!Array.isArray(requestBody.items))
      throw "requestBody.items is not an array!"
  }

  requestBody(requestBody) {
    this._validateSenderBatchHeader(requestBody)
    this._validateItems(requestBody)
    this.body = requestBody;
    return this;
  }
}

module.exports = { PayoutCreateRequest: PayoutCreateRequest }
