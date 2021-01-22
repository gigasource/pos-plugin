import cms from 'cms'
import { CRUdFactory } from './crud';

export const CRUdDbFactory = function(obj, path, collection) {
  const { create: createData, remove: removeData, update: updateData} = CRUdFactory(obj, path)
  const create = async function(newObj) {
    const createdData = createData(newObj)
    const pushQuery = {}
    pushQuery[path] = createdData
    await cms.getModel(collection).findOneAndUpdate({}, {$push: pushQuery})
    return createdData
  }
  const remove = async function(remObj) {
    removeData(remObj)
    const pullQuery = {}
    pullQuery[`${path}`] = {
      _id: remObj._id
    }
    await cms.getModel(collection).findOneAndUpdate({}, {$pull: pullQuery})
  }
  const update = async function(updObj, newV) {
    const updatedValue = updateData(updObj, newV)
    const setQuery = {}
    setQuery[`${path}.$`] = updatedValue
    const qry = {}
    qry[`${path}._id`] = updObj._id
    //todo: update new fields only
    await cms.getModel(collection).updateOne(qry, {$set: setQuery})
  }
  return {
    create, remove, update
  }
}
