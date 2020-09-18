require('dotenv').config();

const posDeviceApi = require('./api/devices/pos-devices');
const posCommandDeviceApi = require('./api/devices/pos-command-devices');
const gsmsDeviceApi = require('./api/devices/gsms-devices');
const demoApi = require('./api/demoDevice');
const storeApi = require('./api/store');
const storeGroupApi = require('./api/store-group');
const appManagementApi = require('./api/appManagement');
const payment = require('./api/payment');
const supportApi = require('./api/support');
// const restaurantDataBackupApi = require('./api/restaurant-data-backup');
const userApi = require('./api/users');
const topaz = require('./api/topazAI')

module.exports = cms => {
  cms.data['loginUrl'] = '/sign-in';
  cms.data['nonAuthenticateUrls'] = ['/login', '/store', '/reservation', '/franchise', '/menu', '/qrcode', '/overview'];

  cms.app.use('/device', posDeviceApi);
  cms.app.use('/pos-command-device', posCommandDeviceApi);
  cms.app.use('/gsms-device', gsmsDeviceApi);
  cms.app.use('/store', storeApi);
  cms.app.use('/store-group', storeGroupApi);
  cms.app.use('/app', appManagementApi);
  cms.app.use('/payment', payment);
  cms.app.use('/demo', demoApi);
  cms.app.use('/support', supportApi);
  cms.app.use('/users', userApi);
  cms.app.use('/topaz', topaz)
  // cms.app.use('/restaurant-data-backup', restaurantDataBackupApi);

  // NOTE: If health-check API URL is changed, the URL used on frontend must be changed accordingly
  cms.app.get('/health-check', (req, res) => res.status(200).send('OK'));

  cms.app.use(/^\/$/, async (req, res) => {
    if (!req.session.userId)
      return res.redirect('/sign-in')
    else
      return res.redirect('/management')
  })
}
