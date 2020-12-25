import { computed, reactive, ref, watch } from 'vue'
import orderUtil from '../components/logic/orderUtil'
import * as jsonfn from 'json-fn'

const OrderModel = cms.getModel('Order');

export const activeOrders = ref([])
export const currentOrder = ref({ items: [], hasOrderWideDiscount: false, firstInit: false })
export const printedOrder = ref({ items: [], hasOrderWideDiscount: false, firstInit: false })
export const actionList = ref([])
export const initOrderProps = ref({})
// payment
export const paymentAmountTendered = ref(0)
// online order
export const pendingOrders = ref([])
export const kitchenOrders = ref([])
export const onlineOrders = ref([])

export const paymentDiscount = computed(() =>
  currentOrder.value ? orderUtil.calOrderDiscount(currentOrder.value.items) : 0)

export const paymentTotal = computed(() => {
  if (currentOrder.value) {
    const total = orderUtil.calOrderTotal(currentOrder.value.items) + orderUtil.calOrderModifier(currentOrder.value.items)
    if (Number.isInteger(total)) return total
    return +total.toFixed(2)
  }
  return 0
})

export const paymentChange = computed(() => {
  return paymentAmountTendered.value > paymentTotal.value ? paymentAmountTendered.value - paymentTotal.value : 0
})

export const paymentTax = computed(() =>
  currentOrder.value ? orderUtil.calOrderTax(currentOrder.value.items) : 0)

export const paymentSubTotal = computed(() => paymentTotal.value - paymentTax.value)

export function addProductToOrder(product) {
  if (!currentOrder.value || !product) return
  if (!currentOrder.value._id && !actionList.value.some(i => i.type === 'order')) {
    currentOrder.value['firstInit'] = true
    const takeAway = !currentOrder.value.table
    currentOrder.value['takeAway'] = takeAway
    actionList.value.push({
      type: 'order',
      action: 'createOrder',
      where: null,
      data: {
        table: currentOrder.value.table,
      },
      update: {
        method: 'create',
        query: jsonfn.stringify({
          table: currentOrder.value.table,
          items: [],
          status: 'inProgress',
          takeAway
        })
      }
    })
  } else currentOrder.value['firstInit'] = false

  const latestProduct = _.last(currentOrder.value.items)

  const mappedProduct = mapProduct(product)
  if (!latestProduct) {
    // create order with product
    actionList.value.push({
      type: 'order',
      action: 'addItem',
      where: jsonfn.stringify({ _id: !currentOrder.value.firstInit ? currentOrder.value._id : null }),
      data: {
        table: currentOrder.value.table,
      },
      orderId: currentOrder.value.id,
      update: {
        method: 'findOneAndUpdate',
        query: jsonfn.stringify({
          $push: {
            'items': { ...mappedProduct }
          }
        })
      }
    })
    currentOrder.value['items'] = [mappedProduct]
  } else {
    const isSameItem = _.isEqualWith(product, latestProduct, (product, latestProduct) => {
      return latestProduct.product === product._id &&
        product.price === latestProduct.price &&
        (!latestProduct.modifiers || latestProduct.modifiers.length === 0) &&
        !latestProduct.printed
    } )

    if (isSameItem) return addItemQuantity(latestProduct)
    // else add product to arr
    actionList.value.push({
      type: 'order',
      action: 'addItem',
      where: jsonfn.stringify({
        _id: !currentOrder.value.firstInit ? currentOrder.value._id : null
      }),
      data: {
        orderId: currentOrder.value.id,
        table: currentOrder.value.table,
      },
      update: {
        method: 'findOneAndUpdate',
        query: jsonfn.stringify({
          $push: {
            'items': { ...mappedProduct }
          }
        })
      }
    })
    currentOrder.value.items.push(mappedProduct)
  }
}

export function addItemQuantity(item) {
  // $set qty
  const itemToUpdate = currentOrder.value.items.find(i => i === item)
  actionList.value.push({
    type: 'order',
    action: 'changeItemQuantity',
    where: jsonfn.stringify({
      _id: !currentOrder.value.firstInit ? currentOrder.value._id : null,
      'items._id': itemToUpdate._id
    }),
    data: {
      orderId: currentOrder.value.id,
      table: currentOrder.value.table,
    },
    update: {
      method: 'findOneAndUpdate',
      query: jsonfn.stringify({
        $inc: {
          'items.$.quantity': 1
        }
      })
    }
  })
  itemToUpdate.quantity++
}

const getActiveOrders = _.throttle(async function () {
  const orders = await cms.getModel('Order').find({ status: 'inProgress' })
  activeOrders.value = orders || []
  if (activeOrders.value.length) {
    const existingOrder = activeOrders.value.find(o => o.table === currentOrder.value.table)
    if (existingOrder) mapToCurrentOrder(existingOrder)
  }
}, 1000)

