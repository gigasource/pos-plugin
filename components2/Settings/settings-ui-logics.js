import { useI18n } from 'vue-i18n';
import { ref } from 'vue'
import { settingsHooks } from './settings-shared-logics';


export const SettingsSidebarFactory = () => {
  const { messages, locale, fallbackLocale } = useI18n()
  const { sidebar, dashboard: { deliveryMenu } } = messages.value[locale.value] || messages.value[fallbackLocale.value]

  // GeneralSetting,
  //   UserSetting,
  //   CompanyInfoSetting,
  //   PaymentSetting,
  //   TaxSetting
  const sidebarData = [
    { title: sidebar.user, icon: 'person', isView: true, key: 'user', target: 'UserSetting'},
    { title: sidebar.general, icon: 'icon-general_setting', isView: true, key: 'general', target: 'GeneralSetting' },
    {
      title: sidebar.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
      items: [
        { title: sidebar.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo', target: 'CompanyInfoSetting' },
        { title: sidebar.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment', target: 'PaymentSetting' },
        { title: sidebar.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax', target: 'TaxSetting' },
      ]
    },
    {
      title: sidebar.onlineOrderSettings, icon: 'icon-general_setting',
      items: [
        { title: sidebar.settings, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'onlineOrderSettings' },
        { title: deliveryMenu, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'deliveryConfig' },
      ]
    },
    { title: sidebar.callSystem, icon: 'icon-telephone', isView: true, key: 'callSystem' },
    { title: sidebar.customerScreen, icon: 'icon-screen', isView: true, key: 'customerScreen' },
  ]
  return { sidebarData}
}

export function changeView(newView) {
  settingsHooks.emit('changeSettingView', newView)
}

const onlineDevice = ref(null)
const defaultPrepareTime = ref(null)
const onlineOrderSorting = ref(null)

// todo: implement these functions
function updateOnlineDevice() {
}

function updateDefaultPrepareTime() {
}

function updateOnlineOrderSorting() {
}

function getOnlineDevice() {
}
