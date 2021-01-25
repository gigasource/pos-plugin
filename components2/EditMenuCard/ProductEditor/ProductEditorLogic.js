import { reactive, watch, computed, onActivated, ref } from 'vue'
import { showNotify } from '../../AppSharedStates';
import _ from 'lodash'
import cms from 'cms';
import {
  selectedCategoryLayout, selectedProductLayout, selectedProduct,
  updateView,
  updateSelectedProductLayout, loadOrderLayout, selectProductLayout, updateProduct as _updateProduct
} from '../../OrderView/pos-ui-shared';
import orderLayoutApi from '../orderLayoutApi';

//// <editor-fold desc="product layout type">
// TODO: rename to more meaning name (productLayoutType for example)/**/
export const types = _.map(['Article', 'Div.Article', 'Text'], item => ({ text: item, value: item }))
export const type = computed(() => selectedProductLayout.value && selectedProductLayout.value.type)
export const isProductLayout = computed(() => type.value !== 'Text')

export async function changeType(type) {
  if (selectedProductLayout.value.type === type)
    return
  const articleTypes = ['Article', 'Div.Article']
  // Art, Div.Art -> Div.Art, Art
  if (_.includes(articleTypes, selectedProductLayout.value.type) && _.includes(articleTypes, type)) {
    await updateProduct({ isDivArticle: type === 'Div.Article' })
  }
  await updateProductLayout({ type })
}

//// <editor-fold desc="Taxes">
export const dineInTaxes = ref([])
export const takeAwayTaxes = ref([])
export const showDineInTax = computed(() => {
  if (!selectedProduct.value) {
    return true
  }
  const { groupPrinter, groupPrinter2 } = selectedProduct.value
  if (groupPrinter2) {
    return groupPrinter2.showDineInTax
  }
  if (groupPrinter) {
    return groupPrinter.showDineInTax
  }
  return true
})

export async function loadTaxes() {
  const taxes = await cms.getModel('TaxCategory').find()
  dineInTaxes.value = taxes.filter(i => i.type.includes('dineIn')).map(({ _id, value, name }) => ({ _id, text: name, value }))
  takeAwayTaxes.value = taxes.filter(i => i.type.includes('takeAway')).map(({ _id, value, name }) => ({ _id, text: name, value }))
}


//// <editor-fold desc="Printer stuff">
export const printers = ref([])
export const isPrinter2Select = ref(false)
// boolean value indicate whether "+2. printer" button should be shown
export const showAddPrinter2 = computed(() => (
    selectedProduct.value.groupPrinter
    && !selectedProduct.value.groupPrinter2
    && !selectedProduct.value.isModifier
    && !selectedProduct.value.isNoPrint
    && !isPrinter2Select.value
))

export async function loadPrinters() {
  printers.value = await cms.getModel('GroupPrinter').find({ type: 'kitchen' })
}

export async function selectPrinter(id) {
  const printer = printers.value.find(p => p._id === id)

  const change = {
    isItemNote: false,
    isNoPrint: false
  }

  if (isPrinter2Select.value) {
    if (selectedProduct.value.groupPrinter !== printer) {
      change.groupPrinter2 = printer;
    }
    isPrinter2Select.value = false;
  } else {
    change.groupPrinter = printer;
    change.groupPrinter2 = null;
  }

  if (!selectedProduct.value.tax && printer.defaultDineInTax) {
    const taxCategory = printer.defaultDineInTax;
    selectedProduct.value.tax = taxCategory
    change.taxCategory = taxCategory
    const dineImTax = dineInTaxes.value.find(i => i._id.toString() === taxCategory)
    if (dineImTax)
      change.tax = dineImTax.value
  }

  if (!selectedProduct.value.tax2 && printer.defaultTakeAwayTax) {
    const taxCategory2 = printer.defaultTakeAwayTax;
    selectedProduct.value.tax2 = taxCategory2
    change.taxCategory2 = taxCategory2
    const takeAwayTax = takeAwayTaxes.value.find(i => i._id.toString() === taxCategory2)
    if (takeAwayTax)
      change.tax2 = takeAwayTax.value
  }

  await updateProduct(change)
}

export async function setAsNoPrint() {
  await updateProduct({
    groupPrinter: null,
    groupPrinter2: null,
    isNoPrint: true,
    isItemNote: false
  })
}

// categories // what???
export const categories = ref([])
export const loadCategories = async () => {
  categories.value = await cms.getModel('Category').find()
}
export async function changeCategory(category) {
  await updateProduct({ category: category._id })
}


// todo: meaning??
export const layoutType = ref('default')

// modifier
export const popupModifierGroups = ref([])
export const loadPopupModifierGroups = async () => {
  popupModifierGroups.value = await cms.getModel('PosModifierGroup').find()
}
export function changePopupModifierGroup(group) {
  return updateProduct({ activePopupModifierGroup: group && group._id })
}
export const addPopupModifierGroup = (toggleSelect, item) => {
  toggleSelect(item)
  changePopupModifierGroup(item).then(resolve => resolve())
}
export const clearPopupModifierGroup = (toggleSelect, item) => {
  toggleSelect(item)
  changePopupModifierGroup(null).then(resolve => resolve())
}

// product layout
export async function updateProductLayout(change, forceCreate) {
  updateSelectedProductLayout({ ...selectedProductLayout.value, ...change })
  if (selectedProductLayout.value._id) {
    await orderLayoutApi.updateProductLayout(
        layoutType.value,
        selectedCategoryLayout.value._id,
        selectedProductLayout.value._id,
        change)
    showNotify()
  } else if (forceCreate) {
    await createNewProductLayout(null, change)
    showNotify()
  }
}

