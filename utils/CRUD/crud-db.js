import cms from 'cms'
import { CRUdFactory } from './crud';
import { ObjectID } from 'bson';

/**
 *
 * @param obj object need to be modified
 * @param path
 * @param collection Database collection name
 * @param docId
 *
 * @returns {{create: (function(*=): *), update: (function(*=, *=): Promise<undefined>), remove: (function(*=): Promise<void>)}}
 * @constructor
 */
export const CRUdDbFactory = function(obj, path, collection, docId = null) {

  const docFindQuery = docId ? { _id: docId } : {}

  const { create: createData, remove: removeData, update: updateData} = CRUdFactory(obj, path, docId)
  const create = async function(newObj) {
    const createdData = createData(newObj)
    if (path === '' && !docId) {
      await cms.getModel(collection).create(createdData)
    } else {
      const pushQuery = {}
      pushQuery[path] = createdData
      await cms.getModel(collection).findOneAndUpdate(docFindQuery, {$push: pushQuery})
    }
    return createdData
  }
  const remove = async function(remObj) {
    removeData(remObj)

    if (docId) {

    }
    if (path === '' && !docId) {
      await cms.getModel(collection).remove( { _id: remObj._id})
    } else {
      const pullQuery = {}
      pullQuery[`${path}`] = {
        _id: remObj._id
      }
      await cms.getModel(collection).findOneAndUpdate(docFindQuery, {$pull: pullQuery})
    }
  }
  const update = async function(updObj, newV) {
    if (!updObj || !updObj._id) return
    const updatedValue = updateData(updObj, newV)
    if (docId) {
      const qry = { _id: docId }
      qry[`${path}._id`] = updObj._id
      const setQuery = {}
      setQuery[`${path}.$`] = updatedValue
      await cms.getModel(collection).findOneAndUpdate(qry, setQuery)
    } else {
      if (path === '') {
        await cms.getModel(collection).findOneAndUpdate({ _id: updObj._id}, updatedValue)
      } else {
        const setQuery = {}
        setQuery[`${path}.$`] = updatedValue
        const qry = {}
        qry[`${path}._id`] = updObj._id
        await cms.getModel(collection).updateOne(qry, { $set: setQuery })
      }
    }
  }
  return {
    create, remove, update
  }
}
