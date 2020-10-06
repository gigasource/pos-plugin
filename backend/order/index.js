const orderUtil = require('../../components/logic/orderUtil')
const { getBookingNumber, getVDate } = require('../../components/logic/productUtils')
const { printKitchen, printKitchenCancel } = require('../print-kitchen/kitchen-printer');
const { printInvoiceHandler } = require('../print-report')
const _ = require('lodash')

module.exports = (cms) => {
  cms.socket.on('connect', async (socket) => {

    socket.on('print-to-kitchen', async (device, order, oldOrder = { items: [] }, actionList, cb = () => null) => {
      const diff = _.differenceWith(order.items, oldOrder.items, _.isEqual);
      const printLists = diff.reduce((lists, current) => {
        if (!oldOrder.items.some(i => i._id === current._id)) {
          if (current.quantity > 0) lists.addList.push(current)
        } else {
          const product = oldOrder.items.find(i => i._id === current._id)

          if (product) {
            const qtyChange = current.quantity - product.quantity
            if (qtyChange < 0) {
              const items = Array.from({ length: -qtyChange }).map(() => current);
              lists.cancelList = lists.cancelList.concat(items)
            } else {
              lists.addList.push({ ...current, quantity: qtyChange })
            }
          }
        }
        return lists
      }, { cancelList: [], addList: [] })

      // add print commits
      printLists.addList = Object.assign({}, order, { items: await mapGroupPrinter(printLists.addList) });
      printLists.cancelList = Object.assign({}, order, ({ items: await mapGroupPrinter(printLists.cancelList) }));
      const printCommits = _.reduce(printLists, (list, listOrder, listName) => {
        if (listOrder && listOrder.items && listOrder.items.length) {
          list.push({
            type: 'print',
            printType: listName === 'addList' ? 'kitchenAdd' : 'kitchenCancel',
            order: listOrder,
            device
          })
        }
        return list
      }, [])
      actionList.push(...printCommits)

      const mergedActionList = actionList.reduce((list, current) => {
        if (current.type !== 'item' || !current.update['inc'] || current.update['inc'].key !== 'items.$.quantity') {
          list.push(current)
          return list
        }

        const existingItem = list.find(i => i.where && i.where.pairedObject
          && i.where.pairedObject.key[0] === 'items._id'
          && i.where.pairedObject.value[0] === current.where.pairedObject.value[0])
        if (existingItem) {
          existingItem.update['inc'].value += current.update['inc'].value
        } else {
          list.push(current)
        }

        return list
      }, [])

      const mappedActionList = mergedActionList.map(action => {
        if (action.type === 'item' && action.update && action.update.push) {
          action.update.push.value.sent = true
          action.update.push.value.printed = true
        }
        return action
      })

      // save order | create commits
      const newOrder = await createOrderCommits(mappedActionList)
      cb(newOrder)
    })

    socket.on('print-invoice', async (order) => {
      await cms.getModel('OrderCommit').create([{
        type: 'print',
        printType: 'invoice',
        order,
        device
      }])
    })

    socket.on('update-split-payment', async (_id, payment, cb) => {
      try {
        const updatedSplit = await createOrderCommits([{
          type: 'order',
          split: true,
          where: { _id },
          update: {
            set: {
              key: 'payment',
              value: payment
            }
          }
        }])
        cb({ order: updatedSplit })
      } catch (error) {
        cb({ error })
      }
    })

    socket.on('pay-order', async (order, user, device, isSplit = false, actionList, print = true, cb = () => null) => {
      try {
        const mappedOrder = await mapOrder(order, user)
        let newOrder
        if (isSplit) {
          newOrder = await createOrderCommits([{
            type: 'order',
            split: true,
            update: {
              create: mappedOrder
            }
          }])
        } else {
          const excludes = ['_id', 'table', 'id', 'splitId']

          const updates = _(mappedOrder).omit(excludes).map((value, key) => ({
            type: 'order',
            where: { _id: mappedOrder._id },
            table: mappedOrder.table,
            update: {
              set: { key, value }
            }
          })).value()
          actionList.push(...updates)
          newOrder = await createOrderCommits(actionList)
        }

        if (print) {
          // todo use in master
          // await printInvoiceHandler('OrderReport', mappedOrder, device)
          await cms.getModel('OrderCommit').create([{
            type: 'print',
            printType: 'invoice',
            order: mappedOrder,
            device
          }])
        }

        cb(newOrder)
      } catch (e) {
        console.log(e)
      }
    })
  })

  async function mapOrder(order, user) {
    const date = new Date()
    const taxGroups = _.groupBy(order.items, 'tax')
    const vTaxGroups = _.map(taxGroups, (val, key) => ({
      taxType: key,
      tax: orderUtil.calOrderTax(val),
      sum: orderUtil.calOrderTotal(val)
    }))
    const vSum = orderUtil.calOrderTotal(order.items) + orderUtil.calOrderModifier(order.items);
    const payment = order.payment
    const receive = _.sumBy(payment, 'value');

    const cashback = receive - vSum;
    return {
      _id: order._id,
      id: order.id,
      items: await orderUtil.getComputedOrderItems(orderUtil.compactOrder(order.items), date),
      ...order.user && order.user.length
        ? { user: order.user }
        : { user: [{ name: user.name, date }] },
      payment,
      date,
      vDate: await getVDate(date),
      bookingNumber: getBookingNumber(date),
      vSum,
      vTax: orderUtil.calOrderTax(order.items),
      vTaxGroups,
      vDiscount: orderUtil.calOrderDiscount(order.items),
      receive,
      cashback,
      table: order.table,
      splitId: order.splitId,
      status: 'paid',
    }
  }

  async function createOrderCommit(order, key, value) {
    return await cms.getModel('OrderCommit').create([{
      type: 'order',
      where: { _id: order._id },
      table: order.table,
      update: {
        set: { key, value }
      }
    }]);
  }

  async function createOrderCommits(commits) {
    return cms.getModel('OrderCommit').create(commits);
  }

  async function mapGroupPrinter(items) {
    async function getGroupPrinterName(gp) {
      if (typeof gp === 'object') {
        return gp.name
      }
      const printer = await cms.getModel('GroupPrinter').findById(gp)
      if (printer) return printer.name
    }

    return Promise.all(items.map(async item => {
      if (item.groupPrinter) item.groupPrinter = await getGroupPrinterName(item.groupPrinter)
      if (item.groupPrinter2) item.groupPrinter2 = await getGroupPrinterName(item.groupPrinter2)
      return item
    }))
  }

  async function isMasterDevice() {
    const { onlineDevice, masterClientId } = await cms.getModel('PosSetting').findOne()
    if (!onlineDevice) return false
    return onlineDevice.id === masterClientId
  }

  cms.post('run:print', async (commit) => {
    if (commit.printType === 'kitchenAdd') {
      await printKitchen({ order: commit.order, device: commit.device });
    } else if (commit.printType === 'kitchenCancel') {
      await printKitchenCancel({ order: commit.order, device: commit.device });
    } else if (commit.printType === 'invoice') {
      await printInvoiceHandler('OrderReport', commit.order, commit.device);
    }
  })
}
