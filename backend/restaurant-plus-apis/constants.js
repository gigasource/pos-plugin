const VOUCHER_STATUS = Object.freeze({
  UNUSED: 'unused',
  USED: 'used',
});

const PROMOTION_ORDER_TYPE = Object.freeze({
  ONLINE_ORDER: 'onlineOrder',
  DINE_IN: 'dineIn',

  VALUE_ARRAY: ['onlineOrder', 'dineIn'],
});

const PROMOTION_DISCOUNT_TYPE = Object.freeze({
  FLAT: 'flat',
  PERCENT: 'percent',

  VALUE_ARRAY: ['flat', 'percent'],
})

const MAX_NEARBY_DISTANCE = 5000 //5km

module.exports = {
  VOUCHER_STATUS, MAX_NEARBY_DISTANCE, PROMOTION_ORDER_TYPE
}
