const orderUtil = require('../../components/logic/orderUtil')
const { getBookingNumber, getVDate } = require('../../components/logic/productUtils')
const { printKitchen, printKitchenCancel } = require('../print-kitchen/kitchen-printer');
const { printInvoiceHandler } = require('../print-report')
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');

module.exports = (cms) => {
  cms.socket.on('connect', async (socket) => {

    socket.on('print-to-kitchen', async (device, order, oldOrder = { items: [] }, actionList, cb = () => null) => {
      if (!order._id) {
        order._id = new mongoose.Types.ObjectId();
        actionList.forEach(action => {
          if (action.action === 'createOrder') {
            const query = JsonFn.parse(action.update.query);
            query._id = order._id;
            action.update.query = JsonFn.stringify(query);
          }
        })
      }
      actionList.push(...getRecentItemCommits(order, oldOrder))
      const shouldMerge = await getMergeOrderSettings()

      if (shouldMerge) {
        order.items = mergeOrderItems(order.items).map(i => ({
          ...i,
          printed: true,
          sent: true
        }))
        oldOrder.items = mergeOrderItems(oldOrder.items)

        actionList.push({
          type: 'order',
          action: 'update',
          where: JSON.stringify({ _id: order._id }),
          data: {
            table: order.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: JSON.stringify({
              $set: { items: order.items }
            })
          }
        })
      }

      const diff = _.differenceWith(order.items, oldOrder.items, (item, otherItem) => {
        return isSameProduct(item, otherItem, shouldMerge) && item.quantity === otherItem.quantity
      });
      const printLists = diff.reduce((lists, current) => {
        if (!oldOrder.items.some(i => isSameProduct(i, current, shouldMerge))) {
          if (current.quantity > 0) lists.addList.push(current)
        } else {
          const product = oldOrder.items.find(i => isSameProduct(i, current, shouldMerge))

          if (product) {
            const qtyChange = current.quantity - product.quantity
            if (qtyChange < 0) {
              lists.cancelList.push({
                ...current,
                quantity: -qtyChange
              })
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
            type: 'order',
            action: 'printOrder',
            printType: listName === 'addList' ? 'kitchenAdd' : 'kitchenCancel',
            order: listOrder,
            oldOrder,
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

      const mappedActionList = markPrintedItemCommits(mergedActionList)

      // save order | create commits
      const newOrder = await createOrderCommits(mappedActionList)
      cb(newOrder)
    })

    socket.on('print-invoice', async (order) => {
      await cms.getModel('OrderCommit').addCommits([{
        type: 'order',
        action: 'printOrder',
        printType: 'invoice',
        order,
        device
      }])
    })

    socket.on('update-split-payment', async (_id, payment, cb) => {
      try {
        const updatedSplit = await createOrderCommits([{
          type: 'order',
          action: 'update',
          data: {
            split: true,
          },
          where: JSON.stringify({ _id }),
          update: {
            method: 'findOneAndUpdate',
            query: JSON.stringify({
              $set: {
                'payment': payment
              }
            })
          }
        }])
        cb({ order: updatedSplit })
      } catch (error) {
        cb({ error })
      }
    })

    socket.on('pay-order', async (order, user, device, isSplit = false, actionList = [], print = true, cb = () => null) => {
      try {
        const mappedOrder = await mapOrder(order, user)
        const oldOrder = await cms.getModel('Order').findById(order._id)
        actionList.push(...getRecentItemCommits(order, oldOrder))

        let newOrder
        if (isSplit) {
          const commits = [
            {
              type: 'order',
              action: 'createOrder',
              data: {
                split: true,
              },
              update: {
                method: 'create',
                query: JSON.stringify(mappedOrder)
              }
            },
            ...actionList,
            {
              type: 'order',
              action: 'closeOrder',
              where: JSON.stringify({ _id: mappedOrder._id }),
              update: {
                method: 'findOneAndUpdate',
                query: JSON.stringify({
                  $set: { status: 'paid' }
                })
              }
            }
          ]
          newOrder = await createOrderCommits(commits)
        } else {
          const excludes = ['_id', 'table', 'id', 'splitId', 'status']

          const updates = _(mappedOrder).omit(excludes).map((value, key) => ({
            type: 'order',
            action: 'update',
            where: JSON.stringify({ _id: mappedOrder._id }),
            data: {
              table: mappedOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: JSON.stringify({
                $set: { [key]: value }
              })
            }
          })).value()
          actionList.push(...updates)
          actionList.push({
            type: 'order',
            action: 'closeOrder',
            where: JSON.stringify({ _id: mappedOrder._id }),
            data: {
              table: mappedOrder.table,
              mutate: true
            },
            update: {
              method: 'findOneAndUpdate',
              query: JSON.stringify({
                $set: { status: 'paid' }
              })
            }
          })
          actionList = markPrintedItemCommits(actionList)
          newOrder = await createOrderCommits(actionList)
        }

        await createOrderCommits([{
          type: 'order',
          action: 'update',
          where: JSON.stringify({ _id: order._id }),
          data: {
            table: order.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: JSON.stringify({
              $set: { recentCancellationItems: [], recentItems: [] }
            })
          }
        }])


        if (print) {
          await cms.getModel('OrderCommit').addCommits([{
            type: 'order',
            action: 'printOrder',
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

    socket.on('move-items', async (table, newItems, currentOrder, currentOrderItems, cb = () => null) => {
      const sentryTags = await getBaseSentryTags('moveItems');
      console.debug(sentryTags, `2. POS backend: receive event moveItems`)
      const existingOrder = await cms.getModel('Order').findOne({ table, status: 'inProgress' })
      let newOrder
      if (existingOrder) {
        const items = newItems.reduce((list, current) => {
          const existingItem = list.find(i => JsonFn.stringify(i._id) === JsonFn.stringify(current._id));
          if (existingItem) {
            existingItem.quantity += current.quantity
          } else {
            list.push(current)
          }

          return list
        }, existingOrder.items)
        newOrder = await createOrderCommit(existingOrder, 'items', items);
        console.debug(sentryTags, `3. POS backend: moved items to existing order at table ${table}`)
      } else {
        newOrder = await cms.getModel('OrderCommit').addCommits([{
          type: 'order',
          action: 'createOrder',
          where: null,
          data: { table },
          update: {
            method: 'create',
            query: JsonFn.stringify({
              table,
              items: newItems,
              status: 'inProgress'
            })
          }
        }]);
        console.debug(sentryTags, `3. POS backend: moved items to new order at table ${table}`)
      }

      await createOrderCommit(currentOrder, 'items', currentOrderItems)
      console.debug(sentryTags, `4. POS backend: finished commit, ack cb to frontend`)

      // print new items
      let itemsToPrint = newItems.filter(i => !i.printed)
      // merge if needed
      const shouldMerge = await getMergeOrderSettings()
      if (shouldMerge) {
        const items = mergeOrderItems(newOrder.items)
        await createOrderCommit(newOrder, 'items', items)
      }
      // commits: print, set sent/printed items
      if (itemsToPrint.length) {
        await cms.getModel('OrderCommit').addCommits([{
          type: 'order',
          action: 'printOrder',
          printType: 'kitchenAdd',
          order: Object.assign(newOrder, { items: shouldMerge ? mergeOrderItems(itemsToPrint) : itemsToPrint }),
          device
        }])
      }
      cb(newOrder)
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
    const immediatePay = !order.items.some(i => i.printed)

    const cashback = receive - vSum;
    return {
      _id: order._id || new mongoose.Types.ObjectId(),
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
      numberOfCustomers: order.numberOfCustomers,
      tseMethod: order.tseMethod,
      immediatePay,
      status: 'paid'
    }
  }

  async function createOrderCommit(order, key, value) {
    return await cms.getModel('OrderCommit').addCommits([{
      type: 'order',
      action: 'update',
      where: JSON.stringify({ _id: order._id }),
      data: {
        table: order.table,
      },
      update: {
        method: 'findOneAndUpdate',
        query: JSON.stringify({
          $set: {
            [key]: value
          }
        })
      }
    }]);
  }

  async function createOrderCommits(commits) {
    return cms.getModel('OrderCommit').addCommits(commits);
  }

  function markPrintedItemCommits(commits) {
    return commits.map(action => {
      if (action.type === 'order' && action.action === 'addItem') {
        const query = JsonFn.parse(action.update.query)
        query['$push']['items'].sent = true;
        query['$push']['items'].printed = true;
        action.update.query = JsonFn.stringify(query);
      }
      return action
    })
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
    } else if (commit.type === 'report') {
      const { data } = commit
      await printInvoiceHandler(data.reportType, data.printData, data.device);
    }
  })
}

async function getBaseSentryTags(eventType) {
  const appVersion = require('../../package').version;
  const { deviceName } = global.APP_CONFIG;

  let tag = `sentry:version=${appVersion},deviceName=${deviceName},eventType=${eventType}`;
  const posSetting = await cms.getModel('PosSetting').findOne({})

  if (posSetting.onlineDevice) {
    const { id, store } = posSetting.onlineDevice
    if (id) tag += `,clientId=${id}`;
    if (store && store.name) tag += `,store=${store.name}`
    if (store && store.alias) tag += `,alias=${store.alias}`
  }
  return tag;
}

function isSameProduct(item, otherItem, merge) {
  if (merge) {
    const sameProduct = item.product === otherItem.product
    const samePrice = item.price === otherItem.price
    const sameCourse = item.course === otherItem.course

    return sameProduct && samePrice && sameCourse && isSameModifiers(item, otherItem)
  }

  return item._id.toString() === otherItem._id.toString()
}

function isSameModifiers(item, otherItem) {
  function mapModifier(mods) {
    return mods.map(i => _.omit(i, '_id')).sort((cur, next) => {
      if (cur.name === next.name) {
        return cur.price - next.price
      }
      return cur.name > next.name
    })
  }

  return _.isEqualWith(item.modifiers || [], otherItem.modifiers || [], (mods, otherMods) => {
    const sortedMods = mapModifier(mods)
    const sortedOtherMods = mapModifier(otherMods)
    return _.isEqual(sortedMods, sortedOtherMods)
  })
}

async function getMergeOrderSettings() {
  const posSettings = await cms.getModel('PosSetting').findOne().lean()
  const { printerGeneralSetting } = posSettings
  return printerGeneralSetting && printerGeneralSetting.mergeAfterPrint
}

function mergeOrderItems(items) {
  let resultArr = []
  items.forEach(product => {
    const existingProduct = resultArr.find(r => isSameProduct(r, product, true))
    if (existingProduct) {
      existingProduct.quantity = existingProduct.quantity + product.quantity
    } else {
      resultArr.push(_.cloneDeep(product));
    }
  })
  return resultArr
}

function getRecentQuantityItems(items, oldItems = []) {
  return items.reduce((list, item) => {
    const existingItem = oldItems.find(i => i._id.toString() === item._id.toString())
    if (existingItem) {
      const qtyChange = item.quantity - existingItem.quantity
      if (qtyChange > 0) {
        list.recentItems.push({ ...item, quantity: qtyChange })
      } else if (qtyChange < 0) {
        list.recentCancellationItems.push({ ...item, quantity: -qtyChange })
      }

      return list
    }

    list.recentItems.push(item)
    return list
  }, { recentItems: [], recentCancellationItems: [] })
}

function getRecentItemCommits(order, oldOrder) {
  const oldItems = (oldOrder && oldOrder.items) || []
  const { recentItems, recentCancellationItems } = getRecentQuantityItems(order.items, oldItems)
  const actionList = []

  if (recentItems.length) {
    actionList.push({
      type: 'order',
      action: 'update',
      where: JSON.stringify({ _id: order._id }),
      data: {
        table: order.table,
      },
      update: {
        method: 'findOneAndUpdate',
        query: JSON.stringify({
          $set: { recentItems }
        })
      }
    })
  }

  if (recentCancellationItems.length) {
    actionList.push({
      type: 'order',
      action: 'update',
      where: JSON.stringify({ _id: order._id }),
      data: {
        table: order.table,
      },
      update: {
        method: 'findOneAndUpdate',
        query: JSON.stringify({
          $set: { recentCancellationItems }
        })
      }
    })
  }

  return actionList
}
