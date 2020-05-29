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

module.exports = {
  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/createAccountHolder
   * @param metaData
   * @returns {AxiosPromise<any>}
   */
  createAccountHolder: (metaData) => {
    return axios.post(`${API_END_POINT}/createAccountHolder`, metaData, axiosConfig);
  },

  /**
   * https://docs.adyen.com/api-explorer/#/Account/v5/post/closeAccountHolder
   * @param metaData { "accountHolderCode": "CODE_OF_ACCOUNT_HOLDER" }
   * @returns {AxiosPromise<any>}
   */
  closeAccountHolder: (metaData) => {
    return axios.post(`${API_END_POINT}/closeAccountHolder`, metaData, axiosConfig)
  },

  /**
   * TODO: Implement payment api
   */
}
