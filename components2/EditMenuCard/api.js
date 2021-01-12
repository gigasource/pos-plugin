import { showNotify } from '../AppSharedStates';

async function createLayout(columns, rows) {
  return await cms.getModel('OrderLayout').create({
    columns: columns,
    rows: rows,
    type: 'default'
  })
}

async function changeCategoryColumn(orderLayoutId, newColumn) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      {_id: orderLayoutId},
      { columns: newColumn },
      { new: true }
  )
}

async function changeCategoryRow(orderLayoutId, newRow) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      {_id: orderLayoutId},
      { rows: newRow },
      { new: true }
  )
}

async function deleteCategory(orderLayoutId, categoryId) {
  return await cms.getModel('OrderLayout').findOneAndUpdate(
      { _id: orderLayoutId },
      { $pull: { categories: { _id: categoryId } } },
      { new: true }
  )
}

async function switchCategory(cateFrom, cateTo) {
  // [Note] the method suppose that there is [only 1] order layout
  // or [at least] category's id is unique

  // move cate from to new position
  let qry = { 'categories._id': cateFrom._id }
  let set = { $set: { 'categories.$.top': cateTo.top, 'categories.$.left': cateTo.left } }
  let orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { new: true })

  // if new position is existed cate, then move existed cate back to cate from position
  if (cateTo._id) {
    qry = { 'categories._id': cateTo._id }
    set = { $set: { 'categories.$.top': cateFrom.top, 'categories.$.left': cateFrom.left } }
    orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { new: true })
  }

  return orderLayout
}

export default {
  createLayout,
  changeCategoryColumn,
  changeCategoryRow,
  deleteCategory,
  switchCategory
}
