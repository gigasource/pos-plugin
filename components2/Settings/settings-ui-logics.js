import { useI18n } from 'vue-i18n';
import { ref, computed } from 'vue'
import { settingsHooks } from './settings-shared-logics';
import { appType, currentAppType } from '../AppType';


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
      { title: sidebar.value.user, icon: 'person', isView: true, key: 'user', target: 'UserSettingView' },
      { title: sidebar.value.general, icon: 'icon-general_setting', isView: true, key: 'general', target: 'GeneralSettingView' },
      {
        title: sidebar.value.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
        items: [
          { title: sidebar.value.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo', target: 'CompanyInfoSettingView' },
          { title: sidebar.value.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment', target: 'PaymentSettingView' },
          { title: sidebar.value.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax', target: 'TaxSettingView' },
        ]
      },
    ]

    if (appType.POS_RESTAURANT === currentAppType.value) {
      _sidebarData.push({
        title: sidebar.value.onlineOrderSettings, icon: 'icon-general_setting',
        items: [
          { title: sidebar.value.settings, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'onlineOrderSettings', target: 'OnlineOrderSettingView' },
          { title: deliveryMenu.value, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'deliveryConfig', target: 'DeliverySettingView' },
        ]
      })
      _sidebarData.push({ title: sidebar.value.callSystem, icon: 'icon-telephone', isView: true, key: 'callSystem', target: 'CallSystemSettingView' })
      _sidebarData.push({ title: sidebar.value.customerScreen, icon: 'icon-screen', isView: true, key: 'customerScreen', target: 'CustomerScreenSettingView' })
    }
    _sidebarData.push({ title: 'Customre Led Display', icon: 'icon-screen', isView: true, key: 'customerLedDisplay', target: 'CustomerLedDisplayView' })

    return _sidebarData
  })

  return { sidebarData }
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
