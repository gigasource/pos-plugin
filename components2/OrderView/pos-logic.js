//<editor-fold desc="declare">
import {ObjectID} from "bson";
import {v1} from "uuid";
import {currentAppType} from "../AppType";

const {reactive, computed, watch, watchEffect, h, nextTick, ref, isProxy} = require('vue');
const _ = require('lodash');
const dayjs = require('dayjs');

const calTax = function (gross, tax) {
  if (tax === 0) return 0;
  return gross * (1 - 1 / (1 + tax / 100));
}

function calNet(gross, tax) {
  if (tax === 0) return gross;
  return gross * (1 / (1 + tax / 100));
}

function calItemTax(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return _.round(calTax(unitGross * item.quantity, item.tax || 0), 2);
}

function calItemNet(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return _.round(calNet(unitGross * item.quantity, item.tax || 0), 2);
}

export function calItemVSum(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return _.round(unitGross * item.quantity, 2);
}

export const hooks = new (require('schemahandler/hooks/hooks'))();
const uuid = require('uuid/v1');

export function mergeVTaxGroup(objValue, itemValue) {
  if (!objValue) return itemValue;
  if (!itemValue) return objValue;
  return {
    tax: objValue.tax + itemValue.tax,
    net: objValue.net + itemValue.net,
    gross: objValue.gross + itemValue.gross
  };
}

//</editor-fold>

