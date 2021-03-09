//<editor-fold desc="declare">
import {
  addItem, addUser,
  changeItemQuantity,
  clearNullQuantityItems,
  createOrder,
  genSplitId,
  hooks, mergeSameItems,
} from './pos-logic';
import {computed, ref, toRaw, watch, watchEffect} from "vue";
import cms from 'cms';
import _ from 'lodash';
import rdiff from 'recursive-diff';
import Hooks from "schemahandler/hooks/hooks";
import dayjs from "dayjs";
import delay from "delay";
import {socketEmit} from "../utils";
import {username} from "../AppSharedStates";
import {ObjectID} from "bson";

const Order = cms.getModel('Order');

function addItemAction(order, actionList, item, update) {
  update = _.cloneDeep(update);
  actionList.value.push({
    modelName: 'Order', // todo: review
    action: Order
      .findOneAndUpdate({_id: order._id, 'items._id': item._id}, update)
      .commit('updateActiveOrder', {...order._id && {orderId: order._id}, table: order.table}).chain
  })
}

function addOrderAction(order, actionList, update) {
  update = _.cloneDeep(update);
  actionList.value.push({
    modelName: 'Order', // todo: review
    action: Order
      .findOneAndUpdate({_id: order._id}, update)
      .commit('updateActiveOrder', {...order._id && {orderId: order._id}, table: order.table}).chain
  })
}

function diff(o1, o2 = {}) {
  return _.omitBy(o1, (v, k) => {
    if (typeof o2[k] === 'object') {
      const _diff = rdiff.getDiff(o2[k], v);
      return _diff.length === 0;
    }
    return o2[k] === v;
  });
}

/**
 *
 * @param order
 * @param actionList
 * @param items
 * @param itemsSnapshot
 * @param prop
 * @param _hooks (remove-item, add-item, change-item)
 */
const processItems = (order, actionList, items, itemsSnapshot, prop, _hooks) => {
  const _ids = _.unionBy(items.map(i => i._id), (itemsSnapshot || []).map(i => i._id), _id => _id.toString());
  for (const _id of _ids) {
    const item = items.find(i => i._id.toString() === _id.toString());
    const itemSnapshot = _.find(itemsSnapshot, i => i._id.toString() === _id.toString());
    if (!item) {
      // cancellation -> pull
      !_hooks && addOrderAction(order, actionList, {$pull: {[prop]: {_id: itemSnapshot._id}}})
      _hooks && _hooks.emit('remove-item', item, itemSnapshot);
    } else if (!itemSnapshot) {
      // push
      !_hooks && addOrderAction(order, actionList, {$push: {[prop]: item}});
      _hooks && _hooks.emit('add-item', item, itemSnapshot);
    } else {
      const diffItem = diff(item, itemSnapshot);
      if (JSON.stringify(diffItem) !== '{}') {
        const _diffItem = _.mapKeys(diffItem, (v, k) => {
          return `items.$.${k}`;
        })
        !_hooks && addItemAction(order, actionList, item, {$set: _diffItem});
        if (['quantity', 'price', 'modifiers', 'name'].find(p => diffItem.hasOwnProperty(p))) {
          _hooks && _hooks.emit('change-item', diffItem, item, itemSnapshot);
        }
      }
    }
  }
}

let orderMap = new Map();

hooks.on('pre:order:update', order => {
  return hooks.emit(`pre:order:update:${orderMap.get(order)}`, order);
})

hooks.on('post:order:update', order => {
  return hooks.emit(`post:order:update:${orderMap.get(order)}`, order);
})

hooks.on('pre:prepareOrder', order => {
  return hooks.emit(`pre:prepareOrder:${orderMap.get(order)}`, order);
})

function mapProduct(p) {
  return {
    groupPrinter: _.get(p, 'groupPrinter.name', ''),
    ..._.pick(p, ['id', 'name', 'price']),
    product: p._id,
    taxes: [p.tax, p.tax2],
    ingredients: p.ingredients ? p.ingredients : []
  }
}

export function addProduct(order, product, quantity) {
  const item = mapProduct(product);
  addItem(order, item, quantity);
  //todo: compare to old-version;
}

