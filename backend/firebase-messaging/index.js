const admin = require('firebase-admin')

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  admin.initializeApp({
    credential: admin.credential.cert(config)
  })

  cms.on('sendOrderMessage', async (storeId, orderData) => {
    const { createdDate, customer, deliveryTime, discounts, note, orderType, paymentType, products, shippingFee, totalPrice } = orderData

    const store = await cms.getModel('Store').findById(storeId)
    const topic = store.alias
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
        storeName: store.name
      },
      topic
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${store.name},alias=${store.alias}`,
        `Sent firebase message at '${response}'`);
    } catch (e) {
      console.log(e)
    }
  })
}

