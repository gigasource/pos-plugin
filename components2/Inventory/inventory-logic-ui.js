import { ref, computed, watchEffect, watch } from 'vue'
export const inventories = ref([])
export const inventoryCategories = ref([])

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

export const filteredInventory = computed(() => {
  return inventories.value.filter(item => {
    if ((filter.value.name && item.name !== filter.value.name)
        || (filter.value.id && item.id !== filter.value.id)
        || (filter.value.category && item.category.name !== filter.value.category.name)
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
    inventoryCategories,
    filter
  }
}

