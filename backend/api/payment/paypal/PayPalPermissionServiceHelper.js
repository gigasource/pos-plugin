/**
 * // https://developer.paypal.com/docs/archive/permissions-service/integration-guide/PermissionsAbout/#permission-groups
 */

const axios = require('axios')
const crypto = require('crypto')

const _apiHosts = {
  live: 'https://svcs.paypal.com',
  sandbox: 'https://svcs.sandbox.paypal.com'
}

const _grantPermissionsUrls = {
  live: 'https://www.paypal.com/cgi-bin/webscr',
  sandbox: 'https://www.sandbox.paypal.com/cgi-bin/webscr'
}

const requestEnvelope = {
  errorLanguage: 'en_US'
}

const _attributes = {
  'first_name': 'http://axschema.org/namePerson/first',
  'last_name': 'http://axschema.org/namePerson/last',
  'email': 'http://axschema.org/contact/email',
  'full_name': 'http://schema.openid.net/contact/fullname',
  'business_name': 'http://axschema.org/company/name',
  'country': 'http://axschema.org/contact/country/home',
  'payer_id': 'https://www.paypal.com/webapps/auth/schema/payerID',
  'date_of_birth': 'http://axschema.org/birthDate',
  'postcode': 'http://axschema.org/contact/postalCode/home',
  'street1': 'http://schema.openid.net/contact/street1',
  'street2': 'http://schema.openid.net/contact/street2',
  'city': 'http://axschema.org/contact/city/home',
  'state': 'http://axschema.org/contact/state/home',
  'phone': 'http://axschema.org/contact/phone/default'
}

const _basicPersonalDataAttributeNames = ['first_name', 'last_name', 'full_name',
  'email', 'business_name', 'country', 'payer_id']
const _advancedPersonalDataAttributeNames = [..._basicPersonalDataAttributeNames,
  'date_of_birth', 'postcode', 'street1', 'street2', 'city', 'state', 'phone']


class PayPalPermissionServiceHelper{
  constructor({ mode, appId, apiCredential }) {
    mode = mode || 'sandbox'
    this.appId = appId
    this.apiCredential = apiCredential
    this.host = _apiHosts[mode]
    this.grantPermissionUrl = `${_grantPermissionsUrls[mode]}?cmd=_grant-permission&request_token=`
    this.basicHeaders = {
      'X-PAYPAL-SECURITY-USERID': this.apiCredential.userId,
      'X-PAYPAL-SECURITY-PASSWORD': this.apiCredential.password,
      'X-PAYPAL-SECURITY-SIGNATURE': this.apiCredential.signature,
      'X-PAYPAL-APPLICATION-ID': this.appId,
      'X-PAYPAL-REQUEST-DATA-FORMAT': 'JSON',
      'X-PAYPAL-RESPONSE-DATA-FORMAT': 'JSON',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  async requestPermission({ scope, callback }) {
    const url = this._buildRequestUrl('RequestPermissions')

    if (typeof (scope) === 'string' && scope.indexOf(',') > 0)
      scope = scope.split(',')

    try {
      const response = await axios.post(url, { scope, callback, requestEnvelope }, { headers: this.basicHeaders })
      return  {
        ok: response.data.responseEnvelope.ack === "Success",
        grantPermissionUrl: `${this.grantPermissionUrl}${response.data.token}`
      }
    } catch (e) {
      return { error: '' }
    }
  }

  async getAccessToken({ token, verifier }) {
    try {
      const url = this._buildRequestUrl('GetAccessToken')
      const response = await axios.post(url, { token, verifier, requestEnvelope }, { headers: this.basicHeaders })
      if (response.data.responseEnvelope.ack === 'Success')
        return response.data
    } catch (e) {
      console.warn(e)
    }
  }

  async setAuth(accessToken, tokenSecret) {
    this._auth = { accessToken, tokenSecret }
  }

  async getBasicPersonalData() {
    return await this._getPersonalData(_basicPersonalDataAttributeNames, 'GetBasicPersonalData')
  }

  async getAdvancedPersonalData() {
    return await this._getPersonalData(_advancedPersonalDataAttributeNames, 'GetAdvancedPersonalData')
  }

  async _getPersonalData (attributeList, action) {
    try {
      const url = this._buildRequestUrl(action)
      const response = await axios.post(url, {
        requestEnvelope,
        attributeList: { attribute: this._getAttributes(attributeList) }
      }, {
        headers: this._getThirdPartyAuthHeaders('POST', action)
      })
      const responseData = response.data
      if (responseData.responseEnvelope.ack === "Success") {
        const personalData = responseData.response.personalData
        const invertedAttributes = this._invert(_attributes)
        const person = response.person = {}
        for (let data of personalData) {
          person[invertedAttributes[data.personalDataKey]] = data.personalDataValue
        }
        return person
      }
    } catch (e) {
      console.warn(e)
    }
  }

  _paypalUrlEncode(s) {
    const hex = '0123456789abcdef'
    const untouched = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_'
    const result = s.split('').map(function (c) {
      if (untouched.indexOf(c) >= 0) { return c; }
      else if (c === ' ') { return '+'; }else {
        const code = c.charCodeAt(0)
        return '%' + hex.charAt((code & 0xf0) >> 4) + hex.charAt(code & 0xf)
      }
    })
    return result.join('')
  }
  _invert(obj) {
    let newObj = {}

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        newObj[obj[prop]] = prop
      }
    }

    return newObj
  }
  _getThirdPartyAuthHeaders(httpMethod, action) {
    return {
      'X-PAYPAL-AUTHORIZATION': this._getAuthString(httpMethod, this._buildRequestUrl(action)),
      'X-PAYPAL-REQUEST-DATA-FORMAT': 'JSON',
      'X-PAYPAL-RESPONSE-DATA-FORMAT': 'JSON',
      'X-PAYPAL-APPLICATION-ID': this.appId,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  _getAttributes (names) {
    return names.map(name => _attributes[name])
  }
  _getAuthString(httpMethod, url) {
    if (!this._auth)
      throw new Error('The accessToken and tokenSecret need to be set, please call "setAuth" method first.')

    // Don't change order of params
    const timestamp = Math.round(Date.now() / 1000)
    let paramString = [
      `oauth_consumer_key=${this.apiCredential.userId}`,
      `oauth_signature_method=HMAC-SHA1`,
      `oauth_timestamp=${timestamp}`,
      `oauth_token=${this._auth.accessToken}`,
      `oauth_version=1.0`
    ].join('&')

    let key = [this._paypalUrlEncode(this.apiCredential.password), this._paypalUrlEncode(this._auth.tokenSecret)].join('&')
    let signatureBase = [httpMethod, this._paypalUrlEncode(url), this._paypalUrlEncode(paramString)].join('&')
    let signature = crypto.createHmac('sha1', key).update(signatureBase).digest().toString('base64')

    return `token=${this._auth.accessToken},signature=${signature},timestamp=${timestamp}`
  }
  _buildRequestUrl(action) {
    return `${this.host}/Permissions/${action}`
  }
}

module.exports = PayPalPermissionServiceHelper
