import cms from 'cms'
import {
  products,
  categories
} from './product-logic'
import { ObjectID } from 'bson'
import _ from 'lodash'

const Product = cms.getModel('Product')
const Category = cms.getModel('Category')

export async function loadProducts() {
  products.value = await Product.find()
}

export async function loadCategories() {
  categories.value = await Category.find()
}

export async function createProduct(product) {
  if (!product._id) {
    product._id = new ObjectID()
  }
  if (!product.id) {
    const maxId = products.value.reduce((maxId, product) => {
      return Math.max(maxId, parseInt(product.id))
    }, 0)
    product.id = (maxId ? maxId + 1 : 0)
  }
  products.value.push(product)
  return await Product.create(product)
}