export const createOrder = function (_order) {
  const _uuid = uuid();
  if (_order && _order.items && _order.items.length > 0) {
    _order.items.forEach(i => i.originalQuantity = i.quantity);
  }
  let order = _.defaults(_order, {
    _id: new ObjectID(),
    items: [], cancellationItems: [], takeAway: false, status: 'inProgress',
    payment: [],
    user: [],
    appType: currentAppType.value
  });
  order = reactive(order);

  watchEffect(() => {
    order.vSum = _.round(_.sumBy(order.items, 'vSum'), 2);
  })

  //order.vDate
  watchEffect(() => {
    order.vDate = dayjs(order.date).startOf('d').toDate();
  })

  //item.vSum
  watchEffect(() => {
    for (const item of order.items) {
      item.vSum = calItemVSum(item);
    }
  })

  //item.takeAway
  watchEffect(() => {
    for (const item of order.items) {
      item.vTakeAway = !!(order.takeAway || item.takeAway);
    }
  })

  //item.taxes
  watchEffect(() => {
    for (const item of order.items) {
      if (item.taxes) {
        item.tax = item.vTakeAway ? item.taxes[1] : item.taxes[0];
      }
    }
  })

  function calPriceWDiscount(originalPrice, discount) {
    if (typeof discount === 'string' && discount.includes('%')) {
      const _discount = parseFloat(discount.replace('%', ''));
      return _.round(originalPrice * (100 - _discount) / 100, 2);
    } else if (typeof discount === 'string') {
      const _discount = parseFloat(discount);
      return _.round(originalPrice - _discount, 2);
    } else if (typeof discount === 'number') {
      return _.round(originalPrice - discount, 2);
    }
    return originalPrice;
  }

//item.discount -> orginal price
  watchEffect(function () {
    for (const item of order.items) {
      if (item.discount) {
        if (!item.originalPrice) {
          item.originalPrice = item.price;
          if (item.modifiers) {
            for (const modifier of item.modifiers) {
              modifier.originalPrice = modifier.price;
              modifier.price = calPriceWDiscount(modifier.originalPrice, item.discount)
            }
          }
          hooks.emit('item.discount', item);
        }

        item.price = calPriceWDiscount(item.originalPrice, item.discount);
      }
    }
  })

  //order.discount -> item.discount
  watchEffect(() => {
    let discount = order.discount;

    if (!discount) return;

    function processPercentCase(discount) {
      for (const item of order.items) {
        if (_.endsWith(discount, '%')) {
          item.discount = discount;
        }
      }
    }

    if (typeof discount === 'string' && discount.includes('%')) {
      processPercentCase(discount);
    } else {
      if (typeof discount === 'string') discount = parseFloat(discount);
      const vSumOriginal = _.sumBy(order.items, item => (item.originalPrice || item.price) * item.quantity + _.sumBy(item.modifiers, m => m.price * m.quantity));
      // calculate percent
      let _discount = _.round((discount / vSumOriginal) * 100, 0) + '%';
      for (const item of order.items) {
        item.discount = _discount;
      }
      hooks.once(`${_uuid}:discountNumber:post`, function () {
        const _item = _.find(order.items, i => i.quantity === 1);
        if (order.vDiscount !== discount && _item) {
          const items = [...order.items];
          items.splice(items.indexOf(_item), 1);
          const __discount = discount - _.sumBy(items, 'vDiscount');
          _item.discount = _.round(__discount / _item.quantity, 2);
        }
      })
    }
  })

  //order.vDiscount
  watchEffect(() => {
    let vDiscount = _.sumBy(order.items, 'vDiscount');
    vDiscount = vDiscount ? _.round(vDiscount, 2) : vDiscount;
    if (vDiscount > 0) {
      order.vDiscount = vDiscount;
      hooks.emit(`${_uuid}:discountNumber:post`);
    }
  })

  //item.vDiscount
  watchEffect(() => {
    for (const item of order.items) {
      if (item.discount) {
        const vSumOriginal = item.originalPrice * item.quantity + _.sumBy(item.modifiers, m => m.originalPrice * m.quantity);
        item.vDiscount = _.round(vSumOriginal - item.vSum, 2);
      }
    }
  })

  //item.vTaxSum
  watchEffect(() => {
    for (const item of order.items) {
      let vTaxSum = {
        [item.tax || 0]: {
          tax: calItemTax(item),
          net: calItemNet(item),
          gross: calItemVSum(item),
        }
      }

      hooks.emit('item.vTaxSum', item, e => eval(e));

      item.vTaxSum = vTaxSum;
    }
  })

  //order.vTaxSum
  watchEffect(() => {
    const vTaxSum = {}
    for (const item of order.items) {
      _.mergeWith(vTaxSum, item.vTaxSum, mergeVTaxGroup);
    }
    order.vTaxSum = vTaxSum;
  })

  //partTax.tax
  watchEffect(() => {
    for (const item of order.items) {
      if (item.partTax) {
        item.partTax.tax = !item.vTakeAway ? item.partTax.taxes[0] : item.partTax.taxes[1];
      }
    }
  })

  //partTax vTaxSum
  hooks.on('item.vTaxSum', function (item) {
    if (item.partTax && item.partTax.tax) {
      let vTaxSum = {
        [item.partTax.tax]: {
          tax: calItemTax(item, item.partTax.pricePart),
          net: calItemNet(item, item.partTax.pricePart),
          gross: calItemVSum(item, item.partTax.pricePart),
        },
        [item.tax]: {
          tax: calItemTax(item, item.price - item.partTax.pricePart),
          net: calItemNet(item, item.price - item.partTax.pricePart),
          gross: calItemVSum(item, item.price - item.partTax.pricePart)
        }
      }
      this.update('vTaxSum', vTaxSum);
    }
  })

  //partTax discount
  hooks.on('item.discount', function (item) {
    if (item.partTax) {
      item.partTax.originalPricePart = item.partTax.pricePart;
      item.partTax.pricePart = calPriceWDiscount(item.partTax.originalPricePart, item.discount)
    }
  });

  hooks.emit('createOrder', order);

  //todo: cancellationItems
  return order;
}

//<editor-fold desc="functions">
export function addItem(order, item, quantity) {
  const initDefault = {course: 1}
  let _item = _.assign(_.cloneDeep(item), initDefault);

  if (quantity !== undefined) {
    _item.quantity = quantity;
  } else if (!_item.quantity) {
    _item.quantity = 1;
  }

  const last = _.last(order.items);
  //logic: same -> merge, not same -> add
  let merge;
  if (last && isSameItem(item, last)) {
    //merge
    last.quantity += _item.quantity;
    _item = last;
    merge = true;
  } else {
    //addItem
    _item._id = _item._id || new ObjectID();
    _item = reactive(_item);
    order.items.push(_item);
  }

  return {merge, updatedItem: _item}
}

export function updateItem(order, query, update) {
  let item;
  if (typeof query === 'number') {
    item = order.items[query];
  } else {
    item = _.find(order.items, query);
  }
  _.assign(item, update);
}

