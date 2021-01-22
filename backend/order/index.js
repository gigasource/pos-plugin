const orderUtil = require('../../components/logic/orderUtil')
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');
const AwaitLock = require('await-lock').default

module.exports = (cms) => {
  let feSocket = null
  const {orm} = cms
  const feSocketLock = new AwaitLock()

  orm.on('commit:handler:finish:Order', async function (result, commit) {
    if (!feSocketLock.tryAcquire()) return
    setTimeout(async () => {
      feSocketLock.release()
      const order = await orm('Order').findOne({
        table: commit.data.table,
        status: 'inProgress'
      })
      if (feSocket && order)
        feSocket.emit('update-table', order)
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
      //action print should be here
      await cms.emit('post:print-to-kitchen');
    })

    socket.on('action-list', async (actionList) => {
      await execAllChain(actionList)
    })

    socket.on('cancel-order', cancelOrder)
  })

  async function cancelOrder({_id, table}, cb = () => null) {
    if (!_id) return cb()

    //fixme: refactore
    await orm('Order').deleteOne({_id}).commit({table})

    cb()
  }

  async function execAllChain(actionList) {
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
