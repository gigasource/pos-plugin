import { ref, computed } from 'vue'

export const inventories = ref([])
export const inventoryCategories = ref([])
export const inventoryHistories = ref([])
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
 * }
 */
export const filter = ref({
  name: null,
  id: null,
  category: null,
  stock: null
})
export const categories = ref([])

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

export const listIDs = computed(() => {
  return inventories.value.map(i => i._id)
})

export function addFilter(newFilter) {
  filter.value = {
    ...filter.value,
    ...newFilter
  }
}

export function removeFilter(typeFilter) {
  filter.value[typeFilter] = null
}

export function clearFilter() {
  filter.value = {
    name: null,
    id: null,
    category: null,
    stock: null
  }
}



