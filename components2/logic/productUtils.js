const productUtil = {
  getProductGridOrder(product, isFavourite = false) {
    const layout = product.layouts && product.layouts.find(layout => isFavourite ? layout.favourite : !layout.favourite);
    return layout ? layout.order : 0
  },
  getBookingNumber(dateTime) {
    return dayjs(dateTime).format('YYMMDDHHmmssSSS')
  },
  async getVDate(dateTime) {
    const posSettings = await cms.getModel('PosSetting').findOne({})
    const beginHour = posSettings.generalSetting.beginHour || '00:00'
    const [hour, minutes] = beginHour.split(':')
    const beginDateTime = dayjs(dateTime).clone().hour(parseInt(hour)).minute(parseInt(minutes))

    if (dayjs(dateTime).isBefore(beginDateTime)) {
      return beginDateTime.startOf('day').subtract(1, 'day').toDate()
    }

    return beginDateTime.startOf('day').toDate()
  },
  async getHighestProductOrder(categoryId) {
    const listMaxOrder = await cms.getModel('Product').aggregate([
      { $unwind: { path: '$layouts' } },
      {
        $group: {
          _id: '$category',
          maxOrder: { $max: '$layouts.order' }
        }
      }])
    const maxOrderItem = listMaxOrder.find(o => o._id === categoryId)
    return (maxOrderItem && maxOrderItem.maxOrder) || 0;
  },
  async getHighestFavouriteProductOrder() {
    const result = await cms.getModel('Product').aggregate([
      { $unwind: { path: '$layouts' } }, { $match: {'layouts.favourite': true} },
      {
        $group: {
          _id: null,
          maxOrder: { $max: '$layouts.order' }
        }
      }])
    return (result[0] && result[0].maxOrder) || 0
  }
}

module.exports = productUtil