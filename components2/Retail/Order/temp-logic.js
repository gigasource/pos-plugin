import { ref } from 'vue';

export const showDialogProductSearchResult = ref(false)

export function /*PosStore::*/ updateNewPrice(val) {
  console.error('PosStore:updateNewPrice not impl', val)
}

export function /*OrderStore::*/ chooseFunction() {
  console.error('OrderStore_chooseFunction')
  // if (!functionName) return () => null
  // return this[functionName]
}

export function /*OrderStore::*/ isActiveFnBtn(btn) {
  console.error('OrderStore_isActiveFnBtn', btn)
  // if (!btn || !btn.buttonFunction) return
  // if (btn.buttonFunction === 'changePrice' || btn.buttonFunction.includes('discount')) {
  //   return !_.isNil(this.activeTableProduct) && !this.activeTableProduct.discountResistance
  // }
  // if (['pay', 'quickCash', 'saveOrder'].includes(btn.buttonFunction)) {
  //   return this.currentOrder.items.length > 0
  // }
  // return true;
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

export function addProductToOrder(product) {
  console.log('addProductToOrder not impl')
}

export const /*OrderStore::*/ getScrollWindowProducts = () => {
  console.error('OrderStore::getScrollWindowProducts not impl')
  // const products = {}
  // const allProducts = await cms.getModel('Product').find();
  // const groupedProducts = _.groupBy(allProducts, 'category.name')
  // const favouriteProducts = allProducts.filter(product => product.option && product.option.favorite)
  // .sort((cur, next) => getProductGridOrder(cur, true) - getProductGridOrder(next, true))
  // .map(product => ({
  //   ..._.omit(product, 'attributes'),
  //   originalPrice: product.price
  // }))
  // if (favouriteProducts) {
  //   Object.assign(products, {
  //     Favourite: _.chunk(favouriteProducts, 28)
  //   })
  // }
  // if (groupedProducts) {
  //   for (const key in groupedProducts) {
  //     if (groupedProducts.hasOwnProperty(key)) {
  //       const isFavourite = key === 'Favourite'
  //       Object.assign(products, {
  //         [key]: _.chunk(groupedProducts[key].sort((current, next) => {
  //           return getProductGridOrder(current, isFavourite) - getProductGridOrder(next, isFavourite)
  //         }).map(product => ({
  //           ..._.omit(product, 'attributes'),
  //           originalPrice: product.price
  //         })), 28)
  //       })
  //     }
  //   }
  // }
  // this.scrollWindowProducts = products
  // return products
}
export const /*OrderStore::*/ currentOrder = ref(null)
export const /*OrderStore::*/ activeTableProduct = ref(null)
export const /*OrderStore::*/ removeItemQuantity = () => {
  console.error('OrderStore::removeItemQuantity not impl')
}
export const /*OrderStore::*/ savedOrders = ref([])
export const /*OrderStore::*/ getSavedOrders = async () => {
  console.error('OrderStore::getSavedOrders not impl')
  // try {
  //   const orderModel = cms.getModel('Order')
  //   this.savedOrders = await orderModel.find({ status: 'inProgress' })
  // } catch (e) {
  //   console.error(e)
  // }
}
export const /*OrderStore::*/ resetOrderData = () => {
  console.error('OrderStore::resetOrderData not impl')
  // await this.resetOrderData()
  // const orderModel = cms.getModel('Order')
  // this.currentOrder = await orderModel.findOne({ _id: order._id })
}

export const /*SettingsStore::*/ getAllCategories = async () => {
  console.error('SettingsStore::getAllCategories not impl')
  // const categories = await cms.getModel('Category').find().sort('position')
  // const posSettings = (await cms.getModel('PosSetting').find())[0];
  // let favoriteArticle = posSettings.generalSetting.favoriteArticle;
  // return favoriteArticle ? categories : categories.filter(cat => cat.name !== 'Favourite').map(c => ({
  //   ...c,
  //   position: c.position
  // }))
}
export const /*SettingStore::*/ getProductLayout = () => {
  console.error('SettingsStore::getProductLayout not impl')
  // const isFavourite = category && category.name === 'Favourite' || false
  // return item.layouts && item.layouts.find(layout => !!layout.favourite === isFavourite) || {}
}

export const /*PosStore*/ activeCategory = ref(null)
export const /*PosStore::*/ changeCategory = ref(() => {})
export const /*PosStore::*/ changeProductList = ref(() => {
  console.error('PosStore::changeProductList not impl')
})
