import { ref, computed, watchEffect, watch } from 'vue'
import _ from 'lodash'
import {
  products,
  categories
} from '../Product/product-logic';

export const inventories = ref([])
export const hooks = new (require('schemahandler/hooks/hooks'))();
export const detailInventories = computed(() => {
  return inventories.value.map(inventory => {
    const product = products.value.find(product => product._id.toString() === inventory.productId.toString())
    if (!product) return inventory
    inventory.product = _.cloneDeep(product)
    inventory.product.category = inventory.product.category.map(categoryId => {
      return _.cloneDeep(categories.value.find(category => categoryId.toString() === category._id.toString()))
    })
    return inventory
  })
})

//<editor-fold desc="Handle hook">
/**
 * Check before update item
 * -  Control number of item and never let them negative
 * -  Inventories must be an array and items in inventories must include _id and quantity
 * -  If inventory item is combo, get the sum of the item in that combo to calculate final change
 */
hooks.on('before:removeFromInventory', function (removedInventoryItems) {
  const groupItems = _.groupBy(
    removedInventoryItems.reduce((result, item) => {
      const inventory = inventories.value.find(inventory => inventory._id.toString() === item._id.toString())
      if (inventory.hasComboIngredient) {
        result.push(...inventory.comboIngredient.map(comboItem => {
          return {
            _id: comboItem._id,
            quantity: comboItem.quantity * item.quantity
          }
        }))
      }
      result.push(item)
      return result
    }, []),
    item => item._id
  )
  removedInventoryItems = []
  Object.keys(groupItems).forEach(itemId => {
    const inventory = inventories.value.find(inventory => inventory._id.toString() === itemId.toString())
    const totalQuantity = _.sumBy(groupItems[itemId], item => item.quantity)
    removedInventoryItems.push({
      _id: itemId,
      quantity: totalQuantity,
      outOfStock: inventory.stock < totalQuantity
    })
  })
  return this.value = removedInventoryItems
})

//</editor-fold>
/**
 * @name: {string} name of item need to filter
 * @id: {string} id of item need to filter
 * @category: {string} category need to filter
 * @stock: {array} remaining stock to filter
 * @example:
 * {
 *   name: 'Rice',
 *   id: '1',
 *   category: 'Food',
 *   stock: [10, 30]
 *   date: {from, to}
 * }
 */
export const filter = ref({})

export const filteredInventory = computed(() => {
  return detailInventories.value.filter(item => {
    if ((filter.value.name && item.product.name !== filter.value.name)
        || (filter.value.id && item.id !== filter.value.id)
        || (filter.value.category && !item.product.category.find(category => category.name === filter.value.category.name))
        || (filter.value.stock && (item.stock < filter.value.stock[0] || item.stock > filter.value.stock[1])))
      return false
    return true
  })
})

export const listIDs = computed(() => {
  return inventories.value.map(i => i._id)
})

export const isFiltered = computed(() => {
  Object.keys(filter.value).forEach(typeFilter => {
    if (filter.value[typeFilter] !== null) return true
  })
  return false
})

export function addFilter(newFilter) {
  filter.value = {
    ...filter.value,
    ...newFilter
  }
}

export function removeFilter(typeFilter) {
  delete filter.value[typeFilter]
}

export function clearFilter() {
  filter.value = {
  }
}

export function convertFilterValueToString(typeFilter) {
  switch (typeFilter) {
    case 'stock':
      return `[${filter.value.stock[0]} - ${filter.value.stock[1]}]`
    case 'category':
      return filter.value[typeFilter].name
    default:
      return filter.value[typeFilter]
  }
}

window.dbg = {
  ...(window.dbg || {}),
  inventory: {
    inventories,
    filter,
    filteredInventory
  }
}