const isSameItem = (item1, item2, countSentProp = true) => {
  if (item2.modifiers && item2.modifiers.length > 0) return false;
  if (item1.modifiers && item1.modifiers.length > 0) return false;

  if (countSentProp && item2.sent) return false;
  return item2.product === item1.product &&
    item2.name === item1.name &&
    item1.price === item2.price
}

export function changeItemQuantity(order, query, change, shouldRemoveWhenZero = false) {
  let item;
  if (typeof query === 'number') {
    item = order.items[query];
  } else {
    item = _.find(order.items, query);
  }
  item.quantity += change;
  if (shouldRemoveWhenZero && item.quantity === 0) {
    order.items.splice(order.items.indexOf(item), 1);
  }
}

export function makeTakeaway(order, takeAway = true) {
  order.takeAway = takeAway;
}

export function toggleTakeaway(order) {
  order.takeAway = !(!!order.takeAway)
}

export function makeLastItemTakeaway(order) {
  const last = _.last(order.items);
  if (last) {
    last.course = 0;
    last.takeAway = true;
  }
}

export function addModifier(order, modifier) {
  const _modifier = _.cloneDeep(modifier);
  if (!modifier.quantity) _modifier.quantity = 1;
  const last = _.last(order.items);
  if (last && !last.sent) {
    last.modifiers = last.modifiers || [];
    last.modifiers.push(_modifier);
  }
}

export function addItemModifier(order, queryItem, modifier) {
  if (typeof queryItem !== 'number') {
    queryItem = _.findIndex(order.items, queryItem);
  }
  const item = order.items[queryItem];

  const _modifier = _.cloneDeep(modifier);
  if (!modifier.quantity) _modifier.quantity = 1;
  if (item && !item.sent) {
    item.modifiers = item.modifiers || [];
    item.modifiers.push(_modifier);
  }
}

export function removeModifier(order, queryItem, queryModifier, quantity = 1) {
  if (typeof queryItem !== 'number') {
    queryItem = _.findIndex(order.items, queryItem);
  }
  const item = order.items[queryItem];
  if (typeof queryModifier !== 'number') {
    queryModifier = _.findIndex(item.modifiers, queryModifier);
  }

  const modifier = item.modifiers[queryModifier];
  if (modifier.quantity > quantity) {
    modifier.quantity -= quantity;
  } else {
    item.modifiers.splice(queryModifier, 1);
  }

}

export function makeDiscount(order, discount) {
  order.discount = discount;
}

export function makeItemDiscount(order, queryItem, discount) {
  if (typeof queryItem !== 'number') {
    queryItem = _.findIndex(order.items, queryItem);
  }
  const item = order.items[queryItem];
  item.discount = discount
}

export function makeLastItemDiscount(order, discount) {
  const last = _.last(order.items);
  if (last) {
    last.discount = discount;
  }
}

export function makePaid(order) {
  order.status = 'paid';
}

//design addPayment : value, tip, cashback,
//addSinglePayment -> auto fill vSum, cashback (cash), tip ->
//addMultiPayment -> auto fill the rest total

/**
 *
 * @param order
 * @param payment [type: ['cash', 'card'], value]
 */
export function addSinglePayment(order, payment) {
  order.multiPayment = false
  if (!payment.value) {
    payment.value = order.vSum + (order.cashback || 0) - getPaymentTotal(order);
  } else if (payment.type === 'cash' && payment.value + getPaymentTotal(order) > order.vSum) {
    order.cashback = payment.value + getPaymentTotal(order) - order.vSum;
  } else if (payment.type !== 'cash' && payment.value > order.vSum) {
    order.tip = payment.value + getPaymentTotal(order) - order.vSum;
  }

  order.payment.splice(0, 0, payment)
}

/*hooks.on('createOrder', order => {
  watchEffect(() => {
    if (!order.multiPayment && order.payment[0] && order.payment[0] === 'cash') {
      order.payment[0].value = order.vSum + (order.cashback || 0) - getPaymentTotal(order);
    }
  })
})*/

export function addPayment(order, payment) {
  order.payment.push(payment);
}

export function updateSinglePayment(order, payment) {
  order.cashback = 0;
  order.tip = 0;
  order.payment.splice(0, 1);
  addSinglePayment(order, payment);
}

