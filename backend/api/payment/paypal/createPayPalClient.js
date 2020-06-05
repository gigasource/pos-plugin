const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

function createPayPalClient(clientId, clientSecret) {
  const envCtor = process.env.PAYPAL_MODE === 'sandbox' ? checkoutNodeJssdk.core.SandboxEnvironment : checkoutNodeJssdk.core.LiveEnvironment;
  const env = new envCtor(clientId, clientSecret)
  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
}

module.exports = createPayPalClient
