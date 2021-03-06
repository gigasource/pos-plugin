import { useI18n } from 'vue-i18n';
import { ref, computed } from 'vue'
import { appType, currentAppType } from '../AppType';
import Hooks from 'schemahandler/hooks/hooks';
import { VIEWS } from './settings-shared';


export const SettingsSidebarFactory = () => {
  const { messages, locale, fallbackLocale } = useI18n()
  const sidebar = computed(() => {
    return (messages.value[locale.value] && messages.value[locale.value].sidebar) || messages.value[fallbackLocale.value].sidebar
  })
  const deliveryMenu = computed(() => {
    return (messages.value[locale.value] && messages.value[locale.value].dashboard.deliveryMenu) || messages.value[fallbackLocale.value].dashboard.deliveryMenu
  })
  const sidebarData = computed(() => {
    const _sidebarData = [
      { title: sidebar.value.user, icon: 'person', isView: true, key: 'user', target: VIEWS.USER_SETTING_VIEW },
      { title: sidebar.value.general, icon: 'icon-general_setting', isView: true, key: 'general', target: VIEWS.GENERAL_SETTING_VIEW },
      {
        title: sidebar.value.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
        items: [
          { title: sidebar.value.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo', target: VIEWS.COMPANY_INFO_SETTING_VIEW },
          { title: sidebar.value.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment', target: VIEWS.PAYMENT_SETTING_VIEW },
          { title: sidebar.value.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax', target: VIEWS.TAX_SETTING_VIEW },
        ]
      },
    ]

    if (appType.POS_RESTAURANT === currentAppType.value) {
      _sidebarData.push({
        title: sidebar.value.onlineOrderSettings, icon: 'icon-general_setting',
        items: [
          { title: sidebar.value.settings, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'onlineOrderSettings', target: VIEWS.ONLINE_ORDER_SETTING_VIEW },
          { title: deliveryMenu.value, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'deliveryConfig', target: VIEWS.DELIVERY_SETTING_VIEW },
        ]
      })
      _sidebarData.push({ title: sidebar.value.callSystem, icon: 'icon-telephone', isView: true, key: 'callSystem', target: VIEWS.CALL_SYSTEM_SETTING_VIEW })
      _sidebarData.push({ title: sidebar.value.customerScreen, icon: 'icon-screen', isView: true, key: 'customerScreen', target: VIEWS.CUSTOMER_SCREEN_SETTING_VIEW })
    }
    _sidebarData.push({ title: 'Customer Led Display', icon: 'icon-screen', isView: true, key: 'customerLedDisplay', target: VIEWS.CUSTOMER_LED_DISPLAY_VIEW })

    return _sidebarData
  })

  return { sidebarData }
}

