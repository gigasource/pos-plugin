const admin = require('firebase-admin')

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  admin.initializeApp({
    credential: admin.credential.cert(config)
  })

  cms.on('sendOrderMessage', async (storeId, orderData) => {
    const { createdDate, customer, deliveryTime, discounts, note, orderType, paymentType, products, shippingFee, storeAlias, storeName, totalPrice } = orderData

    const topic = storeAlias
    const message = {
      data: {
        orderType,
        paymentType,
        customer: JSON.stringify(customer),
        products: JSON.stringify(products),
        note,
        date: JSON.stringify(createdDate),
        shippingFee: JSON.stringify(shippingFee),
        total: JSON.stringify(totalPrice),
        deliveryTime: deliveryTime,
        discounts: JSON.stringify(discounts),
        storeName
      },
      topic
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${storeName},alias=${storeAlias}`,
        `Sent firebase message ${response}`);
    } catch (e) {
      console.log(e)
    }
  })
}

