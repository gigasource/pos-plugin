const _ = require('lodash')
const JsonFn = require('json-fn');
const {printInvoiceHandler} = require("../print/print-report/report-index");
const {printKitchenCancel} = require("../print/print-kitchen/kitchen-printer");
const {printKitchen} = require("../print/print-kitchen/kitchen-printer");
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
      const condition = commit.data && commit.data.table ? {table: commit.data.table, status: 'inProgress'} : {_id: result._id, status: 'inProgress'}
      const order = await orm('Order').findOne(condition)
      if (feSocket)
        feSocket.emit('update-table', order)
    }

    if (commit.data.isLastCommit) {
      if (feSocketLock.acquired) feSocketLock.release() // Release lock
      await sendNewOrderToFE()
      return
    }
    if (!feSocketLock.tryAcquire()) return // if lock is acquired, return. Otherwise set new debounce
    setTimeout(async () => {
      if (!feSocketLock.acquired) return // Lock is released before debounce
      feSocketLock.release()
      await sendNewOrderToFE()
    }, 300)
  })

  /*cms.on('action:endOfDay', ({order, recent}, cb) => {
    cb();
  })*/

  cms.socket.on('connect', async (socket) => {
    feSocket = socket
    socket.on('print-to-kitchen', async function (actionList, order, recent, device) {
      await execAllChain(actionList)
      //todo: how to get device
      //todo: use test
      await cms.emit('run:print-to-kitchen', ...arguments);
    })

    // todo: recent ??
    socket.on('pay-order', async (actionList, order, recent, cb = () => null) => {
      await execAllChain(actionList)
      //todo: when should call callback

      //pay order : should work on master or not ??
      await cms.emit('run:pay-order', order);
      //emit on master ??

      /*cms.emitAction('action:endOfDay', {order, recent}, () => {
        cb();
      });*/

      cb();
    })

    socket.on('action-list', async (actionList, cb = () => null) => {
      await execAllChain(actionList)
      cb();
    })

    socket.on('cancel-order', cancelOrder)
  })

  async function cancelOrder({_id, table}, cb = () => null) {
    if (!_id) return cb()

    //fixme: refactor
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
    if (commit.printType === 'kitchen') {
      await printKitchen(cms, commit);
      await printKitchenCancel(cms, commit);
    } else if (commit.printType === 'invoice') {
      await printInvoiceHandler('OrderReport', commit.order, commit.device);
    } else if (commit.type === 'report') {
      const {data} = commit
      await printInvoiceHandler(data.reportType, data.printData, data.device);
    }
  })
}