export function makeRefundOrder(order, newOrder = true) {
  order = _.cloneDeep(order)
  order.items = order.items.filter(item => !item.option.nonRefundable)
  order.items.forEach(item => {
    item.maxQuantity = item.quantity
    item.quantity = 0
  })
  const refundOrder = createOrder(order)
  refundOrder.status = 'refund'
  refundOrder.originalOrderId = order._id
  if (newOrder) {
    refundOrder._id = new ObjectID()
  }
  return refundOrder
}

//</editor-fold>

export function orderBeFactory(id = 0) {
  let order = createOrder();
  let _new, _split, _off;
  orderMap.set(order, id);

  const actionList = ref([]);
  const getCurrentOrder = () => order;
  const currentTable = computed(() => order.table);

  let beItemsSnapshot = ref([]), beCancellationItemsSnapshot = ref([]);
  let beOrderSnapshot = ref({});
  let omitOrderProps = ['items', 'cancellationItems', 'beforeSend'];

  let disableSnapshot = false;

  async function makeActionList() {
    let _order = toRaw(order);
    await Promise.resolve();

    actionList.value.length = 0;
    if (_new) {
      return actionList.value.push({
        modelName: 'Order', // todo: review
        action: Order.create(_order).commit('createOrder', {table: order.table, ..._split && {split: true}}).chain
      });
    }

    processItems(order, actionList, _order.items, beItemsSnapshot.value, 'items');
    processItems(order, actionList, _order.cancellationItems, beCancellationItemsSnapshot.value, 'cancellationItems');

    const diffOrder = diff(_.omit(_order, omitOrderProps), beOrderSnapshot.value);
    if (JSON.stringify(diffOrder) !== '{}') {
      addOrderAction(order, actionList, {$set: diffOrder});
    }
  }

  hooks.onQueue(`post:order:update:${id}`, async function (order, force) {
    if (disableSnapshot && !force) return;
    await makeActionList(order);
  })

  function initBeSnapshot(order) {
    beOrderSnapshot.value = _.omit(_.cloneDeep(order), omitOrderProps);
    [beItemsSnapshot.value.length, beCancellationItemsSnapshot.value.length] = [0, 0];
    if (typeof order === 'object') {
      [beItemsSnapshot.value, beCancellationItemsSnapshot.value] = [_.cloneDeep(order).items || [], _.cloneDeep(order).cancellationItems || []];
    }
  }

  hooks.on(`pre:prepareOrder:${id}`, function (order) {
    initBeSnapshot(order)
  })

  const clearOrder = (clearActionList = true) => {
    if (_off) _off();
    if (clearActionList) actionList.value.length = 0;
    _.forEach(order, (v, k) => {
      if (Array.isArray(v)) {
        v.length = 0;
      } else {
        delete order[k]
      }
    })
  }

  /**
   *
   * @param __order (can be table or whole order)
   */
  function prepareOrder(__order, clearActionList = true, split = false) {
    _split = split;
    _new = typeof __order !== 'object' || !__order._id;
    if (typeof __order === 'string') {
      __order = {table: __order};
    }
    clearOrder(clearActionList);
    order = createOrder(_.assign(order, __order));
    hooks.emit(`pre:prepareOrder:${id}`, order);
    let _order = _.omit(_.cloneDeep(order), ['beforeSend']);

    /*_off = watch(order, async () => {
      await hooks.emit(`post:order:update:${id}`, order, true);
      hooks.emit('nextTick');
    }, {immediate: true, deep: true})*/
  }

  watch(order, () => {
    cms.socket.emit('update-customer-order', order)
  }, {
    deep: true
  })

  function setNeedCreate(needCreate) {
    _new = needCreate;
  }

  /**
   * when receive new order should apply patch to new order
   * @param newOrder
   * @returns {Promise<void>}
   */
  async function syncOrderChange(newOrder) {
    if (!newOrder || !order._id || newOrder._id.toString() != order._id.toString()) return
    //add items
    //diff to get patch
    const items = getRecentItems();
    const cancellationItems = getRecentCancellationItems();

    //change to newOrder
    prepareOrder(_.cloneDeep(newOrder), false);
    //apply to order
    for (const item of items) {
      if (!item.sent) {
        order.items.push(item);
      } else {
        const found = _.find(order.items, _item => _item._id.toString() === item._id.toString());
        found.quantity += item.quantity;
      }
    }

    //todo: apply takeAway, discount v.v
  }

  const getRecentItems = function () {
    const result = [];
    //list added item
    result.push(..._.filter(order.items, i => !i.sent));
    //list changed quantity item
    let beItems = _.cloneDeep(_.filter(order.items, i => i.sent));
    beItems = _.compact(beItems.map(item => {
      const found = _.find(beItemsSnapshot.value, _item => _item._id.toString() === item._id.toString());
      const _item = _.cloneDeep(item);
      _item.quantity = item.quantity - found.quantity;
      if (_item.quantity > 0) return _item;
    }))
    result.push(...beItems);
    return result;
  }

  const getRecentCancellationItems = function () {
    return order.cancellationItems.filter((i, k) => k > beCancellationItemsSnapshot.value.length - 1);
  }

  return {
    actionList, getCurrentOrder, currentTable, prepareOrder,
    order, clearOrder, beItemsSnapshot, beCancellationItemsSnapshot,
    syncOrderChange,
    getRecentItems, getRecentCancellationItems,
    makeActionList,
    setNeedCreate
  }
}

