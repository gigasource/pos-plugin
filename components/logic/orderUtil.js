const _ = require('lodash')

const orderUtil = {
  calItemTotal(item) {
    return +(item.quantity * item.price);
  },
  calTax(price, tax) {
    return price * (1 - 1 / (1 + tax / 100))
  },
  calItemTax(item) {
    return +(orderUtil.calTax(item.price, item.tax) * item.quantity).toFixed(2);
  },
  calOrderTax(items) {
    return _.sumBy(items, orderUtil.calItemTax);
  },
  calOrderTotal(items) {
    return _.sumBy(items, orderUtil.calItemTotal);
  },
  calItemDiscount(item) {
    return item.vDiscount ? (item.vDiscount * item.quantity) : 0
  },
  calOrderDiscount(items) {
    return _.sumBy(items, orderUtil.calItemDiscount)
  },
  calItemModifier(item) {
    return item.modifiers ? _.sum(item.modifiers.map(i => i.price)) * item.quantity : 0
  },
  calOrderModifier(items) {
    return _.sumBy(items, orderUtil.calItemModifier)
  },
  applyDiscountForOrder(items, { difference, value }) {
    const totalWithoutDiscountResist = difference + value;
    const percent = difference / totalWithoutDiscountResist * 100;
    let sumDiscount = 0;
    const lastDiscountableItemIndex = _.findLastIndex(items, item => !item.discountResistance);
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      if (!item.discountResistance) {
        if (i < lastDiscountableItemIndex) {
          item.price = +(item.originalPrice * (100 - percent) / 100);
          item.discountUnit = 'percent';
          item.vDiscount = +(item.originalPrice - item.price);
          sumDiscount += this.calItemDiscount(item);
        } else {
          item.discountUnit = 'amount';
          item.vDiscount = +((difference - sumDiscount) / item.quantity);
          item.price = item.originalPrice - item.vDiscount;
        }
      }
    }
    return items;
  },
  async getLatestOrderId() {
    try {
      const orderWithHighestId = await cms.getModel('Order').findOne().sort('-id');
      return ((orderWithHighestId && orderWithHighestId.id) || 0) + 1
    } catch (e) {
      console.error(e)
    }
  },
  async getComputedOrderItems(orderItems, date) {
    const items = []

    for (const item of orderItems) {
      if (item.groupPrinter && typeof item.groupPrinter === 'string') {
        item.groupPrinter = await cms.getModel('GroupPrinter').findOne({ _id: item.groupPrinter })
      }

      if (item.groupPrinter2 && typeof item.groupPrinter2 === 'string') {
        item.groupPrinter2 = await cms.getModel('GroupPrinter').findOne({ _id: item.groupPrinter })
      }

      items.push({
        ..._.omit(item, 'category'),
        product: item._id,
        category: item.category && item.category.name ? item.category.name : '', // saved order then pay have a string category
        date,
        ...item.groupPrinter && { groupPrinter: item.groupPrinter.name },
        ...item.groupPrinter2 && { groupPrinter2: item.groupPrinter2.name },
      });
    }

    return items
  },
  formatOrderItems(items) {
    return items.map(i => Object.assign({}, i, {
      price: i.price.toFixed(2),
      originalPrice: i.originalPrice.toFixed(2),
      ...i.vDiscount && { vDiscount: i.vDiscount.toFixed(2) },
      id: i.id || ''
    }))
  },
  getItemPrice(item) {
    let price = item.originalPrice || item.price
    if (item.modifiers && item.modifiers.length > 0) {
      price += _.sumBy(item.modifiers, m => m.price * m.quantity)
    }
    return price
  },
  getExtraInfo(item) {
    let extrasArr = []
    if (item.modifiers && item.modifiers.length) extrasArr.push(...item.modifiers.map(m => m.name))
    if (item.note) extrasArr.push(item.note)
    return extrasArr.length ? `(${extrasArr.join(', ')})` : ''
  }
}

module.exports = orderUtil
