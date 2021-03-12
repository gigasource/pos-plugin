import { watch } from 'vue'
import cms from 'cms'
import {
  products,
  categories
} from './product-logic'
import {
  currentAppType
} from '../AppType'
import { ObjectID } from 'bson'
import _ from 'lodash'

watch(() => currentAppType.value, async () => {
  await loadCategories()
  await loadProducts()
})

const Product = cms.getModel('Product')
const Category = cms.getModel('Category')

export async function loadProducts() {
  products.value = await Product.find({ appType: currentAppType.value })
}

export async function loadCategories() {
  categories.value = await Category.find({ appType: currentAppType.value })
}

const colors = ['#FFFFFF','#CE93D8','#B2EBF2','#C8E6C9','#DCE775','#FFF59D','#FFCC80','#FFAB91']

export async function createProduct(product) {
  product.category = product.category.map(category => {
    if (category._id) return category._id
    return category
  })
  product.appType = currentAppType.value
  if (!product._id) {
    product._id = new ObjectID()
  }
  if (!product.id) {
    const maxId = products.value.reduce((maxId, product) => {
      return Math.max(maxId, parseInt(product.id))
    }, 0)
    product.id = (maxId ? maxId + 1 : 0)
  }
  // fixme: Add product layout color here if specified
  // { layouts[0].color = Math.floor(Math.random() * colors.length) }
  products.value.push(product)
  await Product.create(product)
  return product
}

export async function updateProductInfo(product) {
  product.category = product.category.map(category => {
    if (category._id) return category._id
    return category
  })
  const foundProduct = products.value.find(_product => _product._id.toString() === product._id.toString())
  Object.assign(foundProduct, { ...product })
  await Product.updateOne({ _id: product._id }, product)
}

export async function removeProductInfo(productId) {
  _.remove(products.value, _product => _product._id.toString() === productId.toString())
  await Product.remove({ _id: productId })
}

export async function createCategory(newCategory) {
  if (!newCategory._id)
    newCategory._id = new ObjectID()
  if (!!categories.value.find(category => category.name === newCategory.name)) return
  newCategory.appType = currentAppType.value
  categories.value.push(newCategory)
  await Category.create(newCategory)
}

export async function updateCategory(_id, change) {
  const foundCategory = categories.value.find(_category => _category._id.toString() === _id.toString())
  if (!foundCategory) return
  Object.assign(foundCategory, change)
  await Category.findOneAndUpdate({_id}, change)
}

export async function updateAllCategory(newCategories) {
  for (const category of newCategories) {
    if (!category._id) category._id = new ObjectID()
    category.appType = currentAppType.value
    const foundCategory = categories.value.find(_category => _category._id.toString() === category._id.toString())
    if (foundCategory)
      Object.assign(foundCategory, category)
    else
      categories.value.push(category)
    await Category.updateOne({ _id: category._id }, category, { upsert: true })
  }
}

export async function deleteCategory(categoryId) {
  _.remove(categories.value, category => category._id.toString() === categoryId.toString())
  await Category.remove({ _id: categoryId })
}