export const {
  getRecentItems, getRecentCancellationItems,
  actionList, getCurrentOrder, currentTable,
  prepareOrder, order, clearOrder,
  beItemsSnapshot, beCancellationItemsSnapshot,
  syncOrderChange,
  makeActionList
} = orderBeFactory(0);

//should run on backend

//<editor-fold desc="Split order, move items">
export const {
  actionList: actionList2,
  getCurrentOrder: getSecondOrder,
  currentTable: secondOrderTable,
  prepareOrder: prepareSecondOrder,
  order: order2,
  clearOrder: clearSecondOrder,
  makeActionList: makeActionList2,
  setNeedCreate: setNeedCreate2
} = orderBeFactory(1);

let tempItemsSnapshot = [], tempCancellationItemsSnapshot = [];

export async function makeSplitOrder() {
  clearSecondOrder();
  genSplitId(order);
  await delay(0);
  prepareSecondOrder(_.omit(order, ['items', 'cancellationItems', '_id', 'vSum', 'vTaxSum', 'status', 'payment']), true, true);
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems]
}

export function prepareMoveItemsOrder() {
  clearSecondOrder();
  prepareSecondOrder();
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems]
}

export async function finishSplitOrder() {
  await makeActionList();
  await makeActionList2();
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [[], []];
}

export async function finishMoveItemsOrder() {
  //todo: check if order is empty
  if (order.items.length === 0) {
    order2.cancellationItems.push(...order.cancellationItems);
  }
  await finishSplitOrder();
}

export async function assignTableToOrder2(table) {
  //check exists
  const _order = await Order.findOne({table, status: 'inProgress'});
  setNeedCreate2(!_order);
  if (_order) {
    const items = _.cloneDeep(order2.items);
    clearSecondOrder();
    prepareSecondOrder(_order);
    for (const item of items) {
      addItem(order2, item);
    }
  } else {
    order2.table = table;
  }
}

export function cancelSplitOrder() {
  clearSecondOrder();
  //restore
  order.items.splice(0, order.items.length, ...tempItemsSnapshot);
  order.cancellationItems.splice(0, order.cancellationItems.length, ...tempCancellationItemsSnapshot);
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [[], []];
}

export function cancelMoveItemsOrder() {
  cancelSplitOrder();
}

export function moveItemToSecondOrder(query) {
  let item = typeof query === 'number' ? order.items[query] : _.find(order.items, query);
  changeItemQuantity(order, query, -1, true);
  const existItem = _.find(order2.items, i => i._id.toString() === item._id.toString());
  if (existItem) {
    changeItemQuantity(order2, existItem, 1);
  } else {
    const _item = _.cloneDeep(item);
    addItem(order2, _item, 1);
  }
}

