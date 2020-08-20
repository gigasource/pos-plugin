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
  TABLE_RESERVATION: 'tableReservation',
  TABLE_REQUEST: 'tableRequest',
});

const RESTAURANT_PLUS_ROLES = Object.freeze({
  RP_CLIENT: 'RP_CLIENT',
  RP_MANAGER: 'RP_MANAGER',
});

const RESPONSE_ERROR_CODE = Object.freeze({
  VOUCHERS: {
    LIMIT_FOR_USER_REACHED: 'voucher/user-limit-reached',
    LIMIT_FOR_PROMOTION_REACHED: 'voucher/promotion-limit-reached',
    USER_INSUFFICIENT_COIN: 'voucher/user-insufficient-coin',
  }
});

const DEFAULT_NEARBY_DISTANCE = 5000; //5km
const DEFAULT_PROMOTION_BACKGROUND = 'https://online-order.gigasource.io/cms-files/files/view/Restaurant%20Plus%20images/default-restaurant-plus-promo-background.png';
const PELIAS_HOST = 'https://pelias.gigasource.io'

module.exports = {
  VOUCHER_STATUS, DEFAULT_NEARBY_DISTANCE, PROMOTION_ORDER_TYPE, PROMOTION_DISCOUNT_TYPE, POINT_HISTORY_TRANSACTION_TYPE,
  DEFAULT_PROMOTION_BACKGROUND, PELIAS_HOST, ORDER_RESPONSE_STATUS, NOTIFICATION_ACTION_TYPE, RESTAURANT_PLUS_ROLES,
  RESPONSE_ERROR_CODE,
}
