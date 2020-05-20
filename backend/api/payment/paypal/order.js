"use strict"
/**
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * PayPal HTTP client dependency
 */
const payPalClient = require('./paypalClient');

/**
 * Setting up the complete JSON request body for creating the Order. The Intent
 * in the request body should be set as "AUTHORIZE" for Authorize intent flow.
 */
async function createOrder(requestBody, debug=false) {
  try {
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.headers["prefer"] = "return=representation";
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

/**
 * This function can be used to perform authorization on the approved order.
 * An valid approved order id should be passed as an argument to this function.
 *
 * @param orderId
 * @param debug
 * @returns
 */
async function authorizeOrder(orderId, debug=false) {
  try {
    const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderId);
    request.requestBody({});
    const response = await payPalClient.client().execute(request);
    if (debug){
      console.log("Status Code: " + response.statusCode);
      console.log("Status: " + response.result.status);
      console.log('Authorization ID: ', response.result.purchase_units[0].payments.authorizations[0].id);
      console.log("Order ID: " + response.result.id);
      console.log("Links: ");
      response.result.links.forEach((item, index) => {
        let rel = item.rel;
        let href = item.href;
        let method = item.method;
        let message = `\t${rel}: ${href}\tCall Type: ${method}`;
        console.log(message);
      });
      console.log("Authorization Links:");
      response.result.purchase_units[0].payments.authorizations[0].links.forEach((item, index) => {
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
 * This function can be used to capture the payment on an authorized Order.
 * An Valid authorization Id should be passed as an argument to this method.
 *
 * @param authId
 * @param debug
 * @returns
 */
async function captureOrder(authId, debug=false) {
  try {
    const request = new checkoutNodeJssdk.payments.AuthorizationsCaptureRequest(authId);
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

module.exports = { createOrder, authorizeOrder, captureOrder }
