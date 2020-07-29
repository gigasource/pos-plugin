const { MAX_NEARBY_DISTANCE, VOUCHER_STATUS } = require('./constants');
const express = require('express')
const router = express.Router()

const voucherModel = cms.getModel('RPVoucher');

router.get('/nearby-vouchers', async (req, res) => {
  const { userId, coordinates } = req.query
  const [long, lat] = coordinates.split(',')

  const nearbyStores = await cms.getModel('Store').find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [long, lat] },
        $maxDistance: MAX_NEARBY_DISTANCE //5km from point
      }
    }
  }).lean()

  const nearbyStorePromos = await cms.getModel('RPPromotion').find({
    store: { $in: nearbyStores.map(s => s._id) }
  }).lean()

  const nearbyVouchers = await voucherModel.find({
    promotion: { $in: nearbyStorePromos.map(p => p._id) },
    restaurantPlusUser: userId,
    status: VOUCHER_STATUS.UNUSED
  })

  const sortedVouchers = [].concat(...nearbyStores.map(store =>
    nearbyVouchers
    .filter(voucher => voucher.promotion.store._id.toString() === store._id.toString())
    .map(({ _id, createdAt, endDate, promotion, restaurantPlusUser, startDate, status }) => ({
        _id: _id.toString(),
        restaurantPlusUser: restaurantPlusUser._id.toString(),
        status: status,
        startDate: startDate,
        endDate: endDate,
        createdAt: createdAt,
        promotion: {
          _id: promotion._id.toString(),
          name: promotion.name,
          description: promotion.description,
          enabled: promotion.enabled,
          storeId: promotion.store._id.toString(),
          storeName: promotion.store.name || promotion.store.settingName,
          price: promotion.price,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          orderType: promotion.orderType
        }
      }))))

  res.status(200).json(sortedVouchers)
})

module.exports = router
