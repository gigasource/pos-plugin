import {computed, reactive, ref, watchEffect} from 'vue';
import {
  createEmptyCategoryLayout,
  createEmptyLayout,
  createEmptyProductLayout,
  isSameArea
} from "../../components/posOrder/util";
import _ from "lodash";
export const selectedCategoryLayout = ref();
export const selectedProductLayout = ref();
export const orderLayout = ref({categories: []});
export const view = ref();
export const editable = ref(false);
export const productDblClicked = ref(false);

export function updateOrderLayout(newLayout) {
  orderLayout.value = newLayout
}

export function updateSelectedCategoryLayout(newCategoryLayout) {
  selectedCategoryLayout.value = newCategoryLayout
}

watchEffect(() => {
  if (selectedCategoryLayout.value) {
    const cateLayout = _.find(orderLayout.value.categories, c => isSameArea(selectedCategoryLayout.value, c))
    if (!cateLayout)
      return
    // update category layout
    selectedCategoryLayout.value = cateLayout;
    if (!view.value || view.value.name !== 'ProductEditor' || !selectedProductLayout.value)
      return
    // update product layout
    const prodLayout = _.find(cateLayout.products, pl => isSameArea(selectedProductLayout.value, pl))
    if (prodLayout)
      selectedProductLayout.value = prodLayout
    else if (editable) {
      view.value = {name: 'CategoryEditor'};
      selectedProductLayout.value = null;
    }
  } else {
    // automatically select first category
    if (orderLayout.value.categories.length > 0) {
      // find tab-product at 0-0
      const topLeftCategory = _.find(orderLayout.value.categories, c => c.top === 0 && c.left === 0)
      if (topLeftCategory)
        selectedCategoryLayout.value = topLeftCategory
      else
        selectedCategoryLayout.value = _.first(orderLayout.value.categories)

      if (editable.value && (!view.value || view.value.name !== 'CategoryEditor'))
        view.value = {name: 'CategoryEditor'}
    }
  }
})

export const products = computed(() => {
  if (editable.value) {
    return fillMissingAreas(
      selectedCategoryLayout.value.products,
      selectedCategoryLayout.value.columns,
      selectedCategoryLayout.value.rows);
  }
  // remove product layout which is not text but doesn't link to any product
  return  _.filter(selectedCategoryLayout.value && selectedCategoryLayout.value.products, p => p.type === 'Text' || (p.type !== 'Text' && p.product))
})

export const mode = ref();

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
        if (selectedCategoryLayout && isSameArea(empty, selectedCategoryLayout))
          empty = selectedCategoryLayout;
        else
          empty = {...empty, ...createEmptyCategoryLayout()}
      } else {
        if (selectedProductLayout && isSameArea(empty, selectedProductLayout))
          empty = selectedProductLayout
        else
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
  return item.originalPrice !== item.price
}

export function itemsWithQtyFactory() {
  const remainingItems = ref([]);
  const itemsWithQty = computed(() => {
    if (remainingItems) return remainingItems.filter(i => i.quantity > 0)
    return [];
  })
  const itemsToMove = ref([]);

  function addToMoveItems(item) {
    if (item.quantity > 1) {
      const existingItem = itemsToMove.value.find(i => i._id === item._id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        itemsToMove.value.push({...item, quantity: 1})
      }
      item.quantity--
      return
    }
    const existingItem = itemsToMove.value.find(i => i._id === item._id)
    if (existingItem) {
      existingItem.quantity++
    } else {
      itemsToMove.value.push({...item, quantity: 1})
    }
    remainingItems.value.splice(remainingItems.value.indexOf(item), 1)
  }

  function returnItem(item) {
    if (item.quantity > 1) {
      const existingItem = remainingItems.value.find(i => i._id === item._id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        remainingItems.value.push({...item, quantity: 1})
      }
      item.quantity--
      return
    }
    const existingItem = remainingItems.value.find(i => i._id === item._id)
    if (existingItem) {
      existingItem.quantity++
    } else {
      remainingItems.value.push({...item, quantity: 1})
    }
    itemsToMove.value.splice(itemsToMove.value.indexOf(item), 1)
  }

  return {
    remainingItems,
    itemsWithQty,
    addToMoveItems,
    returnItem
  }
}

export const orderViewDialog = ref({
  search: false,
  split: false,
  move: false,
  voucher: false,
  receipt: false
});
