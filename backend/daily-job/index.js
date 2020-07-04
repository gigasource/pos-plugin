const dayjs = require('dayjs')
const CronJob = require('cron').CronJob

module.exports = async cms => {
  createCronJob('0 0 * * *', updateStoreRevenue)

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
        console.log(store)
        await storeModel.updateOne({ _id: store._id }, store)
        console.log(`Updated monthly store revenue for store ${store.name}`)
      }
    }
  }
}


function createCronJob(cronSchedule, fn) {
  const job = new CronJob(cronSchedule, fn, null, true)
  console.log(`created cron job ${fn.name}, schedule: ${cronSchedule}`)
  return job
}