export function updatePayment(order, index, payment) {
  order[index] = payment;
}

export function getRestTotal(order) {
  return order.vSum - getPaymentTotal(order);
}

export function addMultiPayment(order, payment) {
  order.multiPayment = true;
  addPayment(order, payment);
}

hooks.on('createOrder', order => {
  watchEffect(() => {
    const cardPayment = _.find(order.payment, p => p.type === 'card')
    const cashPayment = _.find(order.payment, p => p.type === 'cash')

    const cardValue = (cardPayment ? cardPayment.value : 0)
    const cashValue = (cashPayment ? cashPayment.value : 0)
    const remainValue = getPaymentTotal(order) - cashValue - cardValue
    let tip = 0
    let change = 0
    let newCardValue = cardValue

    if (cardValue + remainValue > order.vSum) {
      newCardValue = Math.max(0, order.vSum - remainValue)
      tip = cardValue - newCardValue
    }
    change = Math.max(0, cashValue + newCardValue + remainValue - order.vSum)
    order.tip = tip
    order.cashback = change
  })
})

//todo: update payment

export function getPaymentTotal(order) {
  return _.sumBy(order.payment, 'value');
}

export function updateOrderWithHooks(order, cb) {
  cb();
}

export function clearPayment(order) {
  order.cashback = 0;
  order.tip = 0;
  order.payment.length = 0;
}

/**
 *
 * @param order
 * @param query
 * @param quantity
 * @param force
 * @example
 * removeItem(order, 0, 10);
 * removeItem(order, {name: 'Cola'}, 3);
 * force use only for testing
 */
export function removeItem(order, query, quantity = 1, force = false) {
  if (typeof query !== 'number') {
    query = _.findIndex(order.items, query);
  }

  const item = order.items[query];
  let _item;
  if ((item.quantity > quantity && !item.sent) || (item.quantity >= quantity && item.sent)) {
    //clone
    _item = _.assign(_.cloneDeep(item), {quantity});
    item.quantity -= quantity;
  } else {
    _item = _.assign(_.cloneDeep(item), {quantity});
    if (item.quantity >= quantity)
      item.quantity -= quantity
    order.items.splice(query, 1);
  }
  //todo: sent or not
  if (force || (item.sent && item.originalQuantity > item.quantity - quantity)) {
    order.cancellationItems.push(_item);
  }
}

export function clearNullQuantityItems(order) {
  order.items.splice(0, order.items.length, ...order.items.filter(i => i.quantity !== 0));
}


export function makeEOD(order, z) {
  order.z = z;
}

export function cancelOrder(order) {
  order.status = 'cancelled';
}

export function addUser(order, name, date = new Date()) {
  order.user.push({name, date});
}

export function changeCourse(order, query, add = 1) {
  if (typeof query !== 'number') {
    query = _.findIndex(order.items, query);
  }

  const item = order.items[query];
  if (item.course + add >= -1) {
    item.course += add;
  }
  if (item.course === 0) {
    [item.takeAway, item.separate] = [true, false];
  } else if (item.course === -1) {
    [item.takeAway, item.separate] = [false, true];
  } else {
    [item.takeAway, item.separate] = [false, false];
  }
}

export function addVoucher(order, value) {
  addItem(order, {
    name: 'Voucher',
    price: +value,
    isVoucher: true
  })
}

export function redeemVoucher(order, value) {
  addItem(order, {
    name: 'Voucher',
    price: -value,
    isVoucher: true
  })
}

export function genSplitId(order) {
  order.splitId = order.splitId || v1();
}

export function simulateBackendPrint(order) {
  order.items.forEach(i => {
    i.sent = true;
    i.printed = true;
    i.originalQuantity = i.quantity
  })
  hooks.emit('pre:prepareOrder', order);
}

export function mergeSameItems(order, mutate = true) {
  const items = order.items.reduce((list, item) => {
    let shouldAdd = true;
    for (const _item of list) {
      if (isSameItem(_item, item, false)) {
        shouldAdd = false;
        _item.quantity += item.quantity;
      }
    }
    if (shouldAdd) {
      list.push(item);
    }
    return list;
  }, [])
  if (mutate) order.items = items;
  return items;
}

export function addCustomer(order, customer) {
  order.customer = customer
}

//todo: recent items

//</editor-fold>
