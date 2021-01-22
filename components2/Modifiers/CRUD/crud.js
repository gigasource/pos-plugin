import * as _ from 'lodash'

import { ObjectID} from 'bson';

export const CRUdFactory = function(obj, path) {
  const create = function(newObj) {
    const _newObj = _.cloneDeep(newObj)
    if (!_newObj._id) _newObj._id = new ObjectID()
    if (!_.get(obj, path)) _.set(obj, path, [])
    _.get(obj, path).push(_newObj)
    return _newObj
  }
  const remove = function(remObj) {
    const data = _.get(obj, path)
    const idx = _.findIndex(data, i => i._id.toString() === remObj._id.toString())
    if (idx !== -1) data.splice(idx, 1)
  }
  const update = function(updObj, newV) {
    const data = _.get(obj, path)
    const idx = _.findIndex(data, i => i._id.toString() === updObj._id.toString())
    if (idx !== -1) _.assign(data[idx], newV)
    return data[idx]
  }
  return {
    create, remove, update
  }
}
