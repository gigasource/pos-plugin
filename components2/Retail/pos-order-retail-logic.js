import { ref } from 'vue'

export const selectedCategory = ref(null)
export function selectCategory(item, parent) {
  selectedCategory.value = item
  if (parent)
    selectedCategory.value.parentId = parent._id
}

export function showSubCategory(category) {
  if (!selectedCategory.value)
    return false
  return (category.subCategory && category.subCategory.length > 0 &&
      (selectedCategory.value._id === category._id || selectedCategory.value.parentId === category._id))
}

