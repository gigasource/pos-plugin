const orderUtil = require('../../components/logic/orderUtil')
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');

module.exports = (cms) => {
  const { orm } = cms
  cms.socket.on('connect', async (socket) => {

    socket.on('print-to-kitchen', async (actionList) => {
      await execAllChain(actionList)
    })

    socket.on('cancel-order', cancelOrder)
  })

  async function cancelOrder ({ _id, table }, cb = () => null) {
    if (!_id) return cb()

    await orm('Order').deleteOne({_id}).commit({table})

    cb()
  }

  cms.post('run:print', async (commit) => {
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
