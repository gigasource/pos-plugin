import { reactive, watch, computed, onActivated } from 'vue'
import { showNotify } from '../../AppSharedStates';
import { createEmptyProduct } from '../utils';
import _ from 'lodash'
import cms from 'cms';
import {
  orderLayout, selectedCategoryLayout, selectedProductLayout,
  updateOrderLayout,
  updateSelectedProductLayout
} from '../../OrderView/pos-ui-shared';

//
export const selectedProduct = computed({
  get: () => {
    // if no product layout selected, then return null
    if (!selectedProductLayout.value) {
      return null
    }
    // otherwise, init new product object if current product layout is empty
    if (!selectedProductLayout.value.product) {
      selectedProductLayout.value.product = createEmptyProduct()
    }
    return selectedProductLayout.value.product
  },
  set: (value) => {
    selectedProductLayout.value.product = value
  }
})

//// <editor-fold desc="product layout type">
// TODO: rename to more meaning name (productLayoutType for example)/**/
export const types = _.map(['Article', 'Div.Article', 'Text'], item => ({ text: item, value: item }))
export const type = computed(() => selectedProductLayout.value && selectedProductLayout.value.type)
export const isProductLayout = computed(() => type.value !== 'Text')

export async function changeType(type) {
  if (selectedProductLayout.value.type === type) {
    return
  }
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
export const printers = ref(null)
export const isPrinter2Select = ref(false)
// boolean value indicate whether "+2. printer" button should be shown
export const showAddPrinter2 = computed(() => (
    selectedProduct.groupPrinter
    && !selectedProduct.groupPrinter2
    && !selectedProduct.isModifier
    && !selectedProduct.isNoPrint
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
    if (selectedProduct.groupPrinter !== printer) {
      change.groupPrinter2 = printer;
    }
    isPrinter2Select.value = false;
  } else {
    change.groupPrinter = printer;
    change.groupPrinter2 = null;
  }

  if (!selectedProduct.tax && printer.defaultDineInTax) {
    const taxCategory = printer.defaultDineInTax;
    selectedProduct.tax = taxCategory
    change.taxCategory = taxCategory
    change.tax = dineInTaxes.value.find(i => i._id.toString() === taxCategory).value
  }

  if (!selectedProduct.tax2 && printer.defaultTakeAwayTax) {
    const taxCategory2 = printer.defaultTakeAwayTax;
    selectedProduct.tax2 = taxCategory2
    change.taxCategory2 = taxCategory2
    change.tax2 = takeAwayTaxes.values.find(i => i._id.toString() === taxCategory2).value
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
export const categories = ref(null)
export const loadCategories = async () => {
  categories.value = await cms.getModel('Category').find()
}

export async function changeCategory(category) {
  await updateProduct({ category: category._id })
}

// TODO: move to uI
export const dialog = ref({
  productInfo: false,
  popupModifiers: false,
  focus: 'id',
  showTextKbd: false,
})

export function openDialogInfo(focus) {
  dialog.value.focus = focus
  dialog.value.productInfo = true
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

watch(() => dialog.value.popupModifiers, async (val) => {
  await loadPopupModifierGroups()
})

// styles
// todo: move to ui
export const noPrintClasses = computed(() => ({
  'prop-option': true,
  'prop-option--1': selectedProduct.isNoPrint,
}))

export const itemNoteClasses = computed(() => ({
  'prop-option': true,
  'prop-option--1': selectedProduct.isItemNote,
}))

export const getPrinterClass = (printer) => {
  return {
    'prop-option': true,
    'prop-option--1': selectedProduct.groupPrinter && selectedProduct.groupPrinter._id === printer,
    'prop-option--2': selectedProduct.groupPrinter2 && selectedProduct.groupPrinter2._id === printer,
  }
}

export async function updateProductLayout(change, forceCreate) {
  updateSelectedProductLayout({ ...selectedProductLayout.value, ...change })

  if (selectedProductLayout.value._id) {
    console.log('UpdateProductLayout', change)
    console.log('Update product layout with id', selectedProductLayout.value._id)
    const qry = {
      type: layoutType.value,
      'categories.products._id': selectedProductLayout.value._id
    }
    const set = {
      $set: _.reduce(change, (result, value, key) => {
        result[`categories.$[cate].products.$[product].${key}`] = value
        return result
      }, {})
    };
    const filter = [{ 'cate._id': selectedCategoryLayout.value._id }, { 'product._id': selectedProductLayout.value._id }]
    await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { arrayFilters: filter, new: true });
    showNotify()
  } else if (forceCreate) {
    await createNewProductLayout(null, change)
    showNotify()
  }
}

export async function updateProduct(change, forceCreate) {
  console.log('storing', change, 'to internal variable selectedProduct')
  selectedProduct.set({ ...selectedProduct, ...change })

  if (selectedProduct._id) {
    console.log('updateProduct', change)
    await cms.getModel('Product').findOneAndUpdate({ _id: selectedProduct._id }, change)
    showNotify()
  } else {
    if (forceCreate) {
      console.log('Create new Product')
      const product = await cms.getModel('Product').create({ ...selectedProduct });
      console.log('Create new ProductLayout linked to Product with id: ', product._id)
      await createNewProductLayout(product._id)
      showNotify()
    } else {
      console.log('Product is not existed yet. skipped')
    }
  }
}

export async function createNewProductLayout(productId, extraInfo) {
  const productLayout = {
    product: productId,
    ..._.pick(selectedProductLayout.value, ['top', 'left', 'color', 'type', 'text']),
    ...extraInfo
  }

  const result = await cms.getModel('OrderLayout').findOneAndUpdate(
      {
        type: layoutType.value,
        'categories._id': selectedCategoryLayout.value._id
      },
      { $push: { 'categories.$.products': productLayout } },
      { new: true });

  updateOrderLayout(result)
}


export function setProductInfo(propName, propValue) {
  selectedProduct[propName] = propValue
}

export const debouncedUpdateProduct = _.debounce((key, val) => {
  updateProduct({ [key]: val }, !selectedProduct._id).then(res => res())
}, 300)


async function updateTextLayout(change) {
  const forceCreate = !selectedProductLayout._id;
  await updateProductLayout(change, forceCreate)
}

export const debounceUpdateTextLayout = _.debounce(function(key, val) {
  updateTextLayout({ [key]: val }, !this.selectedProduct._id).then(res => res())
}, 300)

export const addPopupModifierGroup = (toggleSelect, item) => {
  toggleSelect(item)
  changePopupModifierGroup(item).then(resolve => resolve())
}

export const clearPopupModifierGroup = (toggleSelect, item) => {
  toggleSelect(item)
  changePopupModifierGroup(null).then(resolve => resolve())
}
