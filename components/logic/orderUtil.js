const orderUtil = {
  calItemTotal(item) {
    return +(item.quantity * item.price).toFixed(2);
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
  applyDiscountForOrder(items, { difference, value }) {
    const totalWithoutDiscountResist = difference + value;
    const percent =  difference / totalWithoutDiscountResist * 100;
    let sumDiscount = 0;
    const lastDiscountableItemIndex = _.findLastIndex(items, item => !item.discountResistance && item.originalPrice > 0);
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      if (!item.discountResistance) {
        if (i !== lastDiscountableItemIndex) {
          item.price = +(item.originalPrice * (100 - percent) / 100);
          item.discountUnit = 'percent';
          item.vDiscount = +(item.originalPrice - item.price)
          sumDiscount += this.calItemDiscount(item);
        } else {
          item.discountUnit = 'amount';
          item.vDiscount = +((difference - sumDiscount)/item.quantity)
          item.price = item.originalPrice - item.vDiscount;
        }
      }
    }
    return items;
  },
  formatItems(items) {
    return items.map(i => Object.assign(i, {
      price: i.price.toFixed(2),
      vDiscount: i.vDiscount.toFixed(2)
    }))
  }
}

export default orderUtil

