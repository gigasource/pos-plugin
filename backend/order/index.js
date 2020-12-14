const orderUtil = require('../../components/logic/orderUtil')
const { getBookingNumber, getVDate } = require('../../components/logic/productUtils')
const { printKitchen, printKitchenCancel } = require('../print-kitchen/kitchen-printer');
const { printInvoiceHandler } = require('../print-report')
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');
const updateCommit = require('../master-node/updateCommit');

module.exports = (cms) => {
  const { orm } = cms
  cms.socket.on('connect', async (socket) => {

    socket.on('print-to-kitchen', async (device, order, oldOrder = { items: [] }, actionList, cb = () => null) => {
      await execAllChain(actionList, 'Order')
      const { recentItems, recentCancellationItems } = getRecentQuantityItems(order.items, oldOrder.items)
      await getRecentItemCommits(recentItems, recentCancellationItems, order)
      const shouldMerge = await getMergeOrderSettings()

      if (shouldMerge) {
        order.items = mergeOrderItems(order.items).map(i => ({
          ...i,
          printed: true,
          sent: true
        }))
        oldOrder.items = mergeOrderItems(oldOrder.items)
        await orm('Order').findOneAndUpdate({
          _id: order._id
        }, {
          $set: {
            items: order.items
          }
        }).commit('updateActiveOrder', { table: order.table })
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
          list.push(getPrintCommit(listName === 'addList' ? 'kitchenAdd' : 'kitchenCancel', listOrder, device, oldOrder))
        }
        return list
      }, [])
      // actionList.push(...printCommits)

      // const mergedActionList = actionList.reduce((list, current) => {
      //   if (current.type !== 'item' || !current.update['inc'] || current.update['inc'].key !== 'items.$.quantity') {
      //     list.push(current)
      //     return list
      //   }
      //
      //   const existingItem = list.find(i => i.where && i.where.pairedObject
      //     && i.where.pairedObject.key[0] === 'items._id'
      //     && i.where.pairedObject.value[0] === current.where.pairedObject.value[0])
      //   if (existingItem) {
      //     existingItem.update['inc'].value += current.update['inc'].value
      //   } else {
      //     list.push(current)
      //   }
      //
      //   return list
      // }, [])

      // save order | create commits
      const newOrder = await orm('Order').findOneAndUpdate({
        _id: order._id
      }, {
        $set: {
          items: getUpdatedOrderItems(order.items, order.takeAway)
        }
      }).commit('updateActiveOrder', { table: order.table })
      if (!newOrder.items.some(i => i.quantity > 0)) {
        await cancelOrder(newOrder)
        newOrder.status = 'cancelled'
      }
      cb(newOrder)
    })

    socket.on('print-invoice', async (order) => {
      // todo modify this
      // await cms.getModel('OrderCommit').addCommits([getPrintCommit('invoice', order, device)])
    })

    socket.on('update-split-payment', async (_id, payment, cb) => {
      try {
        const updatedSplit = await createOrderCommits([{
          type: 'order',
          action: 'update',
          data: {
            split: true,
            allowMutateInactiveOrder: true
          },
          where: JsonFn.stringify({ _id }),
          update: {
            method: 'findOneAndUpdate',
            query: JsonFn.stringify({
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

    socket.on('pay-order', async (order, user, device, isSplit = false, actionList = [], print = true, fromPayBtn, cb = () => null) => {
      try {
        const mappedOrder = await mapOrder(order, user)
        const oldOrder = await cms.getModel('Order').findById(order._id)
        const oldItems = (oldOrder && oldOrder.items) || []
        const { recentItems, recentCancellationItems } = getRecentQuantityItems(order.items, oldItems)
        await getRecentItemCommits(recentItems, recentCancellationItems, order)
        if (recentItems.length) {
          const printOrder = Object.assign({}, mappedOrder, { items: recentItems })
          // actionList.push(getPrintCommit('kitchenAdd', printOrder, device, oldOrder)) // todo fix this
        }

        if (recentCancellationItems.length) {
          const printOrder = Object.assign({}, mappedOrder, { items: recentCancellationItems })
          // actionList.push(getPrintCommit('kitchenCancel', printOrder, device, oldOrder)) // todo fix this
        }

        await orm('Order').findOneAndUpdate({
          _id: order._id
        }, {
          $set: {
            items: getUpdatedOrderItems(order.items, order.takeAway)
          }
        })

        let newOrder
        if (isSplit) {
          await orm('Order').create({
            ...mappedOrder
          }).commit('splitOrder')
          await orm('Order').findOneAndUpdate({
            _id: mappedOrder._id
          }, {
            $set: {
              status: 'paid'
            }
          }).commit('splitOrder')
        } else {
          const excludes = ['_id', 'table', 'id', 'splitId', 'status']

          const updates = _(mappedOrder).omit(excludes).map((value, key) => ({
            type: 'order',
            action: 'update',
            where: JsonFn.stringify({ _id: mappedOrder._id }),
            data: {
              table: mappedOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: JsonFn.stringify({
                $set: { [key]: value }
              })
            }
          })).value()
          actionList.push(...updates)
          actionList.push({
            type: 'order',
            action: 'closeOrder',
            where: JsonFn.stringify({ _id: mappedOrder._id }),
            data: {
              table: mappedOrder.table,
              mutate: true,
              fromPayBtn
            },
            update: {
              method: 'findOneAndUpdate',
              query: JsonFn.stringify({
                $set: { status: 'paid' }
              })
            }
          }, {
            type: 'order',
            action: 'update',
            where: JsonFn.stringify({ _id: mappedOrder._id }),
            data: {
              table: mappedOrder.table,
              allowMutateInactiveOrder: true
            },
            update: {
              method: 'findOneAndUpdate',
              query: JsonFn.stringify({
                $set: { recentCancellationItems: [], recentItems: [] }
              })
            }
          })
          newOrder = await createOrderCommits(actionList)
        }

        if (print) {
          await cms.getModel('OrderCommit').addCommits([
            getPrintCommit('invoice', mappedOrder, device, oldOrder)])
        }

        cb(newOrder)
      } catch (e) {
        console.log(e)
      }
    })

    socket.on('move-items', async (table, newItems, currentOrder, currentOrderItems, user, cb = () => null) => {
      const sentryTags = await getBaseSentryTags('moveItems');
      console.debug(sentryTags, `2. POS backend: receive event moveItems`)
      const existingOrder = await cms.getModel('Order').findOne({ table, status: 'inProgress' })
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
        await createOrderCommit(existingOrder, 'items', items);
        console.debug(sentryTags, `3. POS backend: moved items to existing order at table ${table}`)
      } else {
        await cms.getModel('OrderCommit').addCommits([{
          type: 'order',
          action: 'createOrder',
          where: null,
          data: { table },
          update: {
            method: 'create',
            query: JsonFn.stringify({
              _id: new mongoose.Types.ObjectId(),
              table,
              items: getUpdatedOrderItems(newItems),
              status: 'inProgress',
              user: [{ name: user.name, date: new Date() }]
            })
          }
        }]);
        console.debug(sentryTags, `3. POS backend: moved items to new order at table ${table}`)
      }

      const updatedOrder = await createOrderCommit(currentOrder, 'items', currentOrderItems)
      updatedOrder.status = 'inProgress'
      if (!currentOrderItems.some(i => i.quantity > 0)) {
        console.debug(sentryTags, `3a. POS backend: no more items at table ${currentOrder.table}, cancelling order`)
        await cancelOrder(currentOrder)
        updatedOrder.status = 'cancelled'
      }
      console.debug(sentryTags, `4. POS backend: finished commit, ack cb to frontend`)

      // print new items
      const newOrder = await updateCommit.getMethod('order', 'buildTempOrder')(table);
      let itemsToPrint = newItems.filter(i => !i.printed)
      // merge if needed
      const shouldMerge = await getMergeOrderSettings()
      if (shouldMerge) {
        const items = mergeOrderItems(newOrder.items)
        await createOrderCommit(newOrder, 'items', items)
      }
      // commits: print, set sent/printed items
      if (itemsToPrint.length) {
        const printOrder = Object.assign(newOrder, { items: shouldMerge ? mergeOrderItems(itemsToPrint) : itemsToPrint });
        await cms.getModel('OrderCommit').addCommits([
          getPrintCommit('kitchenAdd', printOrder)])
      }
      cb(updatedOrder)
    })

    socket.on('cancel-order', cancelOrder)

    socket.on('update-customer-order', order => {
      cms.socket.emit('get-customer-order', order)
    })
  })

  async function cancelOrder ({ _id, table }, cb = () => null) {
    if (!_id) return cb()

    await cms.getModel('OrderCommit').addCommits([{
      type: 'order',
      action: 'delete',
      where: JsonFn.stringify({ _id }),
      data: { table },
      update: {
        method: 'deleteOne'
      }
    }]);

    cb()
  }

  async function mapOrder(order, user) {
    const date = new Date()
    const taxGroups = orderUtil.getOrderTaxGroups(order.items)
    const vTaxGroups = orderUtil.getOrderVTaxGroups(taxGroups)
    const vSum = orderUtil.calOrderVSum(order);
    const payment = order.payment.map(i => ({ ...i, value: +i.value }))
    const receive = orderUtil.calOrderReceive(payment)
    const immediatePay = !order.items.some(i => i.printed)

    const cashback = receive - vSum - order.tip;
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
      takeAway: order.takeAway,
      status: 'paid'
    }
  }

  async function createOrderCommit(order, key, value) {
    return await cms.getModel('OrderCommit').addCommits([{
      type: 'order',
      action: 'update',
      where: JsonFn.stringify({ _id: order._id }),
      data: {
        table: order.table,
      },
      update: {
        method: 'findOneAndUpdate',
        query: JsonFn.stringify({
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

  function getUpdatedOrderItems(items, takeAwayOrder) {
    return items.map(i => {
      const [tax, tax2] = i.taxes
      const newItem = {
        ...i,
        printed: true,
        sent: true,
        tax: takeAwayOrder || i.takeAway ? tax2 : tax
      };
      delete newItem.quantityModified
      return newItem
    })
  }

  async function mapGroupPrinter(items) {
    async function getGroupPrinterName(gp) {
      if (typeof gp === 'object') {
        return gp.name
      }
      const printer = await cms.getModel('GroupPrinter').findOne({name: gp})
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

    return sameProduct && samePrice && sameCourse && isSameModifiers(item, otherItem) && item.takeAway === otherItem.takeAway
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

async function execAllChain(chains, collectionName) {
  const { orm } = cms
  let finalResult
  for (let chain of chains) {
    let result = orm(collectionName)
    chain.forEach(({ fn, args }) => {
      result = result[fn](...args)
    })
    finalResult = result = await result
  }
  return finalResult
}

async function getRecentItemCommits(recentItems, recentCancellationItems, order) {
  const { orm } = cms
  const actionList = []

  if (recentItems.length) {
    await orm('Order').findOneAndUpdate({
      _id: order._id,
    }, {
      $set: {
        recentItems
      }
    }).commit('updateActiveOrder', { table: order.table })
  }

  if (recentCancellationItems.length) {
    await orm('Order').findOneAndUpdate({
      _id: order._id
    }, {
      $set: {
        recentCancellationItems
      }
    }).commit('updateActiveOrder', { table: order.table })
  }
}

function getPrintCommit(printType, order, device, oldOrder) {
  return {
    type: 'order',
    action: 'printOrder',
    printType: printType,
    order,
    device,
    oldOrder
  }
}
