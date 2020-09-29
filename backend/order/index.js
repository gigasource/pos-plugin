const orderUtil = require('../../components/logic/orderUtil')
const { getNewOrderId } = require('../master-node/updateCommit');
const { getBookingNumber, getVDate } = require('../../components/logic/productUtils')
const { printKitchen, printKitchenCancel } = require('../print-kitchen/kitchen-printer');
const _ = require('lodash')

module.exports = (cms) => {
  cms.socket.on('connect', async (socket) => {
    socket.on('join-room', () => {
      socket.join('room')
    })

    socket.on('update-table-status', ({ table, status }) => {
      cms.socket.to('room').emit('update-table-status', ({ table, status }))
    })

    socket.on('print-order-kitchen', async (device, newOrder, oldOrder = [], cb = () => null) => {
      if (oldOrder && oldOrder.items) {
        const diff = _.differenceWith(newOrder.items, oldOrder.items, _.isEqual);
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
        }, {
          cancelList: [],
          addList: []
        })

        const results = {}
        if (printLists.addList.length) {
          const addedList = Object.assign({}, newOrder,
            { items: await mapGroupPrinter(printLists.addList) });
          results.printKitchen = await printKitchen({ order: addedList, device })
          // cms.socket.emit('printEntireReceipt', { order: addedList, device })
        }

        if (printLists.cancelList.length) {
          const cancelledList = Object.assign({}, newOrder,
            ({ items: await mapGroupPrinter(printLists.cancelList) }));
          results.printKitchenCancel = await printKitchenCancel({ order: cancelledList, device })
        }

        cb(results)
      }
    })

    socket.on('print-invoice', () => {

    })

    socket.on('update-split-payment', async (_id, payment, cb) => {
      try {
        const updatedSplit = await cms.getModel('Order').findOneAndUpdate({ _id }, { payment }, { new: true })
        cb({ order: updatedSplit })
      } catch (error) {
        cb({ error })
      }
    })

    socket.on('save-order', async (actionList, cb = () => null) => {
      const newOrder = await createOrderCommits(actionList);
      cb(newOrder)
    })

    socket.on('pay-order', async (order, user, commit = false, cb = () => null) => {
      try {
        const mappedOrder = await mapOrder(order, user)

        if (commit) {
          const excludes = ['_id', 'table', 'id']

          const updates = _(mappedOrder).omit(excludes).map((value, key) => ({
            type: 'order',
            where: { _id: mappedOrder._id },
            table: mappedOrder.table,
            update: {
              set: { key, value }
            }
          })).value()

          const newOrder = await createOrderCommits(updates)
          cb(newOrder)
        } else {
          const newOrder = await cms.getModel('Order').findOneAndUpdate({ _id: mappedOrder._id }, {
            ...mappedOrder,
            id: getNewOrderId()
          }, {
            upsert: true,
            new: true
          })
          cb(newOrder._doc)
        }

      } catch (e) {
        console.log(e)
      }
    })
  })

  async function mapOrder(order) {
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
      items: await orderUtil.getComputedOrderItems(compactOrder(order.items), date),
      user: order.user,
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

  function genObjectId() {
    const BSON = require('bson');
    return new BSON.ObjectID();
  }

  function compactOrder(products) {
    let resultArr = [];
    products.forEach(product => {
      const existingProduct = resultArr.find(r =>
        _.isEqual(_.omit(r, 'quantity', '_id'), _.omit(product, 'quantity', '_id'))
      );
      if (existingProduct) {
        existingProduct.quantity = existingProduct.quantity + product.quantity
      } else {
        resultArr.push(_.cloneDeep(product));
      }
    })
    return resultArr
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
}
