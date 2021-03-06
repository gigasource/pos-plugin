import { useI18n } from 'vue-i18n';

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router';
import { appHooks, enabledFeatures, user } from '../../AppSharedStates'
import { appType, currentAppType } from '../../AppType'
import cms from 'cms';

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
export const showExportDataDialog = ref(false)

export const DashboardFunctionFactory = () => {
  const { t, locale, messages, fallbackLocale } = useI18n()
  const dashboardTranslations = computed(() => {
    return messages.value[locale.value].dashboard || message.value[fallbackLocale.value].dashboard
  })
  const delivery = computed(() => dashboardTranslations.value.delivery)
  const editMenuCard = computed(() => dashboardTranslations.value.editMenuCard)
  const editTablePlan = computed(() => dashboardTranslations.value.editTablePlan)
  const endOfDay = computed(() => dashboardTranslations.value.endOfDay)
  const fastCheckout= computed(() => dashboardTranslations.value.fastCheckout)
  const monthlyReport = computed(() => dashboardTranslations.value.monthlyReport)
  const orderHistory = computed(() => dashboardTranslations.value.orderHistory)
  const printerSettings = computed(() => dashboardTranslations.value.printerSettings)
  const settings = computed(() => dashboardTranslations.value.settings)
  const staffReport = computed(() => dashboardTranslations.value.staffReport)
  const support = computed(() => dashboardTranslations.value.support)
  const onlineOrdering = computed(() => dashboardTranslations.value.onlineOrdering)
  const dineInMenu = computed(() => dashboardTranslations.value.dineInMenu)
  const deliveryMenu = computed(() => dashboardTranslations.value.deliveryMenu)
  const inventory = computed(() => dashboardTranslations.value.inventory)
  const customer = computed(() => dashboardTranslations.value.customer)
  const btnUp = computed(() => ({
    [appType.POS_RESTAURANT] : [
      { title: fastCheckout.value, feature: 'fastCheckout', icon: 'icon-fast-checkout', click: () => changePath('/pos-order') },
      { title: delivery.value, feature: 'delivery', icon: 'icon-order-food', click: () => changePath('/pos-order-delivery') },
      { title: 'Tutorial'/*TODO: i18n*/, feature: 'tutorial', icon: 'icon-tutorial', click: () => changePath('/pos-tutorial') },
    ],
    [appType.POS_RETAIL] : [
      { title: 'Cash Register' /*TODO: i18n*/, icon: 'icon-fast-checkout' /*TODO: update icon*/, click: () => changePath('/retail--order') },
      { title: orderHistory.value, /*feature: 'orderHistory',*/ icon: 'icon-history', click: () => changePath('/pos-order-history') },
    ]
  }))
  const btnDown = computed(() => ({
    [appType.POS_RESTAURANT] : [
      { title: orderHistory.value, feature: 'orderHistory', icon: 'icon-history', click: () => changePath('/pos-order-history') },
      { title: settings.value, feature: 'settings', icon: 'icon-dashboard', click: () => changePath('/pos-settings') },
      { title: dineInMenu.value, feature: 'editMenuCard', icon: 'icon-menu1', click: () => changePath('/pos-edit-menu-card') },
      // {title: deliveryMenu.value, feature: 'editMenuCard', icon: 'icon-menu2',  click: () => updateView('DeliveryConfig')},
      { title: endOfDay.value, feature: 'eodReport', icon: 'icon-calendar', click: () => changePath('/pos-eod-report') },
      { title: monthlyReport.value, feature: 'monthlyReport', icon: 'icon-month_report', click: () => changePath('/pos-month-report') },
      { title: staffReport.value, feature: 'staffReport', icon: 'icon-staff-report', click: () => changePath('/pos-staff-report') },
      { title: editTablePlan.value, feature: 'editTablePlan', icon: 'icon-edit-table-plan', click: () => changePath('/pos-edit-table-plan') },
      { title: printerSettings.value, feature: 'printerSettings', icon: 'icon-printer-setting', click: () => changePath('/pos-printer-setting') },
      { title: customer.value, feature: 'customerInfo', icon: 'icon-customer-info', click: () => changePath('/pos-customer') },
      { title: inventory.value, feature: 'manageInventory', icon: 'icon-inventory', click: () => changePath('/pos-inventory') },
      { title: onlineOrdering.value, feature: 'onlineOrdering', icon: 'icon-online-order-menu', click: openStoreSetting },
      { title: 'GDPdU/GoBD Data Exportieren', icon: 'icon-online-order-menu', click: () => showExportDataDialog.value = true },
      // { title: support, icon: 'icon-support-2',  click: () => changePath('/pos-support') },
    ],
    [appType.POS_RETAIL] : [
      { title: staffReport.value, feature: 'staffReport', icon: 'icon-staff-report', click: () => changePath('/pos-staff-report') },
      { title: settings.value, feature: 'settings', icon: 'icon-dashboard', click: () => changePath('/pos-settings') },
      { title: endOfDay.value, feature: 'eodReport', icon: 'icon-calendar', click: () => changePath('/pos-eod-report') },
      { title: support.value, icon: 'icon-support-2',  click: () => changePath('/pos-support') },
      { title: monthlyReport.value, feature: 'monthlyReport', icon: 'icon-month_report', click: () => changePath('/pos-month-report') },
      { title: inventory.value, feature: 'manageInventory', icon: 'icon-inventory', click: () => changePath('/pos-inventory') },
      { title: 'Product Setting' /*TODO: i18n*/, icon: 'icon-inventory' /*TODO: update icon*/, click: () => changePath('/pos-product-setting') },
      { title: customer.value, feature: 'customerInfo', icon: 'icon-customer-info', click: () => changePath('/pos-customer') },
      { title: 'GDPdU/GoBD Data Exportieren', icon: 'icon-online-order-menu', click: () => showExportDataDialog.value = true },
    ]
  }))

  const computedBtnGroup1 = computed(() => {
    if (!enabledFeatures.value || !enabledFeatures.value.length) return []
    return btnUp.value[currentAppType.value].filter(item => {
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
    const items = btnDown.value[currentAppType.value].filter(item => {
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
  const shouldRenderButtonFnDivider = computed(() => {
    return (computedBtnGroup1.value && computedBtnGroup1.value.length
        && computedBtnGroup2.value && computedBtnGroup2.value.length)
  })

  return { btnUp, btnDown, computedBtnGroup1, computedBtnGroup2, shouldRenderButtonFnDivider }
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
