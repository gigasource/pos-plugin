//<editor-fold desc="declare">
import {addItem, changeItemQuantity, createOrder, hooks} from './pos-logic';
import {computed, ref, toRaw} from "vue";
import cms from 'cms';
import _ from 'lodash';
import rdiff from 'recursive-diff';
import Hooks from "schemahandler/hooks/hooks";
import {v1} from 'uuid';

const Order = cms.getModel('Order');

function addItemAction(order, actionList, item, update) {
  update = _.cloneDeep(update);
  actionList.value.push({
    modelName: 'Order', // todo: review
    action: cms.getModel('Order')
      .findOneAndUpdate({_id: order._id, 'items._id': item._id}, update)
      .commit('updateActiveOrder', {...order._id && {orderId: order._id}, table: order.table}).chain
  })
}

function addOrderAction(order, actionList, update) {
  update = _.cloneDeep(update);
  actionList.value.push({
    modelName: 'Order', // todo: review
    action: cms.getModel('Order')
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
        !_hooks && addItemAction(order, actionList, item, {$set: {'items.$': diffItem}});
        _hooks && _hooks.emit('change-item', diffItem, item, itemSnapshot);
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

function mapProduct(p) {
  return {
    groupPrinter: _.get(p, 'groupPrinter.name', ''),
    ..._.pick(p, ['id', 'name', 'price']),
    product: p._id,
    taxes: [p.tax, p.tax2]
  }
}

export function addProduct(order, product, quantity) {
  const item = mapProduct(product);
  addItem(order, item, quantity);
  //todo: compare to old-version;
}

//</editor-fold>

function orderBeFactory(id = 0) {
  let order = createOrder();
  orderMap.set(order, id);

  const actionList = ref([]);
  const getCurrentOrder = () => order;
  const currentTable = computed(() => order.table);

  let orderSnapshot, itemsSnapshot, cancellationItemsSnapshot;
  let beItemsSnapshot = ref([]), beCancellationItemsSnapshot = ref([]);
  let omitOrderProps = ['items', 'cancellationItems', 'beforeSend'];

  let disableSnapshot = false;
  hooks.on(`pre:order:update:${id}`, function (order, force) {
    if (disableSnapshot && !force) return;
    orderSnapshot = _.omit(_.cloneDeep(order), omitOrderProps);
    itemsSnapshot = _.cloneDeep(order.items);
    cancellationItemsSnapshot = _.cloneDeep(order.cancellationItems);
  })

  hooks.on(`post:order:update:${id}`, async function (order, force) {
    if (disableSnapshot && !force) return;
    let _order = toRaw(order);
    await Promise.resolve();


    processItems(order, actionList, _order.items, itemsSnapshot, 'items');
    processItems(order, actionList, _order.cancellationItems, cancellationItemsSnapshot, 'cancellationItems');

    const diffOrder = diff(_.omit(_order, omitOrderProps), orderSnapshot);
    if (JSON.stringify(diffOrder) !== '{}') {
      addOrderAction(order, actionList, {$set: diffOrder});
    }

    itemsSnapshot = undefined;
    orderSnapshot = undefined;
  })

  hooks.on(`pre:prepareOrder:${id}`, function (order) {
    [beItemsSnapshot.value.length, beCancellationItemsSnapshot.value.length] = [0, 0];
    if (typeof order === 'object') {
      [beItemsSnapshot.value, beCancellationItemsSnapshot.value] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems];
    }
  })

  const clearOrder = () => {
    actionList.value.length = 0;
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
  function prepareOrder(__order) {
    hooks.emit(`pre:prepareOrder:${id}`, __order);
    if (typeof __order === 'string') {
      __order = {table: __order};
    }
    clearOrder();
    order = createOrder(_.assign(order, __order));
    let _order = _.omit(_.cloneDeep(order), ['beforeSend']);
    if (typeof __order !== 'object') {
      const action = Order.create(_order).commit('createOrder', {table: order.table}).chain
      actionList.value.push({
        modelName: 'Order', // todo: review
        action
      });
    }
  }

  function startOnetimeSnapshot() {
    disableSnapshot = true;
    hooks.emit(`pre:order:update:${id}`, order, true);
  }

  function finishOnetimeSnapshot() {
    disableSnapshot = false;
    hooks.emit(`post:order:update:${id}`, order, true);
  }

  return {actionList, getCurrentOrder, currentTable, prepareOrder,
    order, clearOrder, beItemsSnapshot, beCancellationItemsSnapshot,
    startOnetimeSnapshot, finishOnetimeSnapshot}
}

export const {
  actionList, getCurrentOrder, currentTable,
  prepareOrder, order, clearOrder,
  beItemsSnapshot, beCancellationItemsSnapshot,
  startOnetimeSnapshot,
  finishOnetimeSnapshot
} = orderBeFactory(0);

//todo: actionList2: onetime compare
export const {
  actionList: actionList2,
  getCurrentOrder: getSecondOrder,
  currentTable: secondOrderTable,
  prepareOrder: prepareSecondOrder,
  order: order2,
  clearOrder: clearSecondOrder,
  startOnetimeSnapshot: startOnetimeSnapshot2,
  finishOnetimeSnapshot: finishOnetimeSnapshot2
} = orderBeFactory(1);

let tempItemsSnapshot = [], tempCancellationItemsSnapshot = [];
export function makeSplitOrder() {
  clearSecondOrder();
  order.splitId = order.splitId || v1();
  prepareSecondOrder(_.omit(order, ['items', 'cancellationItems', '_id', 'vSum', 'vTaxSum', 'status']));
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems]
  startOnetimeSnapshot();
  startOnetimeSnapshot2();
}

export function prepareMoveItemsOrder() {
  clearSecondOrder();
  prepareSecondOrder();
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems]
  startOnetimeSnapshot();
  startOnetimeSnapshot2();
}

export function finishSplitOrder() {
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [[],[]];
  finishOnetimeSnapshot();
  finishOnetimeSnapshot2();
}

export function finishMoveItemsOrder(_order) {
  const items = _.cloneDeep(order2.items);
  prepareSecondOrder(_order);
  startOnetimeSnapshot2();
  for (const item of items) {
    addItem(order2, item);
  }
  finishSplitOrder();
}

export function cancelSplitOrder() {
  clearSecondOrder();
  //restore
  order.items.splice(0, order.items.length, ...tempItemsSnapshot);
  order.cancellationItems.splice(0, order.cancellationItems.length, ...tempCancellationItemsSnapshot);
  [tempItemsSnapshot, tempCancellationItemsSnapshot] = [[],[]];
}

export function cancelMoveItemsOrder() {
  cancelSplitOrder();
}

export function moveItemToSecondOrder(query) {
  let item = typeof query === 'number' ? order.items[query] : _.find(order.items, query);
  changeItemQuantity(order, query, -1, true);
  const existItem = _.find(order2.items, {_id: item._id});
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

//todo: compact items
//todo: case cancel :
//todo: case order.items -> empty not accept (prevent by frontend)

//ui logic

//<editor-fold desc="ui-logic">

export const hasOrderChange = computed(() => {
  let result = false;

  const _hooks = new Hooks();
  ['add-item', 'remove-item', 'change-item']
    .forEach(e => _hooks.on(e, () => result = true));
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

export function createPrintAction(printType, order) { // todo: review
  actionList.value.push({
    modelName: 'Action',
    action: cms.getModel('Action').create({
      printType,
      order
    }).commit('print').chain
  })
}

export function togglePayPrintBtn() {
  if (!showIcon.value) {
    //show icon and overlay
    [showIcon.value, overlay.value] = [true, true]
    actionTimeout = setTimeout(() => [showIcon.value, overlay.value] = [false, false], 5000)
    return;
  }

  // thanh toan hoac in an
  if (actionTimeout) clearTimeout(actionTimeout);
  [showIcon.value, overlay.value] = [false, false];
  hooks.emit('togglePayPrintBtn:step2');
}

export const quickBtnAction = ref('pay');
//todo: init from setting
hooks.on('togglePayPrintBtn:step2', () => {
  if (!payBtnClickable.value) return;
  if (payPrintMode.value === 'pay') {
    if (quickBtnAction.value === 'receipt') {
      hooks.emit('showOrderReceipt');
    } else {
      hooks.emit('pay');
    }
  } else {
    hooks.emit('printOrder');
  }
})

export const disablePay = computed(() => {
  if (!order.table) return false
  if (!order.items.some(i => i.quantity)) return true
  if (onlyCheckoutPrintedItems.value) {
    return hasOrderChange.value;
  }
  return false;
})
//</editor-fold>
