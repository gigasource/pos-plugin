import * as _ from 'lodash'

import { ObjectID } from 'bson';


/**
 * @param {Object} obj
 * @param {String} path
 * example
 * obj = {}
 * path = 'items'
 * const { create, update, remove } = CRUdFactory(obj, path)
 * create( { name: 'item1' }
 * Result: obj = { items: [ { name: item1 }]}
 *
 * When using remove and update function, you should provide object 's _id
 * @param docId
 */
export const CRUdFactory = function (obj, path, docId = null) {

  function getTargetObj() {
    if (path === '') {
      return obj
    } else {
      if (docId) {
        return _.get(_.find(obj, i => i._id.toString() === docId.toString()), path)
      } else return _.get(obj, path)
    }
  }
  const create = function (newObj) {
    const _newObj = _.cloneDeep(newObj)
    if (!_newObj._id) _newObj._id = new ObjectID()
    if (docId) {
      const doc = _.find(obj, i => i._id.toString() === docId.toString())
      if (!_.get(doc, path)) _.set(doc, path, [])
      _.get(doc, path).push(_newObj)
    } else {
      if (path === '') {
        if (!obj) {
          console.log('obj should be an initialized array')
        }
        obj.push(_newObj)
      } else {
        if (!_.get(obj, path)) _.set(obj, path, [])
        _.get(obj, path).push(_newObj)
      }
    }
    return _newObj
  }
  const remove = function (remObj) {
    const data = getTargetObj()
    const idx = _.findIndex(data, i => i._id.toString() === remObj._id.toString())
    if (idx !== -1) data.splice(idx, 1)
  }
  const update = function (updObj, newV) {
    if (!updObj || !updObj._id) return null
    const data = getTargetObj()
    const idx = _.findIndex(data, i => i._id.toString() === updObj._id.toString())
    if (idx !== -1) {
      _.assign(data[idx], newV)
      return data[idx]
    } else return null
  }
  return {
    create, remove, update
  }
}
