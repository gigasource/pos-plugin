const deviceAPI = require('./api/device')
const storeAPI = require('./api/store')
const appManagementAPI = require('./api/appManagement')

module.exports = cms => {
  cms.data['loginUrl'] = '/sign-in';
  cms.data['nonAuthenticateUrls'] = ['/login', '/store']

  cms.app.use('/device', deviceAPI)
  cms.app.use('/store', storeAPI)
  cms.app.use('/app', appManagementAPI)

  // NOTE: If health-check API URL is changed, the URL used on frontend must be changed accordingly
  cms.app.get('/health-check', (req, res) => res.status(200).send('OK'));

  cms.app.use(/^\/$/, async (req, res) => {
    if (!req.session.userId)
      return res.redirect('/sign-in')
    else
      return res.redirect('/management')
  })
}
