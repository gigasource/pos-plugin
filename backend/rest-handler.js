const orderApi = require('./rest-api/order')

module.exports = cms => {
  cms.app.use(/^\/$/, async (req, res, next) => {
    return res.redirect('/pos-login')
    next()
  })
  cms.app.use('/api/order', orderApi)
}
