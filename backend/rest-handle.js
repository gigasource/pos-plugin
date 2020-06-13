require('dotenv').config()

const deviceAPI = require('./api/device')
const demoAPI = require('./api/demoDevice')
const storeAPI = require('./api/store')
const appManagementAPI = require('./api/appManagement')
const payment = require('./api/payment')

module.exports = cms => {
  cms.data['loginUrl'] = '/sign-in';
  cms.data['nonAuthenticateUrls'] = ['/login', '/store', '/reservation']

  cms.app.use('/device', deviceAPI)
  cms.app.use('/store', storeAPI)
  cms.app.use('/app', appManagementAPI)
  cms.app.use('/payment', payment)
  cms.app.use('/demo', demoAPI)

  // NOTE: If health-check API URL is changed, the URL used on frontend must be changed accordingly
  cms.app.get('/health-check', (req, res) => res.status(200).send('OK'));

  cms.app.use(/^\/$/, async (req, res) => {
    if (!req.session.userId)
      return res.redirect('/sign-in')
    else
      return res.redirect('/management')
  })
}
