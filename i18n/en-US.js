let enLocale = require('./en').en;

module.exports = {
  'en-US': {
    ...enLocale,
    common: {
      ...enLocale.common,
      currency: '$',
      currencyCode: "USD",
      countryCode: "US",
      locale: "en-US",
    }
  }
}
