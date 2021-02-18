import { ref } from 'vue';

export const showDialogSavedList = ref(false)
export const showDialogProductSearchResult = ref(false)
export const showDialogChangePrice = ref(false)
export const showDialogProductLookup = ref(false)

export function /*PosStore::*/ updateNewPrice(val) {
  console.error('PosStore:updateNewPrice not impl', val)
}

export function /*OrderStore::*/ chooseFunction() {
  console.error('OrderStore_chooseFunction')
}

export function /*OrderStore::*/ isActiveFnBtn(btn) {
  console.error('OrderStore_isActiveFnBtn', btn)
}

export const /*OrderStore::*/ updateTableRows = ref(() => {
  console.error('OrderStore::updateTableRows')

  // const posStore = this.$getService('OrderStore') // TODO
  // if (posStore && posStore.updateTableRows && typeof posStore.updateTableRows === 'function') {
  //   posStore.updateTableRows()
  // }
})

export const /*OrderStore::*/ lastPayment = ref(null)

export const /*OrderStore::*/ paymentTax = ref(null)
export const /*OrderStore::*/ paymentDiscount = ref(null)
export const /*OrderStore::*/ paymentSubTotal = ref(null)
export const /*OrderStore::*/ paymentTotal = ref(40)
export const /*OrderStore::*/ paymentAmountTendered = ref(100)
export const /*OrderStore::*/ paymentChange = ref(60)
export const /*OrderStore::*/ productIdQuery = ref('')
export const /*OrderStore::*/ queryProductsById = () => {
  console.error('OrderStore::queryProductsById not impl')
}
export const /*OrderStore::*/ productIdQueryResults = ref('')
export const /*OrderStore::*/ getScrollWindowProducts = () => {
  console.error('OrderStore::getScrollWindowProducts not impl')
}
export const /*OrderStore::*/ currentOrder = ref(null)
export const /*OrderStore::*/ activeTableProduct = ref(null)
export const /*OrderStore::*/ removeItemQuantity = () => {
  console.error('OrderStore::removeItemQuantity not impl')
}
export const /*OrderStore::*/ savedOrders = ref([])
export const /*OrderStore::*/ getSavedOrders = async () => {
  console.error('OrderStore::getSavedOrders not impl')
}
export const /*OrderStore::*/ resetOrderData = () => {
  console.error('OrderStore::resetOrderData not impl')
}

export const /*SettingsStore::*/ getAllCategories = async () => {
  console.error('SettingsStore::getAllCategories not impl')
}
export const /*SettingStore::*/ getProductLayout = () => {
  console.error('SettingsStore::getProductLayout not impl')
}

export const /*PosStore*/ activeCategory = ref(null)
export const /*PosStore::*/ changeCategory = ref(() => {})
export const /*PosStore::*/ changeProductList = ref(() => {
  console.error('PosStore::changeProductList not impl')
})
