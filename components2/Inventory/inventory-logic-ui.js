import { ref, computed, watchEffect } from 'vue'
import _ from 'lodash'

export const inventories = ref([])
export const inventoryCategories = ref([])
export const inventoryHistories = ref([])

/**
 * If category.available is true, then this category can be deleted
 */
watchEffect(() => {
  inventoryCategories.value.forEach(category => {
    const inventoryWithCategory = inventories.value.find(inventory => {
      return inventory.category._id.toString() === category._id.toString()
    })
    category.available = !inventoryWithCategory
  })
})
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
/**
 * @date: {Object} range from, to of selected inventory histories
 * @example:
 * {
 *   data: {
 *     from:
 *     to:
 *   }
 * }
 */
export const historyFilter = ref({})

export const filteredInventory = computed(() => {
  return inventories.value.filter(item => {
    if ((filter.value.name && item.name !== filter.value.name)
        || (filter.value.id && item.id !== filter.value.id)
        || (filter.value.category && item.category.name !== filter.value.category)
        || (filter.value.stock && (item.stock < filter.value.stock[0] || item.stock > filter.value.stock[1])))
      return false
    return true
  })
})

export const filteredInventoryHistories = computed(() => {
  const getAmount = (histories, mode) => {
    return histories.reduce((acc, item) => {
      if (mode === item.type) {
        return acc + parseInt(item.amount)
      }
      return acc
    }, 0)
  }

  const inventoryHistoriesFiltered = inventoryHistories.value.filter(item => {
    if ((historyFilter.fromDate && historyFilter.fromDate.getTime() > item.date.getTime())
      || (historyFilter.toDate && historyFilter.toDate.getTime() < item.date.getTime()))
      return false
    return true
  })
  return _.map(
    _.groupBy(inventoryHistoriesFiltered, history => history.inventory),
    (group, inventory) => {
      return {
        inventory,
        history: group,
        add: getAmount(group, 'add'),
        remove: getAmount(group, 'remove')
      }
    }
  ).filter(item => {
    return !!inventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
  }).map(item => ({
    ...item,
    ...inventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
  }))
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

window.dbg = {
  ...(window.dbg || {}),
  inventory: {
    inventories,
    inventoryCategories,
    inventoryHistories,
    filter
  }
}

