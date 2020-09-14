export function getProductGridOrder(product, isFavourite = false) {
  const layout = product.layouts && product.layouts.find(layout => isFavourite ? layout.favourite : !layout.favourite);
  return layout ? layout.order : 0
}

export async function getLatestOrderId() {
  try {
    const orderWithHighestId = await cms.getModel('Order').findOne().sort('-id');
    return ((orderWithHighestId && orderWithHighestId.id) || 0) + 1
  } catch (e) {
    console.error(e)
  }
}

export function getBookingNumber(dateTime) {
  return dayjs(dateTime).format('YYMMDDHHmmssSSS')
}

export async function getVDate(dateTime) {
  const beginHour = (await cms.getModel('PosSetting').findOne({})).generalSetting.beginHour || '00:00'
  const [hour, minutes] = beginHour.split(':')
  const beginDateTime = dayjs(dateTime).clone().hour(parseInt(hour)).minute(parseInt(minutes))

  if (dayjs(dateTime).isBefore(beginDateTime)) {
    return beginDateTime.startOf('day').subtract(1, 'day').toDate()
  }

  return beginDateTime.startOf('day').toDate()
}

export async function getHighestProductOrder(categoryId) {
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
}

export async function getHighestFavouriteProductOrder() {
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

export function checkCategoryAvailability(availability, checkTime = false) {
  const { active, dayInWeek, startTime, endTime, startDate, repeat } = availability
  if(!active) return true
  const weekday = dayjs().day() - 1
  if(!dayInWeek[weekday]) return false
  if(checkTime && startTime) {
    const [hour, minute] = startTime.split(':')
    const start = dayjs().hour(hour).minute(minute).second(0)
    if(dayjs().isBefore(start)) return false
  }
  if(checkTime && endTime) {
    const [hour, minute] = endTime.split(':')
    const end = dayjs().hour(hour).minute(minute).second(0)
    if(dayjs().isAfter(end)) return false
  }
  if(startDate) {
    const start = dayjs(startDate).startOf('day')
    if(dayjs().isBefore(start)) return false
    if(+repeat) {
      const diff = dayjs().diff(start, 'week')
      if(diff % (+repeat + 1) !== 0) return false
    }
  }
  return true
}

export function checkCategoryInTime(startTime, endTime) {
  if(startTime) {
    const [hour, minute] = startTime.split(':')
    const start = dayjs().hour(hour).minute(minute).second(0)
    if(dayjs().isBefore(start)) return false
  }
  if(endTime) {
    const [hour, minute] = endTime.split(':')
    const end = dayjs().hour(hour).minute(minute).second(0)
    if (dayjs().isAfter(end)) return false
  }
  return true
}
