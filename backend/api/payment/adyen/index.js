const adyenApi = require('./adyenPlatformApi')
const express = require('express')
const router = express.Router()
const _ = require('lodash')

// TODO: Hanlde axios response.

router.post('/createAccountHolder', async (req, res) => {
  const response = await adyenApi.Account.createAccountHolder(req.body.metadata)
  res.json(response)
})

router.post('/closeAccountHolder', async (req, res) => {
  const response = await adyenApi.Account.closeAccountHolder(req.body.metadata)
  res.json(response)
})

/**
 * get account holder check status
 */
router.post('/checkAccountHolder', async (req, res) => {
  const response = await adyenApi.Account.checkAccountHolder(req.body.metadata)
  res.json(response)
})

/**
 * Update account info, link to bank account, add photo id, etc
 */
router.post('/updateAccountHolder', async (req, res) => {
  const response = await adyenApi.Account.updateAccountHolder(req.body.metadata)
  res.json(response);
})

router.post('/deleteBankAccounts', async (req, res) => {
  const response = await adyenApi.Account.deleteBankAccounts(req.body.metadata)
  res.json(response);
})

/**
 * get account holder balance
 */
router.post('/accountHolderBalance', async (req, res) => {
  const response = await adyenApi.Account.accountHolderBalance(req.body.metadata)
  res.json(response)
})


// CHECKOUT
router.post('/paymentMethods', async (req, res) => {
  const response = await adyenApi.Checkout.paymentMethods(req.body.metadata)
  res.json(response)
})

router.post('/payments', async (req, res) => {
  // TODO: service side validation to prevent hack
  const response = await adyenApi.Checkout.payments(req.body.metadata)
  res.json(response)
})

router.post('/payments/details', async(req, res) => {
  const response = await adyenApi.Checkout.paymentDetails(req.body.metadata)
  res.json(response)
})

// PAYOUT
router.post('/payout', async (req, res) => {
  const response = await adyenApi.Payout.payout(req.body.metadata)
  res.json(response)
})

// NOTIFICATION
router.post('/notification-handler', async(req, res) => {
  const {} = req.body
  switch(req.body.eventType) {
    case 'ACCOUNT_HOLDER_CREATED':
      onAccountHolderCreated(req)
      break;
    case 'ACCOUNT_HOLDER_UPDATED':
      onAccountHolderUpdated(req)
      break;
    case 'ACCOUNT_HOLDER_STATUS_CHANGE':
      onAccountHolderStatusChanged(req)
      break;
    case 'ACCOUNT_HOLDER_STORE_STATUS_CHANGE':
      onAccountHolderStoreStatusChange(req)
      break;
    case 'ACCOUNT_HOLDER_VERIFICATION':
      onAccountHolderVerification(req)
      break;
    case 'ACCOUNT_HOLDER_PAYOUT':
      onAccountHolderPayout(req)
      break;
    case 'PAYMENT_FAILURE':
      onPaymentFailure(req)
      break;
    case 'ACCOUNT_HOLDER_LIMIT_REACHED':
      console.warn('ACCOUNT_HOLDER_LIMIT_REACHED: no impl yet')
      break;
  }
})

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_CREATED
 * @param data
 */
function onAccountHolderCreated(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_UPDATED
 * @param data
 */
function onAccountHolderUpdated(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_STATUS_CHANGE
 * @param request
 */
function onAccountHolderStatusChanged(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_STORE_STATUS_CHANGE
 * @param request
 */
function onAccountHolderStoreStatusChange(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_VERIFICATION
 * @param request
 */
function onAccountHolderVerification(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/ACCOUNT_HOLDER_PAYOUT
 * @param request
 */
function onAccountHolderPayout(request) {

}

/**
 * https://docs.adyen.com/api-explorer/#/NotificationService/v5/post/PAYMENT_FAILURE
 * @param request
 */
function onPaymentFailure(request) {

}

// register notification configuration if notification is not registered yet
(async function(){
  const unregisteredNotifications = [
      'ACCOUNT_HOLDER_CREATED',
      'ACCOUNT_HOLDER_UPDATED',
      'ACCOUNT_HOLDER_STATUS_CHANGE',
      'ACCOUNT_HOLDER_VERIFICATION',
      'ACCOUNT_HOLDER_STORE_STATUS_CHANGE',
      'ACCOUNT_HOLDER_LIMIT_REACHED',
      'ACCOUNT_HOLDER_PAYOUT',
      'PAYMENT_FAILURE',
      // ...
  ]

  const includeMode = 'INCLUDE'

  const noticeConfigResp = await adyenApi.Notification.getNotificationConfigurationList({})
  const noticeConfigs = noticeConfigResp.configurations

  // find all required notifications which is not registered yet
  const includedConfigs = []
  _.each(noticeConfigs, noticeConfig => {
    if (noticeConfig.active) {
      includedConfigs.push.apply(includedConfig, _.filter(noticeConfig.eventConfigs, evConfig => evConfig.includeMode === includeMode))
    }
  })

  // loop over included config, remove unregistered notification if this notification has been included
  _.each(includedConfigs, cfg => {
    const indexOfNoticeConfig = unregisteredNotifications.indexOf(cfg.eventType)
    if (indexOfNoticeConfig >= 0) {
      unregisteredNotifications.splice(indexOfNoticeConfig, 1)
    }
  })

  // now we have only unregistered notice config
  // create it
  // TODO: host???
  adyenApi.Notification.createNotification({
    configurationDetails: {
      active: true,
      eventConfigs: _.map(unregisteredNotifications, name => ({
        eventType: name,
        includeMode: includeMode
      })),
      notifyURL: `${'host'}/payment/adyen/notification-handler`,
      notifyUsername: 'notifcation-handler',
      notifyPassword: 'notification-password',
      sslProtocol: 'SSL' // TODO: SSL | SSLInsecureCiphers | TLS | TLSv10 | TLSv10InsecureCiphers | TLSv11 | TLSv12
    }
  })
})()

module.exports = router