function mapToCurrentOrder(order, table) {
  if (order) {
    (currentOrder.value['_id'] = order._id)
    (currentOrder.value['user'] = _.cloneDeep(order.user))
    (currentOrder.value['items'] = _.cloneDeep(order.items))
    (currentOrder.value['manual'] = order.manual)
    (currentOrder.value['discount'] = order.discount)
    (currentOrder.value['takeAway'] = order.takeAway)
    order.splitId && (currentOrder.value['splitId'] = order.splitId)
    order.numberOfCustomers && (currentOrder.value['numberOfCustomers'] = order.numberOfCustomers)
    order.tseMethod && (currentOrder.value['tseMethod'] = order.tseMethod)
    printedOrder.value = _.cloneDeep(currentOrder.value)
  } else {
    currentOrder.value = { items: [], hasOrderWideDiscount: false, tseMethod: 'auto' }
    if (table) (currentOrder.value['table'] = table)
    printedOrder.value = _.cloneDeep(currentOrder.value)
  }
}

function mapProduct(p) {
  return {
    ...p,
    ...!p.originalPrice && { originalPrice: p.price },
    ...!p.quantity && { quantity: 1 },
    ...!p.course && { course: 1 },
    product: p._id,
    _id: genObjectId(),
    taxes: [p.tax, p.tax2]
  }
}

function genObjectId(id) {
  const BSON = require('bson')
  if (id) return new BSON.ObjectID(id)
  return new BSON.ObjectID()
}

export function setInitOrderProps(val) {
  initOrderProps.value = val
}

export async function updateOnlineOrders() {
  pendingOrders.value = await OrderModel.find({ online: true, status: 'inProgress' })
  kitchenOrders.value = await OrderModel.find({ online: true, status: 'kitchen' })
}

export async function acceptPendingOrder(order) {
  try {
    let deliveryDateTime
    if (order.deliveryTime === 'asap') {
      deliveryDateTime = dayjs().add(order.prepareTime, 'minute')
      order.deliveryTime = deliveryDateTime.format('HH:mm')
    } else {
      deliveryDateTime = dayjs(order.deliveryTime, 'HH:mm')
    }
    const status = 'kitchen'
    const acceptResponse = $t(order.type === 'delivery' ? 'onlineOrder.deliveryIn' : 'onlineOrder.pickUpIn', this.storeLocale, {
      0: dayjs(deliveryDateTime).diff(dayjs(order.date), 'minute')
    })

    // validate prepaid (paypal, etc) before update status
    let isPrepaidOrder = isPrepaidOrder(order);
    // info which will be added/updated into order documents
    let updateOrderInfo = Object.assign({}, order, { status, user: this.user });
    let updatedOrder;
    if (isPrepaidOrder) {
      updatedOrder = order
    } else {
      updatedOrder = await OrderModel.findOneAndUpdate({ _id: order._id }, updateOrderInfo)
      // this.printOnlineOrderKitchen(order._id)
      // this.printOnlineOrderReport(order._id)
      await updateOnlineOrders()
    }

    const orderStatus = {
      orderId: updatedOrder.id,
      onlineOrderId: updatedOrder.onlineOrderId,
      status: status,
      responseMessage: acceptResponse,
      paypalOrderDetail: order.paypalOrderDetail,
      total: order.vSum
    }

    // const clientId = await this.getOnlineOrderDeviceId();
    // console.debug(
    //   `sentry:orderToken=${updatedOrder.onlineOrderId},orderId=${updatedOrder.id},eventType=orderStatus,clientId=${clientId}`,
    //   `8. Restaurant frontend: Order id ${updatedOrder.id}: send status to backend: ${status}`)

    // fixme dialog component
    // if (isPrepaidOrder) {
    //   this.dialog.capturing.show = true
    // }

    this.emitWithRetry('updateOrderStatus', updatedOrder.onlineOrderId, [orderStatus])
  } catch (e) {
    // TODO: Show an error dialog to the user
    console.error(e)
  }
}

export async function initOrderData() {
  await getActiveOrders()
  cms.socket.on('update-table-status', getActiveOrders)

  watch(() => currentOrder.value.table, (val) => {
    if (val) {
      let existingOrder = activeOrders.value.find(order => order.table === val)
      mapToCurrentOrder(existingOrder, val)
    } else {
      actionList.value = []
      currentOrder.value = { items: [], hasOrderWideDiscount: false, table: val, tseMethod: 'auto' }
      printedOrder.value = _.cloneDeep(currentOrder.value)
    }

    if (initOrderProps.value) {
      for (const prop in initOrderProps.value) {
        if (initOrderProps.value.hasOwnProperty(prop)) {
          currentOrder.value[prop] = initOrderProps.value[prop]
        }
      }
      setInitOrderProps({})
    }
  })
}
