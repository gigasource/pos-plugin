import {computed, reactive, ref, watch} from 'vue';
import _ from "lodash";
import {$filters} from "../AppSharedStates";
import {useI18n} from "vue-i18n";
import {createEmptyProduct} from '../EditMenuCard/utils';
import orderLayoutApi from '../EditMenuCard/orderLayoutApi';

export const orderLayout = ref({ categories: [] });
export async function loadOrderLayout(type = 'default') {
  const _orderLayout = await orderLayoutApi.loadOrderLayout(type);
  if (editable.value) {
    _orderLayout.categories = fillMissingAreas(_orderLayout.categories, _orderLayout.columns, _orderLayout.rows, true);
    _.each(_orderLayout.categories, c => c.products = fillMissingAreas(c.products, c.columns, c.rows, false))
  }
  orderLayout.value = _orderLayout
}

const _selectedLayoutCache = {
  categoryLayout: null,
  productLayout: null
}
export const selectedCategoryLayoutPosition = ref({ top: 0, left: 0 })
export const selectedCategoryLayout = computed({
  get: () => {
    const layout = _.find(orderLayout.value.categories, c => isSameArea(selectedCategoryLayoutPosition.value, c))
    _selectedLayoutCache.categoryLayout = layout
    return layout
  },
  set: () => {
    console.error('trying to update immutable selectedCategoryLayout')
  }
})
export const selectCategoryLayout = position => {
  selectedCategoryLayoutPosition.value = validatePosition(position)
}
export const updateSelectedCategoryLayout = change => {
  Object.assign(_selectedLayoutCache.categoryLayout, change)
}

//
export const selectedProductLayoutPosition = ref({ top: 0, left: 0 })
export const selectedProductLayout = computed({
  get: () => {
    if (selectedCategoryLayout.value) {
      const prodLayout = _.find(selectedCategoryLayout.value.products, p => isSameArea(selectedProductLayoutPosition.value, p))
      _selectedLayoutCache.productLayout = prodLayout
      return prodLayout
    } else {
      _selectedLayoutCache.productLayout = null
    }
  },
  set: (val) => {
    console.error('trying to set immutable selectedProductLayout')
  }
});
export const selectProductLayout = (position) => {
  selectedProductLayoutPosition.value = validatePosition(position)
}
export const updateSelectedProductLayout = change => {
  Object.assign(_selectedLayoutCache.productLayout, change)
}

export const selectedProduct = computed({
  get: () => {
    // if no product layout selected, then return null
    if (!selectedProductLayout.value)
      return null

    // otherwise, init new product object if current product layout is empty
    if (!selectedProductLayout.value.product)
      selectedProductLayout.value.product = createEmptyProduct()

    return selectedProductLayout.value.product
  },
  set: (value) => {
    console.error('trying to set immutable selectedProduct')
  }
})
export const updateProduct = (change) => {
  if (_selectedLayoutCache.productLayout) {
    Object.assign(_selectedLayoutCache.productLayout.product, change)
  }
}

const validatePosition = (position) => {
  const { top, left } = position

  if (top == null || left == null)
    throw 'Invalid position'

  return { top, left }
}
export const selectedProductExisted = computed(() => {
  return !!(selectedProduct.value && selectedProduct.value._id)
})

// editor view
export const view = ref({});
/**
 * Update editor display
 * @param name CategoryEditor | ProductEditor | KeyboardEditor
 * @param mode basic, ingredient
 */
export const updateView = (name, mode) => {
  mode = mode || (view.value && view.value.mode) // keep mode persistent

  // fallback to basic mode
  // we may see some thing weird like { name: CategoryEditor, mode: 'basic' }
  // but it's ok
  if (!mode)
    mode = 'basic'

  view.value = { name, mode }
}
export const ProductEditModes = {
  basic: 'basic',
  ingredient: 'ingredient'
}
export function updateProductEditMode(newMode) {
  view.value.mode = newMode
}

export const editable = ref(false);
export const productDblClicked = ref(false);

watch(orderLayout, () => {
  if (selectedCategoryLayout.value && selectedCategoryLayout.value._id) {
    if (editable.value && !view.value.name) {
      updateView('CategoryEditor')
    }
  } else {
    // automatically select first category
    if (orderLayout.value.categories.length > 0) {
      // find tab-product at 0-0
      const topLeftCategory = _.find(orderLayout.value.categories, c => c._id && isSameArea(c, { top: 0, left: 0 }))
      if (topLeftCategory) {
        selectCategoryLayout(topLeftCategory)
      } else {
        selectCategoryLayout(_.first(orderLayout.value.categories))
      }

      // select category editor as default editor if there is no editor at the moment
      if (editable.value && !view.value.name) {
        updateView('CategoryEditor')
      }
    }
  }
})

