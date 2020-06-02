/**
 * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccountHolder
 */

const axios = require('axios')
const API_ACCOUNT_END_POINT = 'https://cal-test.adyen.com/cal/services/Account/v5'
const API_CHECKOUT_ENDPOINT = 'https://checkout-test.adyen.com/v52'
const API_PAYOUT_ENDPOINT = 'https://pal-test.adyen.com/pal/servlet/Payout/v52'
const API_NOTIFICATION_ENDPOINT = 'https://cal-test.adyen.com/cal/services/Notification/v5'
const wsUsername = process.env.ADYEN_WS_USERNAME
const wsPassword = process.env.ADYEN_WS_PASSWORD
const axiosConfig = {
  headers: {
    'Authentication': `Basic ${Buffer.from(`${wsUsername}:${wsPassword}`).toString('base64')}`,
    'Content-Type': 'application/json'
  }
}

const postAcc = (endPoint, metadata) => axios.post(`${API_ACCOUNT_END_POINT}/${endPoint}`, metadata, axiosConfig);
const postCheckout = (endpoint, metadata) => axios.post(`${API_CHECKOUT_ENDPOINT}/${endpoint}`, metadata, axiosConfig);
const postPayout = (endpoint, metadata) => axios.post(`${API_PAYOUT_ENDPOINT}/${endpoint}`, metadata, axiosConfig);
const postNotification = (endpoint, metadata) => axios.post(`${API_NOTIFICATION_ENDPOINT}/${endpoint}`, metadata, axiosConfig)

module.exports = {
  Account: {
    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    createAccountHolder: payload => postAcc('createAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/closeAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    closeAccountHolder: payload => postAcc('closeAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/getAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    getAccountHolder: payload => postAcc('getAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    updateAccountHolder: payload => postAcc('updateAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/suspendAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    suspendAccountHolder: payload => postAcc('suspendAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccountHolderState
     * @param payload
     * @returns {AxiosPromise}
     */
    updateAccountHolderState: payload => postAcc('updateAccountHolderState', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/unSuspendAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    unSuspendAccountHolder: payload => postAcc('unSuspendAccountHolder', payload),

    // Accounts
    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/closeAccount
     * @param payload
     * @returns {AxiosPromise}
     */
    closeAccount: payload => postAcc('closeAccount', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccount
     * @param payload
     * @returns {AxiosPromise}
     */
    createAccount: payload => postAcc('createAccount', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccount
     * @param payload
     * @returns {AxiosPromise}
     */
    updateAccount: payload => postAcc('updateAccount', payload),

    // verification
    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/checkAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    checkAccountHolder: payload => postAcc('checkAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/deleteBankAccounts
     * @param payload
     * @returns {AxiosPromise}
     */
    deleteBankAccounts: payload => postAcc('deleteBankAccounts', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/deletePayoutMethods
     * @param payload
     * @returns {AxiosPromise}
     */
    deletePayoutMethods: payload => postAcc('deletePayoutMethods', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/getUploadedDocuments
     * @param payload
     * @returns {AxiosPromise}
     */
    getUploadedDocuments: payload => postAcc('getUploadedDocuments', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Account/v5/post/uploadDocument
     * @param payload
     * @returns {AxiosPromise}
     */
    uploadDocument: payload => postAcc('uploadDocument', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/accountHolderBalance
     * @param payload
     * @returns {AxiosPromise}
     */
    accountHolderBalance: payload => postAcc('accountHolderBalance', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/accountHolderTransactionList
     * @param payload
     * @returns {AxiosPromise}
     */
    accountHolderTransactionList: payload => postAcc('accountHolderTransactionList', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/payoutAccountHolder
     * @param payload
     * @returns {AxiosPromise}
     */
    payoutAccountHolder: payload => postAcc('payoutAccountHolder', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/refundFundsTransfer
     * @param payload
     * @returns {AxiosPromise}
     */
    refundFundsTransfer: payload => postAcc('refundFundsTransfer', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/transferFunds
     * @param payload
     * @returns {AxiosPromise}
     */
    transferFunds: payload => postAcc('transferFunds', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/refundNotPaidOutTransfers
     * @param payload
     * @returns {AxiosPromise}
     */
    refundNotPaidOutTransfers: payload => postAcc('refundNotPaidOutTransfers', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/Fund/v5/post/setupBeneficiary
     * @param payload
     * @returns {AxiosPromise}
     */
    setupBeneficiary: payload => postAcc('setupBeneficiary', payload),
  },

  // https://docs.adyen.com/checkout/components-web
  // payment
  Checkout: {
    /**
     * https://docs.adyen.com/api-explorer/#/PaymentSetupAndVerificationService/v52/post/paymentMethods
     * @param payload
     * @returns {AxiosPromise}
     */
    paymentMethods: payload => postCheckout('paymentMethods', payload),

    /**
     * https://docs.adyen.com/api-explorer/#/PaymentSetupAndVerificationService/payments
     * @param pl
     * @returns {AxiosPromise}
     */
    payments: pl => postCheckout('payments', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/PaymentSetupAndVerificationService/v52/post/payments/details
     * @param pl
     * @returns {AxiosPromise}
     */
    paymentDetails: pl => postCheckout('payments/details', pl)
  },
  // https://docs.adyen.com/api-explorer/#/Payout/v52/post/payout
  Payout: {
    payout: pl => postPayout('payout', pl)
  },

  Notification: {
    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/createNotificationConfiguration
     * @param pl
     * @returns {AxiosPromise}
     */
    createNotification: pl => postNotification('createNotificationConfiguration', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/getNotificationConfiguration
     * @param pl
     * @returns {AxiosPromise}
     */
    getNotificationConfiguration: pl => postNotification('getNotificationConfiguration', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/deleteNotificationConfigurations
     * @param pl
     * @returns {AxiosPromise}
     */
    deleteNotificationConfigurations: pl => postNotification('deleteNotificationConfigurations', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/getNotificationConfigurationList
     * @param pl
     * @returns {AxiosPromise}
     */
    getNotificationConfigurationList: pl => postNotification('getNotificationConfigurationList', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/testNotificationConfiguration
     * @param pl
     * @returns {AxiosPromise}
     */
    testNotificationConfiguration: pl => postNotification('testNotificationConfiguration', pl),

    /**
     * https://docs.adyen.com/api-explorer/#/NotificationConfigurationService/v5/post/updateNotificationConfiguration
     * @param pl
     * @returns {AxiosPromise}
     */
    updateNotificationConfiguration: pl => postNotification('updateNotificationConfiguration', pl),
  }
}