export function returnItem(query) {
  let item = typeof query === 'number' ? order2.items[query] : _.find(order2.items, query);
  changeItemQuantity(order2, query, -1, true);
  const existItem = _.find(order.items, {_id: item._id});
  if (existItem) {
    changeItemQuantity(order, existItem, 1);
  } else {
    const _item = _.cloneDeep(item);
    addItem(order, _item, 1);
  }
}

//todo: case order.items -> empty not accept (prevent by frontend)

//</editor-fold>


//ui logic

//<editor-fold desc="ui-logic">

export const hasOrderChange = computed(() => {
  let result = false;

  const _hooks = new Hooks();
  ['add-item', 'remove-item', 'change-item']
    .forEach(e => _hooks.on(e, (i1, i2) => {
      return result = true;
    }));
  processItems(order, actionList, order.items, beItemsSnapshot.value, 'items', _hooks);
  return result;
})

export function itemQuantityChangeCheck(item) {
  if (!item.sent) return false;
  //todo: get item
  const snapshotItem = _.find(beItemsSnapshot.value, {_id: item._id});
  return snapshotItem.quantity !== item.quantity;
}

export const overlay = ref(false)
export const onlyCheckoutPrintedItems = ref(true);
//use hooks for init;
//single ton for manage setting ??

export const payBtnClickable = computed(() => {
  if (order.items.length === 0) return false;
  if (payPrintMode.value === 'pay') return true;

  return hasOrderChange.value;
})

export const payPrintMode = computed(() => {
  if (!order.table) return 'pay';
  if (order.items.find(i => !i.sent)) return "print"
  if (order.items.length === 0) return "print"
  return hasOrderChange.value ? 'print' : 'pay';
})

export const disablePrint = computed(() => {
  if (payPrintMode.value === 'pay') return true;
  return payPrintMode.value === 'print' && !payBtnClickable.value;
})

export const showIcon = ref(false);
let actionTimeout;

/**
 *
 * @param actionList
 * @param printType
 * @param order
 * @param device
 * @param recent
 * @example
 * cms.once('run:print', function (commit) {
 *    expect(stringify(actionList.value)).toMatchSnapshot();
 *    expect(stringify(commit)).toMatchSnapshot()
 *    global.globalHooks.emit('check:orderCreated', cms.orm)
 *    done()
 *  })
 *
 */
export function createPrintAction(actionList, printType, {order, device, recent}) { // todo: review
  actionList.push({
    modelName: 'Action',
    action: cms.getModel('Action').create({
      printType,
      order,
      device,
      recent
    }).commit('print').chain
  })
}

export function togglePayPrintBtn(cb) {
  if (!showIcon.value) {
    //show icon and overlay
    [showIcon.value, overlay.value] = [true, true]
    actionTimeout = setTimeout(() => [showIcon.value, overlay.value] = [false, false], 5000)
    return;
  }

  // thanh toan hoac in an
  if (actionTimeout) clearTimeout(actionTimeout);
  [showIcon.value, overlay.value] = [false, false];
  hooks.emit('togglePayPrintBtn:step2', cb);
}

export async function toggleRefundOrder(refundOrder) {
  await Order.create(refundOrder)
}

export const quickBtnAction = ref('pay');
//todo: init from setting
hooks.on('togglePayPrintBtn:step2', async (cb) => {
  if (!payBtnClickable.value) return;
  if (payPrintMode.value === 'pay') {
    if (quickBtnAction.value === 'receipt') {
      hooks.emit('showOrderReceipt');
    } else {
      if (cb) {
        cb();
      } else {
        await hooks.emit('pay');
      }
    }
  } else {
    hooks.emit('printOrder');
  }
})

export const disablePay = computed(() => {
  if (!order.table) return false;
  if (!order.items.length) return true
  if (onlyCheckoutPrintedItems.value) {
    return hasOrderChange.value;
  }
  return false;
})

hooks.on('printOrder', async () => {
  order.date = new Date();
  addUser(order, username.value, order.date)
  clearNullQuantityItems(order);
  mergeSameItems(order);
  await makeActionList();
  const recent = {items: getRecentItems(), cancellationItems: getRecentCancellationItems()}
  makeSent(actionList.value);
  createPrintAction(actionList.value, 'kitchen', {order, device: 'Terminal 1', recent})
  cms.socket.emit('print-to-kitchen', _.cloneDeep(actionList.value), order);
  clearOrder();
});

