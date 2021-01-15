//<editor-fold desc="declare">
import {ObjectID} from "bson";

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
  return +(calTax(unitGross * item.quantity, item.tax || 0)).toFixed(2);
}

function calItemNet(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return +(calNet(unitGross * item.quantity, item.tax || 0)).toFixed(2);
}

export function calItemVSum(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return +(unitGross * item.quantity).toFixed(2);
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
  let order = _.defaults(_order, {
    _id: new ObjectID(),
    items: [], cancellationItems: [], takeAway: false, status: 'inProgress',
    payment: [],
    user: []
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
        [item.tax]: {
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

  hooks.emit('pre:order:update', order);
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
    _item._id = new ObjectID();
    _item = reactive(_item);
    hooks.emit('pre:addItem', _item);
    order.items.push(_item);
  }
  hooks.emit('post:order:update', order);

  hooks.emit('addItem', order, item, quantity);

  return {merge, updatedItem: _item}
}

export function updateItem(order, index, update) {
  let item;
  if (typeof index === 'number') {
    item = order.items[index];
  } else {
    item = _.find(order.items, index);
  }

  hooks.emit('pre:order:update', order);
  _.assign(item, update);
  hooks.emit('post:order:update', order);
}

const isSameItem = (item1, item2) => {
  if (item2.modifiers && item2.modifiers.length > 0) return false;
  return item2.product === item1.product &&
    item1.price === item2.price && !item2.sent
}

export function changeItemQuantity(order, index, change) {
  hooks.emit('pre:order:update', order);
  const item = order.items[index];
  item.quantity += change;
  hooks.emit('post:order:update', order);
}

export function makeTakeaway(order, takeAway = true) {
  hooks.emit('pre:order:update', order);
  order.takeAway = takeAway;
  hooks.emit('post:order:update', order);
}

export function addModifier(order, modifier) {
  hooks.emit('pre:order:update', order);
  const _modifier = _.cloneDeep(modifier);
  if (!modifier.quantity) _modifier.quantity = 1;
  const last = _.last(order.items);
  if (last) {
    last.modifiers = last.modifiers || [];
    last.modifiers.push(_modifier);
  }
  hooks.emit('post:order:update', order);
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
  hooks.emit('pre:order:update', order);
  if (modifier.quantity > quantity) {
    modifier.quantity -= quantity;
  } else {
    item.modifiers.splice(queryModifier, 1);
  }

  hooks.emit('post:order:update', order);
}

export function makeDiscount(order, discount) {
  hooks.emit('pre:order:update', order, discount);
  order.discount = discount;
  hooks.emit('post:order:update', order, discount);
}

export function makeLastItemDiscount(order, discount) {
  hooks.emit('pre:order:update', order);
  const last = _.last(order.items);
  if (last) {
    last.discount = discount;
  }
  hooks.emit('post:order:update', order);
}

export function makePaid(order) {
  hooks.emit('pre:order:update', order);
  order.status = 'paid';
  hooks.emit('post:order:update', order);
}

//type: cash/card; value: 251
//string, obj, arr
export function addPayment(order, payment) {
  hooks.emit('pre:order:update', order);
  if (typeof payment === 'string') {
    if (order.payment.length === 0) {
      order.payment.push({
        type: payment
      })
    }
  } else if (typeof payment === 'object' && !Array.isArray(payment)) {
    order.payment.push(payment);
  } else if (Array.isArray(payment)) {
    order.payment.push(...payment);
  }
  hooks.emit('post:order:update', order);
}

export function updateOrderWithHooks(order, cb) {
  hooks.emit('pre:order:update', order);
  cb();
  hooks.emit('post:order:update', order);
}

export function clearPayment(order) {
  hooks.emit('pre:order:update', order);
  order.payment.length = 0;
  hooks.emit('post:order:update', order);
}

hooks.on('createOrder', order => {
  watchEffect(() => {
    if (order.payment.length === 1) {
      order.payment[0].value = order.vSum;
    } else if (order.payment.length > 1) {
      const payment = [...order.payment];
      const last = payment.pop();
      last.value = _.round(order.vSum - _.sumBy(payment, p => p.value), 2);
    }
  })
})

/**
 *
 * @param order
 * @param query
 * @param quantity
 * @example
 * removeItem(order, 0, 10);
 * removeItem(order, {name: 'Cola'}, 3);
 */
export function removeItem(order, query, quantity = 1) {
  if (typeof query !== 'number') {
    query = _.findIndex(order.items, query);
  }

  const item = order.items[query];
  let _item;
  hooks.emit('pre:order:update', order);
  if (item.quantity > quantity) {
    //clone
    _item = _.assign(_.cloneDeep(item), {quantity});
    item.quantity -= quantity;
  } else {
    _item = _.assign(_.cloneDeep(item));
    order.items.splice(query, 1);
  }
  order.cancellationItems.push(_item);
  hooks.emit('post:order:update', order);
}

export function makeEOD(order, z) {
  hooks.emit('pre:order:update', order);
  order.z = z;
  hooks.emit('post:order:update', order);
}

export function cancelOrder(order) {
  hooks.emit('pre:order:update', order);
  order.status = 'cancelled';
  hooks.emit('post:order:update', order);
}

export function addUser(order, name, date = new Date()) {
  hooks.emit('pre:order:update', order);
  order.user.push({name, date});
  hooks.emit('post:order:update', order);
}

export function changeCourse(order, query, add = 1) {
  if (typeof query !== 'number') {
    query = _.findIndex(order.items, query);
  }

  const item = order.items[query];
  hooks.emit('pre:order:update', order);
  if (item.course + add >= -1) {
    item.course += add;
  }
  if (item.course === 0) {
    [item.takeAway, item.seperate] = [true, false];
  } else if (item.course === -1) {
    [item.takeAway, item.seperate] = [false, true];
  } else {
    [item.takeAway, item.seperate] = [false, false];
  }
  hooks.emit('post:order:update', order);
}

export function addVoucher(order, value) {
  hooks.emit('pre:order:update', order);
  addItem(order, {
    name: 'Voucher',
    price: +value,
    isVoucher: true
  })
  hooks.emit('post:order:update', order);
}

export function redeemVoucher(order, value) {
  hooks.emit('pre:order:update', order);
  addItem(order, {
    name: 'Voucher',
    price: -value,
    isVoucher: true
  })
  hooks.emit('post:order:update', order);
}

export function simulateBackendPrint(order) {
  order.items.forEach(i => {
    i.sent = true;
    i.printed = true;
  })
}

//</editor-fold>