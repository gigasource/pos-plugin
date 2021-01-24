const orderUtil = require('../../components/logic/orderUtil')
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');
const AwaitLock = require('await-lock').default

module.exports = (cms) => {
  let feSocket = null
  const {orm} = cms
  const feSocketLock = new AwaitLock()

  // Register manually orderSchema instead of using buildform
  const schema = require('./orderSchema.json')
  orm.registerSchema('Order', schema)
  cms.Types['Order'] = {
    schema,
    name: 'Order',
    Model: orm('Order'),
    info: {}
  }

  orm.on('commit:handler:finish:Order', async function (result, commit) {
    const sendNewOrderToFE = async function () {
      const condition = commit.data && commit.data.table ? { table: commit.data.table, status: 'inProgress' } : { _id: result._id, status: 'inProgress' }
      const order = await orm('Order').findOne(condition)
      if (feSocket && order)
        feSocket.emit('update-table', order)
    }

    if (commit.data.isLastCommit) {
      feSocketLock.release() // Release lock
      await sendNewOrderToFE()
      return
    }
    if (!feSocketLock.tryAcquire()) return // if lock is acquired, return. Otherwise set new debounce
    setTimeout(async () => {
      if (!feSocketLock.acquired) return // Lock is released before debounce
      feSocketLock.release()
      await sendNewOrderToFE()
    }, 500)
  })

  cms.socket.on('connect', async (socket) => {
    feSocket = socket
    socket.on('print-to-kitchen', async (actionList, order) => {
      await execAllChain(actionList)
      await orm('Order').updateOne({_id: order._id}, {
        $set: {
          'items.$[].sent': true, 'items.$[].printed': true,
          'cancellationItems.$[].sent': true, 'cancellationItems.$[].printed': true
        }
      });
      await cms.emit('post:print-to-kitchen');
    })

    socket.on('cancel-order', cancelOrder)
  })

  async function cancelOrder({_id, table}, cb = () => null) {
    if (!_id) return cb()

    await orm('Order').deleteOne({_id}).commit({table})

    cb()
  }

  async function execAllChain(actionList) {
    if (actionList && actionList.length) {
      // find and add isLastCommit into data of last commit in actionList
      const lastAction = _.last(actionList)
      const lastInChain = _.last(lastAction.action)
      if (lastInChain.fn === 'commit') {
        lastInChain.args.map(arg => {
          if (typeof arg === 'object') {
            arg.isLastCommit = true
          }
          return arg
        })
      }
    }
    const {orm} = cms
    let finalResult
    for (let {action, modelName} of actionList) {
      let result = orm(modelName)
      for (let {fn, args} of action) {
        result = result[fn](...args)
      }
      finalResult = result = await result
    }
    return finalResult
  }

  cms.on('run:print', async (commit) => {
    // if (commit.printType === 'kitchenAdd') {
    //   await printKitchen({ order: commit.order, device: commit.device });
    // } else if (commit.printType === 'kitchenCancel') {
    //   await printKitchenCancel({ order: commit.order, device: commit.device });
    // } else if (commit.printType === 'invoice') {
    //   await printInvoiceHandler('OrderReport', commit.order, commit.device);
    // } else if (commit.type === 'report') {
    //   const { data } = commit
    //   await printInvoiceHandler(data.reportType, data.printData, data.device);
    // }
  })
}