export async function genMaxId(order) {
  //fixme: run only in master process to prevent missed data
  const order0 = await Order.findOne({id: {$exists: true}}).sort({id: '-1'})
  order.id = order0 ? order0.id + 1 : 1;
}

export async function getCustomerOrder(customerId) {
  return await Order.find({ customer: customerId })
}

async function genBookingNumber(order) {
  order.bookingNumber = dayjs(order.date).format('YYMMDDHHmmssSSS');
}

function makeSent(actionList) {
  actionList.push({
    modelName: 'Order',
    action: Order.updateOne({_id: order._id}, {
      $set: {
        'items.$[].sent': true, 'items.$[].printed': true,
        'cancellationItems.$[].sent': true, 'cancellationItems.$[].printed': true
      }
    }).chain
  });
}

function makePaid(actionList) {
  actionList.push({
    modelName: 'Order',
    action: Order.updateOne({_id: order._id}, {
      $set: {status: 'paid'}
    }).chain
  });
}

//todo: support print to kitchen
hooks.on('pay', async (printInvoice = false) => {
  //todo: withPrintInvoice, noPrintInvoice, split
  //todo: split ??
  //base on splitId
  //todo: virtual printer

  order.date = new Date();
  clearNullQuantityItems(order);
  mergeSameItems(order);
  await genMaxId(order);
  await genBookingNumber(order);
  addUser(order, username.value, order.date);
  await makeActionList();

  const recent = {items: getRecentItems(), cancellationItems: getRecentCancellationItems()}
  if (printInvoice) {
    createPrintAction(actionList.value, 'invoice', {order, device: 'Terminal 1', recent})
  }
  makePaid(actionList.value);

  if (beItemsSnapshot.value.length === 0 && beCancellationItemsSnapshot.value.length === 0) {
    order.immediatePay = true;
  }

  console.log(_.cloneDeep(actionList.value));

  cms.socket.emit('pay-order', _.cloneDeep(actionList.value), order, recent);
  clearOrder();
})

hooks.on('move-items', async () => {
  const empty = order.items.length === 0;
  order2.date = new Date();
  mergeSameItems(order2);
  await finishMoveItemsOrder();
  if (empty) {
    actionList.value.push({
      modelName: 'Order',
      action: Order.remove({_id: order._id}).chain
    })
  }
  const _actionList = [..._.cloneDeep(actionList.value), ..._.cloneDeep(actionList2.value)];
  await socketEmit('action-list', _actionList);
  clearSecondOrder();
  if (empty) clearOrder();
})

hooks.on('pay-split', async (printInvoice) => {
  const empty = order.items.length === 0;
  //todo: case new order
  //todo: print to kitchen if new order ??
  //todo: discount on split
  //todo: isMobile : show receipt
  order2.date = new Date();
  addUser(order, username.value, order.date);
  await genMaxId(order2);
  await genBookingNumber(order2);
  if (empty) {
    order2.cancellationItems = [...order.cancellationItems];
  }
  order2.status = 'paid';
  mergeSameItems(order2);
  await finishSplitOrder();
  const _actionList = [..._.cloneDeep(actionList.value), ..._.cloneDeep(actionList2.value)];
  if (printInvoice) {
    createPrintAction(_actionList, 'invoice', {order: order2, device: 'Terminal 1'})
  }

  //remove order
  if (empty) {
    //remove empty order
    _actionList.push({modelName: 'Order', action: Order.remove({_id: order._id}).chain});
  }

  await socketEmit('action-list', _actionList);
  clearSecondOrder();
  if (empty) clearOrder();
  if (!empty) await makeSplitOrder();
})

//</editor-fold>

//<editor-fold desc="search">
export async function searchOrderByDateRange(from, to) {
  const query = {
    status: {$in: ["paid" ]}
  }
  if (from && to)
    query.date = {
      ...from && {$gte: dayjs(from).format()},
      ...to && {$lte: dayjs(to).format()},
    }
  const orders = await Order.find(query)
  return orders
}
//</editor-fold>
