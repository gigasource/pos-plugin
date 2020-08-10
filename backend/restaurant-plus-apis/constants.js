const VOUCHER_STATUS = Object.freeze({
  UNUSED: 'unused',
  USED: 'used',
});

const PROMOTION_ORDER_TYPE = Object.freeze({
  ONLINE_ORDER: 'onlineOrder',
  DINE_IN: 'dineIn',

  VALUE_ARRAY: ['onlineOrder', 'dineIn'], //VALUE_ARRAY is used to check validity of request params
});

const PROMOTION_DISCOUNT_TYPE = Object.freeze({
  FLAT: 'flat',
  PERCENT: 'percent',

  VALUE_ARRAY: ['flat', 'percent'],
});

const POINT_HISTORY_TRANSACTION_TYPE = Object.freeze({
  STORE_REWARD_POINT: 'storeRewardPoint',
  USER_BUY_VOUCHER: 'userBuyVoucher',

  VALUE_ARRAY: ['storeRewardPoint', 'userBuyVoucher']
});

const ORDER_RESPONSE_STATUS = Object.freeze({
  ORDER_CONFIRMED: 'kitchen',
  ORDER_CANCELLED: 'declined',
  ORDER_IN_PROGRESS: 'inProgress',
});

const NOTIFICATION_ACTION_TYPE = Object.freeze({
  ORDER_STATUS: 'orderStatus',
});

const MAX_NEARBY_DISTANCE = 5000; //5km
const DEFAULT_PROMOTION_BACKGROUND = 'https://online-order.gigasource.io/cms-files/files/view/Restaurant%20Plus%20images/default-restaurant-plus-promo-background.png';
const PELIAS_HOST = 'https://pelias.gigasource.io'

module.exports = {
  VOUCHER_STATUS, MAX_NEARBY_DISTANCE, PROMOTION_ORDER_TYPE, PROMOTION_DISCOUNT_TYPE, POINT_HISTORY_TRANSACTION_TYPE,
  DEFAULT_PROMOTION_BACKGROUND, PELIAS_HOST, ORDER_RESPONSE_STATUS, NOTIFICATION_ACTION_TYPE
}