export async function createNewProductLayout(productId, extraInfo) {
  const productLayout = {
    product: productId,
    ..._.pick(selectedProductLayout.value, ['top', 'left', 'color', 'type', 'text']),
    ...extraInfo
  }
  await orderLayoutApi.createProductLayout(layoutType.value, selectedCategoryLayout.value._id, productLayout)
  await loadOrderLayout()
}

export const debounceUpdateTextLayout = _.debounce(function(key, val) {
  updateTextLayout({ [key]: val }, !selectedProduct.value._id).then(res => res())
}, 300)

async function updateTextLayout(change) {
  const forceCreate = !selectedProductLayout._id;
  await updateProductLayout(change, forceCreate)
}

// product
export async function updateProduct(change, forceCreate) {
  _updateProduct(change)
  if (selectedProduct.value._id) {
    await orderLayoutApi.updateProduct(selectedProduct.value._id, change)
    showNotify()
  } else if (forceCreate) {
    const product = await orderLayoutApi.createProduct(selectedProduct.value);
    await createNewProductLayout(product._id)
    showNotify()
  }
}

export const debouncedUpdateProduct = _.debounce((key, val) => {
  updateProduct({ [key]: val }, !selectedProduct.value._id).then()
}, 300)


// delete
export const canDelete = computed(() => selectedProductLayout.value && selectedProductLayout.value._id)
export async function deleteProductLayout() {
  // delete linked product
  if (selectedProductLayout.value.product._id)
    await orderLayoutApi.deleteProduct(selectedProductLayout.value.product._id)

  await orderLayoutApi.deleteProductLayout(selectedCategoryLayout.value._id, selectedProductLayout.value._id)
  await loadOrderLayout()
  updateView('CategoryEditor')
  selectProductLayout({top: -1, left: -1})
}

// actions
const supportedActions = ['switch', 'copy']
let _action = null
let actionTarget = null // selectedProductLayout at the time set action is called
let actionCategoryTarget = null // selectedCategoryLayout at the time set action is called
export function setAction(action) {
  if (!_.includes(supportedActions, action))
    throw `Action ${action} is not supported!`
  _action = action
  actionTarget = selectedProductLayout.value
  actionCategoryTarget = selectedCategoryLayout.value
}
function _clearAction() {
  _action = null
  actionTarget = null
  actionCategoryTarget = null
}
async function _execAction() {
  switch(_action) {
    case 'switch':
      await switchProduct()
      break;
    case 'copy':
      await copyProduct()
      break;
  }
}

// watch product layout change to trigger product layout action automatically
// side-effect: in-case the user select action then switch to another category
// Do we need to clear action if the user change category ???
watch(() => selectedProductLayout.value, async (newVal, oldValue) => {
  if (_action)
    await _execAction()
})

// copy action
export const canCopy = computed(() => selectedProductLayout.value && selectedProductLayout.value._id)
async function copyProduct() {
  if (selectedProductLayout.value._id) {
    console.log('Product existed in selected position. Skip copy.')
    return;
  }
  console.log('copyProduct:copying product...')
  const product = await orderLayoutApi.createProduct(copyProductInfo(actionTarget.product));
  const productLayout = {
    product: product._id,
    ..._.pick(selectedProductLayout.value, ['top', 'left']),
    ..._.pick(actionTarget, ['color', 'type', 'text'])
  }
  const result = await orderLayoutApi.createProductLayout(
      layoutType.value,
      selectedCategoryLayout.value._id,
      productLayout
  );
  _clearAction()
  await loadOrderLayout()
}
function copyProductInfo(product) {
  if (!product)
    return
  const clone = { ...product, id: createNewProductId(product.id) }
  delete clone._id
  return clone
}
function createNewProductId(id) {
  const idRegex = /^(?<digit>\d+)(?<alpha>\w)?$/g
  const result = idRegex.exec(id)
  if (!result)
    return id
  if (!result.groups.alpha)
    return Number(result.groups.digit) + 1
  return `${result.groups.digit}${String.fromCharCode(result.groups.alpha.charCodeAt(0) + 1) }`
}

// switch action
export const canSwitch = computed(() => selectedProductLayout.value && selectedProductLayout.value._id)
async function switchProduct() {
  if (actionCategoryTarget._id === selectedCategoryLayout.value._id) {
    console.log('switch product in same category')
    // TODO: Bulk update
    let result = await changeProductLayoutPosInTheSameCate(
        actionTarget,
        _.pick(selectedProductLayout.value, ['top', 'left']),
        actionCategoryTarget)

    if (selectedProductLayout.value._id)
      result = await changeProductLayoutPosInTheSameCate(
          selectedProductLayout.value,
          _.pick(actionTarget, ['top', 'left']),
          actionCategoryTarget)
    _clearAction()
    await loadOrderLayout()
  } else {
    // switch in 2 categories
    console.log('TODO: switching products between category is not implemented')
  }
}
async function changeProductLayoutPosInTheSameCate(productLayout, { top, left }, categoryLayout) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      { 'categories.products._id': productLayout._id },
      {
        $set: {
          ['categories.$[cate].products.$[product].top']: top,
          ['categories.$[cate].products.$[product].left']: left,
        }
      },
      {
        arrayFilters: [{ 'cate._id': categoryLayout._id }, { 'product._id': productLayout._id }],
        new: true
      });
}
