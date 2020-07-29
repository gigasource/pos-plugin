require('dotenv').config();

const deviceApi = require('./api/device');
const gsmsDeviceApi = require('./api/devices/gsms-devices');
const demoApi = require('./api/demoDevice');
const storeApi = require('./api/store');
const appManagementApi = require('./api/appManagement');
const payment = require('./api/payment');
const supportApi = require('./api/support');
// const restaurantDataBackupApi = require('./api/restaurant-data-backup');
const userApi = require('./api/users');
const rpStoreApi = require('./restaurant-plus-apis/stores')
const rpVoucherApi = require('./restaurant-plus-apis/vouchers')

module.exports = cms => {
  cms.data['loginUrl'] = '/sign-in';
  cms.data['nonAuthenticateUrls'] = ['/login', '/store', '/reservation', '/franchise', '/menu', '/qrcode'];

  cms.app.use('/device', deviceApi);
  cms.app.use('/gsms-device', gsmsDeviceApi);
  cms.app.use('/store', storeApi);
  cms.app.use('/app', appManagementApi);
  cms.app.use('/payment', payment);
  cms.app.use('/demo', demoApi);
  cms.app.use('/support', supportApi);
  cms.app.use('/users', userApi);
  cms.app.use('/v1/restaurant-plus-apis/stores', rpStoreApi)
  cms.app.use('/v1/restaurant-plus-apis/vouchers', rpVoucherApi)
  // cms.app.use('/restaurant-data-backup', restaurantDataBackupApi);
  cms.app.use('/api/v1/restaurant-plus/stores', rpStoreApi)
  cms.app.use('/api/v1/restaurant-plus/vouchers', rpVoucherApi)

  // NOTE: If health-check API URL is changed, the URL used on frontend must be changed accordingly
  cms.app.get('/health-check', (req, res) => res.status(200).send('OK'));

  cms.app.use(/^\/$/, async (req, res) => {
    if (!req.session.userId)
      return res.redirect('/sign-in')
    else
      return res.redirect('/management')
  })
}
