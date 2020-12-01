let enLocale = require('./en').en;

module.exports = {
  'en-GB': {
    ...enLocale,
    common: {
      ...enLocale.common,
      currency: '£',
      currencyCode: "GBP",
      countryCode: "GB",
      locale: "en-GB",
    }
  }
}
