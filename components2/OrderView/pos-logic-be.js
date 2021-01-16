//<editor-fold desc="declare">
import {
  createOrder,
  addItem,
  addModifier,
  makeTakeaway,
  makeDiscount,
  makeLastItemDiscount,
  makePaid,
  mergeVTaxGroup,
  addPayment,
  clearPayment,
  removeItem,
  cancelOrder,
  makeEOD,
  addUser,
  hooks
} from './pos-logic';
import {computed, reactive, ref, watchEffect, watch, toRaw, nextTick, triggerRef} from "vue";
import cms from 'cms';
import _ from 'lodash';
import {ObjectID} from "bson";
import rdiff from 'recursive-diff';
import Hooks from "schemahandler/hooks/hooks";

const Order = cms.getModel('Order');

export const actionList = ref([]);

let order = createOrder();
export const getCurrentOrder = () => order;
export const currentTable = computed(() => order.table);

function mapProduct(p) {
  return {
    groupPrinter: _.get(p, 'groupPrinter.name', ''),
    ..._.pick(p, ['id', 'name', 'price']),
    product: p._id,
    taxes: [p.tax, p.tax2]
  }
}

function addItemAction(order, item, update) {
  update = _.cloneDeep(update);
  actionList.value.push(cms.getModel('Order')
    .findOneAndUpdate({_id: order._id, 'items._id': item._id}, update)
    .commit('updateActiveOrder', {...order._id && {orderId: order._id}, table: order.table}).chain)
}

function addOrderAction(order, update) {
  update = _.cloneDeep(update);
  actionList.value.push(cms.getModel('Order')
    .findOneAndUpdate({_id: order._id}, update)
    .commit('updateActiveOrder', {...order._id && {orderId: order._id}, table: order.table}).chain)
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

//</editor-fold>

hooks.on('createOrder', order => order.beforeSend = true);

let orderSnapshot, itemsSnapshot, cancellationItemsSnapshot;
let beItemsSnapshot = ref([]), beCancellationItemsSnapshot = ref([]);
let omitOrderProps = ['items', 'cancellationItems', 'beforeSend'];
hooks.on('pre:order:update', function (order) {
  orderSnapshot = _.omit(_.cloneDeep(order), omitOrderProps);
  itemsSnapshot = _.cloneDeep(order.items);
  cancellationItemsSnapshot = _.cloneDeep(order.cancellationItems);
})

hooks.on('post:order:update', async function (order) {
  let _order = toRaw(order);
  await Promise.resolve();


  processItems(_order.items, itemsSnapshot, 'items');
  processItems(_order.cancellationItems, cancellationItemsSnapshot, 'cancellationItems');

  const diffOrder = diff(_.omit(_order, omitOrderProps), orderSnapshot);
  if (JSON.stringify(diffOrder) !== '{}') {
    addOrderAction(order, {$set: diffOrder});
  }

  itemsSnapshot = undefined;
  orderSnapshot = undefined;
})

/**
 *
 * @param items
 * @param itemsSnapshot
 * @param prop
 * @param _hooks (remove-item, add-item, change-item)
 */
const processItems = (items, itemsSnapshot, prop, _hooks) => {
  const _ids = _.unionBy(items.map(i => i._id), (itemsSnapshot || []).map(i => i._id), _id => _id.toString());
  for (const _id of _ids) {
    const item = items.find(i => i._id.toString() === _id.toString());
    const itemSnapshot = _.find(itemsSnapshot, i => i._id.toString() === _id.toString());
    if (!item) {
      // cancellation -> pull
      !_hooks && addOrderAction(order, {$pull: {[prop]: {_id: itemSnapshot._id}}})
      _hooks && _hooks.emit('remove-item', item, itemSnapshot);
    } else if (!itemSnapshot) {
      // push
      !_hooks && addOrderAction(order, {$push: {[prop]: item}});
      _hooks && _hooks.emit('add-item', item, itemSnapshot);
    } else {
      const diffItem = diff(item, itemSnapshot);
      if (JSON.stringify(diffItem) !== '{}') {
        !_hooks && addItemAction(order, item, {$set: {'items.$': diffItem}});
        _hooks && _hooks.emit('change-item', diffItem, item, itemSnapshot);
      }
    }
  }
}

hooks.on('pre:prepareOrder', function (order) {
  [beItemsSnapshot.value.length, beCancellationItemsSnapshot.value.length] = [0, 0];
  if (typeof order === 'object') {
    [beItemsSnapshot, beCancellationItemsSnapshot] = [_.cloneDeep(order).items, _.cloneDeep(order).cancellationItems];
  }
})

hooks.on('resetOrderData', () => {
  _.forEach(order, (v,k) => {
    if (Array.isArray(v)) {
      v.length = 0;
    } else {
      delete order[k]
    }
  })
});

/**
 *
 * @param __order (can be table or whole order)
 */
export function prepareOrder(__order) {
  hooks.emit('pre:prepareOrder', __order);
  if (typeof __order === 'string') {
    __order = {table: __order};
  }
  hooks.emit('resetOrderData');
  order = createOrder(_.assign(order, __order));
  let _order = _.omit(_.cloneDeep(order), ['beforeSend']);
  const action = Order.create(_order).commit('createOrder', {table: order.table}).chain
  actionList.value.length = 0;
  actionList.value.push(action);
}

export function addProduct(order, product) {
  const item = mapProduct(product);
  addItem(order, item);
  //todo: compare to old-version;
}

//ui logic

//<editor-fold desc="ui-logic">

export const hasOrderChange = computed(() => {
  let result = false;

  const _hooks = new Hooks();
  ['add-item', 'remove-item', 'change-item']
    .forEach(e => _hooks.on(e, () => result = true));
  processItems(order.items, beItemsSnapshot.value, 'items', _hooks);
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
