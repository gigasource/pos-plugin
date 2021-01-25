import _ from 'lodash';
import cms from 'cms';

const colName = 'OrderLayout'

async function createOrderLayout(columns, rows) {
  return await cms.getModel(colName).create({
    columns: columns,
    rows: rows,
    type: 'default'
  })
}

async function loadOrderLayout(type) {
  return cms.getModel('OrderLayout').findOne({type})
}
async function changeCategoryColumn(orderLayoutId, newColumn) {
  return await cms.getModel(colName).findOneAndUpdate(
      {_id: orderLayoutId},
      { columns: newColumn },
      { new: true }
  )
}

async function changeCategoryRow(orderLayoutId, newRow) {
  return await cms.getModel(colName).findOneAndUpdate(
      {_id: orderLayoutId},
      { rows: newRow },
      { new: true }
  )
}

async function deleteCategory(orderLayoutId, categoryId) {
  return await cms.getModel(colName).findOneAndUpdate(
      { _id: orderLayoutId },
      { $pull: { categories: { _id: categoryId } } },
      { new: true }
  )
}

async function switchCategory(cateFrom, cateTo) {
  console.log('switchCategory: from', cateFrom, ' to', cateTo)
  // [Note] the method suppose that there is [only 1] order layout
  // or [at least] category's id is unique

  // move cate from to new position
  let qry = { 'categories._id': cateFrom._id }
  let set = { $set: { 'categories.$.top': cateTo.top, 'categories.$.left': cateTo.left } }
  let orderLayout = await cms.getModel(colName).findOneAndUpdate(qry, set, { new: true })

  // if new position is existed cate, then move existed cate back to cate from position
  if (cateTo._id) {
    qry = { 'categories._id': cateTo._id }
    set = { $set: { 'categories.$.top': cateFrom.top, 'categories.$.left': cateFrom.left } }
    orderLayout = await cms.getModel(colName).findOneAndUpdate(qry, set, { new: true })
  }

  return orderLayout
}

async function updateCategoryLayout(categoryLayoutId, change) {
  const qry = { 'categories._id': categoryLayoutId }
  const set = _.reduce(change, (result, value, key) => {
    result[`categories.$.${key}`] = value;
    return result
  }, {}) ;
  return await cms.getModel('OrderLayout').findOneAndUpdate(qry, { $set: set }, { new: true });
}

async function createCategoryLayout(orderLayoutId, categoryLayout) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      { _id: orderLayoutId },
      { $push: { categories: categoryLayout } },
      { new: true });
}


// product api
async function createProductLayout(layoutType, categoryLayoutId, productLayout) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      {
        type: layoutType,
        'categories._id': categoryLayoutId
      },
      { $push: { 'categories.$.products': productLayout } },
      { new: true });
}

async function updateProductLayout(layoutType, categoryLayoutId, productLayoutId, change) {
  console.log('Update product layout id=', productLayoutId, ' with change', change)
  const qry = { type: layoutType, 'categories.products._id': productLayoutId }
  const set = {
    $set: _.reduce(change, (result, value, key) => {
      result[`categories.$[cate].products.$[product].${key}`] = value
      return result
    }, {})
  };
  const filter = [{ 'cate._id': categoryLayoutId }, { 'product._id': productLayoutId }]
  return await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { arrayFilters: filter, new: true });
}

async function deleteProductLayout(categoryId, productLayoutId) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      { 'categories._id': categoryId },
      { $pull: { 'categories.$.products': { _id: productLayoutId } } },
      { new: true })
}

// product api (MOVE TO ANOTHER FILE???)
async function updateProduct(productId, change) {
  return await cms.getModel('Product').findOneAndUpdate({ _id: productId }, change)
}

async function createProduct(product) {
  return await cms.getModel('Product').create({ ...product });
}

async function deleteProduct(productId) {
  return await cms.getModel('Product').remove({_id: productId})
}


export default {
  createOrderLayout,
  loadOrderLayout,
  //
  changeCategoryColumn,
  changeCategoryRow,
  deleteCategory,
  switchCategory,
  //
  updateCategoryLayout,
  createCategoryLayout,
  // product layout
  createProductLayout,
  updateProductLayout,
  deleteProductLayout,

  // product
  createProduct,
  updateProduct,
  deleteProduct

}
