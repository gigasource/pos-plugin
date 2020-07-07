const dayjs = require('dayjs')

async function updateStoreRevenue() {
  const storeModel = cms.getModel('Store');
  const stores = await storeModel.find({
    lastSyncAt: { $lt: dayjs().startOf('month').toDate() }
  })

  if (stores && stores.length > 0) {
    const updatedStores = stores.map(({ _id, name, settingName, currentMonthReport }) => {
      return {
        name: name || settingName,
        _id,
        prevMonthReport: currentMonthReport,
        currentMonthReport: { orders: 0, total: 0 },
        lastSyncAt: new Date()
      }
    })

    for (const store of updatedStores) {
      await storeModel.updateOne({ _id: store._id }, store)
      console.log(`Updated monthly store revenue for store ${store.name}`)
    }
  }
}

module.exports = updateStoreRevenue
