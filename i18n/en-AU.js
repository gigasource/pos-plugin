let enLocale = require('./en').en;

module.exports = {
  'en-AU': {
    ...enLocale,
    common: {
      ...enLocale.common,
      currency: '$',
      currencyCode: "AUD",
      countryCode: "AU",
      locale: "en-AU",
    }
  }
}
