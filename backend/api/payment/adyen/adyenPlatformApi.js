/**
 * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccountHolder
 */

const axios = require('axios')
const API_END_POINT = 'https://cal-test.adyen.com/cal/services/Account/v5'
const wsUsername = process.env.ADYEN_WS_USERNAME
const wsPassword = process.env.ADYEN_WS_PASSWORD
const axiosConfig = {
  headers: {
    'Authentication': `Basic ${Buffer.from(`${wsUsername}:${wsPassword}`).toString('base64')}`,
    'Content-Type': 'application/json'
  }
}

const post = (endPoint, metadata) => axios.post(`${API_END_POINT}/${endPoint}`, metadata, axiosConfig);

module.exports = {
  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  createAccountHolder: payload => post('createAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/closeAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  closeAccountHolder: payload => post('closeAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/getAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  getAccountHolder: payload => post('getAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  updateAccountHolder: payload => post('updateAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/suspendAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  suspendAccountHolder: payload => post('suspendAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccountHolderState
   * @param payload
   * @returns {AxiosPromise}
   */
  updateAccountHolderState: payload => post('updateAccountHolderState', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/unSuspendAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  unSuspendAccountHolder: payload => post('unSuspendAccountHolder', payload),

  // Accounts
  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/closeAccount
   * @param payload
   * @returns {AxiosPromise}
   */
  closeAccount: payload => post('closeAccount', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccount
   * @param payload
   * @returns {AxiosPromise}
   */
  createAccount: payload => post('createAccount', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/updateAccount
   * @param payload
   * @returns {AxiosPromise}
   */
  updateAccount: payload => post('updateAccount', payload),

  // verification
  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/checkAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  checkAccountHolder: payload => post('checkAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/deleteBankAccounts
   * @param payload
   * @returns {AxiosPromise}
   */
  deleteBankAccounts: payload => post('deleteBankAccounts', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/deletePayoutMethods
   * @param payload
   * @returns {AxiosPromise}
   */
  deletePayoutMethods: payload => post('deletePayoutMethods', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/getUploadedDocuments
   * @param payload
   * @returns {AxiosPromise}
   */
  getUploadedDocuments: payload => post('getUploadedDocuments', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/uploadDocument
   * @param payload
   * @returns {AxiosPromise}
   */
  uploadDocument: payload => post('uploadDocument', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/accountHolderBalance
   * @param payload
   * @returns {AxiosPromise}
   */
  accountHolderBalance: payload => post('accountHolderBalance', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/accountHolderTransactionList
   * @param payload
   * @returns {AxiosPromise}
   */
  accountHolderTransactionList: payload => post('accountHolderTransactionList', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/payoutAccountHolder
   * @param payload
   * @returns {AxiosPromise}
   */
  payoutAccountHolder: payload => post('payoutAccountHolder', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/refundFundsTransfer
   * @param payload
   * @returns {AxiosPromise}
   */
  refundFundsTransfer: payload => post('refundFundsTransfer', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/transferFunds
   * @param payload
   * @returns {AxiosPromise}
   */
  transferFunds: payload => post('transferFunds', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/refundNotPaidOutTransfers
   * @param payload
   * @returns {AxiosPromise}
   */
  refundNotPaidOutTransfers: payload => post('refundNotPaidOutTransfers', payload),

  /**
   * https://docs.adyen.com/api-explorer/#/Fund/v5/post/setupBeneficiary
   * @param payload
   * @returns {AxiosPromise}
   */
  setupBeneficiary: payload => post('setupBeneficiary', payload)
}
