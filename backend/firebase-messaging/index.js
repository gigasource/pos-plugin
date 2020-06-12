const admin = require('firebase-admin')

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  admin.initializeApp({
    credential: admin.credential.cert(config)
  })

  cms.on('sendOrderMessage', async (storeId, orderData) => {
    let { createdDate, customer, deliveryTime, discounts, note, orderType, paymentType, products, shippingFee, totalPrice } = orderData

    const store = await cms.getModel('Store').findById(storeId)
    const topic = store.alias
    products = products.map(({ modifiers, name, note, originalPrice, quantity }) => {
      if (modifiers && modifiers.length) {
        const sumOfModifiers = modifiers.reduce((sum, { price, quantity }) => sum + quantity * price, 0)
        originalPrice = originalPrice + sumOfModifiers
      }

      return {
        name,
        originalPrice,
        note,
        modifiers: modifiers.map(({ name }) => name).join(', '),
        quantity,
      }
    })

    discounts = discounts.reduce((sum, discount) => sum + discount.value, 0)

    if (deliveryTime === 'asap') {
      deliveryTime = dayjs().add(store.gSms.timeToComplete || 30, 'minute').format('HH:mm')
    }

    customer = {
      name: customer.name,
      phone: customer.phone,
      zipCode: customer.zipCode,
      address: customer.address
    }

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
        deliveryTime,
        discounts: JSON.stringify(discounts)
      },
      notification: {
        title: store.name,
        body: 'You have a new order!'
      },
      android: {
        notification: {
          sound: 'bell'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'bell.aiff',
            contentAvailable: true
          },
        }
      },
      topic
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${store.name},alias=${store.alias}`,
        `Sent firebase message, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${store.name},alias=${store.alias}`,
        `Error sending firebase msg`, e)
    }
  })
}

