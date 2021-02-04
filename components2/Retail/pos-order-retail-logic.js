import { ref } from 'vue'

export const mockCategories = [
  { _id: 1, name: 'Favorite', icon: 'star', iconColor: '#FFCB3A' },
  { _id: 2, name: 'Sport',
    subCategory: [
      { _id: 20, name: 'Football' },
      { _id: 21, name: 'Baseball' },
      { _id: 22, name: 'Basketball' },
    ]
  },
  { _id: 3, name: 'Food',
    subCategory: [
      { _id: 30, name: 'Burger' },
      { _id: 31, name: 'Rice' },
      { _id: 32, name: 'Noodle' },
    ] },
  { _id: 4, name: 'Drink',
    subCategory: [
      { _id: 40, name: 'Alcohol' },
      { _id: 41, name: 'Non-alcoholic' },
    ] },
  { _id: 5, name: 'Gift' },
  { _id: 6, name: 'Motobike',
    subCategory: [
      { _id: 60, name: 'Standard' },
      { _id: 61, name: 'Cruiser' },
      { _id: 62, name: 'Sport' },
      { _id: 63, name: 'Scooter' },
    ] },
  { _id: 7, name: 'Clothes',
    subCategory: [
      { _id: 70, name: 'Shirt' },
      { _id: 71, name: 'Dress' },
      { _id: 72, name: 'Jeans' },
      { _id: 73, name: 'Trousers' },
    ]
  },
]

export const categories = ref(mockCategories)

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
