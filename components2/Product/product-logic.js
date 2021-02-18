import { ref, watchEffect, computed } from 'vue'

export const products = ref([])
export const categories = ref([])

/**
 * If category.available is true, then this category can be deleted
 */
watchEffect(() => {
  categories.value.forEach(category => {
    const product = products.value.find(product => {
      return !!product.category.find(categoryId => {
        return categoryId === category._id.toString()
      })
    })
    category.available = !product
    // depth max is 2
    // If category is not available (can not be deleted) so is the parent
    if (!category.available && category.parentCategory) {
      const parentCategory = categories.value.find(_category => {
        return _category._id.toString() === category.parentCategory.toString()
      })
      parentCategory.available = false
    }
  })
})

/**
 * Format category to format with subCategory as array attribute
 * {
 *   ...
 *   subCategory: list of sub categories
 *   ...
 * }
 */
export const formattedCategories = computed(() => {
  const result = categories.value.map(category => {
    category.subCategory = _.cloneDeep(categories.value.filter(_category => {
      return _category.parentCategory && _category.parentCategory.toString() === category._id.toString()
    }))
    category.subCategory = !!category.subCategory ? category.subCategory : []
    return category
  })
  _.remove(result, category => {
    return !!category.parentCategory
  })
  return result
})

