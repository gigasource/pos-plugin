import { reactive, watch, computed, onActivated } from 'vue'
import { createEmptyProduct } from '../utils';
import _ from 'lodash'

const useProductEditorLogic = async (props, context) => {
  const state = reactive({
    colors: '#FFFFFF,#CE93D8,#B2EBF2,#C8E6C9,#DCE775,#FFF59D,#FFCC80,#FFAB91'.split(',') ,
    // Product layout types
    type: props.selectedProductLayout.type,
    types: _.map([ 'Article', 'Div.Article', 'Text'], item => ({ text: item, value: item })),
    dineInTaxes: [],
    takeAwayTaxes: [],
    // indicate whether the +2. Printer button has been clicked or not
    isPrinter2Select: false,
    // GroupPrinter collection data
    printers: null,
    // Category collection data
    categories: null,
    //
    dialog: {
      productInfo: false,
      popupModifiers: false,
      focus: 'id',
      showTextKbd: false,
    },
    showSnackbar: false,
    notifyContent: null,
    popupModifierGroups: [],
    layoutType: 'default',
  })

  let selectedProduct = computed({
    get: () => {
      // if no product layout selected, then return null
      if (!props.selectedProductLayout)
        return null
      // otherwise, init new product object if current product layout is empty
      if (!props.selectedProductLayout.product) {
        props.selectedProductLayout.product = createEmptyProduct()
      }
      return props.selectedProductLayout.product
    },
    set: (value) => {
      props.selectedProductLayout.product = value
    }
  })
  const showAddPrinter2 = computed(() => (
      selectedProduct.groupPrinter
      && !selectedProduct.groupPrinter2
      && !selectedProduct.isModifier
      && !selectedProduct.isNoPrint
      && !state.isPrinter2Select
  ))
  const isProductLayout = computed(() => state.type !== 'Text')
  const noPrintClasses = computed(() => ({
    'prop-option': true,
    'prop-option--1': selectedProduct.isNoPrint,
  }))
  const itemNoteClasses = computed(() => ({
    'prop-option': true,
    'prop-option--1': selectedProduct.isItemNote,
  }))
  const showDineInTax = computed(() => {
    if (!selectedProduct)
      return true
    const { groupPrinter, groupPrinter2 } = selectedProduct
    if (groupPrinter2)
      return groupPrinter2.showDineInTax
    if (groupPrinter)
      return groupPrinter.showDineInTax
    return true
  })

  watch(() => props.selectedProductLayout, (val) => {
    state.type = val.type
  })
  watch(() => state.dialog.popupModifiers, async (val) => {
    await loadPopupModifierGroups()
  })

  const loadCategories = async () => {
    state.categories = await cms.getModel('Category').find()
  }

  const changeCategory = async category => {
    await updateProduct({ category: category._id })
  }

  const loadTaxes = async () => {
    const taxes = await cms.getModel('TaxCategory').find()
    state.dineInTaxes = taxes.filter(i => i.type.includes('dineIn')).map(({ _id, value, name }) => ({ _id, text: name, value }))
    state.takeAwayTaxes = taxes.filter(i => i.type.includes('takeAway')).map(({ _id, value, name }) => ({ _id, text: name, value }))
  }

  const showNotify = content => {
    state.notifyContent = content || 'Saved'
    state.showSnackbar = true
  }

  const loadPrinters = async () => {
    state.printers = await cms.getModel('GroupPrinter').find({ type: 'kitchen' })
  }

  const loadPopupModifierGroups = async () => {
    state.popupModifierGroups = await cms.getModel('PosModifierGroup').find()
  }

  const getPrinterClass = (printer) => {
    return {
      'prop-option': true,
      'prop-option--1': selectedProduct.groupPrinter && selectedProduct.groupPrinter._id === printer,
      'prop-option--2': selectedProduct.groupPrinter2 && selectedProduct.groupPrinter2._id === printer,
    }
  }

  const selectPrinter = async id => {
    const printer = state.printers.find(p => p._id === id)

    const change = {
      isItemNote: false,
      isNoPrint: false
    }

    if (state.isPrinter2Select) {
      if (selectedProduct.groupPrinter !== printer) {
        change.groupPrinter2 = printer;
      }
      state.isPrinter2Select = false;
    } else {
      change.groupPrinter = printer;
      change.groupPrinter2 = null;
    }

    if (!selectedProduct.tax && printer.defaultDineInTax) {
      const taxCategory = printer.defaultDineInTax;
      selectedProduct.tax = taxCategory
      change.taxCategory = taxCategory
      change.tax = state.dineInTaxes.find(i => i._id.toString() === taxCategory).value
    }
    if (!selectedProduct.tax2 && printer.defaultTakeAwayTax) {
      const taxCategory2 = printer.defaultTakeAwayTax;
      selectedProduct.tax2 = taxCategory2
      change.taxCategory2 = taxCategory2
      change.tax2 = state.takeAwayTaxes.find(i => i._id.toString() === taxCategory2).value
    }

    await updateProduct(change)
  }

  const setAsNoPrint = async () => {
    await updateProduct({
      groupPrinter: null,
      groupPrinter2: null,
      isNoPrint: true,
      isItemNote: false
    })
  }

  const changeType = async type => {
    if (props.selectedProductLayout.type === type)
      return

    const articleTypes = ['Article', 'Div.Article']

    // Art, Div.Art -> Div.Art, Art
    if (_.includes(articleTypes, props.selectedProductLayout.type) && _.includes(articleTypes, type)) {
      await updateProduct({ isDivArticle: type === 'Div.Article' })
    }

    await updateProductLayout({type})
  }

  const changePopupModifierGroup = (group) => {
    return updateProduct({ activePopupModifierGroup: group && group._id })
  }

  const updateProductLayout = async (change, forceCreate) => {
    _.each(_.keys(change), k => props.selectedProductLayout[k] = change[k])

    if (props.selectedProductLayout._id) {
      console.log('UpdateProductLayout', change)
      console.log('Update product layout with id', props.selectedProductLayout._id)
      const qry = {
        type: state.layoutType,
        'categories.products._id': props.selectedProductLayout._id
      }
      const set =  { $set: _.reduce(change, (result, value, key) => {
          result[`categories.$[cate].products.$[product].${key}`] = value
          return result
        }, {}) };
      const filter = [{ 'cate._id': props.selectedCategoryLayout._id }, { 'product._id': props.selectedProductLayout._id }]
      const result = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { arrayFilters: filter,  new: true });
      showNotify()
    } else {
      if (forceCreate) {
        await createNewProductLayout(null, change)
        showNotify()
      } else {
        console.log('ProductLayout is not existed yet. skipped')
      }
    }
  }

  const updateProduct = async(change, forceCreate) => {
    console.log('storing', change ,'to internal variable selectedProduct')
    selectedProduct = { ...selectedProduct, ...change }

    if (selectedProduct._id) {
      console.log('updateProduct', change)
      await cms.getModel('Product').findOneAndUpdate({_id: selectedProduct._id}, change)
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

  const createNewProductLayout = async (productId, extraInfo) => {
    const productLayout = {
      product: productId,
      ..._.pick(props.selectedProductLayout, ['top', 'left', 'color', 'type', 'text']),
      ...extraInfo
    }

    const result = await cms.getModel('OrderLayout').findOneAndUpdate(
        {
          type: state.layoutType,
          'categories._id' : props.selectedCategoryLayout._id
        },
        { $push: { 'categories.$.products' : productLayout } },
        { new: true });

    context.emit('update:orderLayout', result)
  }

  const openDialogInfo = focus => {
    state.dialog.focus = focus
    state.dialog.productInfo = true
  }

  const setProductInfo = (propName, propValue) => {
    selectedProduct[propName] = propValue
  }

  // TODO: activated
  onActivated(() => {
    // TODO: route?
    // if (this.$route && this.$route.query && this.$route.query.type) {
    //   this.layoutType = this.$route.query.type
    // } else {
    //   this.layoutType = 'default'
    // }
  })


  // created
  await loadPrinters()
  await loadCategories()
  await loadTaxes()
  await loadPopupModifierGroups()

  // TODO: route? in created
  // if (this.$route && this.$route.query && this.$route.query.type) {
  //   this.layoutType = this.$route.query.type
  // } else {
  //   this.layoutType = 'default'
  // }

  const debouncedUpdateProduct = _.debounce((key, val) => {
    updateProduct({ [key]: val }, !selectedProduct._id)
  }, 300)

  return {
    state,
    selectedProduct,
    showAddPrinter2,
    isProductLayout,
    noPrintClasses,
    itemNoteClasses,
    showDineInTax,
    loadCategories,
    changeCategory,
    loadTaxes,
    showNotify,
    loadPrinters,
    loadPopupModifierGroups,
    getPrinterClass,
    selectPrinter,
    setAsNoPrint,
    changeType,
    changePopupModifierGroup,
    updateProductLayout,
    updateProduct,
    createNewProductLayout,
    openDialogInfo,
    setProductInfo,
    debouncedUpdateProduct
  }
}

export default useProductEditorLogic
