import { useI18n } from 'vue-i18n';
import { ref } from 'vue'
import { settingsHooks } from './settings-shared-logics';


export const SettingsSidebarFactory = () => {
  const { messages, locale, fallbackLocale } = useI18n()
  const { sidebar, dashboard: { deliveryMenu } } = messages.value[locale.value] || messages.value[fallbackLocale.value]

  const sidebarData = [
    { title: sidebar.user, icon: 'person', isView: true, key: 'user', target: 'UserSettingView' },
    { title: sidebar.general, icon: 'icon-general_setting', isView: true, key: 'general', target: 'GeneralSettingView' },
    {
      title: sidebar.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
      items: [
        { title: sidebar.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo', target: 'CompanyInfoSettingView' },
        { title: sidebar.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment', target: 'PaymentSettingView' },
        { title: sidebar.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax', target: 'TaxSettingView' },
      ]
    },
    {
      title: sidebar.onlineOrderSettings, icon: 'icon-general_setting',
      items: [
        { title: sidebar.settings, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'onlineOrderSettings', target: 'OnlineOrderSettingView' },
        { title: deliveryMenu, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'deliveryConfig', target: 'DeliverySettingView' },
      ]
    },
    { title: sidebar.callSystem, icon: 'icon-telephone', isView: true, key: 'callSystem', target: 'CallSystemSettingView' },
    { title: sidebar.customerScreen, icon: 'icon-screen', isView: true, key: 'customerScreen', target: 'CustomerScreenSettingView' },
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
