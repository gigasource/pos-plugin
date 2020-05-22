"use strict"
/**
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('./paypalClient');

const { TransactionsGetRequest } = require('./transactionsGetRequest')

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

module.exports = {
  createOrder: async function(requestBody, debug) {
    requestBody.intent = "CAPTURE"
    return await createOrder(requestBody, debug)
  },
  captureOrder: async function(orderID, debug) {
    return await captureOrder(orderID, debug)
  },
  listTransaction: listTransaction
}
