const CronJob = require('cron').CronJob
const updateStoreRevenue = require('./update-monthly-revenue')
const cloneTask = require('./clone-task-management')

module.exports = async cms => {
  createCronJob('0 0 * * *', updateStoreRevenue)
  createCronJob('0 0 * * *', cloneTask)
}

function createCronJob(cronSchedule, fn) {
  const job = new CronJob(cronSchedule, fn, null, true)
  console.log(`created cron job ${fn.name}, schedule: ${cronSchedule}`)
  return job
}