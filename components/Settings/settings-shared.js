import Hooks from 'schemahandler/hooks/hooks';
import { ref } from 'vue';
export const VIEWS = {
  GENERAL_SETTING_VIEW: 'generalSettingView',
  USER_SETTING_VIEW: 'UserSettingView',
  COMPANY_INFO_SETTING_VIEW: 'CompanyInfoSettingView',
  PAYMENT_SETTING_VIEW: 'PaymentSettingView',
  TAX_SETTING_VIEW: 'TaxSettingView',
  CALL_SYSTEM_SETTING_VIEW: 'CallSystemSettingView',
  CUSTOMER_SCREEN_SETTING_VIEW: 'CustomerScreenSettingView',
  ONLINE_ORDER_SETTING_VIEW: 'OnlineOrderSettingView',
  DELIVERY_SETTING_VIEW: 'DeliverySettingView',
  CUSTOMER_LED_DISPLAY_VIEW: 'CustomerLedDisplayView'
}
export const settingsHooks = new Hooks()

export const currentSettingView = ref(VIEWS.USER_SETTING_VIEW)
settingsHooks.on('changeSettingView', (val) => {
  currentSettingView.value = val
})

export function changeSettingView(newView) {
  settingsHooks.emit('changeSettingView', newView)
}
