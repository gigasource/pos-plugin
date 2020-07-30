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
const rpVoucherApi = require('./restaurant-plus-apis/vouchers');
const rpPromotionApi = require('./restaurant-plus-apis/promotions');
const rpUserApi = require('./restaurant-plus-apis/users');

module.exports = async cms => {
/*  let stores = await cms.getModel('Store').find();
  await Promise.all(stores.map(async store => {
    if (!store.coordinates || !store.coordinates.long || !store.coordinates.lat) return

    await cms.getModel('Store').updateOne({_id: store._id}, {location: {
        type: "Point",
        coordinates: [store.coordinates.long, store.coordinates.lat],
      }});
  }));*/

/*  const stores = await cms.getModel('Store').find();
  await Promise.all(stores.map(async store => {
    const name = store.settingName || store.name;
    await cms.getModel('RPPromotion').create({
      name: `Discount 5$ for ${name}`,
      quantity: 10000,
      startDate: new Date(),
      endDate: new Date(2021, 12, 31),
      enabled: true,
      store: store._id,
      price: 10,
      discountType: 'flat',
      discountValue: 5,
      description: 'Reduction of 5$ on your order',
      duration: 2592000000,
      orderType: 'onlineOrder',
      createdAt: new Date(),
    });
  }));*/

/*  const mongoose = require('mongoose');
  const promotions = await cms.getModel('RPPromotion').find();
  await Promise.all(promotions.slice(0, 7).map(async promo => {
    await cms.getModel('RPVoucher').create({
      promotion: promo._id,
      restaurantPlusUser: new mongoose.Types.ObjectId('5f200b42fb7a7682e116c7d4'),
      status: 'unused',
      startDate: new Date(),
      endDate: new Date(2020, 8, 28),
      createdAt: new Date(),
    });
  }));*/

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
  // cms.app.use('/restaurant-data-backup', restaurantDataBackupApi);

  cms.app.use('/api/v1/restaurant-plus/stores', rpStoreApi);
  cms.app.use('/api/v1/restaurant-plus/vouchers', rpVoucherApi);
  cms.app.use('/api/v1/restaurant-plus/promotions', rpPromotionApi);
  cms.app.use('/api/v1/restaurant-plus/users', rpUserApi);

  // NOTE: If health-check API URL is changed, the URL used on frontend must be changed accordingly
  cms.app.get('/health-check', (req, res) => res.status(200).send('OK'));

  cms.app.use(/^\/$/, async (req, res) => {
    if (!req.session.userId)
      return res.redirect('/sign-in')
    else
      return res.redirect('/management')
  })
}
