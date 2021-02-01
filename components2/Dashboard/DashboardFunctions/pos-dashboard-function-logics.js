import { useI18n } from 'vue-i18n';

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router';
import { appHooks, enabledFeatures, user } from '../../AppSharedStates'

let t, locale
let router

export function init() {
  ({ t, locale } = useI18n())
  router = useRouter()
  appHooks.emit('updateEnabledFeatures')
}


export const showIframe = ref(false)
export const iframeWidth = ref(window.innerWidth)
export const iframeHeight = ref(window.innerHeight)
export const iframeSrc = ref('about:blank')
export const iframeDragging = ref(false)
export const iframeRefreshInterval = ref(null)
export const demoLicense = ref(false)
export const dayLeft = ref(14)
export const inventoryNotification = ref(0)
export const posSetting = ref(null)

export const DashboardFunctionFactory = () => {
  const { messages, locale, fallbackLocale} = useI18n()
  const {
    dashboard: {
      delivery, editMenuCard, editTablePlan, endOfDay, fastCheckout, monthlyReport,
      orderHistory, printerSettings, settings, staffReport, support, onlineOrdering,
      dineInMenu, deliveryMenu, inventory, customer
    }
  } = messages.value[locale.value] || messages.value[fallbackLocale.value]
  const btnUp = [
    { title: fastCheckout, feature: 'fastCheckout', icon: 'icon-fast-checkout', click: () => changePath('/pos-order') },
    { title: delivery, feature: 'delivery', icon: 'icon-order-food', click: () => changePath('/pos-order-delivery') },
    { title: 'Tutorial', feature: 'tutorial', icon: 'icon-tutorial', click: () => changePath('/pos-tutorial') },
  ]
  const btnDown = [
    { title: orderHistory, feature: 'orderHistory', icon: 'icon-history', click: () => changePath('/pos-order-history') },
    { title: settings, feature: 'settings', icon: 'icon-dashboard', click: () => changePath('/pos-settings') },
    { title: dineInMenu, feature: 'editMenuCard', icon: 'icon-menu1', click: () => changePath('/pos-edit-menu-card') },
    // {title: deliveryMenu, feature: 'editMenuCard', icon: 'icon-menu2',  click: () => updateView('DeliveryConfig')},
    { title: endOfDay, feature: 'eodReport', icon: 'icon-calendar', click: () => changePath('/pos-eod-report') },
    { title: monthlyReport, feature: 'monthlyReport', icon: 'icon-month_report', click: () => changePath('/pos-month-report') },
    { title: staffReport, feature: 'staffReport', icon: 'icon-staff-report', click: () => changePath('/pos-staff-report') },
    { title: editTablePlan, feature: 'editTablePlan', icon: 'icon-edit-table-plan', click: () => changePath('/pos-edit-table-plan') },
    { title: printerSettings, feature: 'printerSettings', icon: 'icon-printer-setting', click: () => changePath('/pos-printer-setting') },
    { title: customer, feature: 'customerInfo', icon: 'icon-customer-info', click: () => changePath('/pos-customer') },
    { title: inventory, feature: 'manageInventory', icon: 'icon-inventory', click: () => changePath('/pos-inventory') },
    { title: onlineOrdering, feature: 'onlineOrdering', icon: 'icon-online-order-menu', click: openStoreSetting },
    // {title: support, icon: 'icon-support-2',  click: () => changePath('/pos-support')},
  ]

  const computedBtnGroup1 = computed(() => {
    if (!enabledFeatures.value || !enabledFeatures.value.length) return []


    return btnUp.filter(item => {
      if (!item.feature) return true
      if (item.feature === 'tutorial') {
        return !!(posSetting.value && posSetting.value.showTutorial)
      }
      return (enabledFeatures.value.includes(item.feature))
    })
  })
  const computedBtnGroup2 = computed(() => {
    if (!enabledFeatures.value || !enabledFeatures.value.length) return []
    //todo: check this logic
    const items = btnDown.filter(item => {
      if (!user.value) return false
      if (!item.feature) return true
      if (user.value.role === 'admin')
        if (item.feature === 'settings' || item.feature === 'printerSettings' || item.feature === 'customerInfo') return true
      if (item.feature === 'manageInventory')
        return user.value.role === 'admin' || user.value.viewInventory
      if (item.feature === 'orderHistory')
        return user.value.role === 'admin' || user.value.viewOrderHistory
      if (item.feature === 'onlineOrdering')
        return (user.value.role === 'admin' || user.value.viewOnlineOrderMenu) && enabledFeatures.value.includes(item.feature)
      return enabledFeatures.value.includes(item.feature)
    })

    if (inventoryNotification.value) {
      return items.map(item => {
        if (item.feature === 'manageInventory') {
          return {
            ...item,
            notification: inventoryNotification.value
          }
        }
        return item
      })
    }

    return items
  })

  return { btnUp, btnDown, computedBtnGroup1, computedBtnGroup2 }
}


//todo: move to setup
export async function created() {
  //todo: use inventory logics
  inventoryNotification.value = await cms.getModel('Inventory').countDocuments({ stock: { $lte: 0 } })
  cms.socket.on('changeInventory', async () => {
    inventoryNotification.value = await cms.getModel('Inventory').countDocuments({ stock: { $lte: 0 } })
  })
}

//todo: move to setup
export async function activated() {
  await appHooks.emit('settingChange')
}


export function changePath(path) {
  if (path)
    router.push({ path })
}

export function openStoreSetting() {
  window.cms.socket.emit('getWebShopSettingUrl', locale.value, webShopUrl => {
    if (webShopUrl) {
      iframeSrc.value = webShopUrl
      showIframe.value = true
    }
  })
}

// export function updateView(name, { emit } ) {
//   emit('update:view', { name })
// }

//todo: ?????
export function viewLicense() {
  dayLeft.value = dayLeft.value === 59 ? 14 : 59
}
