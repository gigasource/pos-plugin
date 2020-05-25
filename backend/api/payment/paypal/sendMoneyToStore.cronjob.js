const CronJob = require('cron').CronJob;
const paypalApiV2 = require('./paypalApiV2')
const dayjs = require('dayjs')
const _ = require('lodash')
//
// const everyFirstDayOfMonth = '00 00 00 1 * *'
// const job = new CronJob(everyFirstDayOfMonth, async () => {
//   const now = new Date()
//   const month = now.getMonth() + 1
//   const year = now.getFullYear()
//   const startDate = `${year}-${month}-01T00:00:00`
//   const endDayOfMonth = dayjs(`${year}-${month}-01`).daysInMonth();
//   const endDate = `${year}-${month}-${endDayOfMonth}T23:59:59`
//
//   // get all customer enabled paypal service
//   const stores = _.filter(await cms.getModel('Store').find({ paymentProviders: { $not: null } }), store => {
//     return store.paymentProviders && store.paymentProviders.paypal && store.paymentProviders.paypal.enabled
//   })
//
//   // send money
//   _.each(stores, async(store) => {
//     const netAmount = await paypalApiV2.getTransactionByStore({
//       start_date: startDate,
//       end_date: endDate,
//       store_id: store._id,
//       output: 'net_amount'
//     });
//
//     // TODO: prevent re-send money if money has been sent
//     // then send these money
//     paypalApiV2.payout({
//       sender_batch_header: {
//         sender_batch_id: `Payouts_${store._id}__01_${month}_${year}`,
//         recipient_type: 'EMAIL',
//         email_subject: 'Gigasource Online Order monthly transfer',
//         email_message: 'You have received a payout! Thanks for using our service!'
//       },
//       items: [{
//         amount: {
//           value: netAmount.toString(),
//           currency: "USD"
//         },
//         receiver: store.paymentProviders.paypal.email
//       }]
//     })
//
//   })
// }, null, true, 'America/Los_Angeles');
// job.start();
