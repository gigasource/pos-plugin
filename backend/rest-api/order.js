const express = require('express')
const router = express.Router()
const getOnlineOrderSocket = require('../online-order/online-order').getOnlineOrderSocket

router.post('/update-status', async (req, res) => {
  const { orderId, onlineOrderId, status, responseMessage } = req.body[0]
  console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${onlineOrderId},orderId=${orderId}`,
    `8A. Restaurant backend: received update order status message by REST API`)

  const posSetting = await cms.getModel('PosSetting').findOne()
  const {onlineDevice: {store: {name, alias}}} = posSetting

  console.debug(getBaseSentryTags('orderStatus') + `,orderToken=${onlineOrderId},orderId=${orderId},store=${name},alias=${alias}`,
    `9A. Restaurant backend: Order id ${orderId}: send order status to online-order: status: ${status}, message: ${responseMessage}`)

  getOnlineOrderSocket().emit('updateOrderStatus', { orderId, onlineOrderId, status, responseMessage, storeName: name, storeAlias: alias}, )

  res.sendStatus(200)
})

module.exports = router

function getBaseSentryTags(eventType) {
  const appVersion = require('../../package').version;
  const onlineOrderSocket = getOnlineOrderSocket()
  const {deviceName} = global.APP_CONFIG;

  let tag = `sentry:version=${appVersion},deviceName=${deviceName},eventType=${eventType}`;
  if (onlineOrderSocket && onlineOrderSocket.clientId) tag += `,clientId=${onlineOrderSocket.clientId}`;

  return tag;
}