// TODO: rename -> productLayouts
export const products = computed(() => {
  if (!selectedCategoryLayout.value)
    return

  if (editable.value) {
    return fillMissingAreas(
      selectedCategoryLayout.value.products,
      selectedCategoryLayout.value.columns,
      selectedCategoryLayout.value.rows);
  }
  // remove product layout which is not text but doesn't link to any product
  return  _.filter(selectedCategoryLayout.value.products, p => p.type === 'Text' || (p.type !== 'Text' && p.product))
})

//fixme: only for dev

//prepareOrder();
// const order = getCurrentOrder();
// const once = _.once(() => {
//   addProduct(order, products.value[0].product);
//   addProduct(order, products.value[0].product);
//   addProduct(order, products.value[1].product);
//   addProduct(order, products.value[1].product);
//
//   orderViewDialog.move = true;
// })
/*watchEffect(() => {
  if (order.items.length === 0 && products.value && products.value.length > 0) {
    once();
  }
})*/

/*async function run() {
  await nextTick();
}
run();*/

export const highlightSelectedProduct = ref(false);

export function getAreaStyle(item, rotate) {
  if (!item.top && item.top !== 0) {
    return
  }
  if (rotate) {
    return {
      'grid-area': `${item.left + 1} / ${item.top + 1} / ${item.left + 2} / ${item.top + 2}`
    }
  } else {
    return {
      'grid-area': `${item.top + 1} / ${item.left + 1} / ${item.top + 2} / ${item.left + 2}`
    }
  }
}

export function fillMissingAreas(areas, columns, rows, isCategory) {
  // add extra info
  // areas: [ { top, left }, {...} ]
  // generating empty elements
  const allAreas = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let empty = createEmptyLayout(row, column);
      if (isCategory) {
        empty = {...empty, ...createEmptyCategoryLayout()}
      } else {
        empty = {...empty, ...createEmptyProductLayout()}
      }
      allAreas.push(empty)
    }
  }
  return removeOuterAreas(_.unionWith(areas, allAreas, (area1, area2) => isSameArea(area1, area2)), columns, rows)
}

function removeOuterAreas(areas, columns, rows) {
  return _.filter(areas, area => area.top < rows && area.left < columns)
}

export function getGridTemplateFromNumber(num) {
  return _.join(_.map(_.range(0, num), c => `calc(${100 / num}% - ${5 * (num - 1) / num}px)`), ' ')
}

export function getItemSubtext({course, takeAway, separate}) {
  if (separate) return
  if (takeAway) return 'Take-away'
  if (course && course > 1) return `Course: ${course}`
}

export function isItemDiscounted(item) {
  return item.originalPrice && item.originalPrice !== item.price
}

export const orderViewDialog = reactive({
  search: false,
  split: false,
  move: false,
  changeTableWaiter: false,
  voucher: false,
  receipt: false
});

export function itemsRenderFactory() {
  const {t, locale} = useI18n();
  const itemsRender = (items, onClick) => items.map(item => (
    <div class="item" key={item._id.toString()}>
      <div class="item-detail" onClick={() => onClick && onClick(item)}>
        <div>
          <p class="item-detail__name" style={[item.sent && {opacity: 0.55}]}>
            {item.id && `${item.id}. `}{item.name}</p>
          <p>
            <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
              {t('common.currency', locale)}{$filters.formatCurrency(isItemDiscounted(item) ? item.originalPrice : item.price)}
            </span>
            {isItemDiscounted(item) &&
            <span class="item-detail__price--new">
              {t('common.currency', locale)}{$filters.formatCurrency(item.price)}
            </span>}
            <span class={['item-detail__option', 'text-red-accent-2']}>
              {getItemSubtext(item)}
            </span>
          </p>
        </div>
        <div class="mr-2 fw-700 row-flex align-items-center"
             style="font-size: 18px" style={[item.sent && {opacity: 0.55}]}>{item.quantity}</div>
      </div>
      {item.modifiers && <div>
        {item.modifiers.map(modifier => (
          <g-chip label small text-color="#616161">
            {modifier.name} |
            {t('common.currency', locale)} {$filters.formatCurrency(modifier.price)}
          </g-chip>
        ))}

      </div>}
    </div>
  ))
  return itemsRender;
}

export function createEmptyProductLayout() {
  return {
    type: 'Article',
    text: '',
    color: '#ddd',
    product: {
      type: null,
      id: '',
      name: '',
      price: '',
      groupPrinter: null,
      groupPrinter2: null,
      isNoPrint: null,
      isItemNote: null,
      tax: null,
      tax2: null,
      category: null,
      isDivArticle: null
    }
  }
}


export function createEmptyLayout(row, column) {
  return {
    top: row,
    left: column,
    name: ''
  }
}

export function createEmptyCategoryLayout() {
  return {
    rows: 10,
    columns: 6,
    color: '#FFF'
  }
}


export function isSameArea(area1, area2) {
  return area1.top === area2.top && area1.left === area2.left
}


window.dbg = {
  orderLayout,
  _selectedLayoutCache,
  selectedCategoryLayoutPosition,
  selectedCategoryLayout,
  selectedProductLayoutPosition,
  selectedProductLayout,
  selectedProduct,
}
