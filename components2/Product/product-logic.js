import { ref, watchEffect } from 'vue'

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
        return _category._id.toString() === _category.parentCategory.toString()
      })
      parentCategory.available = false
    }
  })
})
